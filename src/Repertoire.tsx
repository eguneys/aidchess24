import { For, createSignal, createEffect, createResource, createMemo, on, Signal, Match, Switch, batch, onCleanup, untrack, onMount } from 'solid-js'
import './Repertoire.scss'
import { useParams } from '@solidjs/router'

import StudyRepo, { PGNStudy } from './studyrepo'
import { Show } from 'solid-js'
import { Shala } from './Shalala'
import Chessboard from './Chessboard'
import { ChesstreeShorten, Treelala2, TwoPaths2 } from './Chesstree2'
import { INITIAL_FEN, MoveScoreTree, MoveTree } from './chess_pgn_logic'
import { Color } from 'chessground/types'
import { OpeningsChapterStatStore } from './repertoire_store'
import { stepwiseScroll } from './common/scroll'
import SessionStore from './SessionStore'
import { usePlayer } from './sound'

const DEPTH_COLOR = [
   '#afacc6', '#0d2b45', '#203c56', '#544e68', '#8d697a', '#d08159',
]
const total_score_to_color = (n: number) => {
  return DEPTH_COLOR[Math.floor((1 - n / 10) * 6)]
}

type PlayMode = 'quiz' | 'practice' | 'moves' | 'match' | 'quiz-quiz' | 'quiz-deathmatch'

const ply_to_index = (ply: number) => {
  let res = Math.floor(ply / 2) + 1
  return `${res}.` + (ply %2 === 0 ? '..' : '')
}

class RepertoirePlayer {
 
  _mode: Signal<PlayMode | undefined>

  get mode() {
    return this._mode[0]()
  }

  set mode(_: PlayMode | undefined) {
    this._mode[1](_)
  }

  _match_color: Signal<Color>

  get match_color() {
    return this._match_color[0]()
  }

  set match_color(_: Color) {
    this._match_color[1](_)
  }

  flip_match_color() {
    this.match_color = this.match_color === 'white' ? 'black':'white'
  }


  _practice_end_result: Signal<boolean>

  get practice_end_result() {
    return this._practice_end_result[0]()
  }


  set practice_end_result(_: boolean) {
    this._practice_end_result[1](_)
  }


  get i_quiz_quiz() {
    return this.quiz_quiz_ls.length + 1
  }

  restart_match() {
      batch(() => {
        this.practice_end_result = false
        this.mode = 'match'
        this.flip_match_color()
      })
  }

  restart_moves() {
    batch(() => {
      this.practice_end_result = false
      this.mode = 'moves'
      this.flip_match_color()
    })
  }

  end_match_or_moves() {
    batch(() => {
      this.practice_end_result = false
      this.mode = undefined
    })
  }

  restart_quiz(): void {
    batch(() => {
      this.quiz_quiz_ls = []
      this._quiz_quiz_ls_paths = []
      this.mode = 'quiz-quiz'
    })
  }

  end_quiz(): void {
    batch(() => {
      this.quiz_quiz_ls = []
      this._quiz_quiz_ls_paths = []
      this.mode = 'quiz'
    })
  }
  


  quiz_pass_one(path: string[]) {
    batch(() => {
      this.quiz_quiz_ls.push(1)
      this.quiz_quiz_ls = this.quiz_quiz_ls
      this._quiz_quiz_ls_paths.push(path)
    })
  }


  _quiz_quiz_ls_paths: string[][] = []

  quiz_fail_one(path: string[]) {
    batch(() => {
      this.quiz_quiz_ls.push(-1)
      this.quiz_quiz_ls = this.quiz_quiz_ls
      this._quiz_quiz_ls_paths.push(path)
    })
  }

  get quiz_pass() {
    return this.quiz_quiz_ls.filter(_ => _ > 0).length
  }

  get quiz_quiz_ls() {
    return this._quiz_quiz_ls[0]()
  }

  set quiz_quiz_ls(_: number[]) {
    this._quiz_quiz_ls[1](_)
  }
  
  _quiz_quiz_ls: Signal<number[]>

  _quiz_deathmatch_fail: Signal<number>

  set quiz_deathmatch_fail_result(v: number) {
    this._quiz_deathmatch_fail[1](v)
  }

  get quiz_deathmatch_fail_result() {
    return this._quiz_deathmatch_fail[0]()
  }

  _quiz_deathmatch_result_path: Signal<string[]>

  get quiz_deathmatch_result_path() {
    return this._quiz_deathmatch_result_path[0]()
  }

  set quiz_deathmatch_result_path(_: string[]) {
    this._quiz_deathmatch_result_path[1](_)
  }

  restart_deathmatch(): void {
    batch(() => {
    this.flip_match_color()
    this.quiz_deathmatch_fail_result = 0
    this.mode = 'quiz-deathmatch'
    })
  }
  end_deathmatch(): void {
    batch(() => {
    this.quiz_deathmatch_fail_result = 0
    this.mode = 'quiz'
    this.flip_match_color()
    })
  }
  


  constructor() {
    this._mode = createSignal<PlayMode | undefined>(undefined, { equals: false })
    this._match_color = createSignal<Color>('white')

    this._quiz_quiz_ls = createSignal<number[]>([], { equals: false })

    this._quiz_deathmatch_fail = createSignal(0)
    this._quiz_deathmatch_result_path = createSignal<string[]>([])

    this._practice_end_result = createSignal(false)
  }
}

const Progress = (props: { width: number }) => {
    return (<>
    
    <div class='progress'>
        <div class='bar' style={`width: ${props.width}%`}/>
        <h3>{`%${props.width}`}</h3>
    </div>
    </>)
}


class RepertoireStats {

  constructor(readonly chapters: RepertoireStat[]) {}

  get progress() {
    let n = this.chapters.length
    return this.chapters.map(_ => Math.round(_.progress / n)).reduce((a, b) => a + b)
  }
}

class RepertoireStat {

  static load_from_store(s: PGNStudy, i_chapter: number): any {
    let store = new OpeningsChapterStatStore(s.id, i_chapter)
    return RepertoireStat.make(s.id, i_chapter, s.chapters[i_chapter].pgn.tree, TwoPaths2.set_for_saving(store.solved_paths))
  }

  static save_paths_to_store(stats: RepertoireStat) {
    let store = new OpeningsChapterStatStore(stats.study_id, stats.i_chapter)
    store.solved_paths = stats.solved_paths.get_for_saving()
    store.practice_progress = stats.progress
  }
  

  static make(study_name: string, i_chapter: number, t: MoveTree, paths: TwoPaths2 = new TwoPaths2()) {
    return new RepertoireStat(study_name, i_chapter, MoveScoreTree.make(t), paths)
  }

  constructor(
    readonly study_id: string, 
    readonly i_chapter: number, 
    readonly score_tree: MoveScoreTree, 
    readonly solved_paths: TwoPaths2) {}

  get clone() {
    return new RepertoireStat(this.study_id, this.i_chapter, this.score_tree, this.solved_paths.clone)
  }

  get progress() {
    return Math.round(this.solved_paths.paths
    .map(p => untrack(() => this.score_tree.get_at(p)?.score) ?? 0)
    .reduce((a, b) => a + b, 0) * 100)
  }

  get progress_map() {

    let pp = untrack(() => this.score_tree.progress_paths)

    const total_scores = untrack(() => pp.map(paths => {
      return [
        paths
        .filter(_ => _.length % 2 === 1)
        .map(p => this.score_tree.get_at(p)!.score)
        .reduce((a, b) => a + b, 0),
        paths
        .filter(_ => _.length % 2 === 0)
        .map(p => this.score_tree.get_at(p)!.score)
        .reduce((a, b) => a + b, 0),

      ]
    }))

    return pp.map((paths, i) => {

      let b_path = paths[0]
      let e_path = paths[paths.length - 1]

      let total_whites = total_scores[i][0]
      let total_blacks = total_scores[i][1]

      let ss = createMemo(() => this.solved_paths.paths)
      let dd = createMemo(() => ss().filter(_ => paths.some(p => p.join('') === _.join(''))))

      let white = createMemo(() => dd()
        .filter(_ => _.length % 2 === 1)
        .map(p => this.score_tree.get_at(p)!.score)
        .reduce((a, b) => a + b, 0))
      let black = createMemo(() => dd()
        .filter(_ => _.length % 2 === 0)
        .map(p => this.score_tree.get_at(p)!.score)
        .reduce((a, b) => a + b, 0))

      return { 
        color: total_score_to_color(b_path.length / 20 + e_path.length / 10), 
        total: total_whites * 2, 
        black: createMemo(() => black() / total_blacks), 
        white: createMemo(() => white() / total_whites),
        path: e_path }
    }).reverse()
  }

  clone_merge_stats(b: RepertoireStat) {
    let res = untrack(() => this.clone)
    res.solved_paths.merge_dup(b.solved_paths)
    return res
  }

  merge_and_save_stats(b: RepertoireStat) {
    this.solved_paths.merge_dup(b.solved_paths)
    this.save_stats()
  }

  save_stats() {
    RepertoireStat.save_paths_to_store(this)
  }
}


const Repertoire = () => {

    const params = useParams()

    const [study] = createResource(params.id, StudyRepo.read_study)


  return (
    <>
      <div class='repertoire-wrap'>
        <Show when={!study.loading} fallback={"Loading..."}>
          <RepertoireLoaded study={study()!} />
        </Show>
      </div>
    </>)
}


const RepertoireLoaded = (props: { study: PGNStudy }) => {

  const Player = usePlayer()
  const study = () => props.study



  let [is_pending_move, set_is_pending_move] = createSignal(false)


  let repertoire_player = new RepertoirePlayer()
  let shalala = new Shala()

  const [i_selected_chapter, set_i_selected_chapter] = createSignal(SessionStore.i_chapter ?? 0)

  let overall_stats = createMemo(() => {
    const s = study()
    return new RepertoireStats(s.chapters.map((_, i) => RepertoireStat.load_from_store(s, i)))
  })

  let overall_repertoire_stat = createMemo(() => {
    return overall_stats().chapters[i_selected_chapter()]
  })


  const selected_chapter = createMemo(() => study().chapters[i_selected_chapter()])

  const repertoire_lala = createMemo(() => {
    //track
    repertoire_player.mode

    let chapter = selected_chapter()
    let res = Treelala2.make(chapter.pgn.tree.clone)
    return res
  })


  const quiz_quiz_stop = createMemo(() => {
    if (repertoire_player.mode === 'quiz-quiz') {
      return repertoire_player.i_quiz_quiz === 16
    }
  })

  const [quiz_error_flash, set_quiz_error_flash] = createSignal(false)

  createEffect(() => {
    if (repertoire_player.mode === 'quiz-quiz') {
      let is_stop = quiz_quiz_stop()
      let last_fail = repertoire_player.quiz_quiz_ls[repertoire_player.quiz_quiz_ls.length - 1]

      if (last_fail < 0) {

        set_quiz_error_flash(true)
        setTimeout(() => {
          set_quiz_error_flash(false)
        }, 500)
      }

      if (is_stop) {

      } else {
        set_is_pending_move(true)
        setTimeout(() => {
          batch(() => untrack(() => {
            repertoire_lala().set_random_cursor_hide_rest()
            repertoire_player.match_color = repertoire_lala().cursor_after_color
            set_is_pending_move(false)
          }))
        }, 100)
      }
    }
  })

  createEffect(() => {
    let { mode, match_color } = repertoire_player
    if (mode === 'quiz-deathmatch') {
      if (match_color === 'black') {
        setTimeout(() => {
          untrack(() => {
            repertoire_lala().reveal_one_random()
          })
        }, 400)
      }
    }
  })

  createEffect(() => {
    repertoire_lala().solved_paths.replace_all(overall_repertoire_stat().solved_paths)
  })

  const repertoire_stat_for_mode = createMemo(() => {
    let t = repertoire_lala().tree!
    return untrack(() => RepertoireStat.make(study().name, i_selected_chapter(), t, new TwoPaths2()))
  })

  createEffect(() => {
    let s = untrack(() => repertoire_stat_for_mode())
    s.solved_paths.replace_all(repertoire_lala().solved_paths)
  })

  let stats_merge_diff = createMemo(() => {
    let o = overall_repertoire_stat()
    let m = repertoire_stat_for_mode()

    let old_progress = untrack(() => o.progress)
    let new_progress = o.clone_merge_stats(m).progress


    return new_progress - old_progress
  })

  createEffect(on(() => [overall_repertoire_stat(), repertoire_stat_for_mode()], (_, prev) => {
    if (prev) {
      let [o, m] = prev
      o.merge_and_save_stats(m)
    }
  }))

  createEffect(on(() => shalala.add_uci, (uci?: string) => {
    if (is_pending_move()) {
      return
    }
    if (!uci) {
      return
    }

    let success = repertoire_lala().try_next_uci_fail(uci)

    if (success) {
      success_auto_play_or_end()

      if (repertoire_player.mode === 'quiz-quiz') {
        repertoire_player.quiz_pass_one(repertoire_lala().cursor_path)
      }

    } else {
      if (repertoire_player.mode === 'match' || repertoire_player.mode === 'moves') {
        set_is_pending_move(true)
        setTimeout(() => {
          repertoire_lala().on_wheel(-1)
          set_is_pending_move(false)
        }, 100)
      }

      if (repertoire_player.mode === 'quiz-quiz') {
        repertoire_player.quiz_fail_one(repertoire_lala().cursor_path)
        Player.play('error')
      }


      if (repertoire_player.mode === 'quiz-deathmatch') {
        repertoire_player.quiz_deathmatch_fail_result = -1
        repertoire_player.quiz_deathmatch_result_path = repertoire_lala().cursor_path.slice(0, -1)
      }
    }
  }))

  createEffect(on(() => repertoire_player.quiz_deathmatch_fail_result, v => {
    if (v > 0) {
       Player.play('victory')
    } else if (v < 0) {
       Player.play('victory')
    }
  }))

  createEffect(on(() => repertoire_player.practice_end_result, v => {
    if (v) {
      Player.play('victory')
    }
  }))

  createEffect(() => {
    let { mode, match_color } = repertoire_player

    if (mode === 'match' && match_color === 'black') {
      untrack(() => {
        success_auto_play_or_end()
      })
    }
  })

  createEffect(on(() => repertoire_lala().fen_last_move, (res) => {
    if (res) {
      let [fen, last_move] = res
      shalala.on_set_fen_uci(fen, last_move)
    } else {
      shalala.on_set_fen_uci(INITIAL_FEN)
    }

  }))

  const success_auto_play_or_end = () => {
    let is_leaf = () => repertoire_lala().is_cursor_path_at_a_leaf

      if (is_leaf()) {
        if (repertoire_player.mode === 'quiz-deathmatch') {
          repertoire_player.quiz_deathmatch_fail_result = 1
          repertoire_player.quiz_deathmatch_result_path = repertoire_lala().cursor_path
        } else if (repertoire_player.mode === 'match' || repertoire_player.mode === 'moves') {
          repertoire_player.practice_end_result = true
        }
      } else {
        if (repertoire_player.mode === 'match' || repertoire_player.mode === 'quiz-deathmatch') {
          set_is_pending_move(true)
          setTimeout(() => {
            repertoire_lala().reveal_one_random()


            if (is_leaf()) {
               if (repertoire_player.mode === 'quiz-deathmatch') {
                 repertoire_player.quiz_deathmatch_fail_result = 1
                 repertoire_player.quiz_deathmatch_result_path = repertoire_lala().cursor_path
               } else if (repertoire_player.mode === 'match' || repertoire_player.mode === 'moves') {
                repertoire_player.practice_end_result = true
               }
            }
            set_is_pending_move(false)
          }, 400)
        }
      }
  }

  createEffect(on(() => shalala.on_wheel, (dir) => {
    if (dir) {
      repertoire_lala().on_wheel(dir)
    }
  }))


  const onKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'f') {
      repertoire_player.flip_match_color()
    }
  }

  createEffect(on(() => repertoire_lala().tree?.get_at(repertoire_lala().cursor_path), v => {
    if (v) {
      Player.move(v)
    }
  }))


  onMount(() => {
    document.addEventListener('keypress', onKeyPress)
  })

  onCleanup(() => {
    document.removeEventListener('keypress', onKeyPress)
  })


  const onWheel = stepwiseScroll((e: WheelEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName !== 'PIECE' &&
      target.tagName !== 'SQUARE' &&
      target.tagName !== 'CG-BOARD'
    )
      return;
    e.preventDefault();
    shalala.set_on_wheel(Math.sign(e.deltaY))

  })



  createEffect(() => {
    repertoire_player.match_color = study().orientation ?? 'white'
  })

  const progress_map = createMemo(() => repertoire_stat_for_mode().progress_map)


  let el_rep: HTMLDivElement

  onMount(() => {
    el_rep.addEventListener('wheel', onWheel, { passive: false })
  })
  onCleanup(() => {
    el_rep.removeEventListener('wheel', onWheel)
  })

  const active_if_tab_practice = (p: PlayMode) => {

    let m = repertoire_player.mode
    if (p === 'practice') {
      if (m === undefined || m === 'match' || m === 'moves') {
        return ' active'
      }
    } else {
      if (m === 'quiz' || m === 'quiz-quiz' || m === 'quiz-deathmatch') {
        return ' active'
      }
    }
    return ''
  }

  const is_board_movable = createMemo(() => {
    return repertoire_player.mode !== undefined && !quiz_quiz_stop() && !repertoire_player.practice_end_result
  })


  const deathmatch_score = createMemo(on(() => repertoire_player.quiz_deathmatch_result_path, rp => {
    let x = rp.length
    let y = repertoire_lala().tree?.all_leaves.map(_ => _.path)
    .filter(_ => !repertoire_lala().failed_paths.find(f => f.join('') === _.join('')))
    .filter(_ => _.join('').startsWith(rp.join('')))[0]?.length
    return `${x} out of ${y}`
  }))


  const branch_sums = createMemo(() => repertoire_lala().tree?.collect_branch_sums(repertoire_lala().cursor_path))

  return (<>
    <div ref={_ => el_rep = _} class='repertoire'>

      <div class='list-wrap'>
        <h1 class='header'>Repertoire</h1>
        <div class='list'>


          <div><h3 class='title'>{study().name}</h3><Progress width={overall_stats().progress} /></div>
          <ul>
            <For each={study().chapters}>{(chapter, i) =>
              <li onClick={() => set_i_selected_chapter(i())} class={i() === i_selected_chapter() ? 'active' : ''}><div><h3>{chapter.name}</h3> <Progress width={overall_stats()?.chapters[i()].progress ?? 0} /></div></li>
            }</For>
          </ul>
        </div>
      </div>
      <div class='board-wrap'>
        <Chessboard
          orientation={repertoire_player.match_color}
          movable={is_board_movable()}
          doPromotion={shalala.promotion}
          onMoveAfter={shalala.on_move_after}
          fen_uci={shalala.fen_uci}
          color={shalala.turnColor}
          dests={shalala.dests} />
      </div>
      <div class='eval-gauge'>
        <For each={progress_map()}>{ p => 
          <div onClick={_ => repertoire_lala().try_set_cursor_path(p.path) } class='line' style={`background: ${p.color}; height: ${Math.round(p.total * 100)}%`}>
            <span class='fill white' style={`height: ${Math.round(p.white() * 100)}%`}></span>
            <span class='fill black' style={`height: ${Math.round(p.black() * 100)}%`}></span>
          </div>
        }</For>
      </div>
      <div class='replay-wrap'>
        <div class='replay-header'>
          <div class='title'>
            <h5>{study().name}</h5>
            <h4>{selected_chapter().name}</h4>
          </div>
          <h3 class='progress'>{overall_repertoire_stat().progress}%</h3>
          <h3 class='lichess'><a target="_blank" href={selected_chapter().site}>lichess</a></h3>
        </div>

        <div class='replay'>
          <div class='replay-v'>
            <ChesstreeShorten lala={repertoire_lala()} />
          </div>
          <div class='branch-sums'>
            <button disabled={is_pending_move() || !repertoire_lala().can_navigate_up} onClick={() => repertoire_lala().navigate_up()} class={"fbt prev" + (!is_pending_move() && repertoire_lala().can_navigate_up ? '' : ' disabled')} data-icon=""/>
            <button disabled={is_pending_move() || !repertoire_lala().can_navigate_down} onClick={() => repertoire_lala().navigate_down()} class={"fbt prev" + (!is_pending_move() && repertoire_lala().can_navigate_down ? '' : ' disabled')} data-icon=""/>
            <For each={branch_sums()}>{branch => 
              <div class='fbt' onClick={() => repertoire_lala().try_set_cursor_path(branch.path)}><Show when={branch.ply & 1}><span class='index'>{ply_to_index(branch.ply)}</span></Show>{branch.san}</div>
            }</For>
          </div>
          <div class='replay-jump'>
            <button onClick={() => repertoire_lala().navigate_first()} class={"fbt first" + (!is_pending_move() && repertoire_lala().can_navigate_prev ? '' : ' disabled')} data-icon=""/>
            <button onClick={() => repertoire_lala().navigate_prev()} class={"fbt prev" + (!is_pending_move() && repertoire_lala().can_navigate_prev ? '' : ' disabled')} data-icon=""/>
            <button onClick={() => repertoire_lala().navigate_next()} class={"fbt next" + (!is_pending_move() && repertoire_lala().can_navigate_next ? '' : ' disabled')} data-icon=""/>
            <button onClick={() => repertoire_lala().navigate_last()} class={"fbt last" + (!is_pending_move() && repertoire_lala().can_navigate_next ? '' : ' disabled')} data-icon=""/>
          </div>

          <div class='tools'>

            <div class='tabs'>
              <h3 class={'tab' + active_if_tab_practice('practice')} onClick={() => repertoire_player.end_match_or_moves() }>Practice</h3>
              <h3 class={'tab' + active_if_tab_practice('quiz')} onClick={() => repertoire_player.mode = 'quiz' }>Quiz</h3>
            </div>

            <div class='content'>
            <Switch>

              <Match when={repertoire_player.mode === 'quiz'}>
                <small> Click on variations to expand. </small>
                <small> Your goal is to guess every move correctly to pass the quiz. </small>
                <h2>Select a Quiz Option</h2>
                <button onClick={() => repertoire_player.mode = 'quiz-quiz'}><span> Take Quiz </span></button>
                <button onClick={() => repertoire_player.mode = 'quiz-deathmatch'}><span> Play Deathmatch </span></button>
              </Match>



              <Match when={repertoire_player.mode === 'quiz-deathmatch'}>
                <h2>Deathmatch Mode</h2>

                <Show when={repertoire_player.quiz_deathmatch_fail_result !== 0} fallback={
                  <>
                <small>You will play the moves from the opening.</small>
                <small>If you go out of book, game ends.</small>

                <div class='in_mode'>
                  <button class='end2' onClick={() => {

                    batch(() => {
                    let p = repertoire_lala().cursor_path
                    repertoire_player.end_deathmatch()
                    repertoire_lala().cursor_path = p
                    })
                  }}><span> End Deathmatch </span></button>
                </div>
                    </>
                }>

                   <small> Deathmatch <Show when={repertoire_player.quiz_deathmatch_fail_result > 0} fallback={<span class='failed'>failed</span>}> <span class='passed'>passed</span></Show></small>
                   <small> Your score: {deathmatch_score()}</small>
                   <small> Progress +{stats_merge_diff()}% </small>


                <div class='in_mode'>
                  <button onClick={() => repertoire_player.restart_deathmatch()}><span> Restart Deathmatch </span></button>
                  <button class='end2' onClick={() => {

                    batch(() => {
                    let p = repertoire_lala().cursor_path
                    repertoire_player.end_deathmatch()
                    repertoire_lala().cursor_path = p
                    })
                  }}><span> End Deathmatch </span></button>
                </div>
                </Show>


              </Match>





              <Match when={repertoire_player.mode === 'quiz-quiz'}>
                <h2>Quiz Mode</h2>

                <Show when={quiz_quiz_stop()} fallback={
                  <>
                <small>You are given 15 random positions from the opening.</small>
                <small>Guess the correct move.</small>
                <h2 class={quiz_error_flash() ? 'error': ''}>{repertoire_player.i_quiz_quiz} of 15</h2>

                <div class='in_mode'>
                  <button class='end2' onClick={() => {
                    batch(() => {
                    let path = repertoire_lala().cursor_path
                    repertoire_player.end_quiz()
                    repertoire_lala().cursor_path = path
                    })
                  }}><span> End Quiz </span></button>
                </div>
                    </>
                }>

                   <small> Quiz <Show when={repertoire_player.quiz_pass > 10} fallback={<span class='failed'>failed</span>}> <span class='passed'>passed</span></Show></small>
                   <small> Your score: {repertoire_player.quiz_pass} out of 15 correct</small>
                   <small> Progress +{stats_merge_diff()}% </small>

                   <div class='past'>
                     <For each={repertoire_player.quiz_quiz_ls}>{(ls, i) => 
                       <span onClick={() => repertoire_lala().cursor_path = repertoire_player._quiz_quiz_ls_paths[i()]} class={'move ' + (ls > 0 ? 'success': 'error')}>{i() + 1}</span>
                     }</For>
                   </div>



                <div class='in_mode'>
                  <button onClick={() => repertoire_player.restart_quiz()}><span> Restart Quiz </span></button>
                  <button class='end2' onClick={() => { 

                    batch(() => {
                    let path = repertoire_lala().cursor_path
                    repertoire_player.end_quiz()
                    repertoire_lala().cursor_path = path
                    })
                    }}><span> End Quiz </span></button>
                </div>
                </Show>


              </Match>



              <Match when={repertoire_player.mode === undefined}>
                <small> Click on variations to expand. </small>
                <small> Your goal is to guess every move correctly to fill up the progress bar. </small>
                <h2>Select a Practice Option</h2>
                <button onClick={() => repertoire_player.mode = 'moves'}><span> Play all Moves </span></button>
                <button onClick={() => repertoire_player.mode = 'match'}><span> Play as Match </span></button>
              </Match>

              <Match when={repertoire_player.mode === 'match'}>
                <h2>Play as Match</h2>

                 <Show when={repertoire_player.practice_end_result} fallback={
                   <>
                      <small> Try to guess the moves for {repertoire_player.match_color}.</small>
                      <small> AI will play the next move, picking a random variation. </small>
                      <small> Moves will be hidden once the game is started. </small>
                   </>
                 }>
                  <>
                  <small> End of practice. </small>
                  <small> Congratulations. </small>
                  </>
                 </Show>
                  <div class='in_mode'>
                    <button onClick={() => repertoire_player.restart_match()}><span> Rematch </span></button>
                    <button class='end2' onClick={() => {
                      let pp = repertoire_lala().cursor_path
                      repertoire_player.end_match_or_moves()
                      repertoire_lala().cursor_path = pp
                    }}><span> End Practice </span></button>
                  </div>
              </Match>

              <Match when={repertoire_player.mode === 'moves'}>
                <h2>Play all moves</h2>

                 <Show when={repertoire_player.practice_end_result} fallback={
                   <>
                       <small>Try to guess the moves for both sides.</small>
                       <small>Moves will be hidden once you start.</small>
                   </>
                 }>
                  <>
                  <small> End of practice. </small>
                  <small> Congratulations. </small>
                  </>
                 </Show>

                <div class='in_mode'>
                  <button onClick={() => { repertoire_player.restart_moves() }}><span> Clear </span></button>
                  <button class='end2' onClick={() => repertoire_player.end_match_or_moves()}><span> End Practice </span></button>
                </div>
              </Match>
            </Switch>

            </div>

          </div>
        </div>

      </div>
      <div class='under'>
        <br />
        <br />
        <br />
      </div>
    </div>
  </>
  )
}


export default Repertoire

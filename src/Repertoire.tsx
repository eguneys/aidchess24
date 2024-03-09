import { For, createSignal, createEffect, createResource, createMemo, on, Signal, Match, Switch, batch, onCleanup, untrack, onMount } from 'solid-js'
import './Repertoire.scss'
import { useParams } from '@solidjs/router'

import StudyRepo, { PGNStudy } from './studyrepo'
import { Show } from 'solid-js'
import { Shala } from './Shalala'
import Chessboard from './Chessboard'
import { ChesstreeShorten, Treelala2, TwoPaths } from './Chesstree2'
import { INITIAL_FEN, MoveScoreTree, MoveTree } from './chess_pgn_logic'
import { Color } from 'chessground/types'
import { OpeningsChapterStatStore } from './repertoire_store'
import { stepwiseScroll } from './common/scroll'
import SessionStore from './SessionStore'

const DEPTH_COLOR = [
   '#afacc6', '#0d2b45', '#203c56', '#544e68', '#8d697a', '#d08159',
]
const total_score_to_color = (n: number) => {
  return DEPTH_COLOR[Math.floor((1 - n / 10) * 6)]
}

type PlayMode = 'moves' | 'match'

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

  constructor() {
    this._mode = createSignal<PlayMode | undefined>(undefined, { equals: false })
    this._match_color = createSignal<Color>('white')
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
    return RepertoireStat.make(s.id, i_chapter, s.chapters[i_chapter].pgn.tree, TwoPaths.set_for_saving(store.solved_paths))
  }

  static save_paths_to_store(stats: RepertoireStat) {
    let store = new OpeningsChapterStatStore(stats.study_id, stats.i_chapter)
    store.solved_paths = stats.solved_paths.get_for_saving()


    store.practice_progress = stats.progress
  }
  

  static make(study_name: string, i_chapter: number, t: MoveTree, paths: TwoPaths = new TwoPaths()) {
    return new RepertoireStat(study_name, i_chapter, MoveScoreTree.make(t), paths)
  }

  constructor(
    readonly study_id: string, 
    readonly i_chapter: number, 
    readonly score_tree: MoveScoreTree, 
    readonly solved_paths: TwoPaths) {}

  get progress() {
    return Math.floor(this.solved_paths.expand_paths
    .map(p => this.score_tree.get_at(p)?.score ?? 0)
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

      let ss = createMemo(() => this.solved_paths.expand_paths)
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


  merge_and_save_stats(b: RepertoireStat) {
    this.solved_paths.merge_dup(b.solved_paths)
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

  const study = () => props.study

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

  createEffect(() => {
    repertoire_lala().solved_paths.replace_all(overall_repertoire_stat().solved_paths)
  })

  const repertoire_stat_for_mode = createMemo(() => {
    let t = repertoire_lala().tree!
    return untrack(() => RepertoireStat.make(study().name, i_selected_chapter(), t, new TwoPaths()))
  })

  createEffect(() => {
    let s = untrack(() => repertoire_stat_for_mode())
    s.solved_paths.replace_all(repertoire_lala().solved_paths)
  })

  createEffect(on(() => [repertoire_stat_for_mode(), overall_repertoire_stat()], (_, prev) => {
    if (prev) {
      let [m, o] = prev
      o.merge_and_save_stats(m)
    }
  }))


  createEffect(() => {
    let { mode, match_color } = repertoire_player
    if (mode === 'match' && match_color === 'black') {
      setTimeout(() => {
        repertoire_lala().reveal_one_random()
      }, 400)
    }
  })

  createEffect(on(() => shalala.add_uci, (uci?: string) => {
    if (!uci) {
      return
    }

    let success = repertoire_lala().try_next_uci_fail(uci)

    if (success) {
      if (repertoire_player.mode === 'match') {
        setTimeout(() => {
          repertoire_lala().reveal_one_random()
        }, 400)
      }
    }
  }))

  createEffect(on(() => repertoire_lala().fen_last_move, (res) => {
    if (res) {
      let [fen, last_move] = res
      shalala.on_set_fen_uci(fen, last_move)
    } else {
      shalala.on_set_fen_uci(INITIAL_FEN)
    }
  }))

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

  document.addEventListener('keypress', onKeyPress)

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
          movable={repertoire_player.mode !== undefined}
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
            <h5>Slav Defense</h5>
            <h4>{selected_chapter().name}</h4>
          </div>
          <h3 class='lichess'><a target="_blank" href={selected_chapter().site}>lichess</a></h3>
        </div>

        <div class='replay'>
          <div class='replay-v'>
            <ChesstreeShorten lala={repertoire_lala()} />
          </div>

          <div class='tools'>

            <Switch>

              <Match when={repertoire_player.mode === undefined}>
                <small> Click on variations to expand. </small>
                <small> Your goal is to guess every move correctly to fill up the progress bar. </small>
                <h2>Select a Practice Option</h2>
                <button onClick={() => repertoire_player.mode = 'moves'}><span> Play all Moves </span></button>
                <button onClick={() => repertoire_player.mode = 'match'}><span> Play as Match </span></button>
              </Match>

              <Match when={repertoire_player.mode === 'match'}>
                <h2>Play as Match</h2>
                <small> Try to guess the moves for {repertoire_player.match_color}.</small>
                <small> AI will play the next move, picking a random variation. </small>
                <small> Moves will be hidden once the game is started. </small>

                <div class='in_mode'>
                  <button onClick={() => {
                    batch(() => {

                      repertoire_player.mode = 'match'
                      repertoire_player.flip_match_color()
                    })

                  }}><span> Rematch </span></button>
                  <button class='end2' onClick={() => repertoire_player.mode = undefined}><span> End Practice </span></button>
                </div>
              </Match>

              <Match when={repertoire_player.mode === 'moves'}>
                <h2>Play all moves</h2>
                <small>Try to guess the moves for both sides.</small>
                <small>Moves will be hidden once you start.</small>

                <div class='in_mode'>
                  <button onClick={() => { repertoire_player.mode = 'moves' }}><span> Clear </span></button>
                  <button class='end2' onClick={() => repertoire_player.mode = undefined}><span> End Practice </span></button>
                </div>
              </Match>
            </Switch>
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

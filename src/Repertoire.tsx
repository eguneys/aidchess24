import { For, createSignal, createEffect, createResource, createMemo, on, Signal, Match, Switch, batch, onCleanup  } from 'solid-js'
import './Repertoire.css'
import { useParams } from '@solidjs/router'

import StudyRepo from './studyrepo'
import { Show } from 'solid-js'
import { Shala } from './Shalala'
import Chessboard from './Chessboard'
import { ChesstreeShorten, Treelala } from './Chesstree2'
import { INITIAL_FEN } from './chess_pgn_logic'
import { Color } from 'chessground/types'

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
    return this.chapters.map(_ => _.progress).reduce((a, b) => a + b)
  }
}

class RepertoireStat {

  static load_from_study = (study_name: string, i: number) => {

    return new RepertoireStat()
  }

  get progress() {
    return 0
  }
}


const Repertoire = () => {

    const params = useParams()

    const [study] = createResource(params.id, StudyRepo.read_study)

    let stats = createMemo(() => {
      const s = study()
      if (s) {
        return new RepertoireStats(s.chapters.map((_, i) => RepertoireStat.load_from_study(s.name, i)))
      }
    })

    const [i_selected_chapter, set_i_selected_chapter] = createSignal(0)

    const selected_chapter = 
    createMemo(() => study()?.chapters[i_selected_chapter()])


  let shalala = new Shala()

  let [repertoire_lala, set_repertoire_lala] = createSignal<Treelala | undefined>(undefined)
  
  createEffect(() => {
    let mode = repertoire_player.mode
    let chapter = selected_chapter()
    if (chapter) {
      let res = Treelala.make(chapter.pgn.tree.clone)
      if (mode !== undefined) {
      }
      set_repertoire_lala(res)
    }
  })


  createEffect(() => {
    let { mode, match_color } = repertoire_player
    if (mode === 'match' && match_color === 'black') {
      setTimeout(() => {
        repertoire_lala()?.reveal_one_random()
      }, 400)
    }
  })

  createEffect(on(() => shalala.add_uci, (uci?: string) => {
    if (!uci) {
      return
    }

    let success = repertoire_lala()?.try_next_uci_fail(uci)

    if (success) {
      if (repertoire_player.mode === 'match') {
        setTimeout(() => {
          repertoire_lala()?.reveal_one_random()
        }, 400)
      }
    }
  }))


  createEffect(on(() => repertoire_lala()?.fen_last_move, (res) => {
    if (res) {
    let [fen, last_move] = res
      shalala.on_set_fen_uci(fen, last_move)
    } else {
      shalala.on_set_fen_uci(INITIAL_FEN)
    }
  }))

  createEffect(on(() => shalala.on_wheel, (dir) => {
    if (dir) {
      repertoire_lala()?.on_wheel(dir)
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


    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName !== 'PIECE' &&
        target.tagName !== 'SQUARE' &&
        target.tagName !== 'CG-BOARD'
      )
        return;
      e.preventDefault();
      shalala.set_on_wheel(Math.sign(e.deltaY))

    }


    let repertoire_player = new RepertoirePlayer()

    createEffect(() => {
      repertoire_player.match_color = study()?.orientation ?? 'white'
    })

    return (<>
    <div onWheel={onWheel} class='repertoire'>

      <Show when={!study.loading} fallback={"Loading..."}>

      <div class='list-wrap'>
      <h1 class='header'>Repertoire</h1>
      <div class='list'>


        <div><h3 class='title'>{study()!.name}</h3><Progress width={stats()?.progress ?? 0}/></div>
        <ul>
            <For each={study()!.chapters}>{ (chapter, i) =>
              <li onClick={() => set_i_selected_chapter(i())} class={i() === i_selected_chapter() ? 'active': ''}><div><h3>{chapter.name}</h3> <Progress width={stats()?.chapters[i()].progress ?? 0}/></div></li>
            }</For>
        </ul>
      </div>
      </div>

      </Show>


      <Show when={selected_chapter()}>{chapter => 
        <>
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
        <div class='replay-wrap'>
          <div class='replay-header'>
            <div class='title'>
                <h5>Slav Defense</h5>
                <h4>{chapter().name}</h4>
            </div>
            <h3 class='lichess'><a target="_blank" href={chapter().site}>lichess</a></h3>
          </div>
  
          <div class='replay'>
            <div class='replay-v'>
              <Show when={repertoire_lala()}>{ repertoire_lala =>
                <ChesstreeShorten lala={repertoire_lala()}/>
              }</Show>
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
  
          </>
      }</Show>
    </div>


    </>)
}


export default Repertoire
import { For, createSignal, createEffect, createResource, createMemo, on, Signal, Match, Switch  } from 'solid-js'
import './Repertoire.css'
import { useParams } from '@solidjs/router'

import StudyRepo from './studyrepo'
import { Show } from 'solid-js'
import { Shala } from './Shalala'
import Chessboard from './Chessboard'
import { ChesstreeShorten, Treelala } from './Chesstree2'
import { INITIAL_FEN } from './chess_pgn_logic'

type PlayMode = 'moves' | 'match'

class RepertoirePlayer {
  _mode: Signal<PlayMode | undefined>

  get mode() {
    return this._mode[0]()
  }

  set mode(_: PlayMode | undefined) {
    this._mode[1](_)
  }

  constructor() {
    this._mode = createSignal<PlayMode | undefined>(undefined, { equals: false })
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


const Repertoire = () => {

    const params = useParams()

    const [study] = createResource(params.id, StudyRepo.read_study)


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


    return (<>
    <div onWheel={onWheel} class='repertoire'>

      <Show when={!study.loading} fallback={"Loading..."}>

      <div class='list-wrap'>
      <h1 class='header'>Repertoire</h1>
      <div class='list'>


        <div><h3 class='title'>{study()!.name}</h3><Progress width={30}/></div>
        <ul>
            <For each={study()!.chapters}>{ (chapter, i) =>
              <li onClick={() => set_i_selected_chapter(i())} class={i() === i_selected_chapter() ? 'active': ''}><div><h3>{chapter.name}</h3> <Progress width={0}/></div></li>
            }</For>
        </ul>
      </div>
      </div>

      </Show>


      <Show when={selected_chapter()}>{chapter => 
        <>
        <div class='board-wrap'>
              <Chessboard
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
                      <h2>Select an Option</h2>
                      <button onClick={() => repertoire_player.mode = 'moves'}><span> Play all Moves </span></button>
                      <button onClick={() => repertoire_player.mode = 'match'}><span> Play as Match </span></button>
                    </Match>

                    <Match when={repertoire_player.mode === 'match'}>
                      <h2>Play as Match</h2>
                      <small> AI will play the random next move </small>

                      <div class='in_mode'>
                        <button onClick={() => { repertoire_player.mode = 'match' }}><span> Rematch </span></button>
                        <button class='end2' onClick={() => repertoire_player.mode = undefined}><span> End Practice </span></button>
                      </div>
                    </Match>

                    <Match when={repertoire_player.mode === 'moves'}>
                      <h2>Play all moves</h2>

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
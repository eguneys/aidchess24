import './Explorer.scss'
import { Color } from "chessops"
import Chessboard from "./Chessboard"
import { ChesstreeShorten, Treelala2 } from "./Chesstree2"
import { Shala } from "./Shalala"
import { PGNChapter } from "./studyrepo"
import { For, Show, createEffect, createMemo, createResource, createSignal, on, onCleanup, onMount } from "solid-js"
import StudyRepo, { RepertoiresFixture } from './studyrepo'
import { INITIAL_FEN } from './chess_pgn_logic'
import { stepwiseScroll } from './common/scroll'
import { usePlayer } from './sound'

const Explorer = () => {

    let all = RepertoiresFixture.all.filter(_ => _.study_link !== '' && _.category !== 'Tactics')
    const [active_index, set_active_index] = createSignal(0)

    const [pgn_study] = createResource(() => all[active_index()].study_link, id => StudyRepo.read_study(id))

    const [i_chapter_index, set_i_chapter_index] = createSignal(0)

    const chapters = createMemo(() => pgn_study()?.chapters)
    const pgn_chapter = createMemo(() => chapters()?.[i_chapter_index()])

    createEffect(on(pgn_study, () => {
        set_i_chapter_index(0)
    }))

    return (<>
    <div class='explorer'>
        <div class='e-studies'>
            <h3>Studies</h3>
            <select onChange={e => set_active_index(parseInt(e.currentTarget.value))}>
              <For each={all}>{ (study, i) =>
                <option value={i()}>{study.study_name}</option>
              }</For>
            </select>
            <div class='e-chapters'>
                <h3>Chapters</h3>
                <Show when={chapters()} fallback= {
                    <span> Loading ... </span>
                }>{ chapters =>
                    <select onChange={e => set_i_chapter_index(parseInt(e.currentTarget.value))}>
                       <For each={chapters()}>{ (chapter, i) =>
                        <option value={i()}>{chapter.name}</option>
                       }</For>
                    </select>
                }</Show>
            </div>
        </div>

        <div class='e-chapter-wrap'>
            <Show when={pgn_chapter()} fallback = {
                <span>Loading...</span>
            }>{ pgn_chapter => 
                <ExplorerChapter pgn_chapter={pgn_chapter()}/>
            }</Show>
        </div>
    </div>
    </>)
}

const ExplorerChapter = (props: { pgn_chapter: PGNChapter }) => {

    const Player = usePlayer()

    const is_board_movable = () => {
        return false
    }
    const match_color = (): Color => 'white'

    const pgn_chapter = () => props.pgn_chapter

    const pgn = createMemo(() => pgn_chapter().pgn)

    const shalala = new Shala()

    const lala = createMemo(() => {
        let res = Treelala2.make(pgn().tree)

        return res
    })




  createEffect(on(() => lala().fen_last_move, (res) => {
    if (res) {
      let [fen, last_move] = res
      shalala.on_set_fen_uci(fen, last_move)
    } else {
      shalala.on_set_fen_uci(INITIAL_FEN)
    }

  }))



  createEffect(on(() => shalala.on_wheel, (dir) => {
    if (dir) {
      lala().on_wheel(dir)
    }
  }))



  const onKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'f') {
      //player.flip_match_color()
    }
  }

  createEffect(on(() => lala().tree?.get_at(lala().cursor_path), v => {
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




    let el: HTMLElement

  onMount(() => {
    el.addEventListener('wheel', onWheel, { passive: false })
  })
  onCleanup(() => {
    el.removeEventListener('wheel', onWheel)
  })


    return (<>
    <div ref={_ => el = _} class='explorer-chapter'>
      <div class='board-wrap'>
        <Chessboard
          orientation={match_color()}
          movable={is_board_movable()}
          doPromotion={shalala.promotion}
          onMoveAfter={shalala.on_move_after}
          fen_uci={shalala.fen_uci}
          color={shalala.turnColor}
          dests={shalala.dests} />
      </div>
      <div class='replay-wrap'>
        <div class='replay-header'>
            <h3>{pgn_chapter().name}</h3>

        </div>
        <div class='replay'>
            <div class='replay-v'>

            <ChesstreeShorten lala={lala()} />
            </div>
            <div class='replay-jump'>
              <button onClick={() => lala().navigate_first()} class={"fbt first" + (lala().can_navigate_prev ? '' : ' disabled')} data-icon=""/>
              <button onClick={() => lala().navigate_prev()} class={"fbt prev" + (lala().can_navigate_prev ? '' : ' disabled')} data-icon=""/>
              <button onClick={() => lala().navigate_next()} class={"fbt next" + (lala().can_navigate_next ? '' : ' disabled')} data-icon=""/>
              <button onClick={() => lala().navigate_last()} class={"fbt last" + (lala().can_navigate_next ? '' : ' disabled')} data-icon=""/>
            </div>
            <div class='replay-tools'>

            </div>
        </div>
      </div>
    </div>
    </>)
}

export default Explorer
import { createSignal, createEffect, createResource, createMemo, on  } from 'solid-js'
import './Repertoire.css'
import './Tactics.css'
import { useParams } from '@solidjs/router'

import StudyRepo from './studyrepo'
import { Show } from 'solid-js'
import Chessboard from './Chessboard'
import { Shala } from './Shalala'
import { MoveTree } from './chess_pgn_logic'
import Chesstree2, { Treelala } from './Chesstree2'

class PuzzlePgn {

  static make = (puzzle: string, pgn: MoveTree) => {
    return new PuzzlePgn(puzzle, pgn)
  }

  attempt: Treelala

  constructor(readonly puzzle: string, readonly solution: MoveTree) {
    this.attempt = Treelala.make(solution)
  }
}


const ProgressOutOf = (props: { width: number, nb: number }) => {
    return (<>
    
    <div class='progress'>
        <div class='bar' style={`width: ${(props.width/props.nb) * 100}%`}/>
        <h3>{`${props.width}/${props.nb}`}</h3>
    </div>
  </>)
}


const Repertoire = () => {

  const params = useParams()

  const [pgn] = createResource(params.id, StudyRepo.read_study)


  const [i_selected_chapter, set_i_selected_chapter] = createSignal(0)

  const selected_chapter =
    createMemo(() => pgn()?.chapters[i_selected_chapter()])

  let shalala = new Shala()

  let puzzle_pgn = createMemo(on(selected_chapter, (chapter) => {
    if (chapter) {
      let res = PuzzlePgn.make(chapter.pgn.puzzle!, chapter.pgn.tree)

      res.attempt.cursor_path = res.attempt.tree!.root.data.path
      res.attempt.hidden_paths = res.attempt.tree!.root.children.map(_ => _.data.path)

      return res
    }
  }))


  createEffect(on(() => shalala.add_uci, (uci?: string) => {
    if (!uci) {
      return
    }

    puzzle_pgn()?.attempt.try_next_uci_fail(uci)
  }))

  createEffect(on(() => puzzle_pgn()?.attempt.fen_last_move, (res) => {
    if (res) {
    let [fen, last_move] = res
      shalala.on_set_fen_uci(fen, last_move)
    }
  }))

  createEffect(on(() => shalala.on_wheel, (dir) => {
    if (dir) {
      puzzle_pgn()?.attempt.on_wheel(dir)
    }
  }))

  const on_next_puzzle = () => {

    set_i_selected_chapter(i_selected_chapter() + 1)
  }

  const on_view_solution = () => {
    puzzle_pgn()?.attempt.reveal_hidden_paths()
  }

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

  return (<>
    <div onWheel={onWheel} class='repertoire'>

      <Show when={!pgn.loading} fallback={"Loading..."}>

      <div class='list-wrap'>
      <h1 class='header'>Tactics</h1>
      <div class='list'>
        <div><h3 class='title'>{pgn()!.name}</h3><ProgressOutOf width={3} nb={10}/></div>
        <div><p>Current Run</p><ProgressOutOf width={3} nb={50}/></div>
      </div>
      </div>

      </Show>


      <Show when={puzzle_pgn()}>{puzzle_pgn => 
        <>
        <div class='board-wrap'>
              <Chessboard
                movable={!puzzle_pgn().attempt.is_revealed}
                doPromotion={shalala.promotion}
                onMoveAfter={shalala.on_move_after}
                fen_uci={shalala.fen_uci}
                color={shalala.turnColor}
                dests={shalala.dests} />

        </div>
        <div class='replay-wrap'>
  
          <div class='replay-header'>
            <div class='title'>
                <h5>{pgn()!.name}</h5>
                <h4>3/50</h4>
            </div>
            <h3 class='lichess'><a target="_blank" href={`https://lichess.org/training/${puzzle_pgn().puzzle}`}>lichess</a></h3>
          </div>
  
          <div class='replay'>
            <div class='replay-v'>
              <Chesstree2 lala={puzzle_pgn().attempt}/>
            </div>
            <div class='tools'>
              <Show when={puzzle_pgn().attempt.is_revealed} fallback={
                  <>
                <h3>Find the best line!</h3>
                <button onClick={on_view_solution}>View Solution</button>
                </>
              }>

                <h3>Puzzle solved.</h3>
                <button onClick={on_next_puzzle}>Next Puzzle</button>
              </Show>
            </div>
          </div>
        </div>
  
        </>
      }</Show>
    </div>


    </>)
}


export default Repertoire
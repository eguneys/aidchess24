import { createSignal, createEffect, createResource, createMemo, on, Signal  } from 'solid-js'
import './Repertoire.css'
import './Tactics.css'
import { useParams } from '@solidjs/router'

import StudyRepo from './studyrepo'
import { Show } from 'solid-js'
import Chessboard from './Chessboard'
import { Shala } from './Shalala'
import { MoveTree } from './chess_pgn_logic'
import Chesstree2, { Treelala } from './Chesstree2'

class PuzzleRuns {

  static make = (id: string) => {
    return new PuzzleRuns(id)
  }

  _scores: Signal<number[]>
  _current_run: [Signal<number>, Signal<number>]

  constructor(readonly id: string) {
    this._scores = createSignal<number[]>([], { equals: false })
    this._current_run = [createSignal(0), createSignal(0)]
  }

  get current_score() {
    return this._current_run[0][0]() ?? 0
  }
  get i_selected_chapter() {
    return this._current_run[1][0]() ?? 0
  }

  set current_score(n: number) {
    this._current_run[0][1](n)
  }
  set i_selected_chapter(n: number) {
    this._current_run[1][1](n)
  }

  get scores() {
    return this._scores[0]()
  }


  new_current_run() {
    this.current_score = 0
    this.i_selected_chapter = 0
  }

  add_current_run() {
    let ss = this._scores[0]()
    ss.push(this.current_score)
    ss = ss.slice(-10)
    this._scores[1](ss)
  }

  get highscore( ){
    return Math.max(...[0, ...this._scores[0]()])
  }
}

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
  let id = params.id

  let runs = PuzzleRuns.make(id)

  const [pgn] = createResource(id, StudyRepo.read_study)

  const selected_chapter =
    createMemo(() => pgn()?.chapters[runs.i_selected_chapter])

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

  const puzzle_sub_title = () => {
    let pp = pgn()
    if (!pp) {
      return '--'
    }

    return `${runs.i_selected_chapter+ 1} / ${pp.chapters.length}  Score: ${runs.current_score}`
  }

  const check_score = () => {

    let i = puzzle_pgn()?.attempt.solved_paths.length ?? 0
    let f = puzzle_pgn()?.attempt.failed_paths.length ?? 0
    if (i % 2 === 1) {
      i =  i + 1 + (i - 1) / 2
    } else {
      i = i + i / 2
    }
    if (f % 2 === 1) {
      f = f + 1 + (f - 1) / 2
    } else {
      f = f + i / 2
    }
    return i - f
  }

  const on_new_run = () => {
    runs.new_current_run()
  }

  const on_next_puzzle = () => {
    runs.current_score = Math.max(0, runs.current_score + check_score())
    runs.i_selected_chapter = runs.i_selected_chapter + 1
  }


  createEffect(on(() => puzzle_pgn()?.attempt.is_revealed, (p, p0) => {
    if (p && !p0) {
      if (runs.i_selected_chapter === pgn()!.chapters.length - 1) {
        runs.current_score = Math.max(0, runs.current_score + check_score())
        runs.add_current_run()
      }
    }
  }))

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
        <div>
          <h3 class='title'>{pgn()!.name}</h3><span>Total Runs</span><ProgressOutOf width={runs.scores.length} nb={10}/>
          <p>Highscore: {runs.highscore} </p>
          </div>
        <div>
            <p>Current Run</p><ProgressOutOf width={runs.i_selected_chapter + 1} nb={pgn()!.chapters.length}/>
            <p>Score: {runs.current_score}</p>
        </div>
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
                <h4>{puzzle_sub_title()}</h4>
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

                <h3>Puzzle solved. <span> Score +{check_score()}</span></h3>
                <Show when={runs.i_selected_chapter === pgn()!.chapters.length - 1} fallback={
                  <button onClick={on_next_puzzle}>Next Puzzle</button>
                }>
                    <h3> Current Run Finished </h3>
                    <button onClick={on_new_run}>New Run</button>
                </Show>
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
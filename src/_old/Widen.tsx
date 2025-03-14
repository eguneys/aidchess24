import { For, Show, Signal, batch, createEffect, createMemo, createSignal, on } from 'solid-js'
import Chessboard from './Chessboard'
import { Shala } from './Shalala'
import './Widen.scss'
import { fen_after_apply_uci, fen_turn, fen_uci_to_san } from './chess_pgn_logic'
import CandidatesRepository from './candidates'

type MoveState = 'guess' | 'none' | 'filled'

class CandidateMove {

    get score() {
        let { uci, solution_uci } = this
        if (!uci) {
            return 0
        }
        if (uci === solution_uci) {
            return 5
        }
        if (this.pvs.includes(uci)) {
            return 2
        }
        return 0
    }

    takeback() {
        this.uci = undefined
        this.state = 'guess'
    }

    get applied_fen() {
        let uci = this.uci

        if (uci) {
            return fen_after_apply_uci(this.fen, uci)
        }
        return this.fen
    }

    get solution_san() {
        let uci = this.solution_uci
        if (!uci) {
            return undefined
        }
        return fen_uci_to_san(this.fen, uci)
    }



    get san() {
        let uci = this.uci
        if (!uci) {
            return undefined
        }
        return fen_uci_to_san(this.fen, uci)
    }

    get uci() {
        return this._uci[0]()
    }

    set uci(_: string | undefined) {
        this._uci[1](_)
    }

    get state() {
        return this._state[0]()
    }

    set state(_: MoveState) {
        this._state[1](_)
    }

    _uci: Signal<string | undefined>
    _state: Signal<MoveState>

    constructor(readonly pvs: string[], readonly fen: string, state: MoveState = 'none', readonly solution_uci?: string) {

        this._state = createSignal(state)
        this._uci = createSignal()
    }
}

const Widen = () => {

    let [cc, set_cc] = createSignal(CandidatesRepository.get_current_8())

    let [i_cc, set_i_cc] = createSignal(0)

    let cp = createMemo(() => cc()[i_cc()])

    const fen = createMemo(() => cp().fen)
    let pvs = createMemo(() => cp().candidates)
    const nb_candidates = createMemo(() => pvs().length)

    let shalala = new Shala()

    const [active_candidate, set_active_candidate] = createSignal(1)

    const active_if_candidate = (c: number) => {
        if (active_candidate() === c) {
            return 'active'
        }
    }

    const active_if_cc = (c: number) => {
        if (i_cc() === c) {
            return 'active'
        }
    }

    const orientation = createMemo(() => fen_turn(fen()))
    const all_candidates = createMemo(() => {
        return cc().map(cc => {
            let ff = cc.fen
            let nb_cc = cc.candidates.length
            let pp = cc.candidates

            return [
                new CandidateMove(pp, ff, nb_cc >= 2 ? 'guess' : undefined, pp[0]),
                new CandidateMove(pp, ff, nb_cc >= 2 ? 'guess' : undefined, pp[1]),
                new CandidateMove(pp, ff, nb_cc >= 3 ? 'guess' : undefined, pp[2]),
                new CandidateMove(pp, ff, nb_cc >= 4 ? 'guess' : undefined, pp[3]),
                new CandidateMove(pp, ff, nb_cc >= 5 ? 'guess' : undefined, pp[4]),
            ]
        })
    })

    const candidates = createMemo(() => all_candidates()[i_cc()])

    const total_score = createMemo(() =>
        all_candidates()
            .map(_ => _.map(_ => _.score).reduce((a: number, b: number) => a + b, 0))
            .reduce((a: number, b: number) => a + b, 0)
    )


    createEffect(on(fen, fen => {
        shalala.on_set_fen_uci(fen)
    }))

    const candidate_move = createMemo(() => candidates()[active_candidate() - 1])

    createEffect(on(() => candidate_move().applied_fen, fen => {
        let uci = candidate_move().uci
        if (results_mode()) {
            return
        }
        shalala.on_set_fen_uci(fen, uci)
    }))

    createEffect(on(() => shalala.add_uci, (ucisan?: [string, string]) => {
        if (!ucisan) {
            return
        }
        let [uci] = ucisan
        let cc = candidate_move()
        if (cc.state !== 'guess') {
            return
        }

        cc.state = 'filled'
        cc.uci = uci


        set_active_candidate_timeout = setTimeout(() => {
            set_active_candidate_to_next_guess()
        }, 1000)
    }))

    let set_active_candidate_timeout: number

    const set_active_candidate_to_next_guess = () => {
        let cc = candidates()
        let aa = active_candidate()

        for (let i = aa + 1; i <= 5; i++) {
            if (cc[i - 1].state === 'guess') {
                set_active_candidate(i) 
                return
            }
        }

        for (let i = 1; i < aa; i++) {
            if (cc[i - 1].state === 'guess') {
                set_active_candidate(i) 
                return
            }
        }
    }

    const is_board_movable = () => candidate_move().state === 'guess'

    const is_all_guessed = createMemo(() => candidates().filter(_ => _.state === 'guess').length === 0)
    const is_final_position = createMemo(() => i_cc() === 7)

    const go_next_position = () => {
        go_to_position(i_cc() + 1)
    }

    const go_to_position = (i: number) => {
        batch(() => {
            clearTimeout(set_active_candidate_timeout)
          set_i_cc(i)
          set_active_candidate(1)
        })
    }

    const [results_mode, set_result_mode] = createSignal(false)

    const see_results = () => {
        batch(() => {
          set_result_mode(true)
          set_i_cc(0)
        })
    }

    const see_new_puzzles = () => {
        batch(() => {
          set_cc(CandidatesRepository.get_next_8())
          set_i_cc(0)
          set_active_candidate(1)
          set_result_mode(false)
        })
    }

    const analyse_on_lichess = () => {
        let fen = candidate_move().fen.replace(' ', '%20')
        window.open(`https://lichess.org/analysis?fen=${fen}`, '_blank')
    }

    return (<>
    <main class='widen'>
      <div class='board-wrap'>
        <Chessboard
          orientation={orientation()}
          movable={is_board_movable()}
          doPromotion={shalala.promotion}
          onMoveAfter={shalala.on_move_after}
          fen_uci={shalala.fen_uci}
          color={shalala.turnColor}
          dests={shalala.dests} />
      </div>

      <div class='replay-wrap'>
        <div class='header'>Widen Your Search</div>
        <div class='replay'>
            <Show when={results_mode()} fallback={
            <div class='questions'>
            <h3>There are {nb_candidates()} Candidate Moves</h3>
            <small>Positions taken from masters games</small>
            <p>that doesn't worsen the position too much.</p>
            <p>Try to guess what they are.</p>
            <p>Order is considered for extra score.</p>
            <small>Some positions are not winning, try to find the best resistance.</small>


            <h3>{i_cc() + 1} of 8</h3>

            <ul class='candidates'>
                <For each={candidates()}>{(candidates, i) =>
                <Show when={candidates.state !== 'none'}>
                  <li onClick={() => set_active_candidate(i() + 1)} class={active_if_candidate(i() + 1)}>
                    <Show when={candidates.state === 'guess'} fallback={

                      <div><span>{candidates.san}</span><a onClick={() => {candidates.takeback(); set_active_candidate(i() + 1)}}>Takeback</a></div>
                    }>
                      <div><span>--</span></div>
                    </Show>
                  </li>
                </Show>
                }</For>
            </ul>


            <Show when={is_all_guessed()}>
                <Show when={is_final_position()} fallback={
                  <a class='link' onClick={() => { go_next_position() }}>Next Position</a>
                }>
                  <a class='link' onClick={() => { see_results() }}>See Results</a>
                </Show>
            </Show>
            </div>
            }>

            <div class='results'>

                <h3>Total Score: {total_score()} </h3>

                <ul class='cc-list'>
                  <For each={cc()}>{ (_cc, i) =>
                    <li class={active_if_cc(i())} onClick={() => go_to_position(i())}>{i() + 1}</li>
                  }</For>
                </ul>


                <div class='cc-compare'>
                <a onClick={() => analyse_on_lichess()} class='analyse'> Analyse on lichess </a>
                <div class='compare'>
                    <div>
                        <h4>You</h4>
                        <ul>
                            <For each={candidates()}>{ candidates => 
                            <Show when={candidates.state !== 'none'}>
                              <li>{candidates.san}  <span>{candidates.score}</span></li>
                            </Show>
                            }</For>
                        </ul>
                    </div>
                    <div>
                        <h4>Answer</h4>
                        <ul>
                            <For each={candidates()}>{ candidates => 
                            <Show when={candidates.state !== 'none'}>
                              <li>{candidates.solution_san}</li>
                            </Show>
                            }</For>
                        </ul>
                    </div>
                </div>

                <div class='q-score'>
                    <span>Score: {candidates().map(_ => _.score).reduce((a: number, b: number) => a + b, 0)}</span>
                </div>
                </div>
                <div class='next-cc'>
                    <a onClick={() => { see_new_puzzles() }}>New Puzzles</a>
                </div>
            </div>
            </Show>

        </div>
      </div>
    </main>
    </>)
}

export default Widen
import { onCleanup, useContext } from "solid-js";
import { BestMoveWithDepthProgress, createLazyMemoAndCacheGet, StockfishContext } from "../ceval2/StockfishContext";
import { Step } from "./step_types";
import { LocalEval } from "../ceval2/stockfish-module";
import { povDiff } from "../ceval2/winningChances";
import { fen_turn, INITIAL_FEN } from "../chess_pgn_logic";
import { Accessor, createMemo, createSignal } from "solid-js";
import { Color } from "chessops";
import { keyArray } from "@solid-primitives/keyed";

export type GameId = string

export const diff_eval = (color: Color, before: LocalEval, after: LocalEval) => {
    return povDiff(color, before, after)
}

export type Judgement = 'top' | 'ok' | 'inaccuracy' | 'mistake' | 'blunder'


export type StepWithSearch = Step & {
    before_search?: LocalEval,
    search?: LocalEval,
    judgement?: Judgement,
    progress?: LocalEval
}

export type StepLazyQueueWork = {
    step: Step,
    d8pv6: [Accessor<StepWithSearch>, Accessor<StepWithSearch | undefined>]
    d20pv6: [Accessor<StepWithSearch>, Accessor<StepWithSearch | undefined>]
    d8pv1: [Accessor<StepWithSearch>, Accessor<StepWithSearch | undefined>]
    d20pv1: [Accessor<StepWithSearch>, Accessor<StepWithSearch | undefined>]
    clear(): void
}

export type StepsWithStockfishComponent = {
    set_game_id: (_: string) => void
    set_steps: (_: Step[]) => void
    steps_with_stockfish: StepLazyQueueWork[]
}

export const DEPTH8 = 10

export function StepsWithStockfishComponent() {
    let s = useContext(StockfishContext)!
    function calc_fen_ply(fen: string, ply: number, multi_pv: number, depth: number, 
        on_loading: () => void, 
        on_depth: (e: LocalEval) => void, 
        on_best_move: (e: LocalEval) => void) {
        s.best_move_with_cache(game_id(), fen, ply, multi_pv, depth, on_loading, on_depth, on_best_move)
    }

    type Work = { 
        set_loading: () => void, 
        set_depth_eval: (_: LocalEval) => void, 
        set_best_eval: (_: LocalEval) => void, 
        cancel: () => void, 
        fen: string, ply: number, depth: number, multi_pv: number }

    let working: Work | undefined = undefined
    let queue: Work[] = []

    function queue_calc_fen_ply(fen: string, ply: number, depth: number, multi_pv: number) {
        let [loading, set_loading] = createSignal(void 0)
        let [depth_eval, set_depth_eval] = createSignal<LocalEval | undefined>(undefined)
        let [best_eval, set_best_eval] = createSignal<LocalEval | undefined>(undefined)


        let e: BestMoveWithDepthProgress = {
            get loading() {
                return loading()
            },
            get depth_eval() {
                return depth_eval()
            },
            get best_eval() {
                return best_eval()
            },
            cancel
        }
        let item: Work = { cancel, fen, ply, depth, multi_pv, set_loading, set_depth_eval, set_best_eval }

        function cancel() {
            let i = queue.indexOf(item)
            if (i !== -1) {
                queue.splice(i, 1)
            }
            if (working === item) {
                console.trace('working cancel')
                working = undefined
                s.stop()
            }
            dequeue()
        }

        queue.push(item)
        dequeue()
        return e
    }

    function dequeue() {
        if (working) {
            return
        }
        
        working = queue.pop()

        if (!working) {
            return
        }

        const on_best_move = (e: LocalEval) => {
            working?.set_best_eval(e)
            working = undefined
            dequeue()
        }

        calc_fen_ply(working.fen, working.ply, working.multi_pv, working.depth, working.set_loading, working.set_depth_eval, on_best_move)
    }

    function queue_calc_step(step: Step, depth: number, multi_pv: number) {

        let be = queue_calc_fen_ply(step.before_fen, step.ply - 1, depth, multi_pv)
        let e = queue_calc_fen_ply(step.fen, step.ply, depth, multi_pv)

        function judge(turn: Color, before_search: LocalEval, search: LocalEval) {
            let diff = diff_eval(turn, before_search, search)

            let judgement: Judgement = diff < 0.02 ? 'top' : diff < 0.03 ? 'ok' : diff < 0.05 ? 'inaccuracy' : diff < 0.12 ? 'mistake' : 'blunder'
            return judgement
        }

        return createMemo<StepWithSearch>(() => {

            onCleanup(() => {
                e.cancel()
                be.cancel()
            })

            return {
                ...step,
                get before_search() {
                    return be.best_eval
                },
                get search() {
                    return e.best_eval
                },
                get judgement() {

                    let before = be.best_eval
                    let after = e.best_eval

                    if (before && after) {
                        return judge(fen_turn(step.before_fen), before, after)
                    }
                },
                get progress() {
                    return e?.depth_eval
                }
            }
        })
    }



    function step_lazy_queue_work(step: Step): StepLazyQueueWork {

        let [d8pv6, set_d8pv6] = createSignal(createLazyMemoAndCacheGet(() => queue_calc_step(step, DEPTH8, 6)()))
        let [d8pv1, set_d8pv1] = createSignal(createLazyMemoAndCacheGet(() => queue_calc_step(step, DEPTH8, 1)()))
        let [d20pv6, set_d20pv6] = createSignal(createLazyMemoAndCacheGet(() => queue_calc_step(step, 20, 6)()))
        let [d20pv1, set_d20pv1] = createSignal(createLazyMemoAndCacheGet(() => queue_calc_step(step, 20, 1)()))

        return {
            step,
            get d8pv6() { return d8pv6() },
            get d8pv1() { return d8pv1() },
            get d20pv6() { return d20pv6() },
            get d20pv1() { return d20pv1() },
            clear() {
                set_d8pv6(createLazyMemoAndCacheGet(() => queue_calc_step(step, DEPTH8, 6)()))
                set_d20pv6(createLazyMemoAndCacheGet(() => queue_calc_step(step, 20, 6)()))
                set_d8pv1(createLazyMemoAndCacheGet(() => queue_calc_step(step, DEPTH8, 1)()))
                set_d20pv1(createLazyMemoAndCacheGet(() => queue_calc_step(step, 20, 1)()))
            }
        }
    }

    let [game_id, set_game_id] = createSignal('')

    let [steps, set_steps] = createSignal<Step[]>([])

    let steps_with_stockfish = keyArray(steps, step => [step.fen, step.uci].join('$$'),
        step => step_lazy_queue_work(step()))

    let initial_work = step_lazy_queue_work({
        before_fen: INITIAL_FEN,
        fen: INITIAL_FEN,
        path: '',
        ply: 0,
        san: '',
        uci: '',
    })

    return {
        set_game_id,
        set_steps,
        get steps_with_stockfish() {
            return steps_with_stockfish()
        },
        get initial_step() {
            return initial_work
        }
    }
}

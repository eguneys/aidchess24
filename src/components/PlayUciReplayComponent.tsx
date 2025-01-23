import { Accessor, createEffect, createMemo, createResource, createSignal, For, mapArray, on, Show } from "solid-js"
import './PlayUciReplay.scss'
import { StockfishContextRes } from "../ceval2/StockfishContext"
import { LocalEval } from "../ceval2/stockfish-module"
import { povDiff } from "../chess_winningChances"
import { fen_turn } from "../chess_pgn_logic"
import { ReactiveMap } from "@solid-primitives/map"
import { build_steps, FEN, fen_is_end, Ply, push_san, SAN, Step } from "./step_types"

export type PlayUciSingleReplayComponent = {
    plies: Ply[],
    sans: SAN[],
    ply_sans: SAN[],
    steps_up_to_ply: Step[],
    steps: Step[],
    last_step: Step | undefined,
    ply_step: Step | undefined,
    ply: number,
    play_san: (san: SAN) => void,
    goto_ply: (ply: Ply) => void
    get_prev_ply: () => Ply | undefined,
    get_next_ply: () => Ply | undefined,
    goto_prev_ply_if_can: () => void,
    goto_next_ply_if_can: () => void,
    is_on_last_ply: boolean,
    sf_steps: (RequestStepWithSearch | undefined)[],
    last_sf_step: RequestStepWithSearch | undefined,
    set_sans(_: SAN[]): void
}

export function PlayUciSingleReplayComponent(s: StockfishContextRes, game_id: GameId): PlayUciSingleReplayComponent {

    let sf_builder = StockfishBuilderComponent({ s, game_id })



    let [steps, set_steps] = createSignal<Step[]>([])
    const last_step = createMemo(() => { 
        let ss = steps()
        return ss[ss.length - 1]
    })

    let [i_ply, set_i_ply] = createSignal(last_step()?.ply ?? 0)

    const ply_step = createMemo(() => {
        let ply = i_ply()
        let ss = steps()
        return ss.find(_ => _.ply === ply)
    })



    let sans = createMemo(mapArray(steps, step => step.san))
    let plies = createMemo(mapArray(steps, step => step.ply))

    let ply_sans = createMemo(() => {
        let ss = sans()
        let pp = plies()

        return ss.map((san, i) => {
            let ply = pp[i]

            return `${ply} ${san}`
        })
    })

    const goto_ply = (ply: Ply) => {
        set_i_ply(ply)
    }
    const get_prev_ply = () => {
        let res = i_ply() - 1
        return plies().find(_ => _ === res)
    }
    const get_next_ply = () => {
        let res = i_ply() + 1
        return plies().find(_ => _ === res)
    }


    const sf_steps = createMemo(mapArray(steps, step =>
        sf_builder.request_step_with_search(step)
    ))

    const last_sf_step = createMemo(() => {
        let ss = sf_steps()
        return ss[ss.length - 1]
    })



    
    return {
        set_sans(sans: SAN[]) {
            set_steps(build_steps(sans))
            set_i_ply(sans.length)
        },
        get sf_steps() { return sf_steps() },
        get last_sf_step() { return last_sf_step() },
        get steps() {
            return steps()
        },
        get steps_up_to_ply() {
            return steps().slice(0, i_ply())
        },
        get plies() {
            return plies()
        },
        get sans() {
            return sans()
        },
        get ply_sans() {
            return ply_sans()
        },
        get ply_step() {
            return ply_step()
        },

        get last_step() {
            return last_step()
        },
        get ply() {
            return i_ply()
        },
        goto_ply,
        get_prev_ply,
        get_next_ply,
        goto_prev_ply_if_can() {
            let res = get_prev_ply()
            if (res !== undefined) {
                goto_ply(res)
            }
            if (i_ply() === 1) {
                set_i_ply(0)
            }
        },
        goto_next_ply_if_can() {
            let res = get_next_ply()
            if (res !== undefined) {
                goto_ply(res)
            }
        },
        play_san(san: SAN) {
            let last = last_step()
            if (!last) {
                set_steps(build_steps([san]))
                return
            }

            let ss = steps()
            set_steps(push_san(san, ss))

            set_i_ply(last.ply + 1)
        },
        get is_on_last_ply() {
            return i_ply() === (last_step()?.ply ?? 0)
        }
    }

}


export function PlayUciSingleReplay(props: { play_replay: PlayUciSingleReplayComponent }) {
    const ply_sans = createMemo(mapArray(() => props.play_replay.ply_sans, ply_san => {
        let [ply, san] = ply_san.split(' ')
        return {
            ply: parseInt(ply),
            san
        }
    }))

    const goto_ply = (ply: Ply) => {
        props.play_replay.goto_ply(ply)
    }

    const i_ply = createMemo(() => props.play_replay.ply_step?.ply)


    let $moves_el: HTMLElement

    createEffect(on(ply_sans, (sans) => {
        if (sans.length < 7) return

        let cont = $moves_el.parentElement!

        let st: number | undefined
        if (props.play_replay.ply < 3) {
            st = 0
        } else if (props.play_replay.is_on_last_ply) {
            st = 99999
        } else {
            let ply_el = cont.querySelector('.active') as HTMLElement | undefined
            if (ply_el) {
                st = ply_el.offsetTop - $moves_el.offsetHeight / 2 + ply_el.offsetHeight / 2
            }
        }
        if (st !== undefined) {
            cont.scrollTo({behavior: 'smooth', top: st })
        }
    }))

    const judgement_klass = (i: number) => {
        let sf_step = props.play_replay.sf_steps[i]

        if (!sf_step) {
            return ''
        }

        let res = sf_step.request_search()()

        return res?.judgement ?? ''
    }

    return (<>
        <div class='replay-single'>
            <div ref={_ => $moves_el = _} class='moves'>
            <For each={ply_sans()}>{(ply_san, i) => 
                <>
                    <Show when={ply_san.ply % 2 === 1}>
                        <span class='index'>{Math.ceil(ply_san.ply / 2)}</span>
                    </Show>
                    <span onClick={() => goto_ply(ply_san.ply)} class={'move ' + (judgement_klass(i())) + (ply_san.ply === i_ply() ? ' active' : '')}>
                            <span class='san'>{ply_san.san}</span>
                            <Show when={props.play_replay.sf_steps[i()]}>{res =>
                                <Show when={res().request_search()}>{ss =>
                                    <Show when={ss()()} fallback={
                                        "..."
                                    }>{ss =>
                                        <StepWithSearchForParams ss={ss()} />
                                    }</Show>
                                }</Show>
                            }</Show>
                        </span>
                </>
            }</For>
            </div>
        </div>
    </>)
}

const StepWithSearchForParams = (props: { ss: StepWithSearch }) => {

    const cp = () => props.ss.search?.cp
    const judgement = () => props.ss.judgement

    return (<>
        <Show when={cp()}>{cp =>
            <span class='eval'>{renderEval(cp())}</span>
        }</Show>
        <span class='judgement'>{judgement_glyph(judgement())}</span>
    </>)
}

export type SearchParams = {
    server?: true,
    depth: number,
    multi_pv: number
}

export type StepWithSearch = Step & {
    params: SearchParams
    before_search: LocalEval | undefined,
    search: LocalEval | undefined,
    judgement: Judgement
}

export type RequestStepWithSearch = {
    step: Step,
    request_search(params?: SearchParams): Accessor<StepWithSearch | undefined>,
}

export type GameId = string

export const diff_eval = (fen: FEN, before: LocalEval, after: LocalEval) => {
    return povDiff(fen_turn(fen), before, after)
}

const judgement_glyph = (j: Judgement) => {
    return j === 'good' ? '✓' : j === 'inaccuracy' ? '?!' : j === 'mistake' ? '?' : '??'
}

type Judgement = 'good' | 'inaccuracy' | 'mistake' | 'blunder'



export type StockfishBuilderComponent = {
    request_step_with_search: (step: Step) => RequestStepWithSearch | undefined
}

export type Skill = 'level10' | 'level16' | 'level20'

function StockfishBuilderComponent(props: { s: StockfishContextRes, game_id: string }): StockfishBuilderComponent {

    type QueueItem = { reject_ev?: (_: Error) => void, resolve_ev?: (_?: LocalEval) => void, fen: FEN, ply: number, game_id: GameId, multi_pv: number, depth: number }

    let queue: QueueItem[] = []

    const queue_item = (fen: FEN, ply: number, game_id: GameId, multi_pv: number, depth: number) => {

        let item: QueueItem = { fen, ply, game_id, multi_pv, depth }
        let res = new Promise<LocalEval | undefined>((resolve_ev, reject_ev) => {
            item.resolve_ev = resolve_ev
            item.reject_ev = reject_ev
            queue.push(item)
            dequeue()
        })

        return [res, () => {
            let i = queue.indexOf(item)
            if (i !== -1) {
                queue.splice(i, 1)
                dequeue()
                return
            }
            if (working_item === item) {
                working_item.reject_ev?.(new Error('Work cancelled'))
                working_item = undefined
                dequeue()
            }
        }] as [Promise<LocalEval | undefined> , () => void]
    }

    let working_item: QueueItem | undefined
    const dequeue = async () => {
        if (working_item) {
            return
        }

        working_item = queue.pop()
        if (!working_item) {
            return
        }

        console.log(queue)
        let item = working_item
        let { game_id, fen, ply, multi_pv, depth } = item
        let ev = await props.s.get_best_move(game_id, fen, ply, multi_pv, depth)

        item.resolve_ev?.(ev)
        if (item === working_item) {
            working_item = undefined
        }

        dequeue()
    }

    let cache: Record<string, LocalEval> = {}
    const get_eval_with_cached_cancellable = (fen: FEN, ply: number, game_id: GameId, multi_pv: number, depth: number): [Promise<LocalEval | undefined>, () => void] => {

        const make_key = (depth: number) => [fen, ply, multi_pv, depth].join('$$')

        let key = make_key(depth)

        if (!cache[key]) {
            let off_depth = Math.floor(Math.random() * 3)
            let [res, cancel_ev] = queue_item(fen, ply, game_id, multi_pv, depth + off_depth)
            res = res.then(ev => {
                if (ev) {
                    cache[key] = ev
                }
                return ev
            })

            return [res, cancel_ev]
        }

        return [Promise.resolve(cache[key]), () => {}]
    }
    

    let request_step_with_search = (step: Step): RequestStepWithSearch | undefined => {

        if (fen_is_end(step.fen)) {
            return undefined
        }

        let cache = new ReactiveMap<string, Accessor<StepWithSearch | undefined>>()

        let a_cancel = () => { },
            b_cancel = () => {}

        function request_search(params?: SearchParams): Accessor<StepWithSearch | undefined> {

            if (!params) {
                return () => {
                    let res = [...cache.values()]
                    return res[res.length - 1]?.()
                }
            }

            let key = [params.depth, params.multi_pv, params.server].join('$$')

            if (cache.get(key)) {
                return cache.get(key)!
            }


            let { multi_pv, depth } = params
            let [r] = createResource(async () => {

                let a: Promise<LocalEval | undefined>, b: Promise<LocalEval | undefined>

                a_cancel()
                b_cancel()
                ;[a, a_cancel] = get_eval_with_cached_cancellable(step.before_fen, step.ply - 1, props.game_id, multi_pv, depth)
                ;[b, b_cancel] = get_eval_with_cached_cancellable(step.fen, step.ply, props.game_id, multi_pv, depth)

                let [before_search, search] = await Promise.all([a, b])

                if (!before_search || !search) {
                    return undefined
                }

                let diff = diff_eval(step.before_fen, before_search, search)

                let judgement: Judgement = diff < 0.03 ? 'good' : diff < 0.05 ? 'inaccuracy' : diff < 0.12 ? 'mistake' : 'blunder'

                return {
                    params,
                    ...step,
                    before_search,
                    search,
                    judgement
                }
            })


            let res = () => {
                if (r.state === 'ready') {
                    return r()
                }
                return undefined
            }

            cache.set(key, res)

            return res
        }

        return {
            step,
            request_search
        }
    }

    return { request_step_with_search }
}

/* lila/ui/ceval/src/util.ts */
export function renderEval(e: number): string {
  e = Math.max(Math.min(Math.round(e / 10) / 10, 99), -99);
  return (e > 0 ? '+' : '') + e.toFixed(1);
}
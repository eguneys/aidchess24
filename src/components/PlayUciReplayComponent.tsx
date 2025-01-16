import { Chess, makeUci, Position } from "chessops"
import { INITIAL_FEN, makeFen, parseFen } from "chessops/fen"
import { parseSan } from "chessops/san"
import { createEffect, createMemo, createResource, createSignal, For, mapArray, Setter, Show } from "solid-js"
import './PlayUciReplay.scss'
import { StockfishContextRes } from "../ceval2/StockfishContext"
import { LocalEval } from "../ceval2/stockfish-module"
import { povDiff } from "../chess_winningChances"
import { fen_turn } from "../chess_pgn_logic"

export type FEN = string
export type UCI = string
export type SAN = string
export type Ply = number
export type Path = string

export type Step = {
    path: Path,
    ply: Ply,
    before_fen: FEN,
    fen: FEN,
    uci: UCI,
    san: SAN
}

const fen_is_end = (fen: FEN) => Chess.fromSetup(parseFen(fen).unwrap()).unwrap().isEnd()

function make_step_and_play(ply: Ply, pos: Position, san: SAN, base_path: Path): Step {
    let move = parseSan(pos, san)!
    let uci = makeUci(move)

    let before_fen = makeFen(pos.toSetup())

    pos.play(move)

    let fen = makeFen(pos.toSetup())

    let path = `${base_path} ${uci}`

    return {
        path,
        ply,
        before_fen,
        fen,
        uci,
        san
    }
}

type StepsSingle = Step[]

function push_san(san: SAN, res: StepsSingle, pos?: Position) {
    let last = res[res.length - 1]
    if (!pos) {
        pos = Chess.fromSetup(parseFen(last?.fen ?? INITIAL_FEN).unwrap()).unwrap()
    }
    return [...res, make_step_and_play((last?.ply ?? 0) + 1, pos, san, last?.path ?? '')]
}

function build_steps(sans: SAN[], fen: FEN = INITIAL_FEN): StepsSingle {
    let res: StepsSingle = []

    let pos = Chess.fromSetup(parseFen(fen).unwrap()).unwrap()
    for (let san of sans) {
        res = push_san(san, res, pos)
    }

    return res
}

export type PlayUciSingleReplayComponent = {
    initial_fen: FEN,
    plies: Ply[],
    sans: SAN[],
    ply_sans: string[],
    steps: Step[],
    last_step: Step | undefined,
    ply_step: Step | undefined,
    play_san: (san: SAN) => void,
    goto_ply: (ply: Ply) => void
    get_prev_ply: () => Ply | undefined,
    get_next_ply: () => Ply | undefined,
    goto_prev_ply_if_can: () => void,
    goto_next_ply_if_can: () => void,
    is_on_last_ply: boolean,
    sf_steps: (ResWithSearchReturn | undefined)[],
    last_sf_step: ResWithSearchReturn | undefined,
    set_skill: Setter<Skill>
}

export function PlayUciSingleReplayComponent(s: StockfishContextRes, game_id: GameId, initial_fen: FEN = INITIAL_FEN, _sans: SAN[] = []): PlayUciSingleReplayComponent {

    let [skill, set_skill] = createSignal<Skill>('level8')

    let sf_builder = StockfishBuilderComponent({ s, game_id, get skill() { return skill() } })



    let [steps, set_steps] = createSignal<Step[]>(build_steps(_sans, initial_fen))
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
        sf_builder.res_with_search(step)
    ))

    const last_sf_step = createMemo(() => {
        let ss = sf_steps()
        return ss[ss.length - 1]
    })



    
    return {
        set_skill,
        get sf_steps() { return sf_steps() },
        get last_sf_step() { return last_sf_step() },
        initial_fen,
        get steps() {
            return steps()
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

    return (<>
        <div class='replay-single'>
            <div class='moves'>
            <For each={ply_sans()}>{(ply_san, i) => 
                <>
                    <Show when={ply_san.ply % 2 === 1}>
                        <span class='index'>{Math.ceil(ply_san.ply / 2)}</span>
                    </Show>
                    <span onClick={() => goto_ply(ply_san.ply)} class={'move' + (ply_san.ply === i_ply() ? ' active' : '')}>
                            <span class='san'>{ply_san.san}</span>
                            <Show when={props.play_replay.sf_steps[i()]}>{res =>
                                <Show when={res().state === 'loading'}>{
                                    <span class='loading'>l</span>
                                }</Show>
                            }</Show>
                        </span>
                </>
            }</For>
            </div>
        </div>
    </>)
}


export type FenWithSearch = {
    fen: FEN,
    search: {
        depth: number,
        multi_pv: number,
        eval: LocalEval
    }
}

export const diff_evals = (a: FenWithSearch, b: FenWithSearch) => {
    return povDiff(fen_turn(a.fen), a.search.eval, b.search.eval)
}


export type StepWithSearch = Step & {
    before_search: FenWithSearch,
    search: FenWithSearch,
    diff_eval: number
}

export type GameId = string

export type ResWithSearchReturn = {
    state: 'loading' | 'success',
    search: StepWithSearch | undefined
}

export type StockfishBuilderComponent = {
    res_with_search: (step: Step) => ResWithSearchReturn | undefined
}

export type Skill = 'level8' | 'level13' | 'level20'

function StockfishBuilderComponent(props: { s: StockfishContextRes, game_id: string, skill: Skill }): StockfishBuilderComponent {

    type QueueItem = { resolve_ev: (_?: LocalEval) => void, fen: FEN, ply: number, game_id: GameId, multi_pv: number, depth: number }

    let queue: QueueItem[] = []

    const queue_item = (fen: FEN, ply: number, game_id: GameId, multi_pv: number, depth: number) => {
        return new Promise<LocalEval | undefined>(resolve_ev => {
            queue.push({ fen, ply, game_id, multi_pv, depth, resolve_ev })
            dequeue()
        })
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

        let { game_id, fen, ply, multi_pv, depth } = working_item
        let ev = await props.s.get_best_move(game_id, fen, ply, multi_pv, depth)

        working_item.resolve_ev(ev)
        working_item = undefined
        dequeue()
    }

    let cache: Record<string, LocalEval> = {}
    const get_eval_with_cached = async (fen: FEN, ply: number, game_id: GameId, multi_pv: number, depth: number) => {

        const make_key = (depth: number) => [fen, ply, multi_pv, depth].join('$$')

        let key = make_key(depth)

        if (!cache[key]) {
            let off_depth = Math.floor(Math.random() * 3)
            let ev = await queue_item(fen, ply, game_id, multi_pv, depth + off_depth)
            if (ev) {
                cache[key] = ev
            }
        }

        return cache[key]
    }

    let res_with_search = (step: Step): ResWithSearchReturn | undefined => {

        if (fen_is_end(step.fen)) {
            return undefined
        }

        let [r] = createResource(() => props.skill, async (skill: Skill) => {
            let multi_pv = step.ply < 10 ? 6 : step.ply < 15 ? 3 : 1
            let depth = skill === 'level8' ? 8 : skill === 'level13' ? 13 : 20
            let [before_eval, fen_eval] = await Promise.all([
                get_eval_with_cached(step.before_fen, step.ply - 1, props.game_id, multi_pv, depth),
                get_eval_with_cached(step.fen, step.ply, props.game_id, multi_pv, depth)
            ])

            let before_search = {
                fen: step.before_fen,
                search: {
                    depth,
                    multi_pv,
                    eval: before_eval
                }
            }

            let search = {
                fen: step.fen,
                search: {
                    depth,
                    multi_pv,
                    eval: fen_eval
                }
            }

            let diff_eval = diff_evals(before_search, search)

            return {
                ...step,
                before_search,
                search,
                diff_eval
            }
        })

        return {
            get state() {
                return r.loading ? 'loading' : 'success'
            },
            get search() {
                return r()
            }
        }
    }

    return { res_with_search }
}


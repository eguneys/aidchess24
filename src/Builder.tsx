import { createEffect, createMemo, createResource, createSignal, mapArray, on, Show, useContext } from "solid-js"
import { StockfishContext, StockfishContextRes, StockfishProvider } from "./ceval2/StockfishContext"
import { INITIAL_FEN } from "chessops/fen"
import { Color, opposite } from "chessops"
import { LocalEval } from "./ceval2/stockfish-module"
import { PlayUciBoard, PlayUciComponent } from "./components/PlayUciComponent"
import './Builder.scss'

import { FEN, PlayUciSingleReplay, PlayUciSingleReplayComponent, SAN, Step } from "./components/PlayUciReplayComponent"
import { makePersistedNamespaced } from "./storage"
import { stepwiseScroll } from "./common/scroll"
import { usePlayer } from "./sound"
import { povDiff } from "./chess_winningChances"
import { fen_turn } from "./chess_pgn_logic"

export default () => {
    return (<StockfishProvider>
        <LoadingStockfishContext/>
    </StockfishProvider>)
}

function LoadingStockfishContext() {

    let [ss] = createResource(() => useContext(StockfishContext))

    const loading_percent = createMemo(() => {
        let nb = ss()?.download_nb
        if (nb) {
            return Math.ceil((nb.bytes / (nb.total === 0 ? 70 * 1024 * 1024 : nb.total)) * 100)
        }
    })

    return (<>
        <Show when={ss()}>{s =>
            <Show when={s().state === 'loading'} fallback={
                <WithStockfishLoaded s={s()!} />
            }><>
            <span class='info'>Loading {loading_percent()??'--'}%</span>
                </> </Show>
        }</Show>
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
    res_with_search: (step: Step) => ResWithSearchReturn
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
            let ev = await queue_item(fen, ply, game_id, multi_pv, depth)
            if (ev) {
                cache[key] = ev
            }
        }

        return cache[key]
    }

    let res_with_search = (step: Step): ResWithSearchReturn => {

        let [r] = createResource(() => props.skill, async (skill: Skill) => {
            let multi_pv = step.ply < 10 ? 6 : step.ply < 15 ? 3 : 1
            let depth = skill === 'level8' ? 8 : skill === 'level13' ? 13 : 20
            let off_depth = Math.ceil(Math.random() * 3)
            let [before_eval, fen_eval] = await Promise.all([
                get_eval_with_cached(step.before_fen, step.ply - 1, props.game_id, multi_pv, depth + off_depth),
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

function WithStockfishLoaded(props: { s: StockfishContextRes }) {

    const Player = usePlayer()
    Player.setVolume(0.2)

    let [sans, set_sans] = makePersistedNamespaced<SAN[]>([], 'builder.current.sans')

    const play_replay = PlayUciSingleReplayComponent(INITIAL_FEN, sans())
    let play_uci = PlayUciComponent()

    let [skill, set_skill] = createSignal<Skill>('level8')
    let game_id = ''
    let sf_builder = StockfishBuilderComponent({ s: props.s, game_id, get skill() { return skill() } })

    const [player_color, _set_player_color] = createSignal<Color>('white')

    const engine_color = createMemo(() => opposite(player_color()))

    const sf_steps = createMemo(mapArray(() => play_replay.steps, step =>
        sf_builder.res_with_search(step)
    ))

    const last_sf_step = createMemo(() => {
        let ss = sf_steps()
        return ss[ss.length - 1]
    })

    createEffect(() => {
        console.log(sf_steps())
    })

    createEffect(() => {
        let last = last_sf_step()

        if (!last) {
            return
        }

        createEffect(on(() => last.search, (s) => {
            if (!s) {
                return
            }

            let turn = fen_turn(s.fen)

            if (turn === engine_color()) {

                let pvs = s.search.search.eval.pvs

                play_uci.play_uci(pvs[0].moves[0])
            }
        }))

        createEffect(on(() => last.state, (s) => {
            console.log(s)
        }))
    })


    createEffect(on(() => play_uci.add_last_move, (last_move) => {
        if (last_move) {
            play_replay.play_san(last_move[1])
        }
    }))

    createEffect(on(() => play_replay.sans, set_sans))

    createEffect(on(() => play_replay.ply_step, (ps) => {
        if (ps) {
            play_uci.set_fen_last_move(ps.fen, [ps.uci, ps.san])
        } else {
            play_uci.set_fen_last_move(play_replay.initial_fen)
        }
    }))

    createEffect(on(() => play_replay.ply_step, (current, prev) => {
        if (current) {
            if (!prev || prev.ply === current.ply - 1) {
                Player.move(current)
            }
        }
    }))

    const onWheel = stepwiseScroll((e: WheelEvent) => {
        const target = e.target as HTMLElement;
        if (
            target.tagName !== 'PIECE' &&
            target.tagName !== 'SQUARE' &&
            target.tagName !== 'CG-BOARD'
        )
            return;
        e.preventDefault();
        set_on_wheel(Math.sign(e.deltaY))
    })

    const set_on_wheel = (i: number) => {
        if (i > 0) {
            play_replay.goto_next_ply_if_can()
        } else {
            play_replay.goto_prev_ply_if_can()
        }
    }

    const movable = () => {
        return !play_uci.isEnd && play_replay.is_on_last_ply
    }



    return (<>
    <div onWheel={onWheel} class='builder'>
        <div class='board-wrap'>
            <PlayUciBoard color={player_color()} movable={movable()} play_uci={play_uci} />
        </div>
        <div class='replay-wrap'>
            <PlayUciSingleReplay play_replay={play_replay}/>
        </div>
    </div>
    </>)
}
import { batch, createEffect, createMemo, createResource, createSignal, on, Show, useContext } from "solid-js"
import { StockfishContext, StockfishContextRes, StockfishProvider } from "./ceval2/StockfishContext"
import { INITIAL_FEN } from "chessops/fen"
import { Color, opposite } from "chessops"
import { fen_turn } from "./chess_pgn_logic"
import { LocalEval } from "./ceval2/stockfish-module"
import { PlayUciBoard, PlayUciComponent } from "./components/PlayUciComponent"
import './Builder.scss'
import { FEN, PlayUciSingleReplay, PlayUciSingleReplayComponent, Ply, SAN, UCI } from "./components/PlayUciReplayComponent"
import { makePersistedNamespaced } from "./storage"
import { stepwiseScroll } from "./common/scroll"
import { usePlayer } from "./sound"

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
            return (nb.bytes / nb.total) * 100
        }
    })

    return (<>
        <Show when={ss()}>{s =>
            <Show when={s().state === 'loading'} fallback={
                <WithStockfishLoaded s={s()!} />
            }><>
            <span class='info'>Loading ${loading_percent()??'--'}%</span>
                </> </Show>
        }</Show>
    </>)
}


function StockfishRouletteGameComponent(props: { on_play_uci: (_: UCI) => void,   get_fen_ply_and_play: [FEN, Ply] | undefined, s: StockfishContextRes }) {

    let game_id = `${Math.random()}`
    let [engine_color, set_engine_color] = createSignal<Color>('white', { equals: false})

    let multi_pv = 6
    let depth = 8

    let [working, set_working] = createSignal(false)

    createEffect(on(() => props.get_fen_ply_and_play, (fen_ply) => {
        if (!fen_ply) {
            return
        }
        let [fen, ply] = fen_ply
        let turn = fen_turn(fen)
        if (turn === engine_color()) {

            if (working()) {
                return
            }

            set_working(true)
            props.s.get_best_move(game_id, fen, ply, multi_pv, depth).then(ev => {
                set_working(false)
                if (ev) {
                    engine_play_eval(ev)
                }
            })
        }
    }))

    const engine_play_eval = (ev: LocalEval) => {
        let uci = ev.pvs[0].moves[0]

        props.on_play_uci(uci)
    }


    return {
        get engine_color() {
            return engine_color()
        },
        reset_game(engine_color: Color) {
            batch(() => {
                set_engine_color(engine_color)
            })
        }
    }
}

function WithStockfishLoaded(props: { s: StockfishContextRes }) {

    const Player = usePlayer()
    Player.setVolume(0.2)

    let [sans, set_sans] = makePersistedNamespaced<SAN[]>([], 'builder.current.sans')

    const play_replay = PlayUciSingleReplayComponent(INITIAL_FEN, sans())
    let play_uci = PlayUciComponent()

    let [fen_ply_for_engine_play, set_fen_ply_for_engine_play] = createSignal<[FEN, Ply] | undefined>(undefined)

    let cc = StockfishRouletteGameComponent({ 
        on_play_uci(uci: string) { play_uci.play_uci(uci) },  
        get get_fen_ply_and_play() { 
            return fen_ply_for_engine_play()
        }, 
        s: props.s })

    const [player_color, _set_player_color] = createSignal<Color>('white')

    cc.reset_game(opposite(player_color()))

    createEffect(() => {
        console.log(play_uci.last_move)
    })
    createEffect(on(() => play_uci.add_last_move, (last_move) => {
        if (last_move) {
            play_replay.play_san(last_move[1])
        }
    }))

    createEffect(on(() => play_replay.sans, set_sans))

    createEffect(on(() => play_replay.last_step, (ls) => {
        if (ls) {
            set_fen_ply_for_engine_play([ls.fen, ls.ply])
        }
    }))

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


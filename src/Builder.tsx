import { createEffect, createMemo, createResource, createSignal, on, Show, useContext } from "solid-js"
import { StockfishContext, StockfishContextRes, StockfishProvider } from "./ceval2/StockfishContext"
import { INITIAL_FEN } from "chessops/fen"
import { Color, opposite } from "chessops"
import { PlayUciBoard, PlayUciComponent } from "./components/PlayUciComponent"
import './Builder.scss'

import { PlayUciSingleReplay, PlayUciSingleReplayComponent, SAN } from "./components/PlayUciReplayComponent"
import { makePersistedNamespaced } from "./storage"
import { stepwiseScroll } from "./common/scroll"
import { usePlayer } from "./sound"
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

function WithStockfishLoaded(props: { s: StockfishContextRes }) {

    const Player = usePlayer()
    Player.setVolume(0.2)

    let [sans, set_sans] = makePersistedNamespaced<SAN[]>([], 'builder.current.sans')

    let game_id = ''
    const play_replay = PlayUciSingleReplayComponent(props.s, game_id, INITIAL_FEN, sans())
    let play_uci = PlayUciComponent()

    const [player_color, _set_player_color] = createSignal<Color>('white')

    const engine_color = createMemo(() => opposite(player_color()))

    createEffect(() => {
        let last = play_replay.last_sf_step

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
import { useParams, useSearchParams } from "@solidjs/router"
import { RepeatsDbContext } from "./repeats_context"
import { batch, createEffect, createMemo, createSignal, on, Show, useContext } from "solid-js"
import { createDexieSignalQuery } from "./solid-dexie"
import { DueFilters, NewRepeatWithMoves } from "./types"
import Chessboard from "../Chessboard"
import { Shala } from "../Shalala"
import "./Dues.scss"
import { annotationShapes } from "../annotationShapes"
import { DrawShape } from "chessground/draw"
import { fen_turn, INITIAL_FEN } from "../chess_pgn_logic"

function arr_rnd<T>(arr: T[]): T | undefined {
    return arr[Math.floor(Math.random() * arr.length)]
}

export default () => {

    let params = useParams()
    const repeat_id = parseInt(params.id)

    const db = useContext(RepeatsDbContext)!

    const repeat = createDexieSignalQuery<NewRepeatWithMoves | undefined>(() => db.repeat_by_id(repeat_id))

    return (<>
    <Show when={repeat()} fallback={<NotFound/>}>{repeat => 
    <RepeatDues repeats={repeat()!}/>
        }</Show>
    </>)
}

const RepeatDues = (props: { repeats: NewRepeatWithMoves }) => {

    const [params] = useSearchParams()

    const db = useContext(RepeatsDbContext)!
    const repeats = createMemo(() => props.repeats)

    const due_filter = createMemo(() => new DueFilters(repeats()))

    const due_moves = createMemo(() => {
        switch (params.filter) {
            case 'white': return due_filter().due_white
            case 'black': return due_filter().due_black
            case 'first-ten': return due_filter().due_10
            case 'ten-twenty': return due_filter().due_10_20
            case 'twenty-plus': return due_filter().due_20plus
            default: return due_filter().due
        }
    })

    const selected_due_move = createMemo(() => arr_rnd(due_moves()))

    const [auto_shapes, set_auto_shapes] = createSignal<DrawShape[] | undefined>(undefined)

    const shalala = new Shala()

    let [i_idle, set_i_idle] = createSignal<number | undefined>(undefined)
    const orientation = createMemo(() => fen_turn(selected_due_move()?.fen ?? INITIAL_FEN))
    const is_board_movable = createMemo(() => {
        let a = i_idle()
        let b = auto_shapes()

        return a === undefined && b === undefined
    })

    createEffect(on(selected_due_move, m => {
        if (!m) {
            return
        }
        shalala.on_set_fen_uci(m.fen)
    }))


    createEffect(on(() => shalala.add_uci, (ucisan) => {
        if (!ucisan) {
            return
        }

        const selected = selected_due_move()

        if (!selected) {
            return
        }

        let [uci, san] = ucisan

        const repeat_id = repeats().id
        const fen = selected.fen
        const ucis = selected.ucis.map(_ => _.uci)

        let good = '✓'
        let bad = '✗'

        let glyph = good
        if (ucis.includes(uci)) {
            glyph = good
        } else {
            glyph = bad
        }

        set_auto_shapes(annotationShapes(uci, san, glyph))


        set_i_idle(setTimeout(() => {
            batch(() => {
                set_auto_shapes(undefined)
                db.play_due_move(repeat_id, fen, uci)
                set_i_idle(undefined)
            })
        }, 600))
    }))

    const on_show_answer = () => {

        if (i_idle() !== undefined) {
            return
        }

        let m = selected_due_move()

        if (!m) {
            return
        }

        let repeat_id = repeats().id
        let fen = m.fen
        let uci = m.ucis[m.ucis.length - 1].uci

        shalala.on_play_uci(uci)

        set_i_idle(setTimeout(() => {
            batch(() => {
                set_auto_shapes(undefined)
                db.play_due_move(repeat_id, fen, '')

                set_i_idle(undefined)
            })
        }, 600))
    }

    return (<>
        <div class='repeat-dues'>

            <div class='board-wrap'>
                <Chessboard
                    shapes={auto_shapes()}
                    orientation={orientation()}
                    movable={is_board_movable()}
                    doPromotion={shalala.promotion}
                    onMoveAfter={shalala.on_move_after}
                    fen_uci={shalala.fen_uci}
                    color={shalala.turnColor}
                    dests={shalala.dests} />
            </div>
            <div class='info'>
            <h3>{due_moves().length} Due Moves</h3>
            <button onClick={on_show_answer}>Show Answer</button>
            </div>
        </div>
    </>)
}

const NotFound = () => {
    return (<>
        <span>Repeat Not Found</span>
     </>)
}
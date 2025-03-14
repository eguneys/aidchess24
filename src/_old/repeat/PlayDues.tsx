import { useParams, useSearchParams } from "@solidjs/router"
import { batch, createEffect, createMemo, createResource, createSignal, on, onMount, Show, useContext } from "solid-js"
import { FSRSRating } from "./types"
import Chessboard from "../Chessboard"
import { Shala } from "../Shalala"
import "./Dues.scss"
import { annotationShapes } from "../annotationShapes"
import { DrawShape } from "chessground/draw"
import { fen_turn, INITIAL_FEN, MoveData } from "../chess_pgn_logic"
import { ChessTreeWithTools } from "../components/ChessTreeWithTools"
import { EntityPGNChapter, EntityPGNSection, EntityPGNStudy, RepertoireDBProvider, RepertoiresDBContext, Study } from "../components/idb_repository"
import { Due_Component, PersistedSelectionComponent } from "./Show2"
import { createDexieSignalQuery } from "./solid-dexie"
import '../components/PlayUciComponent'

function arr_rnd<T>(arr: T[]): T | undefined {
    return arr[Math.floor(Math.random() * arr.length)]
}

export default () => {
    return <RepertoireDBProvider>
        <WithDB/>
    </RepertoireDBProvider>
}

function WithDB() {

    let params = useParams()
    const study_id = parseInt(params.id)

    const rdb = useContext(RepertoiresDBContext)!
    const study = createDexieSignalQuery(() => rdb.get_study_by_id(study_id))

    return (<>
        <Show when={study()} fallback={<NotFound />}>{ study =>
            <RepeatDues study={study()} />
        }</Show>
    </>)
}

const RepeatDues = (props: { study: EntityPGNStudy }) => {

    const study = createMemo(() => props.study)
    const [params] = useSearchParams()


    const selection_component = createMemo(() => PersistedSelectionComponent(props.study.id))
    const selected_sections = createMemo(() => selection_component()[0]())
    let due_filter = createMemo(on(selected_sections, sections => Due_Component(sections)))



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

    const filter_name = createMemo(() => {
        switch (params.filter) {
            case 'white': return 'White Only'
            case 'black': return 'Black Only'
            case 'first-ten': return 'First 10 moves'
            case 'ten-twenty': return '10-20 moves'
            case 'twenty-plus': return '20+ moves'
            default: return 'All moves'
        }
    })

    const selected_due_move = createMemo(() => arr_rnd(due_moves()))


    return (<>
        <div class='repeat-dues'>
            <Show when={selected_due_move()} fallback={
                <p>Completed All Due Moves.</p>
            }>{due_move =>
                <>
                    <div class='header'>
                        <h3>{study().name}</h3>
                        <p>{filter_name()}</p>
                        <p>{due_moves().length} Due Moves</p>
                    </div>
                    <StudyLoader study={study()} due_move={due_move()}/>
                </>
                }</Show>
        </div>
    </>)
}

type DueMove = {
    id: number,
    before_fen: string,
    due: number,
    section: EntityPGNSection,
    moves: { 
        data: MoveData, 
        chapter: EntityPGNChapter
    }[]
}

const StudyLoader = (props: { on_wheel?: number, due_move: DueMove, study: EntityPGNStudy }) => {

    const rdb = useContext(RepertoiresDBContext)!
    const [section_study] = createResource(() => props.study.id, id => rdb.get_study_imported_by_id(id))


        return (<>
            <Show when={section_study()} fallback={
                <NotFound/>
            }>{study =>
                <PlayDueMove on_wheel={props.on_wheel} due_move={props.due_move} study={study()} />
            }</Show>
        </>)
}

const PlayDueMove = (props: { on_wheel?: number, due_move: DueMove, study: Study }) => {

    const rdb = useContext(RepertoiresDBContext)!
    const study = createMemo(() => props.study)

    const due_move = createMemo(() => props.due_move)
    const path = createMemo(() => due_move().moves[0].data.path)

    const section = createMemo(() => study().sections.find(_ => _.name === due_move().section.name)!)
    const chapter = createMemo(() => section().chapters.find(_ => _.name === due_move().moves[0].chapter.name)!)

    /*
    const section = createMemo(() => study().sections[0])
    const chapter = createMemo(() => section().chapters[0])
    createEffect(() => {
        console.log(due_move().moves[0].chapter)
    })
        */

    const [auto_shapes, set_auto_shapes] = createSignal<DrawShape[] | undefined>(undefined)

    const shalala = new Shala()

    let [i_idle, set_i_idle] = createSignal<number | undefined>(undefined)
    const orientation = createMemo(() => fen_turn(due_move()?.before_fen ?? INITIAL_FEN))

    createEffect(() => {
        shalala.on_set_fen_uci(due_move().before_fen)
    })

    createEffect(on(due_move, () =>{
        batch(() => {
            set_i_idle(undefined)
            set_fsrs_rating(undefined)
            set_hide_after_path([])
            set_cursor_path(path().slice(0, -1))
        })
    }))

    const [cursor_path, set_cursor_path] = createSignal(path().slice(0, -1), { equals: false })

    const [hide_after_path, set_hide_after_path] = createSignal<string[] | undefined>([])

    createEffect(on(() => shalala.add_uci, (ucisan) => {
        if (!ucisan) {
            return
        }

        const move = due_move()

        let [uci, san] = ucisan

        const sans = move.moves.map(_ => _.data.san)

        let good = '✓'
        let bad = '✗'

        const rating = fsrs_rating()
        let glyph = good
        if (sans.includes(san)) {
            glyph = good
            if (!rating) {
                set_fsrs_rating('easy')
            }
        } else {
            glyph = bad
            if (!rating || rating === 'hard') {
                set_fsrs_rating('again')
            }
        }

        set_auto_shapes(annotationShapes(uci, san, glyph))

        if (glyph === bad) {
            set_hide_after_path(undefined)
        } else {
            set_i_idle(setTimeout(on_next_due, 600))
        }
    }))

    const on_fen_last_move = ([fen, last_move]: [string, string]) => {
        shalala.on_set_fen_uci(fen, last_move)
    }

    const on_hint_previous = () => {
        if (fsrs_rating() === 'again') {
            return false
        }
        set_fsrs_rating('hard')
        set_hide_after_path(path())
    }

    const on_show_answer = () => {
        batch(() => {
            set_fsrs_rating('again')
            set_hide_after_path(undefined)
            set_cursor_path(path())
        })
    }


    const [fsrs_rating, set_fsrs_rating] = createSignal<FSRSRating | undefined>(undefined)

    const on_next_due = () => {

        const fen = due_move().before_fen
        const rating = fsrs_rating()

        batch(() => {
            set_auto_shapes(undefined)
            rdb.play_due_move(fen, rating ?? 'again')
        })
    }

    const on_next_due_visible = createMemo(() => {

        const rating = fsrs_rating()
        if (!rating || rating === 'hard') {
            return false
        }
        return true
    })

    const on_show_hint_visible = createMemo(() => {
        return fsrs_rating() === undefined
    })

    const on_show_answer_visible = createMemo(() => {
        return fsrs_rating() !== 'again'
    })

    const is_board_movable = createMemo(() => {
        let a = i_idle()
        let b = fsrs_rating()


        return a === undefined && b !== 'again'
    })

    const [on_wheel, set_on_wheel] = createSignal<number | undefined>(undefined, { equals: false })

    let $el: HTMLElement
    onMount(() => {
        $el.addEventListener('wheel', e => {
            set_on_wheel(Math.sign(e.deltaY))
        }, { passive: true})
    })



    return (<>
        <div ref={_ => $el = _} class='board-wrap'>
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
        <div class='replay-wrap'>
            <div class='replay-header'>
                <div class='title'>
                    <h3>{study().name}</h3>
                    <h4>{chapter().name}</h4>
                </div>
            </div>
            <ChessTreeWithTools hide_after_path={hide_after_path()} on_wheel={on_wheel()} pgn={chapter().pgn} on_fen_last_move={on_fen_last_move} cursor_path={cursor_path()}>
                <>
                    <div class='info'>
                        <Show when={i_idle()} fallback={

                            <>
                                <Show when={on_show_hint_visible()}>
                                    <button onClick={on_hint_previous}>Hint: Show Previous Moves</button>
                                </Show>
                                <Show when={on_show_answer_visible()}>
                                    <button onClick={on_show_answer}>Show Answer</button>
                                </Show>
                                <Show when={on_next_due_visible()}>
                                    <button onClick={on_next_due}>Next Due</button>
                                </Show>
                            </>
                        }>
                            <></>
                        </Show>
                    </div>
                </>
            </ChessTreeWithTools>
        </div>

    </>)
}

const NotFound = () => {
    return (<>
    <p> Study Not Found </p>
    </>)
}
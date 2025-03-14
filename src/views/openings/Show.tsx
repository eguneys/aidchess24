import { createEffect, createMemo, createSignal, For, on, onCleanup, onMount, Show, Suspense } from "solid-js"
import { useNavigate, useParams } from "@solidjs/router"
import './Show.scss'
import { non_passive_on_wheel } from "../../components/PlayUciComponent"
import { DialogComponent } from "../../components/DialogComponent"
import { FEN, fen_pos, GLYPH_NAMES, glyph_to_nag, GLYPHS, nag_to_glyph, Path, Step } from "../../components/step_types"
import { annotationShapes } from "../../annotationShapes"
import { StoreState, useStore } from "../../store"
import { EntityChapterId, EntitySectionId, EntityStudyId, ModelChapter, ModelSection, ModelStudy, ModelTreeStepNode } from "../../components/sync_idb_study"
import { get_letter_nth } from "../../components/hard_limits"

import '../../components/StudyComponent.scss'
import { EditChapterComponent, EditSectionComponent, EditStudyComponent } from "../../components2/EditStudyComponent"
import { PGN } from "../../components2/parse_pgn"
import { as_pgn_for_path, createReplayTreeComputed, find_at_path, MoveContextMenuComponent, ReplayTreeComponent } from "../../components2/ReplayTreeComponent"
import { PlayUciBoard } from "../../components2/PlayUciBoard"
import { INITIAL_FEN } from "chessops/fen"
import { Key } from "chessground/types"
import { parseSquare } from "chessops"
import { fen_turn } from "../../chess_pgn_logic"
import { unwrap } from "solid-js/store"

export default () => {

    const [store, { load_study }] = useStore()

    let params = useParams()
    createEffect(() => load_study(params.id))

    return (<>
        <ShowComponent {...ShowComputedProps(store, params.id)}/>
    </>)
}

type ShowComputedPropsOpStudy = {
    study?: ModelStudy,
    selected_section?: ModelSection,
    selected_chapter?: ModelChapter
}

type ShowComputedProps = ShowComputedPropsOpStudy & {
    study: ModelStudy
    sections: ModelSection[]
    chapters: ModelChapter[]
}

function ShowComputedProps(store: StoreState, study_id: EntityStudyId) {

    let study = createMemo(() => store.studies[study_id])

    let sections = createMemo(() => {
        let ss = study()?.sections
        return study()?.section_ids.map(id => ss.find(_ => _.id === id))
    })

    let selected_section = createMemo(() => {
        let s = study()
        let selected_section_id = s?.selected_section_id
        if (!selected_section_id) {
            return undefined
        }
        return s?.sections.find(_ => _.id === selected_section_id)
    })

    let chapters = createMemo(() => {
        let section = selected_section()
        if (!section) {
            return undefined
        }

        return section.chapter_ids.map(id => store.chapters.list.find(_ => _.id === id)!).filter(Boolean)
    })

    let selected_chapter = createMemo(() => {
        let section = selected_section()
        let selected_chapter_id = section?.selected_chapter_id
        if (!selected_chapter_id) {
            return undefined
        }
        return chapters()?.find(_ => _.id === selected_chapter_id)
    })

    return {
        get study() {
            return study()
        },
        get selected_section() {
            return selected_section()
        },
        get selected_chapter() {
            return selected_chapter()
        },
        get sections() {
            return sections()
        },
        get chapters() {
            return chapters()
        }
    }

}

function ShowComponent(props: ShowComputedPropsOpStudy) {

    const [, { reset_replay_tree, load_replay_tree, load_chapter, load_chapters }] = useStore()

    const [tab, set_tab] = createSignal('show')

    createEffect(on(() => props.selected_section, (section) => section && load_chapters(section.id)))
    createEffect(on(() => props.selected_chapter, (chapter) => {
        if (chapter) {
            load_chapter(chapter.id)
            load_replay_tree(chapter.id)
        } else {
            reset_replay_tree()
        }
    }))

    const props_with_study = (study: ModelStudy): ShowComputedProps => ({...props, study } as ShowComputedProps)

    return (<>
        <Suspense fallback={<StudyLoading />}>
            <Show when={props.study}>{study =>
            <>
                <Show when={tab() === 'show'}>
                    <StudyShow {...props_with_study(study())} on_feature_practice={() => set_tab('practice')} />
                </Show>
                <Show when={tab() === 'practice'}>
                    <></>
                    {/*
                    <StudyPractice study={study()} on_feature_practice_off={() => set_tab('show')} />
                        */}
                </Show>
            </>
            }</Show>
        </Suspense>
    </>)
}


/*
function StudyPractice(props: { study: ModelStudy, on_feature_practice_off: () => void }) {

    const db = useContext(StudiesDBContext)!

    const play_uci = PlayUciComponent()

    const [selected_section, set_selected_section] = createSignal<Section | undefined>(undefined)
    const [selected_chapter, set_selected_chapter] = createSignal<Chapter | undefined>(undefined)

    const on_selected_chapter = (section: Section, chapter: Chapter) => {
        batch(() => {
            set_selected_section(section)
            set_selected_chapter(chapter)
        })
    }

    const play_replay = createMemo(() => {
        let s = selected_chapter()
        if (!s) {
            return PlayUciTreeReplay(gen_id8(), StepsTree(gen_id8()))
        }
        return s.play_replay
    })

    const [color, set_color] = createSignal(play_uci.turn)
    const [movable, set_movable] = createSignal(false)

    const initial_fen = createMemo(() => INITIAL_FEN)

    createEffect(on(() => play_replay().cursor_path_step, (step) => {
        if (!step) {
            play_uci.set_fen_and_last_move(initial_fen())
            return
        }
        play_uci.set_fen_and_last_move(step.fen, step.uci)
    }))


    const Player = usePlayer()
    Player.setVolume(0.2)
    createEffect(on(() => play_replay().cursor_path_step, (current, prev) => {
        if (current) {
            if (!prev || prev.ply === current.ply - 1) {
                Player.move(current)
            }
        }
    }))

    const set_on_wheel = (i: number) => {
        if (i > 0) {
            play_replay().goto_next_if_can()
        } else {
            play_replay().goto_prev_if_can()
        }
    }

    let $el_ref: HTMLDivElement

    let annotation = createMemo(() => {
        let step = play_replay().cursor_path_step

        if (!step) {
            return []
        }

        let nag = step.nags[0]

        if (!nag) {
            return []
        }

        return annotationShapes(step.uci, step.san, nag_to_glyph(nag))
    })

    const chapter_title_or_detached = createMemo(() => {
        return selected_chapter()?.name ?? '[detached]'
    })


    const [tab, set_tab] = createSignal('practice')


    const quiz_nodes = createMemo(() => play_replay().steps.all_nodes)

    return (<>
        <main ref={$el_ref!} class='openings-show study'>
            <div class='details-wrap'>
                <StudyDetailsComponent study={props.study} section={selected_section()} chapter={selected_chapter()} />
            </div>
            <div on:wheel={non_passive_on_wheel(set_on_wheel)} class='board-wrap'>
                <PlayUciBoard shapes={annotation()} color={color()} movable={movable()} play_uci={play_uci}/>
            </div>
            <div class='replay-wrap'>
                <div class='header'>
                    {chapter_title_or_detached()}
                </div>
                <PlayUciTreeReplayComponent db={db} 
                play_replay={play_replay()} 
                on_context_menu={() => {}} 
                lose_focus={false}
                features = {
                    <>
                    <button onClick={props.on_feature_practice_off} class='feature practice'><i data-icon=""></i></button>
                    </>
                }
                feature_content = {
                    <>
                    <div class='practice-feature'>
                        <div class='tabs'>
                            <div onClick={() => set_tab('practice')} class={'feature tab' + (tab() === 'practice' ? ' active': '')}>Practice</div>
                            <div onClick={() => set_tab('quiz')} class={'quiz tab' + (tab() === 'quiz' ? ' active': '')}>Quiz</div>
                            <div onClick={() => set_tab('deathmatch')} class={'deathmatch tab' + (tab() === 'deathmatch' ? ' active': '')}>Deathmatch</div>
                        </div>
                        <div class={'content ' + tab()}>
                            <Show when={tab() === 'quiz'}>
                            <h4>Take Quiz</h4>
                            <TakeQuiz nodes={quiz_nodes()}/>
                            </Show>
                            <Show when={tab() === 'deathmatch'}>
                            <h4>Play Deathmatch</h4>
                            <PlayDeathmatch />
                            </Show>
                            <Show when={tab() === 'practice'}>
                            <h4>Practice with the Computer</h4>
                            <Practice color={color()} set_color={set_color} set_movable={set_movable} play_uci={play_uci} play_replay={play_replay()}/>
                            </Show>
                        </div>
                    </div>
                    </>
                }
                />
            </div>
            <div class='sections-wrap'>
                <SectionsListComponent db={db} study={props.study} is_edits_disabled={true} on_selected_chapter={on_selected_chapter}/>
            </div>
            <div class='tools-wrap'>
            </div>
        </main>
    </>)
}
    */

/*
function Practice(props: { color: Color, set_color: (_: Color) => void, set_movable: (_: boolean)=> void, play_uci: PlayUciComponent, play_replay: PlayUciTreeReplay}) {
    const on_rematch = (color?: Color) => {
        if (color) {
            set_color(color)
        }
    }

    const color = createMemo(() => props.color)
    const set_color = props.set_color

    const engine_color = createMemo(() => opposite(color()))

    props.set_movable(true)

    const play_uci = props.play_uci
    const play_replay = createMemo(() => props.play_replay)

    createEffect(on(() => play_uci.on_last_move_added, (us) => {
        if (!us) {
            return
        }

        let san = us[1]

        let failed_node = play_replay().add_failed_san_or_success_with_advance_cursor_path(san)

        if (failed_node) {

        }

    }, { defer: true }))


    return (<>
        <div class='info-wrap'>
            <div class='status'>
                Your turn.
            </div>
            <div class='info'>
                <p>
                    Computer will follow the lines in the opening.
                </p>
                <p>
                    Moves will be hidden.
                </p>
            </div>
        </div>
        <div class='rematch-buttons buttons'>
            <button onClick={() => on_rematch()} class='rematch'>Rematch</button>
            <button onClick={() => on_rematch(engine_color())} class={`color ${engine_color()}`}><i></i></button>
        </div>
    </>)
}

type QuizItem = {
    step: TreeStepNode,
    is_solved?: boolean
}

function QuizItem(step: TreeStepNode) {

    let [is_solved, set_is_solved] = createSignal<boolean | undefined>(undefined)

    return {
        step,
        get is_solved() { return is_solved() },
        set is_solved(s: boolean | undefined) { set_is_solved(s)}
    }
}

function TakeQuiz(props: { nodes: TreeStepNode[] }) {

    let [indexes, _set_indexes] = createSignal([...Array(15).keys()])
    
    const [status, _set_status] = createSignal('info')
    const make_quiz_item = () => QuizItem(arr_rnd(props.nodes))

    let items = createMemo(mapArray(indexes, make_quiz_item))

    return (<>
    <div class='info-wrap'>
        <div class='status'>
            <Show when={status()=== 'info'}>
                Press start
            </Show>

            <Show when={status()=== 'in-progress'}>
                <span>1 of 15</span>
            </Show>

            <Show when={status()=== 'end'}>
                <button class='retake'>Re-take</button>
            </Show>
        </div>
        <div class='info'>
            <Show when={status() === 'info'}>
                <p>
                    You are given 15 random positions from the opening.
                    Play the correct moves.
                </p>
            </Show>
        </div>
     </div>
        <div class='quiz-history'>
            <For each={items()}>{ (_item, i) =>
               <div class={'quiz-item'}>{i() + 1}</div>
            }</For>
        </div>
        <div class='quiz-buttons buttons'>
            <Show when={status()=== 'info'}>
                <button class='start'>Start</button>
            </Show>
        </div>
    </>)
}

function PlayDeathmatch() {

    const [status, _set_status] = createSignal('info')
    return (
        <>
    <div class='info-wrap'>
        <div class='status'>
            <Show when={status() === 'info'}>
                Press start
            </Show>

            <Show when={status()=== 'in-progress'}>
                <span>1 of 15</span>
            </Show>

            <Show when={status()=== 'end'}>
                <button class='retake'>Re-take</button>
            </Show>

        </div>
        <div class='info'>
            <Show when={status() === 'info'}>
                <p>
                    You will play the moves from the opening.
                    If you go out of book game ends.
                </p>
            </Show>
        </div>

        </div>
        <div class='quiz-buttons buttons'>
            <Show when={status()=== 'info'}>
                <button class='start'>Start</button>
            </Show>
        </div>
    </>)
}

*/

function StudyShow(props: ShowComputedProps & { on_feature_practice: () => void }) {

    const [store, {
        play_uci,
        set_fen,
        set_last_move,
        goto_path,
        goto_path_if_can,
        delete_at_and_after_path,
        tree_step_node_set_nags,
        add_child_san_to_current_path,
        chapter_as_export_pgn
    }] = useStore()

    let c_props = createReplayTreeComputed(store, true)

    let [context_menu_open, set_context_menu_open] = createSignal<Path | undefined>()
    let [annotate_sub_menu_open, set_annotate_sub_menu_open] = createSignal(false)
    let [edit_study_dialog, set_edit_study_dialog] = createSignal(false)
    let [edit_section_dialog, set_edit_section_dialog] = createSignal<ModelSection>()
    let [edit_chapter_dialog, set_edit_chapter_dialog] = createSignal<ModelChapter>()


    const context_menu_step = createMemo(() => {
        let c_path = context_menu_open()
        if (c_path) {
            return find_at_path(store.replay_tree.steps_tree, c_path)
        }
        return undefined
    })

    onMount(() => {
        const on_click = () => {
            set_context_menu_open(undefined)
        }
        document.addEventListener('click', on_click)
        onCleanup(() => {
            document.removeEventListener('click', on_click)
        })
    })

    let $el_ref: HTMLDivElement
    let $el_context_menu: HTMLDivElement

    const on_tree_context_menu = (e: MouseEvent, path: Path) => {
        goto_path(path)
        set_context_menu_open(path)

        let x = e.clientX
        let y = e.clientY

        let context_bounds = $el_context_menu!.getBoundingClientRect()
        let bounds = $el_ref!.getBoundingClientRect()
        x -= bounds.left
        y -= bounds.top


        x = Math.min(x, document.body.clientWidth - context_bounds.width - bounds.left - 20)

        let top = `${y}px`
        let left = `${x}px`

        $el_context_menu!.style.top = top
        $el_context_menu!.style.left = left
    }

    const on_analyze_lichess = (step: Step) => {
        let fen = step.fen
        window.open(`https://lichess.org/analysis?fen=${fen}`, '_blank')
        set_context_menu_open(undefined)
    }

    const on_delete_move = async (path: Path) => {
        delete_at_and_after_path(path)
        set_context_menu_open(undefined)
    }

    let i_delay_sub_menu_open: number | undefined
    const delay_set_annotate_sub_menu_open = (value: boolean) => {
        clearTimeout(i_delay_sub_menu_open)
        i_delay_sub_menu_open = undefined

        if (value === false) {
            i_delay_sub_menu_open = setTimeout(() => {
                set_annotate_sub_menu_open(false)
            }, 150)
        } else {
            i_delay_sub_menu_open = setTimeout(() => {
                set_annotate_sub_menu_open(true)
            }, 100)
        }
    }

    const on_annotate_click = async (step: ModelTreeStepNode, glyph: string) => {
        await tree_step_node_set_nags(step, [glyph_to_nag(glyph)])

        clearTimeout(i_delay_sub_menu_open)
        set_annotate_sub_menu_open(false)
    }

    let $el_sub_menu_anchor: HTMLAnchorElement
    let [get_$el_context_sub_menu, set_$el_context_sub_menu] = createSignal<HTMLDivElement | undefined>(undefined)

    const sub_menu_klass = createMemo(() => {
        let $el_context_sub_menu = get_$el_context_sub_menu()

        if ($el_context_menu! === undefined || $el_context_sub_menu === undefined) {
            return ''
        }

        let anchor_bounds = $el_sub_menu_anchor!.getBoundingClientRect()
        let sub_bounds = $el_context_sub_menu.getBoundingClientRect()
        let menu_bounds = $el_context_menu.getBoundingClientRect()
        let y = anchor_bounds.top
        let x = menu_bounds.left - sub_bounds.width

        let bounds = $el_ref!.getBoundingClientRect()
        x -= bounds.left
        y -= bounds.top



        return `top: ${y}px; left: ${x}px;`
    })


    let annotation = createMemo(() => {
        let step = c_props.step_at_cursor_path

        if (!step) {
            return []
        }

        let nag = step.nags?.[0]

        if (!nag) {
            return []
        }

        return annotationShapes(step.step.uci, step.step.san, nag_to_glyph(nag))
    })

    const chapter_title_or_detached = createMemo(() => {
        return props.selected_chapter?.name ?? '[detached]'
    })

    const lose_focus = createMemo(() => {
        return context_menu_open() !== undefined ||
         edit_study_dialog() !== undefined || 
         edit_section_dialog() !== undefined || 
         edit_chapter_dialog() !== undefined
    })



    let [,{ create_section, create_chapter }] = useStore()
    const on_import_pgns = async (pgns: PGN[], default_section_name: string) => {
        set_edit_section_dialog(undefined)

        let study_name = props.study.name
        let sections: Record<string, [string, PGN][]> = {}

        for (let pgn of pgns) {
            let event = pgn.event!
            let [default_study_name, section_name, chapter_name] = event.split(':')

            if (!chapter_name) {
                chapter_name = section_name
                section_name = default_section_name
            }


            if (sections[section_name] === undefined) {
                sections[section_name] = []
            }

            sections[section_name].push([chapter_name, pgn])
            study_name = default_study_name
        }

        await on_update_study({ id: props.study.id, name: study_name })

        let section_name = Object.keys(sections)[0]
        let section = edit_section_dialog()
        if (section) {
            await on_edit_section(props.study.id, { id: section.id, name: section_name })
        }

        let s_chapter: ModelChapter | undefined = undefined
        let s_section: ModelSection | undefined = section

        for (section_name of Object.keys(sections)) {
            if (!section) {
                section = await create_section(props.study.id, section_name)
            }

            let chapters = sections[section_name]
            for (let [chapter_name, pgn] of chapters) {
                s_chapter = await create_chapter(props.study.id, section!.id, chapter_name, pgn)
            }
            s_section = section
            section = undefined
        }

        if (s_section && s_chapter) {
            update_study({ id: props.study.id, selected_section_id: s_section.id })
            update_section(props.study.id, { id: s_section.id, selected_chapter_id: s_chapter.id })
        }
    }


    const on_export_lichess = () => {
    }

    createEffect(() => {
        console.log(unwrap(props.selected_section?.chapter_ids))
    })

    async function study_as_export_pgn() {
        let res = await Promise.all(props.sections.map(section =>
            Promise.all(section.chapter_ids.map(id => store.chapters.list.find(_ => _.id === id)!).map(chapter =>
                chapter_as_export_pgn(props.study.name, section.name, chapter)
            )).then(_ => _.join('\n\n'))
        )).then(_ => _.join('\n\n\n'))
        return res
    }

    const on_export_pgn = async () => {
        let res = await study_as_export_pgn()
        downloadBlob(res, `${props.study.name}.pgn`)
    }
    const on_copy_pgn = async () => {
        let res = await chapter_as_export_pgn(props.study.name, props.selected_section!.name, props.selected_chapter!)
        navigator.clipboard.writeText(res)
    }

    const on_copy_variation_pgn = (path: Path) => {
        let res = as_pgn_for_path(store.replay_tree.steps_tree, path)
        navigator.clipboard.writeText(res)
        set_context_menu_open(undefined)
    }


    const set_on_wheel = (i: number) => {
        if (i > 0) {
            goto_path_if_can(c_props.get_next_path)
        } else {
            goto_path_if_can(c_props.get_prev_path)
        }
    }

    const movable = createMemo(() => !props.study.is_edits_disabled)

    const get_i_section = (section: ModelSection) => props.sections.indexOf(section)
    const get_i_chapter = (chapter: ModelChapter) => props.chapters.indexOf(chapter)

    const [, {
        update_section,
        delete_section,
        update_chapter,
        delete_chapter,
        update_study,
        delete_study,
        order_sections,
        order_chapters,
    }] = useStore()

    const on_edit_section = update_section
    const on_delete_section = (study_id: EntityStudyId, section_id: EntitySectionId) => {
        delete_section(study_id, section_id)
        set_edit_section_dialog(undefined)
    }
    const on_edit_chapter = update_chapter
    const on_delete_chapter = (id: EntityChapterId) => {
        delete_chapter(props.study.id, props.selected_section!.id, id)
        set_edit_chapter_dialog(undefined)
    }
    const on_update_study = update_study
    const navigate = useNavigate()
    const on_delete_study = async (id: EntityStudyId) => {
        await delete_study(id)
        navigate('/openings')
    }


    const on_order_section = (section: ModelSection, order: number) => {
        order_sections(section.study_id, section.id, order)
    }
    const on_order_chapter = (chapter: ModelChapter, order: number) => {
        order_chapters(props.study.id, chapter.section_id, chapter.id, order)
    }

    createEffect(on(() => c_props.step_at_cursor_path, (step) => {
        if (!step) {
            set_last_move(undefined)
            set_fen(INITIAL_FEN)
            return
        }
        set_fen(step.step.fen)
        set_last_move([step.step.uci, step.step.san])
    }))

    const on_play_orig_key = async (orig: Key, dest: Key) => {

        const pos = () => fen_pos(store.play_fen)

        let position = pos()
        let turn_color = position.turn

        let piece = position.board.get(parseSquare(orig)!)!

        let uci = orig + dest
        if (piece.role === 'pawn' &&
            ((dest[1] === '8' && turn_color === 'white') || (dest[1] === '1' && turn_color === 'black'))) {
            uci += 'q'
        }

        let san = play_uci(uci)


        let node = await add_child_san_to_current_path(san)
        goto_path(node.step.path)
    }



    return (<>
        <main ref={$el_ref!} class='openings-show study'>
            <div class='details-wrap'>
                <StudyDetailsComponent {...props} section={props.selected_section} chapter={props.selected_chapter} />
            </div>
            <div on:wheel={non_passive_on_wheel(set_on_wheel)} class='board-wrap'>
                <PlayUciBoard shapes={annotation()} movable={movable()} color={fen_turn(store.play_fen)} fen={store.play_fen} last_move={store.last_move} play_orig_key={on_play_orig_key}/>
                {/*
                <PlayUciBoard shapes={annotation()} color={color()} movable={movable()} play_uci={play_uci}/>
                */}
            </div>
            <div class='replay-wrap'>
                <div class='header'>
                    {chapter_title_or_detached()}
                </div>
                <ReplayTreeComponent on_context_menu={on_tree_context_menu}/>
                {/*
                <PlayUciTreeReplayComponent
                play_replay={play_replay()} 
                on_context_menu={on_tree_context_menu} 
                lose_focus={lose_focus()}
                features = {
                    <>
                    <button onClick={props.on_feature_practice} class='feature practice'><i data-icon=""></i></button>
                    </>
                }
                />
                */}
            </div>
            <div class='sections-wrap'>
                <SectionsListComponent {...props} is_edits_disabled={props.study.is_edits_disabled} on_edit_study={() => set_edit_study_dialog(true)} on_edit_section={set_edit_section_dialog} on_edit_chapter={set_edit_chapter_dialog}/>
            </div>
            <div class='tools-wrap'>
                <ToolbarComponent {...props} fen={store.play_fen} on_export_lichess={on_export_lichess} on_export_pgn={on_export_pgn} on_copy_pgn={on_copy_pgn}/>
            </div>
            <Show when={edit_section_dialog()}>{ section => 
                <DialogComponent klass='edit-section' on_close={() => set_edit_section_dialog(undefined)}>
                    <EditSectionComponent section={section()} i_section={get_i_section(section())} nb_sections={props.sections.length} on_delete_section={() => on_delete_section(props.study.id, section().id)} on_edit_section={_ => on_edit_section(props.study.id, _)} on_order_section={_ => on_order_section(section(), _)} on_import_pgns={on_import_pgns} />
                </DialogComponent>
            }</Show>
            <Show when={edit_chapter_dialog()}>{ (chapter) => 
                <DialogComponent klass='edit-chapter' on_close={() => set_edit_chapter_dialog(undefined)}>
                    <EditChapterComponent chapter={chapter()} i_chapter={get_i_chapter(chapter())} on_edit_chapter={_ => on_edit_chapter(props.study.id, chapter().section_id, _)} on_delete_chapter={() => on_delete_chapter(chapter().id)} on_order_chapter={_ => on_order_chapter(chapter(), _)}/>
                </DialogComponent>
            }</Show>
            <Show when={edit_study_dialog()}>
                <DialogComponent klass='edit-study' on_close={() => set_edit_study_dialog(false)}>
                    <EditStudyComponent study={props.study} on_delete_study={() => on_delete_study(props.study.id)} on_update_study={on_update_study}/>
                </DialogComponent>
            </Show>
            <Show when={context_menu_step()}>{ step => 
            <>
                <MoveContextMenuComponent step={step().step} ref={$el_context_menu!}>
                    <a onClick={() => on_analyze_lichess(step().step)} class='analyze' data-icon=''>Analyze on lichess</a>
                    <a onClick={() => on_copy_variation_pgn(step().step.path)} class='copy-line' data-icon=''>Copy variation PGN</a>
                    <Show when={!props.study.is_edits_disabled}>
                       <a ref={$el_sub_menu_anchor!} onMouseLeave={() => delay_set_annotate_sub_menu_open(false)} onMouseEnter={() => delay_set_annotate_sub_menu_open(true)} class='annotate has-sub-menu' data-icon=""><i class='glyph-icon'></i>Annotate Glyph</a>
                       <a onClick={() => on_delete_move(step().step.path)} class='delete' data-icon=''>Delete after this move</a>
                    </Show>
                </MoveContextMenuComponent>
                <Show when={annotate_sub_menu_open()}>
                    <div onMouseLeave={() => delay_set_annotate_sub_menu_open(false)} onMouseEnter={() => delay_set_annotate_sub_menu_open(true)} ref={_ => setTimeout(() => set_$el_context_sub_menu(_))} style={sub_menu_klass()} class='context-sub-menu'>
                        <For each={GLYPHS}>{ (g, i) =>
                            <a onClick={() => on_annotate_click(step(), g)} class={'annotate glyph ' + GLYPH_NAMES[i()] }><i class={`glyph-icon ${GLYPH_NAMES[i()]}`}></i>{GLYPH_NAMES[i()]}</a>
                        }</For>
                    </div>
                </Show>
                </>
            }</Show>
        </main>
    </>)
}

function SectionsListComponent(props: ShowComputedProps & { is_edits_disabled: boolean, on_edit_study: () => void, on_edit_section: (section: ModelSection) => void, on_edit_chapter: (chapter: ModelChapter) => void, }) {

    let [,{ create_section, update_study}] = useStore()

    const on_new_section = async () => {
        let section = await create_section(props.study.id)
        set_selected_section(section.id)
    }

    const set_selected_section = (selected_section_id: EntitySectionId) => 
        update_study({id: props.study.id, selected_section_id })

    return (<>
    <div class='sections-list'>
        <div class='header'>
            <span class='title'>{props.study.name}</span>
            <div class='tools'>
                <Show when={!props.is_edits_disabled}>
                    <i onClick={() => props.on_edit_study?.()} data-icon=""></i>
                </Show>
            </div>
        </div>
        <div class='list'>
            <For each={props.sections} fallback={
                <NoSections />
            }>{(section, i) =>
                <Show when={section === props.selected_section} fallback={
                    <SectionCollapsedComponent is_edits_disabled={props.is_edits_disabled} section={section} nth={get_letter_nth(i())} on_selected={() => set_selected_section(section.id)} on_edit={() => props.on_edit_section(section)}/>
                }>
                    <SectionComponent 
                                {...props}
                                section={section} 
                                is_edits_disabled={props.is_edits_disabled} 
                                nth={get_letter_nth(i())} 
                                on_edit={() => props.on_edit_section(section)} 
                                on_edit_chapter={props.on_edit_chapter} 
                                />
                </Show>
                }</For>
            <div class='tools'>
                <Show when={!props.is_edits_disabled}>
                    <button onClick={on_new_section} class='new'><i data-icon=""></i><span>New Section</span></button>
                </Show>
            </div>
        </div>
    </div>
    </>)
}

function SectionComponent(props: ShowComputedProps & { nth: string, section: ModelSection, is_edits_disabled: boolean, on_edit: () => void, on_edit_chapter: (chapter: ModelChapter) => void }) {

    let [,{ create_chapter, update_section }] = useStore()

    const on_new_chapter = async () => {
        let chapter = await create_chapter(props.study.id, props.section.id)
        set_selected_chapter(chapter.id)
    }


    const set_selected_chapter = (selected_chapter_id: EntityChapterId) => 
        update_section(props.study.id, {id: props.section.id, selected_chapter_id })

    return (<>
        <div class='section active'>
            <div class='header'>
                <div class='title'><span class='nth'>{props.nth}</span><span class='fit-ellipsis' title={props.section?.name}>{props.section?.name}</span></div>
                <Show when={!props.is_edits_disabled}>
                    <i onClick={() => props.on_edit()} data-icon=""></i>
                </Show>
            </div>
            <div class='chapters-list'>

                <div class='list'>
                    <For each={props.chapters} fallback={
                        <NoChapters />
                    }>{(chapter, i) =>
                        <ChapterComponent is_edits_disabled={props.is_edits_disabled} chapter={chapter} nth={`${props.nth}${i() + 1}`} selected={props.selected_chapter===chapter} on_selected={() => set_selected_chapter(chapter.id)}  on_edit={() => props.on_edit_chapter(chapter)}/>
                    }</For>
                </div>
                <div class='tools'>
                    <Show when={!props.is_edits_disabled}>
                        <button onClick={() => on_new_chapter()} class='new'><i data-icon=""></i><span>New Chapter</span></button>
                    </Show>
                </div>
            </div>
        </div>
    </>)
}

export function ChapterComponent(props: { is_edits_disabled: boolean, chapter: ModelChapter, nth: string, selected: boolean, on_selected: () => void, on_edit: () => void }) {

    const klass = createMemo(() => props.selected ? ' active' : '')

    return (<>
        <div onClick={() => props.on_selected()} class={'chapter' + klass()}>
            <div class='title'><span class='nth'>{props.nth}.</span>{props.chapter.name}</div>
            <Show when={!props.is_edits_disabled}>
                <i onClick={() => props.on_edit()} data-icon=""></i>
            </Show>
        </div>
    </>)
}



function SectionCollapsedComponent(props: { is_edits_disabled: boolean, section: ModelSection, nth: string, on_selected: () => void, on_edit: () => void }) {

    return (<>
        <div class='section'>
            <div onClick={() => props.on_selected()} class='header'>
                <div class='title'><span class='nth'>{props.nth}</span><span class='fit-ellipsis'>{props.section.name}</span></div>
                <Show when={!props.is_edits_disabled}>
                    <i onClick={() => props.on_edit()} data-icon=""></i>
                </Show>
            </div>
        </div>
    </>)
}



export function NoSections() {
    return (<>
    <div class='no-sections'>No Sections yet.</div>
    </>)
}

export function NoChapters() {
    return (<>
    <div class='no-chapters'>No Chapters yet.</div>
    </>)
}

export function LoadingChapters() {
    return (<>
    <div class='loading-chapters'>Loading Chapters.</div>
    </>)
}




function StudyDetailsComponent(_props: { study: ModelStudy, section?: ModelSection, chapter?: ModelChapter }) {
    return (<>
    </>)
}


function ToolbarComponent(props: { study: ModelStudy, fen: FEN, on_export_lichess: () => void, on_export_pgn: () => void, on_copy_pgn: () => void }) {
    const [, { update_study}] = useStore()

    const [tab, set_tab] = createSignal('share')

    const [on_copied_pgn, set_on_copied_pgn] = createSignal(true, { equals: false })
    const on_copy_pgn = () => {
        set_on_copied_pgn(true)
        props.on_copy_pgn()
    }

    const is_edits_disabled = props.study.is_edits_disabled;
    const set_is_edits_disabled = (value: boolean) => update_study({ id: props.study.id, is_edits_disabled: value })


    return (<>
        <div class='tabs'>
            <div onClick={() => set_tab('settings')} class={'tab' + (tab() === 'settings' ? ' active': '')}><i data-icon=""></i></div>
            <div onClick={() => set_tab('share')} class={'tab' + (tab() === 'share' ? ' active': '')}><i data-icon=""></i></div>
        </div>
        <div class='content'>
            <Show when={tab() === 'settings'}>
                <div class='settings'>
                    <div class='group'>
                    <label for="editable">Disable Edits</label>
                    <input onChange={(e) => set_is_edits_disabled(e.currentTarget.checked)}id="editable" type='checkbox' checked={is_edits_disabled}></input>
                    </div>
                </div>
            </Show>
            <Show when={tab() === 'share'}>
                <div class='export'>
                    <button onClick={on_copy_pgn}><CopiedI on_copy={on_copied_pgn()}/>Copy PGN</button>
                    <button onClick={props.on_export_pgn}>Export as PGN</button>
                    <button onClick={props.on_export_lichess}>Export to Lichess Study</button>
                </div>
                <div class='fen'>
                <h4>FEN</h4>
                <CopyInputText value={props.fen}/>
                </div>
            </Show>
        </div>
    </>)
}

function CopyInputText(props: { value: string }) {

    const [on_copy, set_on_copy] = createSignal(true, { equals: false })
    const copy_value = () => {
        navigator.clipboard.writeText(props.value)
        set_on_copy(true)
    }

    return (<div onClick={copy_value} class='copy-input-text'>
        <input type='text' value={props.value} spellcheck={false} readonly={true}></input>
        <CopiedI on_copy={on_copy()}/>

    </div>)
}

function CopiedI(props: { on_copy: boolean }) {
    createEffect(on(() => props.on_copy, () => {
        set_copied(true)
        setTimeout(() => set_copied(false), 1000)
    }, { defer: true }))

    const [copied, set_copied] = createSignal(false)
    return (<>
        <Show when={copied()} fallback={
            <span><i data-icon=""></i></span>
        }>
            <span class='copied'><i data-icon=""></i></span>
        </Show>
    </>)
}

function StudyLoading() {
    return (<>
        <div class="loading">Loading</div>
    </>)
}

/* chat gpt */
function downloadBlob(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const element = document.createElement('a');
  element.setAttribute('href', url);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  URL.revokeObjectURL(url); // Clean up the URL object
}
import { batch, createEffect, createMemo, createResource, createSignal, ErrorBoundary, For, on, onCleanup, onMount, Show, Suspense, useContext } from "solid-js"
import { gen_id8, StudiesDBContext, StudiesDBProvider } from "../../components/sync_idb_study"
import { useNavigate, useParams } from "@solidjs/router"
import { Chapter, EditChapterComponent, EditSectionComponent, EditStudyComponent, Section, SectionsListComponent, Study, StudyDetailsComponent } from "../../components/StudyComponent"
import './Show.scss'
import { non_passive_on_wheel, PlayUciBoard, PlayUciComponent } from "../../components/PlayUciComponent"
import { MoveContextMenuComponent, PGN, PlayUciTreeReplay, PlayUciTreeReplayComponent, StepsTree, TreeStepNode } from "../../components/ReplayTreeComponent"
import { DialogComponent } from "../../components/DialogComponent"
import { INITIAL_FEN } from "chessops/fen"
import { usePlayer } from "../../sound"
import { FEN, GLYPH_NAMES, glyph_to_nag, GLYPHS, nag_to_glyph, Path, Step } from "../../components/step_types"
import { annotationShapes } from "../../annotationShapes"

export default () => {
    return (<>
    <StudiesDBProvider>
            <ShowComponent />
    </StudiesDBProvider>
    </>)
}

function ShowComponent() {
    let db = useContext(StudiesDBContext)!

    let params = useParams()

    let [study, {refetch}] = createResource(() => db.study_by_id(params.id))

    return (<>
        <ErrorBoundary fallback={<StudyNotFound />}>
            <Suspense fallback={<StudyLoading />}>
                <Show when={study()}>{study =>
                    <StudyShow study={study()} on_refetch={() => refetch()} />
                }</Show>
            </Suspense>
        </ErrorBoundary>
    </>)
}

function StudyShow(props: { study: Study, on_refetch: () => void }) {

    const db = useContext(StudiesDBContext)!

    const play_uci = PlayUciComponent()

    const color = createMemo(() => play_uci.turn)
    const movable = createMemo(() => true)

    const [selected_section, set_selected_section] = createSignal<Section | undefined>(undefined)
    const [selected_chapter, set_selected_chapter] = createSignal<Chapter | undefined>(undefined)

    const on_selected_chapter = (section: Section, chapter: Chapter) => {
        batch(() => {
            set_selected_section(section)
            set_selected_chapter(chapter)
        })
    }

    const [edit_section_dialog, set_edit_section_dialog] = createSignal<Section | undefined>(undefined)

    const nb_sections = createMemo(() => props.study.sections.length)
    const get_i_section = (section: Section) => props.study.sections.indexOf(section)
    const get_i_chapter = (section: Section, chapter: Chapter) => section.chapters.indexOf(chapter)

    const on_order_changed = (section: Section, order: number) => {
        batch(() => {
            props.study.change_section_order(section, order)
            set_on_section_order_changed(order)
        })
    }

    const [edit_chapter_dialog, set_edit_chapter_dialog] = createSignal<[Section, Chapter] | undefined>(undefined)

    const on_chapter_order_changed = (section: Section, chapter: Chapter, order: number) => {
        batch(() => {
            section.change_chapter_order(chapter, order)
            set_on_chapter_order_changed(order)
        })
    }

    const [get_on_chapter_order_changed, set_on_chapter_order_changed] = createSignal<number | undefined>(undefined)
    const [get_on_section_order_changed, set_on_section_order_changed] = createSignal<number | undefined>(undefined)

    const [edit_study_dialog, set_edit_study_dialog] = createSignal(false)

    const play_replay = createMemo(() => {
        let s = selected_chapter()
        if (!s) {
            return PlayUciTreeReplay(gen_id8(), StepsTree(gen_id8()))
        }
        return s.play_replay
    })

    const fen = createMemo(() => play_replay().cursor_path_step?.fen ?? INITIAL_FEN)

    createEffect(on(() => play_uci.on_last_move_added, (us) => {
        if (!us) {
            return
        }

        let san = us[1]

        let new_node = play_replay().add_child_san_to_current_path(san)

        if (!new_node) {
            return
        }

        db.new_tree_step_node(new_node)
    }))

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


    props.study.create_effects_listen_and_save_db(db)

    createEffect(on(() => props.study.sections, (ss) => {
        ss.forEach(s => {
            s.create_effects_listen_and_save_db(db)

            createEffect(on(() => s.chapters, (cc) => {
                cc.forEach(c => {
                    c.create_effects_listen_and_save_db(db)
                })
            }))
        })
    }))

    createEffect(on(play_replay, (replay) => {
        replay.create_effects_listen_and_save_db(db)
    }))


    const on_delete_chapter = (section: Section, chapter: Chapter) => {
        section.delete_chapter(chapter)
        set_edit_chapter_dialog(undefined)

        db.delete_chapter(chapter)
    }

    const on_delete_section = (section: Section) => {
        props.study.delete_section(section)
        set_edit_section_dialog(undefined)

        db.delete_section(section)
    }

    const navigate = useNavigate()
    const on_delete_study = () => {
        set_edit_study_dialog(false)
        db.delete_study(props.study)
        navigate('/openings')
    }

    const [context_menu_open, set_context_menu_open] = createSignal<Path | undefined>(undefined)

    const context_menu_step = createMemo(() => {
        let c_path = context_menu_open()
        if (c_path) {
            return play_replay().get_at_path(c_path)
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
        play_replay().cursor_path = path
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
        let child = play_replay().delete_at_and_after_path(path)

        if (!child) {
            return
        }

        await db.delete_tree_nodes([child, ...child.all_sub_children])

        set_context_menu_open(undefined)
    }

    const [annotate_sub_menu_open, set_annotate_sub_menu_open] = createSignal(false)

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

    const on_annotate_click = (step: TreeStepNode, glyph: string) => {
        step.set_nags([glyph_to_nag(glyph)])

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

    const lose_focus = createMemo(() => {
        return context_menu_open() !== undefined ||
         edit_study_dialog() !== undefined || 
         edit_section_dialog() !== undefined || 
         edit_chapter_dialog() !== undefined
    })


    const on_import_pgns = async (pgns: PGN[], default_section_name: string) => {

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

        props.study.set_name(study_name)

        let section_name = Object.keys(sections)[0]
        let section = edit_section_dialog()
        if (section) {
            section.set_name(section_name)
        }

        let s_chapter: Chapter | undefined = undefined
        let s_section: Section | undefined = section

        let i_order = props.study.sections.length
        for (section_name of Object.keys(sections)) {

            if (!section) {
                section = await db.new_section_with_name(props.study.id, section_name, i_order++)
                props.study.add_new_section(section)
            }

            let i_chapter = 0
            let chapters = sections[section_name]
            for (let [chapter_name, pgn] of chapters) {
                s_chapter = await db.new_chapter_from_pgn(section.id, chapter_name, pgn, i_chapter++)
                section.add_new_chapter(s_chapter)
            }
            s_section = section
            section = undefined
        }

        if (s_section && s_chapter) {
            on_selected_chapter(s_section, s_chapter)
        }
        set_edit_section_dialog(undefined)
    }


    const on_export_lichess = () => {
        //let _res = props.study.as_export_lichess
    }

    const on_export_pgn = () => {
        let res = props.study.as_export_pgn
        downloadBlob(res, `${props.study.name}.pgn`)
    }
    const on_copy_pgn = () => {
        let res = props.study.as_export_pgn
        navigator.clipboard.writeText(res)
    }



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
                <PlayUciTreeReplayComponent db={db} play_replay={play_replay()} on_context_menu={on_tree_context_menu} lose_focus={lose_focus()}/>
            </div>
            <div class='sections-wrap'>
                <SectionsListComponent db={db} study={props.study} on_selected_chapter={on_selected_chapter} on_edit_study={() => set_edit_study_dialog(true)} on_edit_section={set_edit_section_dialog} on_edit_chapter={(section, chapter) => set_edit_chapter_dialog([section, chapter])} on_chapter_order_changed={get_on_chapter_order_changed()} on_section_order_changed={get_on_section_order_changed()}/>
            </div>
            <div class='tools-wrap'>
                <ToolbarComponent fen={fen()} on_export_lichess={on_export_lichess} on_export_pgn={on_export_pgn} on_copy_pgn={on_copy_pgn}/>
            </div>
            <Show when={edit_section_dialog()}>{ section => 
                <DialogComponent klass='edit-section' on_close={() => set_edit_section_dialog(undefined)}>
                    <EditSectionComponent db={db} on_delete_section={() => on_delete_section(section())} on_order_changed={order => on_order_changed(section(), order)} section={section()} i_section={get_i_section(section())} nb_sections={nb_sections()} on_import_pgns={on_import_pgns}/>
                </DialogComponent>
            }</Show>
            <Show when={edit_chapter_dialog()}>{ (sc) => 
                <DialogComponent klass='edit-chapter' on_close={() => set_edit_chapter_dialog(undefined)}>
                    <EditChapterComponent db={db} on_delete_chapter={() => on_delete_chapter(...sc())} on_order_changed={order => on_chapter_order_changed(...sc(), order)} section={sc()[0]} chapter={sc()[1]} i_chapter={get_i_chapter(...sc())}/>
                </DialogComponent>
            }</Show>
            <Show when={edit_study_dialog()}>
                <DialogComponent klass='edit-study' on_close={() => set_edit_study_dialog(false)}>
                    <EditStudyComponent db={db} study={props.study} on_delete_study={on_delete_study} />
                </DialogComponent>
            </Show>
            <Show when={context_menu_step()}>{ step => 
            <>
                <MoveContextMenuComponent step={step()} ref={$el_context_menu!}>
                    <a onClick={() => on_analyze_lichess(step().step)} class='analyze' data-icon=''>Analyze on lichess</a>
                    <a ref={$el_sub_menu_anchor!} onMouseLeave={() => delay_set_annotate_sub_menu_open(false)} onMouseEnter={() => delay_set_annotate_sub_menu_open(true)} class='annotate has-sub-menu' data-icon=""><i class='glyph-icon'></i>Annotate Glyph</a>
                    <a onClick={() => on_delete_move(step().path)} class='delete' data-icon=''>Delete after this move</a>
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

function ToolbarComponent(props: { fen: FEN, on_export_lichess: () => void, on_export_pgn: () => void, on_copy_pgn: () => void }) {

    const [tab, set_tab] = createSignal('share')

    const [on_copied_pgn, set_on_copied_pgn] = createSignal(true, { equals: false })
    const on_copy_pgn = () => {
        set_on_copied_pgn(true)
        props.on_copy_pgn()
    }



    return (<>
        <div class='tabs'>
            <div onClick={() => set_tab('settings')} class={'tab' + (tab() === 'settings' ? ' active': '')}><i data-icon=""></i></div>
            <div onClick={() => set_tab('share')} class={'tab' + (tab() === 'share' ? ' active': '')}><i data-icon=""></i></div>
        </div>
        <div class='content'>
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

function StudyNotFound() {

    return (<>
        <div class='not-found'>Opening Not Found</div>
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
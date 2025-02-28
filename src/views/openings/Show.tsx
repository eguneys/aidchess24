import { batch, createMemo, createResource, createSignal, ErrorBoundary, Show, Suspense, useContext } from "solid-js"
import { StudiesDBContext, StudiesDBProvider } from "../../components/sync_idb_study"
import { useParams } from "@solidjs/router"
import { Chapter, EditChapterComponent, EditSectionComponent, EditStudyComponent, Section, SectionsListComponent, Study, StudyDetailsComponent } from "../../components/StudyComponent"
import './Show.scss'
import { PlayUciBoard, PlayUciComponent } from "../../components/PlayUciComponent"
import { Color } from "chessops"
import { PlayUciTreeReplay, PlayUciTreeReplayComponent } from "../../components/ReplayTreeComponent"
import { DialogComponent } from "../../components/DialogComponent"

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

    let [study] = createResource(() => db.study_by_id(params.id))

    return (<>
        <main class='openings-show'>
            <ErrorBoundary fallback={<StudyNotFound />}>
                <Suspense fallback={<StudyLoading />}>
                    <Show when={study()}>{study =>
                        <StudyShow study={study()} />
                    }</Show>
                </Suspense>
            </ErrorBoundary>
        </main>
    </>)
}

function StudyShow(props: { study: Study }) {

    const play_uci = PlayUciComponent()
    const play_replay = PlayUciTreeReplayComponent()

    const [color, _set_color] = createSignal<Color>('white')

    const movable = createMemo(() => false)

    const [selected_section, set_selected_section] = createSignal<Section | undefined>(undefined)
    const [selected_chapter, set_selected_chapter] = createSignal<Chapter | undefined>(undefined)

    const on_selected_chapter = (section: Section, chapter: Chapter) => {
        batch(() => {
            set_selected_section(section)
            set_selected_chapter(chapter)
        })
    }

    const [edit_section_dialog, set_edit_section_dialog] = createSignal<Section | undefined>(undefined)

    const nb_sections = () => props.study.sections.length
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

    return (<>
        <div class='study'>
            <div class='details-wrap'>
                <StudyDetailsComponent study={props.study} section={selected_section()} chapter={selected_chapter()} />
            </div>
            <div class='board-wrap'>
                <PlayUciBoard color={color()} movable={movable()} play_uci={play_uci}/>
            </div>
            <div class='replay-wrap'>
                <PlayUciTreeReplay play_replay={play_replay}/>
            </div>
            <div class='sections-wrap'>
                <SectionsListComponent study={props.study} on_selected_chapter={on_selected_chapter} on_edit_study={() => set_edit_study_dialog(true)} on_edit_section={set_edit_section_dialog} on_edit_chapter={(section, chapter) => set_edit_chapter_dialog([section, chapter])} on_chapter_order_changed={get_on_chapter_order_changed()} on_section_order_changed={get_on_section_order_changed()}/>
            </div>
            <div class='tools-wrap'>
            </div>
            <Show when={edit_section_dialog()}>{ section => 
                <DialogComponent klass='edit-section' on_close={() => set_edit_section_dialog(undefined)}>
                    <EditSectionComponent on_order_changed={order => on_order_changed(section(), order)} section={section()} i_section={get_i_section(section())} nb_sections={nb_sections()}/>
                </DialogComponent>
            }</Show>
            <Show when={edit_chapter_dialog()}>{ (sc) => 
                <DialogComponent klass='edit-chapter' on_close={() => set_edit_chapter_dialog(undefined)}>
                    <EditChapterComponent on_order_changed={order => on_chapter_order_changed(...sc(), order)} section={sc()[0]} chapter={sc()[1]} i_chapter={get_i_chapter(...sc())}/>
                </DialogComponent>
            }</Show>
            <Show when={edit_study_dialog()}>
                <DialogComponent klass='edit-study' on_close={() => set_edit_study_dialog(false)}>
                    <EditStudyComponent study={props.study}/>
                </DialogComponent>
            </Show>
        </div>
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
import { batch, createMemo, createResource, createSignal, ErrorBoundary, Show, Suspense, useContext } from "solid-js"
import { StudiesDBContext, StudiesDBProvider } from "../../components/sync_idb_study"
import { useParams } from "@solidjs/router"
import { Chapter, Section, SectionsListComponent, Study, StudyDetailsComponent } from "../../components/StudyComponent"
import './Show.scss'
import { PlayUciBoard, PlayUciComponent } from "../../components/PlayUciComponent"
import { Color } from "chessops"
import { PlayUciTreeReplay, PlayUciTreeReplayComponent } from "../../components/ReplayTreeComponent"

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
                <SectionsListComponent study={props.study} on_selected_chapter={on_selected_chapter} />
            </div>
            <div class='tools-wrap'>
            </div>
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
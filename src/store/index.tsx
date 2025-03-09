import { Accessor, createContext, useContext } from "solid-js";
import { JSX } from "solid-js";
import { createStore } from "solid-js/store";
import { createAgent } from "./createAgent";
import { EntityChapter, EntityChapterId, EntityChapterInsert, EntitySectionId, EntityStudy, EntityStudyId, EntityStudyInsert, ModelChapter,  ModelSection,  ModelStudy, StudiesPredicate } from "../components/sync_idb_study";
import { createStudies } from "./createStudies";
import { createChapters } from "./createChapters";
import { FEN } from "../components/step_types";
import { INITIAL_FEN } from "chessops/fen";


export type StoreActions = {
    load_studies(predicate: StudiesPredicate): Promise<void>
    load_study(id: EntityStudyId): Promise<void>
    create_study(): Promise<ModelStudy>
    delete_study(id: EntityStudyId): Promise<void>
    update_study(study: Partial<EntityStudyInsert>): Promise<EntityStudy>
    create_section(study_id: EntityStudyId): Promise<ModelSection>
    update_section(study_id: EntityStudyId, section: Partial<ModelSection>): Promise<void>
    delete_section(study_id: EntityStudyId, id: EntitySectionId): Promise<void>


    load_chapters(section_id: EntitySectionId): Promise<void>
    load_chapter(chapter_id: EntityChapterId): Promise<void>
    create_chapter(section_id: EntitySectionId): Promise<ModelChapter>
    update_chapter(study_id: EntityStudyId, section_id: EntitySectionId, chapter: Partial<EntityChapterInsert>): Promise<EntityChapter>
    delete_chapter(id: EntityChapterId): Promise<void>
}

export type StoreState = {
    studies: Record<EntityStudyId, ModelStudy>
    chapters: ModelChapter[]
    section_id?: EntitySectionId,
    play_fen: FEN
}

export type StoreComputed = {
}

export type Store = [StoreState, StoreActions]

const StoreContext = createContext<Store>()

export function StoreProvider(props: { children: JSX.Element }) {

    let studies: Accessor<Record<EntityStudyId, ModelStudy>>,
    chapters: Accessor<ModelChapter[]>

    let [state, setState] = createStore<StoreState>({
        get studies() {
            return studies()
        },
        get chapters() {
            return chapters()
        },
        play_fen: INITIAL_FEN,
    }),
    actions: Partial<StoreActions> = {},
    store: Store = [state, actions as StoreActions],
    agent = createAgent(store)

    studies = createStudies(agent, actions, state, setState)
    chapters = createChapters(agent, actions, state, setState)

    return (<StoreContext.Provider value={store}>
        {props.children}
    </StoreContext.Provider>)
}

export function useStore() {
    return useContext(StoreContext)!
}
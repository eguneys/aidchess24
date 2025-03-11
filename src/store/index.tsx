import { Accessor, createContext, useContext } from "solid-js";
import { JSX } from "solid-js";
import { createStore } from "solid-js/store";
import { createAgent } from "./createAgent";
import { EntityChapter, EntityChapterId, EntityChapterInsert, EntitySectionId, EntityStudy, EntityStudyId, EntityStudyInsert, ModelChapter,  ModelReplayTree,  ModelSection,  ModelStudy, StudiesPredicate } from "../components/sync_idb_study";
import { createStudies } from "./createStudies";
import { createChapters } from "./createChapters";
import { createReplayTree } from "./createReplayTree";
import { FEN } from "../components/step_types";
import { INITIAL_FEN } from "chessops/fen";
import { PGN } from "../components2/parse_pgn";


export type StoreActions = {
    load_studies(predicate: StudiesPredicate): Promise<void>
    load_study(id: EntityStudyId): Promise<void>
    create_study(): Promise<ModelStudy>
    delete_study(id: EntityStudyId): Promise<void>
    update_study(study: Partial<EntityStudyInsert>): Promise<EntityStudy>
    create_section(study_id: EntityStudyId, name?: string): Promise<ModelSection>
    update_section(study_id: EntityStudyId, section: Partial<ModelSection>): Promise<void>
    delete_section(study_id: EntityStudyId, id: EntitySectionId): Promise<void>
    order_sections(study_id: EntityStudyId, section_id: EntitySectionId, order: number): Promise<void>


    load_chapters(section_id: EntitySectionId): Promise<void>
    load_chapter(chapter_id: EntityChapterId): Promise<void>
    create_chapter(study_id: EntityStudyId, section_id: EntitySectionId, name?: string, pgn?: PGN): Promise<ModelChapter>
    update_chapter(study_id: EntityStudyId, section_id: EntitySectionId, chapter: Partial<EntityChapterInsert>): Promise<EntityChapter>
    delete_chapter(id: EntityChapterId): Promise<void>
    order_chapters(study_id: EntityStudyId, section_id: EntitySectionId, chapter_id: EntityChapterId, order: number): Promise<void>
}

export type StoreState = {
    studies: Record<EntityStudyId, ModelStudy>
    chapters: ModelChapter[]
    replay_tree: ModelReplayTree
    play_fen: FEN
}

export type StoreComputed = {
}

export type Store = [StoreState, StoreActions]

const StoreContext = createContext<Store>()

export function StoreProvider(props: { children: JSX.Element }) {

    let studies: Accessor<Record<EntityStudyId, ModelStudy>>,
    chapters: Accessor<ModelChapter[]>,
    replay_tree: Accessor<ModelReplayTree>

    let [state, setState] = createStore<StoreState>({
        get studies() {
            return studies()
        },
        get chapters() {
            return chapters()
        },
        get replay_tree() {
            return replay_tree()
        },
        play_fen: INITIAL_FEN,
    }),
    actions: Partial<StoreActions> = {},
    store: Store = [state, actions as StoreActions],
    agent = createAgent(store)

    studies = createStudies(agent, actions, state, setState)
    chapters = createChapters(agent, actions, state, setState)
    replay_tree = createReplayTree(agent, actions, state, setState)

    return (<StoreContext.Provider value={store}>
        {props.children}
    </StoreContext.Provider>)
}

export function useStore() {
    return useContext(StoreContext)!
}
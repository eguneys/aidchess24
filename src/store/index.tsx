import { Accessor, batch, createContext, useContext } from "solid-js";
import { JSX } from "solid-js";
import { createStore } from "solid-js/store";
import { createAgent } from "./createAgent";
import { EntityChapter, EntityChapterId, EntityChapterInsert, EntitySectionId, EntityStudy, EntityStudyId, EntityStudyInsert, ModelChapter,  ModelReplayTree,  ModelSection,  ModelStudy, ModelTreeStepNode, StudiesPredicate } from "../components/sync_idb_study";
import { createStudies } from "./createStudies";
import { createChapters } from "./createChapters";
import { createReplayTree } from "./createReplayTree";
import { FEN, fen_pos, NAG, Path, SAN, UCI } from "../components/step_types";
import { INITIAL_FEN, makeFen } from "chessops/fen";
import { PGN } from "../components2/parse_pgn";
import { parseUci } from "chessops";
import { makeSan } from "chessops/san";


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
    delete_chapter(study_id: EntityStudyId, section_id: EntitySectionId, id: EntityChapterId): Promise<void>
    order_chapters(study_id: EntityStudyId, section_id: EntitySectionId, chapter_id: EntityChapterId, order: number): Promise<void>
    chapter_as_export_pgn(study_name: string, section_name: string, chapter: ModelChapter): Promise<string>

    reset_replay_tree(): Promise<void>
    load_replay_tree(chapter_id: EntityChapterId): Promise<void>
    goto_path(path: Path): void
    goto_path_if_can(path: Path | undefined): void 
    delete_at_and_after_path(path: Path): void
    add_child_san_to_current_path(san: SAN): Promise<ModelTreeStepNode>
    tree_step_node_set_nags(node: ModelTreeStepNode, nags: NAG[]): Promise<void>

    set_fen(fen: FEN): void
    set_last_move(last_move: [UCI, SAN] | undefined): void
    play_uci(uci: UCI): SAN
}

export type StoreState = {
    studies: Record<EntityStudyId, ModelStudy>
    chapters: { list: ModelChapter[] }
    replay_tree: ModelReplayTree
    play_fen: FEN
    last_move: [UCI, SAN] | undefined
}



export type Store = [StoreState, StoreActions]

const StoreContext = createContext<Store>()

export function StoreProvider(props: { children: JSX.Element }) {

    let studies: Accessor<Record<EntityStudyId, ModelStudy>>,
    chapters: Accessor<{ list: ModelChapter[] }>,
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
        last_move: undefined
    }),
    actions: Partial<StoreActions> = {},
    store: Store = [state, actions as StoreActions],
    agent = createAgent(store)

    studies = createStudies(agent, actions, state, setState)
    chapters = createChapters(agent, actions, state, setState)
    replay_tree = createReplayTree(agent, actions, state, setState)

    const set_fen = (fen: FEN) => {
        setState("play_fen", fen)
    }
    const set_last_move = (last_move: [UCI, SAN] | undefined) => {
        setState('last_move', last_move)
    }

    Object.assign(actions, {
        set_fen,
        set_last_move,
        play_uci(uci: UCI) {
            let position = fen_pos(state.play_fen)

            let move = parseUci(uci)!

            let san = makeSan(position, move)

            position.play(move)


            batch(() => {
                set_last_move([uci, san])
                set_fen(makeFen(position.toSetup()))

                if (uci.length === 5) {
                    //set_promotion(dest)
                }
            })

            return san
        }
    })

    return (<StoreContext.Provider value={store}>
        {props.children}
    </StoreContext.Provider>)
}

export function useStore() {
    return useContext(StoreContext)!
}
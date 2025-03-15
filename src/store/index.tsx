import { Accessor, batch, createContext, useContext } from "solid-js";
import { JSX } from "solid-js";
import { createStore } from "solid-js/store";
import { createAgent } from "./createAgent";
import { EntityChapter, EntityChapterId, EntityChapterInsert, EntityPlayUciTreeReplayId, EntitySectionId, EntityStepsTreeId, EntityStudy, EntityStudyId, EntityStudyInsert, ModelChapter,  ModelRepeatDueMove,  ModelRepeatMoveAttempt,  ModelReplayTree,  ModelSection,  ModelStudy, ModelTreeStepNode, StudiesPredicate } from "./sync_idb_study";
import { createStudies } from "./createStudies";
import { createChapters } from "./createChapters";
import { createReplayTree } from "./createReplayTree";
import { createDueMoves } from "./createDueMoves";
import { FEN, fen_pos, NAG, Path, SAN, UCI } from "./step_types";
import { INITIAL_FEN, makeFen } from "chessops/fen";
import { PGN } from "../components2/parse_pgn";
import { parseUci } from "chessops";
import { makeSan } from "chessops/san";
import { makePersisted } from "@solid-primitives/storage";
import { FSRS } from "ts-fsrs";
import { RepeatAttemptResult } from "./repeat_types";


export type StoreActions = {
    load_studies(predicate: StudiesPredicate): void
    load_study(id: EntityStudyId): void
    create_study(): Promise<ModelStudy>
    delete_study(id: EntityStudyId): Promise<void>
    update_study(study: Partial<EntityStudyInsert>): Promise<EntityStudy>
    create_section(study_id: EntityStudyId, name?: string): Promise<ModelSection>
    update_section(study_id: EntityStudyId, section: Partial<ModelSection>): Promise<void>
    delete_section(study_id: EntityStudyId, id: EntitySectionId): Promise<void>
    order_sections(study_id: EntityStudyId, section_id: EntitySectionId, order: number): Promise<void>


    load_chapters(section_id: EntitySectionId): void
    load_chapter(chapter_id: EntityChapterId): void
    create_chapter(study_id: EntityStudyId, section_id: EntitySectionId, name?: string, pgn?: PGN): Promise<ModelChapter>
    update_chapter(study_id: EntityStudyId, section_id: EntitySectionId, chapter: Partial<EntityChapterInsert>): Promise<EntityChapter>
    delete_chapter(study_id: EntityStudyId, section_id: EntitySectionId, id: EntityChapterId): Promise<void>
    order_chapters(study_id: EntityStudyId, section_id: EntitySectionId, chapter_id: EntityChapterId, order: number): Promise<void>
    chapter_as_export_pgn(study_name: string, section_name: string, chapter: ModelChapter): Promise<string>

    reset_replay_tree(only_steps_tree?: boolean): Promise<void>
    load_replay_tree(chapter_id: EntityChapterId, write_enabled?: boolean): void
    load_replay_tree_by_id(id: EntityPlayUciTreeReplayId, write_enabled?: boolean): void
    load_replay_tree_by_steps_id(id: EntityStepsTreeId, write_enabled?: boolean): void

    goto_path(path: Path): void
    goto_path_if_can(path: Path | undefined): void 
    goto_path_force(path: Path): void
    delete_at_and_after_path(path: Path): void
    add_child_san_to_current_path(san: SAN): Promise<ModelTreeStepNode>
    tree_step_node_set_nags(node: ModelTreeStepNode, nags: NAG[]): Promise<void>

    set_success_path(path?: Path): void
    set_failed_path(path?: Path): void
    set_hide_after_path(path?: Path): void

    set_fen(fen: FEN): void
    set_last_move(last_move: [UCI, SAN] | undefined): void
    play_uci(uci: UCI): SAN


    load_due_moves(study_id: EntityStudyId, section_ids: EntitySectionId[]): void
    save_due_move_if_not(due_move: ModelRepeatDueMove): Promise<void>
    add_attempt_with_spaced_repetition(fs: FSRS, due_move: ModelRepeatDueMove, attempt_result: RepeatAttemptResult): Promise<ModelRepeatMoveAttempt>


}

export type StoreState = {
    studies: Record<EntityStudyId, ModelStudy>
    chapters: { list: ModelChapter[] }
    replay_tree: ModelReplayTree
    play_fen: FEN
    last_move: [UCI, SAN] | undefined


    due_moves: { list: ModelRepeatDueMove[] }
}



export type Store = [StoreState, StoreActions]

const StoreContext = createContext<Store>()

export function StoreProvider(props: { children: JSX.Element }) {

    let studies: Accessor<Record<EntityStudyId, ModelStudy>>,
    chapters: Accessor<{ list: ModelChapter[] }>,
    replay_tree: Accessor<ModelReplayTree>,
    due_moves: Accessor<{ list: ModelRepeatDueMove[] }>


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
        get due_moves() {
            return due_moves()
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
    due_moves = createDueMoves(agent, actions, state, setState)

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


type PersistedActions = {
    set_repeat_selected_study(id?: EntityStudyId): void
    toggle_repeat_study_section(id: EntitySectionId): void
}

type PersistedState = {
    repeat_selected_study_id: EntityStudyId | undefined
    selected_section_ids: Record<EntityStudyId, EntitySectionId[]>
}

const p_version = 1

export type PersistedStore = [PersistedState, PersistedActions]

const PersistedStoreContext = createContext<PersistedStore>()

export function PersistedStoreProvider(props: { children: JSX.Element }) {
    let [state, setState] = makePersisted(createStore<PersistedState>({
        repeat_selected_study_id: undefined,
        selected_section_ids: {}
    }), { name: '.aidchess.pstore?v' + p_version })

    let actions: PersistedActions = {
        set_repeat_selected_study(id?: EntityStudyId) {
            setState('repeat_selected_study_id', id)
        },
        toggle_repeat_study_section(id: EntitySectionId) {
            let study_id = state.repeat_selected_study_id
            if (!study_id) {
                return
            }
            let list = state.selected_section_ids[study_id]

            if (!list) {
                setState('selected_section_ids', study_id, [id])
            } else if (list.includes(id)) {
                setState('selected_section_ids', study_id, list => list.filter(_ => _ !== id))
            } else {
                setState('selected_section_ids', study_id, list => [...list, id])
            }
        }
    }

    let store: PersistedStore = [state, actions]

    return <PersistedStoreContext.Provider value={store}>
        {props.children}
    </PersistedStoreContext.Provider>

}

export const usePersistedStore = () => useContext(PersistedStoreContext)!
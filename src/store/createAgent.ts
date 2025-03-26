import { useContext } from "solid-js";
import type { Store } from ".";
import { EntityChapterId, EntityChapterInsert, EntityPlayUciTreeReplayId, EntityPlayUciTreeReplayInsert, EntityRepeatDueMoveId, EntitySectionId, EntitySectionInsert, EntityStepsTreeId, EntityStudyId, EntityStudyInsert, EntityTreeStepNodeId, EntityTreeStepNodeInsert, ModelChapter, ModelRepeatDueMove, ModelRepeatMoveAttempt, ModelReplayTree, ModelSection, ModelStudy, ModelTreeStepNode, StudiesDBContext, StudiesDBReturn } from "./sync_idb_study";
import { PGN } from "../components2/parse_pgn";
import type { FEN, NAG, Step } from "../store/step_types";
import { Card } from "ts-fsrs";
import { RepeatAttemptResult } from "./repeat_types";

// mock query
const query = (id: any, _key: string) => id

export type Agent = {
    Studies: Studies,
    Chapters: Chapters,
    ReplayTree: ReplayTree
    DueMoves: DueMoves
}

type DueMoves = {
    by_study_id(id: EntityStudyId, sections: EntitySectionId[]): Promise<ModelRepeatDueMove[]>
    save_due_move(due_move: ModelRepeatDueMove): Promise<void>;
    new_attempt(id: EntityRepeatDueMoveId, attempt_result: RepeatAttemptResult, new_card: Card): Promise<ModelRepeatMoveAttempt>;
}

type ReplayTree = {
    by_id(id: EntityPlayUciTreeReplayId): Promise<ModelReplayTree>
    by_chapter_id(id: EntityChapterId): Promise<ModelReplayTree>
    by_steps_tree_id(id: EntityStepsTreeId): Promise<ModelReplayTree>
    create_node(steps_tree_id: EntityStepsTreeId, step: Step, nags?: NAG[], comments?: string[], write_enabled?: boolean): Promise<ModelTreeStepNode>

    update(entity: Partial<EntityPlayUciTreeReplayInsert>): Promise<void>
    update_tree_node(entity: Partial<EntityTreeStepNodeInsert>): Promise<void>
    delete_tree_nodes(id: EntityTreeStepNodeId[]): Promise<void>

    change_root_fen(id: EntityChapterId, fen: FEN): Promise<void>
}

type Chapters = {
    get(id: EntityChapterId): Promise<ModelChapter>
    by_section_id(id: EntitySectionId): Promise<ModelChapter[]>
    create(section_id: EntitySectionId, name?: string, pgn?: PGN): Promise<ModelChapter>
    delete(id: EntityChapterId): Promise<void>
    update_chapter(data: Partial<EntityChapterInsert>): Promise<void>
    order_chapters(section_id: EntitySectionId, chapter_id: EntityChapterId, order: number): Promise<void>
}

type Studies = {
    mine(): Promise<ModelStudy[]>
    auto(): Promise<ModelStudy[]>
    featured(): Promise<ModelStudy[]>
    all(): Promise<ModelStudy[]>
    get(id: EntityStudyId): Promise<ModelStudy>
    create_featured_once(id: EntityStudyId): Promise<ModelStudy | undefined>
    create(): Promise<ModelStudy>
    delete(id: EntityStudyId): Promise<void>
    create_section(id: EntityStudyId, name?: string): Promise<ModelSection>
    update(data: Partial<EntityStudyInsert>): Promise<void>
    update_section(data: Partial<EntitySectionInsert>): Promise<void>
    delete_section(id: EntityStudyId, section_id: EntitySectionId): Promise<void>
    order_sections(study_id: EntityStudyId, section_id: EntitySectionId, order: number): Promise<void>
}

function createAgentStudies(db: StudiesDBReturn): Studies {

    const mine = query(() => db.get_studies_by_predicate('mine'), 'studies')
    const auto = query(() => db.get_studies_by_predicate('auto'), 'studies')
    const featured = query(() => db.get_studies_by_predicate('featured'), 'studies')
    const all = query(() => db.get_studies(), 'studies')
    const get = query((id: EntityStudyId) => db.get_study_by_id(id), 'studies_by_id')

    return {
        mine,
        auto,
        featured,
        all,
        get,
        create_featured_once: async (id: EntityStudyId) => {
            let study = await db.new_featured_study_just_once_or_undefined(id)
            return study
        },
        create: async () => {
            let study = await db.new_study()
            return study
        },
        delete: async (id: EntityStudyId) => {
            await db.delete_study(id)
        },
        create_section: async (id: EntitySectionId, name?: string) => {
            let model = await db.new_section(id, name)
            return model
        },
        update: async (data: EntityStudyInsert) => {
            await db.update_study(data)
        },
        update_section: async (data: EntitySectionInsert) => {
            await db.update_section(data)
        },
        delete_section: async (_id: EntityStudyId, section_id: EntitySectionId) => {
            await db.delete_section(section_id)
        },
        order_sections: async (study_id: EntityStudyId, section_id: EntitySectionId, order: number) => {
            await db.order_sections(study_id, section_id, order)
        }

    }
}

function createAgentChapters(db: StudiesDBReturn): Chapters {
    const by_section_id = query((id: EntitySectionId) => db.get_chapters_by_section_id(id), 'chapters_by_section_id')
    const get = query((id: EntityChapterId) => db.get_chapter_by_id(id), 'chapters_by_id')

    return {
        by_section_id,
        get,
        create: async (section_id: EntitySectionId, name?: string, pgn?: PGN) => {
            let chapter = await db.new_chapter(section_id, name, pgn)
            return chapter
        },
        delete: async (id: EntityChapterId) => {
            await db.delete_chapter(id)
        },
        update_chapter: async (data: EntityChapterInsert) => {
            await db.update_chapter(data)
        },
        order_chapters: async (section_id: EntitySectionId, chapter_id: EntityChapterId, order: number) => {
            await db.order_chapters(section_id, chapter_id, order)
        }
    }
}

function createAgentReplayTree(db: StudiesDBReturn): ReplayTree {
    const by_steps_tree_id = query((id: EntityChapterId) => db.get_replay_tree_by_steps_tree_id(id), 'replay_tree_by_steps_tree_id')
    const by_chapter_id = query((id: EntityChapterId) => db.get_replay_tree_by_chapter_id(id), 'replay_tree_by_chapter_id')
    const by_id = query((id: EntityChapterId) => db.get_replay_tree_by_id(id), 'replay_tree_by_id')

    return {
        by_steps_tree_id,
        by_chapter_id,
        by_id,
        create_node: async (steps_tree_id: EntityStepsTreeId, step: Step, nags?: NAG[], comments?: string[], write_enabled?: boolean) => {
            let model = await db.new_tree_step_node(steps_tree_id, step, nags, comments, write_enabled)
            return model
        },
        update: async (entity: EntityPlayUciTreeReplayInsert) => {
            await db.update_play_uci_tree_replay(entity)
        },
        update_tree_node: async (entity: EntityTreeStepNodeInsert) => {
            await db.update_tree_step_node(entity)
        },
        delete_tree_nodes: async (ids: EntityTreeStepNodeId[]) => {
            await db.delete_tree_nodes(ids)
        },
        change_root_fen: async (id: EntityChapterId, fen: FEN) => {
            await db.change_root_fen(id, fen)
        }

    }
}

function createAgentDueMoves(db: StudiesDBReturn): DueMoves {
    const by_study_id = query((study_id: EntityStudyId, sections: EntitySectionId[]) => db.load_repeat_due_moves(study_id, sections), 'due_moves_by_study_id')

    return {
    by_study_id,
    async save_due_move(due_move: ModelRepeatDueMove) {
        return db.new_due_move({
            id: due_move.id,
            study_id: due_move.study_id,
            tree_step_node_id: due_move.tree_step_node_id
        })
    },
    async new_attempt(repeat_due_move_id: EntityRepeatDueMoveId, attempt_result: RepeatAttemptResult, card: Card) {
        return db.add_repeat_move_attempt(repeat_due_move_id, card, attempt_result)
    }
}
}

export function createAgent(_: Store): Agent {
    let db = useContext(StudiesDBContext)!

    let Studies = createAgentStudies(db)

    let Chapters = createAgentChapters(db)

    let ReplayTree = createAgentReplayTree(db)

    let DueMoves = createAgentDueMoves(db)

    return {
        Studies,
        Chapters,
        ReplayTree,
        DueMoves,
    }
}
import { useContext } from "solid-js";
import type { Store } from ".";
import { EntityChapterId, EntityChapterInsert, EntityPlayUciTreeReplayInsert, EntitySectionId, EntitySectionInsert, EntityStepsTreeId, EntityStudyId, EntityStudyInsert, EntityTreeStepNodeId, EntityTreeStepNodeInsert, ModelChapter, ModelReplayTree, ModelSection, ModelStudy, ModelTreeStepNode, StudiesDBContext, StudiesDBReturn } from "../components/sync_idb_study";
import { query} from "@solidjs/router";
import { PGN } from "../components2/parse_pgn";
import { Step } from "../components/step_types";

export type Agent = {
    Studies: Studies,
    Chapters: Chapters,
    ReplayTree: ReplayTree
}

type ReplayTree = {
    by_chapter_id(id: EntityChapterId): Promise<ModelReplayTree>
    create_node(steps_tree_id: EntityStepsTreeId, step: Step): Promise<ModelTreeStepNode>

    update(entity: Partial<EntityPlayUciTreeReplayInsert>): Promise<void>
    update_tree_node(entity: Partial<EntityTreeStepNodeInsert>): Promise<void>
    delete_tree_node(id: EntityTreeStepNodeId): Promise<void>
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
    const by_chapter_id = query((id: EntityChapterId) => db.get_replay_tree_by_chapter_id(id), 'replay_tree_by_chapter_id')

    return {
        by_chapter_id,
        create_node: async (steps_tree_id: EntityStepsTreeId, step: Step) => {
            let model = await db.new_tree_step_node(steps_tree_id, step)
            return model
        },
        update: async (entity: EntityPlayUciTreeReplayInsert) => {
            await db.update_play_uci_tree_replay(entity)
        },
        update_tree_node: async (entity: EntityTreeStepNodeInsert) => {
            await db.update_tree_step_node(entity)
        },
        delete_tree_node: async (id: EntityTreeStepNodeId) => {
            await db.delete_tree_nodes([id])
        }

    }
}

export function createAgent(_: Store): Agent {
    let db = useContext(StudiesDBContext)!

    let Studies = createAgentStudies(db)

    let Chapters = createAgentChapters(db)

    let ReplayTree = createAgentReplayTree(db)

    return {
        Studies,
        Chapters,
        ReplayTree
    }
}
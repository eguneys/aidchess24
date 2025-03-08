import Dexie, { Entity, EntityTable, InsertType } from "dexie";
import { createContext, JSX } from "solid-js";
import { NAG, Path, Step } from "./step_types";
import { Card } from "ts-fsrs";
import { RepeatAttemptResult } from "./repeat_types";

export function gen_id8() {
    return Math.random().toString(16).slice(2, 12)
}

async function db_new_study(db: StudiesDB, entity: EntityStudyInsert) {
    await db.studies.add(entity)
}

async function db_new_section(db: StudiesDB, entity: EntitySectionInsert) {
    await db.sections.add(entity)
}

async function db_new_chapter(db: StudiesDB, entity: EntityChapterInsert) {
    await db.chapters.add(entity)
}

async function db_new_steps_tree(db: StudiesDB, entity: EntityStepsTreeInsert) {
    await db.steps_trees.add(entity)
}

async function db_new_tree_replay(db: StudiesDB, entity: EntityPlayUciTreeReplayInsert) {
    await db.play_uci_tree_replays.add(entity)
}



async function db_update_study(db: StudiesDB, entity: EntityStudyInsert) {
    await db.studies.update(entity.id!, entity)
}
async function db_update_section(db: StudiesDB, entity: EntitySectionInsert) {
    await db.sections.update(entity.id!, entity)
}
async function db_update_chapter(db: StudiesDB, entity: EntityChapterInsert) {
    await db.chapters.update(entity.id!, entity)
}

async function db_delete_study(db: StudiesDB, id: EntityStudyId) {

    db.transaction('rw', [db.studies, db.sections, db.chapters], async () => {

        let e_study = await db.studies.where('id').equals(id).first()

        if (!e_study) {
            throw new EntityNotFoundError('Study', id)
        }

        await db.studies.delete(id)

        let e_sections = await db.sections.where('study_id').equals(e_study.id).toArray()
        let e_section_ids = e_sections.map(_ => _.id)
        db.sections.bulkDelete(e_section_ids)

        e_section_ids.forEach(_ => db_delete_section_rest(db, _))
    })
}

async function db_delete_section(db: StudiesDB, id: EntitySectionId) {
    db.transaction('rw', [db.sections, db.chapters], async () => {
        await db.sections.delete(id)

        await db_delete_section_rest(db, id)
    })
}

async function db_delete_section_rest(db: StudiesDB, id: EntitySectionId) {
    let e_chapters = await db.chapters.where('section_id').equals(id).toArray()
    let e_chapter_ids = e_chapters.map(_ => _.id)
    db.chapters.bulkDelete(e_chapter_ids)

    await e_chapters.map(_ => db_delete_chapter_rest(db, _))
}

async function db_delete_chapter(db: StudiesDB, id: EntityChapterId) {
    db.transaction('rw', [db.chapters], async () => {
        let e_chapter = await db.chapters.where('id').equals(id).first()
        if (!e_chapter) {
            throw new EntityNotFoundError("Chapter", id)
        }

        await db.chapters.delete(id)
        await db_delete_chapter_rest(db, e_chapter)
    })
}

async function db_delete_chapter_rest(db: StudiesDB, entity: EntityChapterInsert) {
    let tree_replay = await db.play_uci_tree_replays.where('id').equals(entity.tree_replay_id).first()
    if (!tree_replay) {
        throw new EntityNotFoundError('TreeReplay', entity.tree_replay_id)
    }
    db.play_uci_tree_replays.delete(tree_replay.id)
}


async function db_delete_tree_nodes(db: StudiesDB, nodes: ModelTreeStepNode[]) {
    await db.tree_step_nodes.bulkDelete(nodes.map(_ => _.id))
}

async function db_update_tree_replay(db: StudiesDB, entity: EntityPlayUciTreeReplayInsert) {
    await db.play_uci_tree_replays.update(entity.id!, entity)
}
async function db_update_tree_step_node(db: StudiesDB, entity: EntityTreeStepNodeInsert) {
    await db.tree_step_nodes.update(entity.id!, entity)
}

async function db_load_model_chapter(db: StudiesDB, id: EntityChapterId): Promise<ModelChapter> {

    let e_chapter = await db.chapters.where('id').equals(id).first()

    if (!e_chapter) {
        throw new EntityNotFoundError('Chapter', id)
    }

    let tree_replay = await db_load_model_play_replay(db, e_chapter.tree_replay_id)

    return {
        ...e_chapter,
        tree_replay
    }
}

async function db_load_model_play_replay(db: StudiesDB, id: EntityPlayUciTreeReplayId): Promise<ModelTreeReplay> {
    let e_replay = await db.play_uci_tree_replays.where('id').equals(id).first()

    if (!e_replay) {
        throw new EntityNotFoundError('Play Uci Tree Replay', id)
    }

    let e_steps = await db.steps_trees.where('id').equals(e_replay.steps_tree_id).first()

    if (!e_steps) {
        throw new EntityNotFoundError('Steps Tree', id)
    }

    let nodes = await db.tree_step_nodes.where('tree_id').equals(e_steps.id).toArray()

    nodes.sort((a, b) => {
        let res = a.step.path.length - b.step.path.length
        if (res === 0) {
            res = a.order - b.order
        }
        return res
    })

    let steps_tree: ModelStepsTree = {
        ...e_steps,
        flat_nodes: nodes

    }

    return {
        ...e_replay,
        steps_tree
    }
}


async function db_chapters_by_section_id(db: StudiesDB, id: EntitySectionId, with_nodes: boolean, limit?: number): Promise<ModelChapter[]> {
    let q_chapters = db.chapters.where('section_id')
        .equals(id)

    if (limit !== undefined) {
        q_chapters = q_chapters.limit(limit)
    }

    let e_chapters = await q_chapters.toArray()


    let chapters: ModelChapter[] = []
    for (let e_chapter of e_chapters) {
        let tree_replay

        if (with_nodes) {
            tree_replay = await db_load_model_play_replay(db, e_chapter.tree_replay_id)
        }

        chapters.push({
            ...e_chapter,
            tree_replay
        })
    }

    return chapters
}

async function db_load_sections(db: StudiesDB, e_sections: EntitySection[], with_nodes: boolean, limit_chapters?: number): Promise<ModelSection[]> {

    let res: ModelSection[] = []
    for (let e_section of e_sections) {

        let chapters = await db_chapters_by_section_id(db, e_section.id, with_nodes, limit_chapters)

        res.push({
            ...e_section,
            chapters
        })
    }
    return res
}

async function db_studies_by_predicate(db: StudiesDB, predicate?: StudiesPredicate): Promise<ModelStudy[]> {
    let res = await (predicate ? db.studies.where('predicate').equals(predicate).toArray() : db.studies.toArray())


    return Promise.all(res.map(_ => db_load_study(db, _.id, false, 5)))
}

async function db_load_study(db: StudiesDB, id: EntityStudyId, with_nodes: boolean, limit_chapters?: number): Promise<ModelStudy> {
    let e_study = await db.studies.get(id)

    if (!e_study) {
        throw new EntityNotFoundError('Study', id)
    }

    let e_sections = await db.sections.where('study_id')
        .equals(e_study.id)
        .toArray()

    let sections = await db_load_sections(db, e_sections, with_nodes, limit_chapters)

    return {
        ...e_study,
        sections
    }
}

async function db_put_repeat_study(db: StudiesDB, entity: EntityRepeatStudyInsert) {
    await db.repeat_studies.put(entity)
}

async function db_get_or_new_repeat_study(db: StudiesDB, study_id: EntityStudyId): Promise<ModelRepeatStudy> {
    let e_res = await db.repeat_studies.where('study_id').equals(study_id).first()

    if (!e_res) {
        let i_res = {
            id: gen_id8(),
            study_id,
            section_ids: []
        }

        await db.repeat_studies.add(i_res)

        return {
            ...i_res,
            sections: []
        }
    }

    let e_sections = await db.sections.where('id').anyOf(e_res.section_ids).toArray()

    let sections = await db_load_sections(db, e_sections, false)

    return {
        ...e_res,
        sections
    }
}

async function db_load_repeat_due_moves(db: StudiesDB, repeat_study_id: EntityRepeatStudyId, sections: EntitySectionId[]): Promise<ModelRepeatDueMove[]> {

    let chapters = await db.chapters.where('section_id')
    .anyOf(sections)
    .toArray()

    let tree_replays = await db.play_uci_tree_replays.where('id')
    .anyOf(chapters.map(_ => _.tree_replay_id))
    .toArray()


    let step_trees = await db.steps_trees.where('id')
    .anyOf(tree_replays.map(_ => _.steps_tree_id))
    .toArray()

    let e_step_tree_nodes = await db.tree_step_nodes.where('tree_id')
    .anyOf(step_trees.map(_ => _.id))
    .toArray()

    let e_existing_due_moves = await db.repeat_due_moves.where('repeat_study_id')
    .equals(repeat_study_id)
    .toArray()


    let res: ModelRepeatDueMove[] = []

    for (let e_step_tree_node of e_step_tree_nodes) {
        let e_existing_due_move = e_existing_due_moves.find(_ => _.tree_step_node_id === e_step_tree_node.id)

        if (e_existing_due_move) {
            res.push({
                id: e_existing_due_move.id,
                repeat_study_id,
                tree_step_node_id: e_step_tree_node.id,
                tree_step_node: e_step_tree_node,
                attempts: [],
                is_saved: true
            })
        } else {
            res.push({
                id: gen_id8(),
                repeat_study_id,
                tree_step_node_id: e_step_tree_node.id,
                tree_step_node: e_step_tree_node,
                attempts: [],
                is_saved: false
            })
        }
    }

    return res
}

async function db_new_repeat_move_attempt(db: StudiesDB, entity: EntityRepeatMoveAttemptInsert) {
    await db.repeat_move_attempts.add(entity)
} 

async function db_load_repeat_move_attempts(db: StudiesDB, due_move_id: EntityRepeatDueMoveId): Promise<ModelRepeatMoveAttempt[]> {
    let e_res = await db.repeat_move_attempts.where('repeat_due_move_id').equals(due_move_id).toArray()

    if (!e_res) {
        throw new EntityNotFoundError("RepeatMoveAttempt", due_move_id)
    }

    return e_res
}

async function db_new_due_move(db: StudiesDB, entity: EntityRepeatDueMoveInsert) {
    await db.repeat_due_moves.add(entity)
}


function new_study_model(): ModelStudy {
    return {
        id: gen_id8(),
        name: 'New Study',
        i_section: 0,
        is_edits_disabled: false,
        sections: [],
        predicate: 'mine'
    }
}

function new_section_model(study_id: EntityStudyId, order: number): ModelSection {
    return {
        id: gen_id8(),
        study_id,
        name: 'New Section',
        i_chapter: 0,
        chapters: [],
        order
    }
}

function new_chapter_model(section_id: EntitySectionId, tree_replay_id: EntityPlayUciTreeReplayId, order: number): ModelChapter {
    return {
        id: gen_id8(),
        tree_replay_id,
        section_id,
        name: 'New Chapter',
        order
    }
}

function new_steps_tree_model(): ModelStepsTree {
    return {
        id: gen_id8(),
        flat_nodes: []
    }
}

function new_tree_replay_model(steps_tree: ModelStepsTree): ModelTreeReplay {
    return {
        id: gen_id8(),
        steps_tree_id: steps_tree.id,
        cursor_path: '',
        steps_tree
    }
}

class StudiesDB extends Dexie {
    studies!: EntityTable<EntityStudy, "id">
    sections!: EntityTable<EntitySection, "id">
    chapters!: EntityTable<EntityChapter, "id">

    play_uci_tree_replays!: EntityTable<EntityPlayUciTreeReplay, "id">
    steps_trees!: EntityTable<EntityStepsTree, "id">
    tree_step_nodes!: EntityTable<EntityTreeStepNode, "id">

    repeat_studies!: EntityTable<EntityRepeatStudy, "id">
    repeat_due_moves!: EntityTable<EntityRepeatDueMove, "id">
    repeat_move_attempts!: EntityTable<EntityRepeatMoveAttempt, "id">

    remove_database() {
        this.delete()
    }


    constructor() {
        super('StudiesDB')


        this.version(1).stores({
            studies: 'id, predicate',
            sections: 'id, study_id',
            chapters: 'id, section_id, tree_replay_id',
            play_uci_tree_replays: 'id, steps_tree_id',
            steps_trees: 'id',
            tree_step_nodes: 'id, tree_id',
            repeat_studies: 'id, study_id',
            repeat_due_moves: 'id, repeat_study_id, tree_step_node_id',
            repeat_move_attempts: 'id, repeat_due_move_id, created_at'
        })


        this.studies.mapToClass(EntityStudy)
        this.sections.mapToClass(EntitySection)
        this.chapters.mapToClass(EntityChapter)

        this.play_uci_tree_replays.mapToClass(EntityPlayUciTreeReplay)
        this.steps_trees.mapToClass(EntityStepsTree)
        this.tree_step_nodes.mapToClass(EntityTreeStepNode)

        this.repeat_studies.mapToClass(EntityRepeatStudy)
        this.repeat_due_moves.mapToClass(EntityRepeatDueMove)
    }
}

export type EntityStudyId = string
export type EntitySectionId = string
export type EntityChapterId = string

export type EntityStudyInsert = InsertType<EntityStudy, "id">
export type EntitySectionInsert = InsertType<EntitySection, "id">
export type EntityChapterInsert = InsertType<EntityChapter, "id">

class EntityStudy extends Entity<StudiesDB> {
    id!: EntityStudyId
    name!: string
    i_section!: number
    is_edits_disabled!: boolean
    predicate!: StudiesPredicate
}
class EntitySection extends Entity<StudiesDB> {
    id!: EntitySectionId
    study_id!: EntityStudyId
    name!: string
    order!: number
    i_chapter!: number
}
class EntityChapter extends Entity<StudiesDB> {
    id!: EntityChapterId
    section_id!: EntitySectionId
    tree_replay_id!: EntityPlayUciTreeReplayId
    name!: string
    order!: number
}

export type EntityStepsTreeId = string
export type EntityTreeStepNodeId = string
export type EntityPlayUciTreeReplayId = string

export type EntityStepsTreeInsert = InsertType<EntityStepsTree, "id">
export type EntityTreeStepNodeInsert = InsertType<EntityTreeStepNode, "id">
export type EntityPlayUciTreeReplayInsert = InsertType<EntityPlayUciTreeReplay, "id">


class EntityPlayUciTreeReplay extends Entity<StudiesDB> {
    id!: EntityPlayUciTreeReplayId
    steps_tree_id!: EntityStepsTreeId
    cursor_path!: Path
}


class EntityStepsTree extends Entity<StudiesDB> {
    id!: EntityStepsTreeId
}

class EntityTreeStepNode extends Entity<StudiesDB> {
    id!: EntityTreeStepNodeId
    tree_id!: EntityStepsTreeId
    step!: Step
    nags!: NAG[]
    order!: number
}

export type EntityRepeatStudyId = string
export type EntityRepeatStudyInsert = InsertType<EntityRepeatStudy, "id">


export type EntityRepeatDueMoveId = string
export type EntityRepeatDueMoveInsert = InsertType<EntityRepeatDueMove, "id">

export type EntityRepeatMoveAttemptId = string
export type EntityRepeatMoveAttemptInsert = InsertType<EntityRepeatMoveAttempt, "id">

class EntityRepeatStudy extends Entity<StudiesDB> {
    id!: EntityRepeatStudyId
    study_id!: EntityStudyId
    section_ids!: EntitySectionId[]
}

class EntityRepeatDueMove extends Entity<StudiesDB> {
    id!: EntityRepeatDueMoveId
    repeat_study_id!: EntityRepeatStudyId
    tree_step_node_id!: EntityTreeStepNodeId
}

class EntityRepeatMoveAttempt extends Entity<StudiesDB> {
    id!: EntityRepeatMoveAttemptId
    repeat_due_move_id!: EntityRepeatDueMoveId
    created_at!: number
    card!: Card
    attempt_result!: RepeatAttemptResult
}


export type ModelStudy = EntityStudyInsert & {
    id: EntityStudyId,
    sections: ModelSection[]
}

export type ModelSection = EntitySectionInsert & {
    id: EntitySectionId,
    chapters: ModelChapter[]
}

export type ModelChapter = EntityChapterInsert & {
    id: EntityChapterId,
    tree_replay?: ModelTreeReplay
}

export type ModelTreeReplay = EntityPlayUciTreeReplayInsert & {
    id: EntityPlayUciTreeReplayId,
    steps_tree: ModelStepsTree
}

export type ModelStepsTree = EntityStepsTreeInsert & {
    id: EntityStepsTreeId,
    flat_nodes: ModelTreeStepNode[]
}

export type ModelTreeStepNode = EntityTreeStepNodeInsert & {
    id: EntityTreeStepNodeId,
}

export type ModelRepeatStudy = EntityRepeatStudyInsert & {
    id: EntityRepeatStudyId,
    sections: ModelSection[]
    due_moves?: ModelRepeatDueMove[]
}

export type ModelRepeatDueMove = EntityRepeatDueMoveInsert & {
    id: EntityRepeatDueMoveId,
    tree_step_node: ModelTreeStepNode,
    attempts: ModelRepeatMoveAttempt[],
    is_saved: boolean
}

export type ModelRepeatMoveAttempt = EntityRepeatMoveAttemptInsert & {
    id: EntityRepeatMoveAttemptId,
}

export const StudiesDBContext = createContext<StudiesDBReturn>()


export type StudiesPredicate = "mine" | "auto" | "featured"

export type StudiesDBReturn = {

    get_chapter_by_id(id: EntityChapterId): Promise<ModelChapter>;
    get_chapters_by_section_id(id: string): Promise<ModelChapter[]>;

    get_study_by_id(id: EntityStudyId): Promise<ModelStudy>,
    get_studies_by_predicate(predicate: StudiesPredicate): Promise<ModelStudy[]>;
    get_studies(): Promise<ModelStudy[]>;

    new_study(): Promise<ModelStudy>
    new_section(study_id: EntityStudyId, order: number): Promise<ModelSection>
    new_chapter(section_id: EntitySectionId, order: number): Promise<ModelChapter>

    update_study(study: EntityStudyInsert): Promise<void>
    update_section(section: EntitySectionInsert): Promise<void>
    update_chapter(chapter: EntityChapterInsert): Promise<void>
    delete_study(id: EntityStudyId): Promise<void>
    delete_section(section: EntitySectionId): Promise<void>
    delete_chapter(chapter: EntityChapterId): Promise<void>

    /*
    new_play_uci_tree_replay(): Promise<ModelTreeReplay>
    new_steps_tree(): Promise<ModelStepsTree>
    new_tree_step_node(node: ModelTreeStepNode): Promise<void>
    */

    update_play_uci_tree_replay(entity: EntityPlayUciTreeReplayInsert): Promise<void>
    update_tree_step_node(entity: EntityTreeStepNodeInsert): Promise<void>
    delete_tree_nodes(nodes: ModelTreeStepNode[]): Promise<void>;

    new_section_from_model(model: ModelSection): Promise<void>;
    new_chapter_from_model(model: ModelChapter): Promise<void>;

    put_repeat_study_sections(entity: EntityRepeatStudyInsert): Promise<void>;
    get_or_new_repeat_study(study_id: EntityStudyId): Promise<ModelRepeatStudy>;
    load_repeat_due_moves(repeat_study_id: EntityRepeatStudyId, sections: EntitySectionId[]): Promise<ModelRepeatDueMove[]>

  /*  play_replay_by_steps_tree_id(steps_tree_id: EntityStepsTreeId): Promise<ModelTreeReplay> */



    add_repeat_move_attempt(entity: EntityRepeatMoveAttemptInsert): Promise<void>
    load_repeat_move_attempts(due_move_id: EntityRepeatDueMoveId): Promise<ModelRepeatMoveAttempt[]>

    new_due_move(due_move: EntityRepeatDueMoveInsert): Promise<void>;
}

export const StudiesDBProvider = (props: { children: JSX.Element }) => {

    let db = new StudiesDB()


    let res: StudiesDBReturn = {
        async new_study() { 
            let model = new_study_model()
            await db_new_study(db, model) 
            return model
        },
        async new_section(study_id: EntityStudyId, order: number) { 
            let model = new_section_model(study_id, order)
            await db_new_section(db, model) 
            return model
        },
        async new_chapter(section_id: EntitySectionId, order: number) { 
            return db.transaction('rw', [db.steps_trees, db.play_uci_tree_replays, db.chapters], async () => {
                let steps_tree_model = new_steps_tree_model()
                await db_new_steps_tree(db, steps_tree_model)

                let tree_replay_model = new_tree_replay_model(steps_tree_model)
                await db_new_tree_replay(db, tree_replay_model)

                let model = new_chapter_model(section_id, tree_replay_model.id, order)
                await db_new_chapter(db, model)
                return model
            })
        },

        get_chapter_by_id(id: EntityChapterId) {
            return db_load_model_chapter(db, id)
        },

        get_chapters_by_section_id(id: EntitySectionId) {
            return db_chapters_by_section_id(db, id, true)
        },

        get_studies_by_predicate(predicate: StudiesPredicate): Promise<ModelStudy[]> {
            return db_studies_by_predicate(db, predicate)

        },
        get_studies(): Promise<ModelStudy[]> {
            return db_studies_by_predicate(db)
        },
        get_study_by_id(id: EntityStudyId, with_nodes = true, limit_chapters?: number) {
            return db_load_study(db, id, with_nodes, limit_chapters)
        },

        update_study(study: EntityStudyInsert) {
            return db_update_study(db, study)
        },
        update_section(section: EntitySectionInsert) {
            return db_update_section(db, section)
        },
        update_chapter(chapter: EntityChapterInsert) {
            return db_update_chapter(db, chapter)
        },
        delete_chapter(id: EntityChapterId) {
            return db_delete_chapter(db, id)
        },
        delete_section(id: EntitySectionId) {
            return db_delete_section(db, id)
        },
        delete_study(id: EntityStudyId) {
            return db_delete_study(db, id)
        },

        update_play_uci_tree_replay(entity: EntityPlayUciTreeReplayInsert) {
            return db_update_tree_replay(db, entity)
        },
        update_tree_step_node(entity: EntityTreeStepNode) {
            return db_update_tree_step_node(db, entity)
        },

        delete_tree_nodes(nodes: ModelTreeStepNode[]) {
            return db_delete_tree_nodes(db, nodes)
        },
        new_section_from_model(model: ModelSection): Promise<void> {
            return db_new_section(db, model)
        },
        new_chapter_from_model(entity: ModelChapter): Promise<void> {
            return db_new_chapter(db, entity)
        },
        put_repeat_study_sections(entity: EntityRepeatStudyInsert) {
            return db_put_repeat_study(db, entity)
        },
        get_or_new_repeat_study(study_id: EntityStudyId) {
            return db_get_or_new_repeat_study(db, study_id)
        },
        load_repeat_due_moves(repeat_study_id: EntityRepeatStudyId, sections: EntitySectionId[]) {
            return db_load_repeat_due_moves(db, repeat_study_id, sections)
        },
        /*
        play_replay_by_steps_tree_id(steps_tree_id: EntityStepsTreeId) {
            return db_play_replay_by_steps_tree_id(db, steps_tree_id)
        },
        */
        add_repeat_move_attempt(entity: EntityRepeatMoveAttemptInsert) {
                return db_new_repeat_move_attempt(db, entity) 
        },
        load_repeat_move_attempts(due_move_id: EntityRepeatDueMoveId) {
            return db_load_repeat_move_attempts(db, due_move_id)
        },
        new_due_move(due_move: EntityRepeatDueMoveInsert) {
            return db_new_due_move(db, due_move)
        }
    }

    return (<>
        <StudiesDBContext.Provider value={res}>
            {props.children}
        </StudiesDBContext.Provider></>)
}

class EntityNotFoundError extends Error {

    constructor(readonly entity: string, readonly id?: string) {
        super(`DB ${entity}${id?(' by id ' + id) : ''} not found.`)
    }
}
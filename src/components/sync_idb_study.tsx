import Dexie, { Entity, EntityTable, InsertType } from "dexie";
import { createContext, JSX } from "solid-js";
import { parent_path, Path, Step } from "./step_types";
import { Card } from "ts-fsrs";
import { RepeatAttemptResult } from "./repeat_types";
import { PGN } from "../components2/parse_pgn";

export function gen_id8() {
    return Math.random().toString(16).slice(2, 12)
}

async function db_new_study(db: StudiesDB, entity: EntityStudyInsert) {
    await db.studies.add(entity)
}

async function db_new_section(db: StudiesDB, entity: EntitySectionInsert) {
    db.transaction('rw', [db.studies, db.sections], async () => {

        let e_study = await db_get_study(db, entity.study_id)

        e_study.section_ids.push(entity.id!)
        await db_update_study(db, e_study)

        return await db.sections.add(entity)
    })
}

async function db_new_chapter(db: StudiesDB, entity: EntityChapterInsert) {
    await db.transaction('rw', [db.sections, db.chapters], async () => {

        let e_section = await db_get_section(db, entity.section_id)

        e_section.chapter_ids.push(entity.id!)
        await db_update_section(db, e_section)

        return await db.chapters.add(entity)
    })
}

async function db_new_steps_tree(db: StudiesDB, entity: EntityStepsTreeInsert) {
    await db.steps_trees.add(entity)
}

async function db_new_tree_replay(db: StudiesDB, entity: EntityPlayUciTreeReplayInsert) {
    await db.play_uci_tree_replays.add(entity)
}

async function db_get_chapter(db: StudiesDB, id: EntityChapterId) {
    let res = await db.chapters.get(id)

    if (!res) {
        throw new EntityNotFoundError("Chapter", id)
    }
    return res
}



async function db_get_section(db: StudiesDB, id: EntitySectionId) {
    let res = await db.sections.get(id)

    if (!res) {
        throw new EntityNotFoundError("Section", id)
    }
    return res
}



async function db_get_study(db: StudiesDB, id: EntityStudyId) {
    let res = await db.studies.get(id)

    if (!res) {
        throw new EntityNotFoundError("Study", id)
    }
    return res
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
    db.transaction('rw', [db.studies, db.sections, db.chapters], async () => {

        let section = await db_get_section(db, id)
        let study = await db_get_study(db, section.study_id)
        study.section_ids.splice(study.section_ids.indexOf(id), 1)
        await db_update_study(db, study)

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
    db.transaction('rw', [db.play_uci_tree_replays, db.sections, db.chapters], async () => {
        let chapter = await db_get_chapter(db, id)
        let section = await db_get_section(db, chapter.section_id)
        section.chapter_ids.splice(section.chapter_ids.indexOf(id), 1)
        await db_update_section(db, section)

        await db.chapters.delete(id)
        await db_delete_chapter_rest(db, chapter)
    })
}

async function db_delete_chapter_rest(db: StudiesDB, entity: EntityChapterInsert) {
    let tree_replay = await db.play_uci_tree_replays.where('id').equals(entity.tree_replay_id).first()
    if (!tree_replay) {
        throw new EntityNotFoundError('TreeReplay', entity.tree_replay_id)
    }
    db.play_uci_tree_replays.delete(tree_replay.id)
}


async function db_update_tree_replay(db: StudiesDB, entity: EntityPlayUciTreeReplayInsert) {
    await db.play_uci_tree_replays.update(entity.id!, entity)
}

async function db_update_tree_step_node(db: StudiesDB, entity: EntityTreeStepNodeInsert) {
    await db.tree_step_nodes.update(entity.id!, entity)
}

async function db_chapters_by_section_id(db: StudiesDB, section_id: EntitySectionId) {
    let section = await db_get_section(db, section_id)
    let res = await db.chapters.where('section_id').equals(section_id).toArray()
    return section.chapter_ids.map(_ => res.find(c => c.id === _)!)
}

async function db_chapter_by_id(db: StudiesDB, id: EntityChapterId): Promise<ModelChapter> {

    let e_chapter = await db.chapters.where('id').equals(id).first()

    if (!e_chapter) {
        throw new EntityNotFoundError('Chapter', id)
    }

    return e_chapter
}

async function db_replay_tree_by_chapter_id(db: StudiesDB, id: EntityChapterId): Promise<ModelReplayTree> {
    let chapter = await db_get_chapter(db, id)
    return db_replay_tree_by_id(db, chapter.tree_replay_id)
}

async function db_replay_tree_by_id(db: StudiesDB, id: EntityPlayUciTreeReplayId): Promise<ModelReplayTree> {
    let e_replay = await db.play_uci_tree_replays.where('id').equals(id).first()

    if (!e_replay) {
        throw new EntityNotFoundError('Play Uci Tree Replay', id)
    }

    let e_steps = await db.steps_trees.where('id').equals(e_replay.steps_tree_id).first()

    if (!e_steps) {
        throw new EntityNotFoundError('Steps Tree', id)
    }

    let nodes = await db.tree_step_nodes.where('tree_id').equals(e_steps.id).toArray()

    let flat_nodes: Record<Path, ModelTreeStepNode[]> = {}

    nodes.forEach(node => {
        let res = flat_nodes[parent_path(node.step.path)]
        if (res === undefined) {
            res = []
            flat_nodes[parent_path(node.step.path)] = res
        }

        res.push(node)
    })


    for (let path of Object.keys(flat_nodes)) {
        let order = await db.tree_step_node_order_for_paths
        .where('tree_id').equals(e_steps.id)
        .and(_ => _.path === path)
        .first()
        if (order !== undefined) {
            flat_nodes[path] = order.order.map(id => {
                let res = flat_nodes[path].find(_ => _.id === id)
                if (!res) {
                    throw new Error("Ordered Tree Step Node Not Found " + id)
                }
                return res
            })
        }
    }

    let steps_tree: ModelStepsTree = {
        ...e_steps,
        flat_nodes
    }

    return {
        ...e_replay,
        steps_tree
    }
}

async function db_studies_model_by_predicate(db: StudiesDB, predicate?: StudiesPredicate): Promise<ModelStudy[]> {
    let res = await (predicate ? db.studies.where('predicate').equals(predicate).toArray() : db.studies.toArray())

    return Promise.all(res.map(_ => db_load_study_model(db, _.id, 5)))
}

async function db_load_sections_model(db: StudiesDB, e_sections: EntitySectionInsert[], limit_chapters?: number): Promise<ModelSection[]> {

    let res: ModelSection[] = []
    for (let e_section of e_sections) {
        let q = await db.chapters.where('section_id').equals(e_section.id!)

        if (limit_chapters)
            q = q.limit(limit_chapters)
        
        let chapters = await q.toArray()

        res.push({
            id: e_section.id!,
            ...e_section,
            chapters
        })
    }

    return res
}

async function db_load_study_model(db: StudiesDB, id: EntityStudyId, limit_chapters?: number): Promise<ModelStudy> {
    let e_study = await db.studies.get(id)

    if (!e_study) {
        throw new EntityNotFoundError('Study', id)
    }

    let e_sections = await db.sections.where('study_id')
        .equals(e_study.id)
        .toArray()

    let u_sections = await db_load_sections_model(db, e_sections, limit_chapters)

    let sections = e_study.section_ids.map(id => u_sections.find(_ => _.id === id)!)

    return {
        ...e_study,
        sections
    }
}

async function db_order_sections(db: StudiesDB, study_id: EntityStudyId, section_id: EntitySectionId, new_order: number) {
    let study = await db_get_study(db, study_id)

    let old_order = study.section_ids.indexOf(section_id)

    if (old_order === -1) {
        throw new Error("Section not found in study.section_ids " + section_id)
    }

    study.section_ids.splice(old_order, 1)
    study.section_ids.splice(new_order, 0, section_id)

    await db_update_study(db, study)
}

async function db_order_chapters(db: StudiesDB, section_id: EntitySectionId, chapter_id: EntityChapterId, new_order: number) {
    let section = await db_get_section(db, section_id)

    let old_order = section.chapter_ids.indexOf(chapter_id)

    if (old_order === -1) {
        throw new Error("Chapter not found in section.chapter_ids " + chapter_id)
    }

    section.chapter_ids.splice(old_order, 1)
    section.chapter_ids.splice(new_order, 0, chapter_id)

    await db_update_section(db, section)
}

async function db_new_tree_steps_node(db: StudiesDB, tree_id: EntityStepsTreeId, step: Step) {
    let node = {
        id: gen_id8(),
        step,
        tree_id,
    }

    db.transaction('rw', [db.tree_step_node_order_for_paths, db.tree_step_nodes], async () => {
        await db_new_tree_step_node_orders(db, [node])
        await db.tree_step_nodes.add(node)
    })
    return node
}

async function db_new_tree_steps_nodes(db: StudiesDB, tree_id: EntityStepsTreeId, steps: Record<Path, Step[]>) {
    let nodes: EntityTreeStepNodeInsert[] = []

    for (let path of Object.keys(steps)) {
        let i_steps = steps[path]
        let nn = []
        for (let step of i_steps) {
            nn.push({
                id: gen_id8(),
                step,
                tree_id
            })
        }

        if (nn.length > 1) {
            await db_new_tree_step_node_orders(db, nn)
        }
        nodes.push(...nn)
    }

    await db.tree_step_nodes.bulkAdd(nodes)
}

async function db_new_tree_step_node_orders(db: StudiesDB, nodes: EntityTreeStepNodeInsert[]) {
    let path = parent_path(nodes[0].step.path)
    const tree_id = nodes[0].tree_id

    let order = await db.tree_step_node_order_for_paths
    .where('tree_id').equals(tree_id)
    .and(_ => _.path === path)
    .first()

    if (!order) {
        await db.tree_step_node_order_for_paths.add({
            id: gen_id8(),
            tree_id: nodes[0].tree_id,
            path,
            order: nodes.map(_ => _.id!)
        })
    } else {
        let new_order = [...order.order, ...nodes.map(_ => _.id!)]
        await db.tree_step_node_order_for_paths.update(order.id, {
            order: new_order
        })
    }
}

async function db_delete_tree_nodes(db: StudiesDB, node_ids: EntityTreeStepNodeId[]) {
    await db.tree_step_nodes.bulkDelete(node_ids)
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

    let sections = await db_load_sections_model(db, e_sections)

    return {
        ...e_res,
        sections
    }
}

async function db_load_repeat_due_moves_model(db: StudiesDB, repeat_study_id: EntityRepeatStudyId, sections: EntitySectionId[]): Promise<ModelRepeatDueMove[]> {

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

async function db_load_repeat_move_attempts_model(db: StudiesDB, due_move_id: EntityRepeatDueMoveId): Promise<ModelRepeatMoveAttempt[]> {
    let e_res = await db.repeat_move_attempts.where('repeat_due_move_id').equals(due_move_id).toArray()

    if (!e_res) {
        throw new EntityNotFoundError("RepeatMoveAttempt", due_move_id)
    }

    return e_res
}

async function db_new_due_move(db: StudiesDB, entity: EntityRepeatDueMoveInsert) {
    await db.repeat_due_moves.add(entity)
}


function new_study_entity(): EntityStudyInsert {
    return {
        id: gen_id8(),
        name: 'New Study',
        is_edits_disabled: false,
        predicate: 'mine',
        section_ids: []
    }
}

function new_section_entity(study_id: EntityStudyId, name = 'New Section'): EntitySectionInsert {
    return {
        id: gen_id8(),
        study_id,
        name,
        chapter_ids: []
    }
}

function new_chapter_entity(section_id: EntitySectionId, tree_replay_id: EntityPlayUciTreeReplayId, name = 'New Chapter'): EntityChapterInsert {
    return {
        id: gen_id8(),
        tree_replay_id,
        section_id,
        name
    }
}

function new_steps_tree_entity(): EntityStepsTreeInsert {
    return {
        id: gen_id8()
    }
}

function new_tree_replay_entity(steps_tree_id: EntityStepsTreeId): EntityPlayUciTreeReplayInsert {
    return {
        id: gen_id8(),
        steps_tree_id,
        cursor_path: '',
    }
}

class StudiesDB extends Dexie {
    studies!: EntityTable<EntityStudy, "id">
    sections!: EntityTable<EntitySection, "id">
    chapters!: EntityTable<EntityChapter, "id">

    play_uci_tree_replays!: EntityTable<EntityPlayUciTreeReplay, "id">
    steps_trees!: EntityTable<EntityStepsTree, "id">
    tree_step_nodes!: EntityTable<EntityTreeStepNode, "id">
    tree_step_node_order_for_paths!: EntityTable<EntityTreeStepNodeOrderForPath, "id">

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
            repeat_move_attempts: 'id, repeat_due_move_id, created_at',
            tree_step_node_order_for_paths: 'id, tree_id, path'
        })


        this.studies.mapToClass(EntityStudy)
        this.sections.mapToClass(EntitySection)
        this.chapters.mapToClass(EntityChapter)

        this.play_uci_tree_replays.mapToClass(EntityPlayUciTreeReplay)
        this.steps_trees.mapToClass(EntityStepsTree)
        this.tree_step_nodes.mapToClass(EntityTreeStepNode)
        this.tree_step_node_order_for_paths.mapToClass(EntityTreeStepNodeOrderForPath)

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

export class EntityStudy extends Entity<StudiesDB> {
    id!: EntityStudyId
    name!: string
    is_edits_disabled!: boolean
    predicate!: StudiesPredicate
    selected_section_id?: EntitySectionId
    section_ids!: EntitySectionId[]
}
export class EntitySection extends Entity<StudiesDB> {
    id!: EntitySectionId
    study_id!: EntityStudyId
    name!: string
    selected_chapter_id?: EntityChapterId
    chapter_ids!: EntityChapterId[]
}
export class EntityChapter extends Entity<StudiesDB> {
    id!: EntityChapterId
    section_id!: EntitySectionId
    tree_replay_id!: EntityPlayUciTreeReplayId
    name!: string
}

export type EntityStepsTreeId = string
export type EntityTreeStepNodeId = string
export type EntityPlayUciTreeReplayId = string

export type EntityStepsTreeInsert = InsertType<EntityStepsTree, "id">
export type EntityTreeStepNodeInsert = InsertType<EntityTreeStepNode, "id">
export type EntityPlayUciTreeReplayInsert = InsertType<EntityPlayUciTreeReplay, "id">


export type EntityTreeStepNodeOrderForPathId = string

export type EntityTreeStepNodeOrderForPathInsert = InsertType<EntityTreeStepNodeOrderForPath, "id">

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
}


class EntityTreeStepNodeOrderForPath extends Entity<StudiesDB> {
    id!: EntityTreeStepNodeOrderForPathId
    tree_id!: EntityStepsTreeId
    path!: Path
    order!: EntityTreeStepNodeId[]
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
}

export type ModelReplayTree = EntityPlayUciTreeReplayInsert & {
    id: EntityPlayUciTreeReplayId,
    steps_tree: ModelStepsTree
}

export type ModelStepsTree = EntityStepsTreeInsert & {
    id: EntityStepsTreeId,
    flat_nodes: Record<Path, ModelTreeStepNode[]>
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
    new_section(study_id: EntityStudyId, name?: string): Promise<ModelSection>
    new_chapter(section_id: EntitySectionId, name?: string, pgn?: PGN): Promise<ModelChapter>

    update_study(study: EntityStudyInsert): Promise<void>
    update_section(section: EntitySectionInsert): Promise<void>
    update_chapter(chapter: EntityChapterInsert): Promise<void>

    order_sections(study_id: EntityStudyId, section_id: EntitySectionId, order: number): Promise<void>
    order_chapters(section_id: EntitySectionId, chapter_id: EntityChapterId, order: number): Promise<void>

    delete_study(id: EntityStudyId): Promise<void>
    delete_section(section: EntitySectionId): Promise<void>
    delete_chapter(chapter: EntityChapterId): Promise<void>

    /*
    new_play_uci_tree_replay(): Promise<ModelTreeReplay>
    new_steps_tree(): Promise<ModelStepsTree>
    */

    new_tree_step_node(tree_id: EntityStepsTreeId, step: Step, order?: number): Promise<ModelTreeStepNode>

    get_replay_tree_by_chapter_id(id: EntityChapterId): Promise<ModelReplayTree>

    update_play_uci_tree_replay(entity: EntityPlayUciTreeReplayInsert): Promise<void>
    update_tree_step_node(entity: EntityTreeStepNodeInsert): Promise<void>
    delete_tree_nodes(nodes: EntityTreeStepNodeId[]): Promise<void>;

    put_repeat_study_sections(entity: EntityRepeatStudyInsert): Promise<void>;
    get_or_new_repeat_study(study_id: EntityStudyId): Promise<ModelRepeatStudy>;
    load_repeat_due_moves(repeat_study_id: EntityRepeatStudyId, sections: EntitySectionId[]): Promise<ModelRepeatDueMove[]>

    add_repeat_move_attempt(entity: EntityRepeatMoveAttemptInsert): Promise<void>
    load_repeat_move_attempts(due_move_id: EntityRepeatDueMoveId): Promise<ModelRepeatMoveAttempt[]>

    new_due_move(due_move: EntityRepeatDueMoveInsert): Promise<void>;
}

export const StudiesDBProvider = (props: { children: JSX.Element }) => {

    let db = new StudiesDB()


    let res: StudiesDBReturn = {
        async new_study() { 
            let entity = new_study_entity()
            await db_new_study(db, entity) 
            return {
                id: entity.id!,
                ...entity,
                sections: []
            }
        },
        async new_section(study_id: EntityStudyId, name?: string) { 
            let entity = new_section_entity(study_id, name)
            await db_new_section(db, entity) 
            return {
                id: entity.id!,
                ...entity,
                chapters: []
            }
        },
        async new_chapter(section_id: EntitySectionId, name?: string, pgn?: PGN) { 
            return db.transaction('rw', [db.tree_step_node_order_for_paths, db.tree_step_nodes, db.steps_trees, db.play_uci_tree_replays, db.sections, db.chapters], async () => {

                let steps_tree_entity = new_steps_tree_entity()
                await db_new_steps_tree(db, steps_tree_entity)

                if (pgn) {
                    await db_new_tree_steps_nodes(db, steps_tree_entity.id!, pgn.flat_steps)
                }

                let tree_replay_entity = new_tree_replay_entity(steps_tree_entity.id!)
                await db_new_tree_replay(db, tree_replay_entity)

                let entity = new_chapter_entity(section_id, tree_replay_entity.id!, name)
                await db_new_chapter(db, entity)
                return {
                    id: entity.id!,
                    ...entity,
                }
            })
        },

        get_chapter_by_id(id: EntityChapterId) {
            return db_chapter_by_id(db, id)
        },

        get_chapters_by_section_id(id: EntitySectionId) {
            return db_chapters_by_section_id(db, id)
        },

        get_studies_by_predicate(predicate: StudiesPredicate): Promise<ModelStudy[]> {
            return db_studies_model_by_predicate(db, predicate)

        },
        get_studies(): Promise<ModelStudy[]> {
            return db_studies_model_by_predicate(db)
        },
        get_study_by_id(id: EntityStudyId, limit_chapters?: number) {
            return db_load_study_model(db, id, limit_chapters)
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
        order_sections(study_id: EntityStudyId, section_id: EntitySectionId, order: number) {
            return db_order_sections(db, study_id, section_id, order)
        },
        order_chapters(section_id: EntitySectionId, chapter_id: EntityChapterId, order: number) {
            return db_order_chapters(db, section_id, chapter_id, order)
        },
        get_replay_tree_by_chapter_id(id: EntityChapterId) {
            return db_replay_tree_by_chapter_id(db, id)
        },
        update_play_uci_tree_replay(entity: EntityPlayUciTreeReplayInsert) {
            return db_update_tree_replay(db, entity)
        },
        async new_tree_step_node(tree_id: EntityStepsTreeId, step: Step) {
            return await db_new_tree_steps_node(db, tree_id, step)
        },
        update_tree_step_node(entity: EntityTreeStepNode) {
            return db_update_tree_step_node(db, entity)
        },
        delete_tree_nodes(node_ids: EntityTreeStepNodeId[]) {
            return db_delete_tree_nodes(db, node_ids)
        },

        put_repeat_study_sections(entity: EntityRepeatStudyInsert) {
            return db_put_repeat_study(db, entity)
        },
        get_or_new_repeat_study(study_id: EntityStudyId) {
            return db_get_or_new_repeat_study(db, study_id)
        },
        load_repeat_due_moves(repeat_study_id: EntityRepeatStudyId, sections: EntitySectionId[]) {
            return db_load_repeat_due_moves_model(db, repeat_study_id, sections)
        },
        add_repeat_move_attempt(entity: EntityRepeatMoveAttemptInsert) {
                return db_new_repeat_move_attempt(db, entity) 
        },
        load_repeat_move_attempts(due_move_id: EntityRepeatDueMoveId) {
            return db_load_repeat_move_attempts_model(db, due_move_id)
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
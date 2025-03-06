import Dexie, { Entity, EntityTable, InsertType } from "dexie";
import { Chapter, Section, Study } from "./StudyComponent";
import { createContext, JSX } from "solid-js";
import { NAG, Path, Step } from "./step_types";
import { PGN, PlayUciTreeReplay, StepsTree, TreeStepNode } from "./ReplayTreeComponent";
import { RepeatAttemptResult, RepeatDueMove, RepeatMoveAttempt, RepeatStudy } from "../views/repetition/types";
import { Card } from "ts-fsrs";
import { _alekhine } from "../Chesstree2";


async function db_new_play_uci_tree_replay(db: StudiesDB, tree?: StepsTree) {
    if (!tree) {
        tree = StepsTree(gen_id8())
    }
    await db.steps_trees.add(tree.entity)


    let new_replay = PlayUciTreeReplay(gen_id8(), tree)
    await db.play_uci_tree_replays.add(new_replay.entity)
    return new_replay
}
async function db_new_steps_tree(db: StudiesDB) {
    let new_tree = StepsTree(gen_id8())
    await db.steps_trees.add(new_tree.entity)
    return new_tree
}
async function db_new_tree_step_node(db: StudiesDB, node: TreeStepNode) {
    await db.tree_step_nodes.add(node.entity)
}

export function gen_id8() {
    return Math.random().toString(16).slice(2, 12)
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



async function db_delete_study(db: StudiesDB, study: Study) {
    await db.studies.delete(study.id)

    db.sections.bulkDelete(study.sections.map(_ => _.id))
    db.chapters.bulkDelete(study.sections.flatMap(_ => _.chapters.map(_ => _.id)))
}
async function db_delete_section(db: StudiesDB, section: Section) {
    await db.sections.delete(section.id)
    db.chapters.bulkDelete(section.chapters.map(_ => _.id))
}
async function db_delete_chapter(db: StudiesDB, chapter: Chapter) {
    await db.chapters.delete(chapter.id)
}

async function db_new_study(db: StudiesDB) {
    let new_study = Study(gen_id8())
    await db.studies.add(new_study.entity)
    return new_study
}

async function db_new_section(db: StudiesDB, study_id: EntityStudyId) {
    let new_section = Section(gen_id8(), study_id)
    await db.sections.add(new_section.entity)
    return new_section
}


async function db_new_chapter(db: StudiesDB, section_id: EntitySectionId) {
    let play_replay = await db_new_play_uci_tree_replay(db)
    let new_chapter = Chapter(gen_id8(), section_id, play_replay)
    await db.chapters.add(new_chapter.entity)
    return new_chapter
}

async function db_load_chapter(db: StudiesDB, e_chapter: EntityChapterInsert) {
    let play_replay = await db_load_play_replay(db, e_chapter.tree_replay_id)

    if (!play_replay) {
        return undefined
    }

    let res = Chapter(e_chapter.id!, e_chapter.section_id, play_replay)
    res.set_entity(e_chapter)
    return res
}

async function db_load_play_replay(db: StudiesDB, id: EntityPlayUciTreeReplayId) {
    let e_replay = await db.play_uci_tree_replays.where('id').equals(id).first()

    if (!e_replay) {
        return undefined
    }

    let e_steps = await db.steps_trees.where('id').equals(e_replay.steps_tree_id).first()

    if (!e_steps) {
        return undefined
    }


    let steps = StepsTree(e_steps.id)


    let nodes = await db.tree_step_nodes.where('tree_id').equals(e_steps.id).toArray()

    nodes.sort((a, b) => {
        let res = a.step.path.length - b.step.path.length
        if (res === 0) {
            res = a.order - b.order
        }
        return res
    })
    nodes.forEach(e_node => {
        let node = TreeStepNode(e_node.id, e_node.tree_id, e_node.step, e_node.order)
        node.set_entity(e_node)
        steps.add_load_node(node)
    })

    let res = PlayUciTreeReplay(e_replay.id!, steps)
    res.set_entity(e_replay)
    return res
}

async function db_delete_tree_nodes(db: StudiesDB, nodes: TreeStepNode[]) {
    await db.tree_step_nodes.bulkDelete(nodes.map(_ => _.id))
}

async function db_update_tree_replay(db: StudiesDB, entity: EntityPlayUciTreeReplayInsert) {
    await db.play_uci_tree_replays.update(entity.id!, entity)
}
async function db_update_tree_step_node(db: StudiesDB, entity: EntityTreeStepNodeInsert) {
    await db.tree_step_nodes.update(entity.id!, entity)
}

async function db_new_section_with_name(db: StudiesDB, id: EntityStudyId, name: string, order: number): Promise<Section> {
    let new_section = Section(gen_id8(), id)
    new_section.set_name(name)
    new_section.set_order(order)

    await db.sections.add(new_section.entity)
    return new_section
}

async function db_new_chapter_from_pgn(db: StudiesDB, section_id: EntitySectionId, chapter_name: string, pgn: PGN, order: number): Promise<Chapter> {
    let play_replay = await db_new_play_uci_tree_replay_from_pgn(db, pgn)
    let new_chapter = Chapter(gen_id8(), section_id, play_replay)
    new_chapter.set_name(chapter_name)
    new_chapter.set_order(order)
    await db.chapters.add(new_chapter.entity)
    return new_chapter
}



async function db_new_play_uci_tree_replay_from_pgn(db: StudiesDB, pgn: PGN): Promise<PlayUciTreeReplay> {
    let play_replay = await db_new_play_uci_tree_replay(db, pgn.tree)

    let nodes = pgn.tree.root.flatMap(_ => [_, ..._.all_sub_children])

    await db.tree_step_nodes.bulkAdd(nodes.map(_ => _.entity))

    return play_replay
}


async function db_study_by_id(db: StudiesDB, id: EntityStudyId): Promise<Study> {
    let e_study = await db.studies.get(id)

    if (!e_study) {
        throw new Error("No Study by given " + id)
    }


    let study = Study(id)
    study.set_entity(e_study)

    let sections = (await db.sections.where('study_id').equals(id).toArray()).map(e_section => {
        let section = Section(e_section.id, id)
        section.set_entity(e_section)

        study.add_section(section)
        
        return section
    })

    study.sort_sections()

    sections.map(async section => {
        await Promise.all((await db.chapters.where('section_id').equals(section.id).toArray()).map(async e_chapter => {
            let res = await db_load_chapter(db, e_chapter)
            if (!res) {
                // TODO handle
                return
            }
            section.add_chapter(res)
        }))
        section.sort_chapters()
    })


    return study
}

async function db_list_studies(db: StudiesDB): Promise<Study[]> {
    let e_res = await db.studies.toArray()

    return e_res.map(e_study => {
        let res = Study(e_study.id)
        res.set_entity(e_study)
        return res
    })
}


async function db_light_list_studies(db: StudiesDB): Promise<Study[]> {
    let e_res = await db.studies.toArray()

    return Promise.all(e_res.map(async e_study => {
        let res = Study(e_study.id)
        res.set_entity(e_study)


        let sections = await db.sections.where('study_id')
        .equals(res.id)
        .limit(5)
        .toArray()

        if (sections.length === 1) {
            let e_section = sections[0]
            let section = Section(e_section.id, res.id)
            section.set_entity(e_section)

            let chapters = await db.chapters.where('section_id')
            .equals(section.id)
            .limit(5)
            .toArray()


            chapters.forEach(e_chapter => {
                let chapter = Chapter(e_chapter.id, section.id, PlayUciTreeReplay('', StepsTree('')))
                chapter.set_entity(e_chapter)
                section.add_chapter(chapter)
            })
            section.sort_chapters()

            res.add_section(section)
        } else {
            for (let e_section of sections) {
                let section = Section(e_section.id, res.id)
                section.set_entity(e_section)

                res.add_section(section)
            }

        }

        res.sort_sections()
        return res
    }))
}


async function db_list_studies_with_sections(db: StudiesDB): Promise<Study[]> {
    let e_res = await db.studies.toArray()

    return Promise.all(e_res.map(async e_study => {
        let res = Study(e_study.id)
        res.set_entity(e_study)


        let sections = await db.sections.where('study_id')
            .equals(res.id)
            .toArray()

        for (let e_section of sections) {
            let section = Section(e_section.id, res.id)
            section.set_entity(e_section)

            let chapters = await db.chapters.where('section_id')
                .equals(section.id)
                .limit(5)
                .toArray()


            chapters.forEach(e_chapter => {
                let chapter = Chapter(e_chapter.id, section.id, PlayUciTreeReplay('', StepsTree('')))
                chapter.set_entity(e_chapter)
                section.add_chapter(chapter)
            })
            section.sort_chapters()

            res.add_section(section)
        }
        res.sort_sections()
        return res
    }))
}

async function db_put_repeat_study(db: StudiesDB, entity: EntityRepeatStudyInsert) {
    await db.repeat_studies.put(entity)
}

async function db_get_or_new_repeat_study(db: StudiesDB, study_id: EntityStudyId): Promise<RepeatStudy> {
    let e_res = await db.repeat_studies.where('study_id').equals(study_id).first()

    if (!e_res) {
        return RepeatStudy(gen_id8(), study_id)
    }

    let e_sections = await db.sections.where('id').anyOf(e_res.sections).toArray()

    let sections = await Promise.all(e_sections.map(async (e_section) => {
        let section = Section(e_section.id, e_section.study_id)
        section.set_entity(e_section)

        let chapters = await db.chapters.where('section_id')
            .equals(section.id)
            .toArray()


        chapters.forEach(e_chapter => {
            let chapter = Chapter(e_chapter.id, section.id, PlayUciTreeReplay('', StepsTree('')))
            chapter.set_entity(e_chapter)
            section.add_chapter(chapter)
        })
        section.sort_chapters()

        return section
    }))


    let res = RepeatStudy(e_res.id, e_res.study_id)
    res.set_sections(sections)

    return res
}

async function db_load_repeat_due_moves(db: StudiesDB, repeat_study_id: EntityRepeatStudyId, sections: EntitySectionId[]): Promise<RepeatDueMove[]> {

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


    let res: RepeatDueMove[] = []

    for (let e_step_tree_node of e_step_tree_nodes) {
        let e_existing_due_move = e_existing_due_moves.find(_ => _.tree_step_node_id === e_step_tree_node.id)

        let node = e_load_tree_step_node_from_entity(e_step_tree_node)

        if (e_existing_due_move) {
            res.push(RepeatDueMove(e_existing_due_move.id, e_existing_due_move.repeat_study_id, node, false))
        } else {
            res.push(RepeatDueMove(gen_id8(), repeat_study_id, node, true))
        }
    }

    return res
}


function e_load_tree_step_node_from_entity(entity: EntityTreeStepNode) {
    let res = TreeStepNode(entity.id, entity.tree_id, entity.step, entity.order)
    res.set_entity(entity)
    return res
}


async function db_play_replay_by_steps_tree_id(db: StudiesDB, steps_tree_id: EntityStepsTreeId) {
    let e_replay = await db.play_uci_tree_replays.where('steps_tree_id').equals(steps_tree_id).first()

    if (!e_replay) {
        throw new Error("No Steps by given id" + steps_tree_id)
    }

    let res = await db_load_play_replay(db, e_replay.id)

    if (!res) {
        throw new Error("No Replay by given id" + e_replay.id)
    }

    return res
}

async function db_new_repeat_move_attempt(db: StudiesDB, entity: EntityRepeatMoveAttemptInsert) {
    await db.repeat_move_attempts.add(entity)
} 


async function db_load_repeat_move_attempts(db: StudiesDB, due_move_id: EntityRepeatDueMoveId): Promise<RepeatMoveAttempt[]> {
    let e_res = await db.repeat_move_attempts.where('repeat_due_move_id').equals(due_move_id).toArray()

    if (!e_res) {
        throw new Error("No Repeat Move Attempts for given due_move_id " + due_move_id)
    }

    return e_res.map(e => RepeatMoveAttempt(e.id, e.repeat_due_move_id, e.attempt_result, e.card, e.created_at))

}

async function db_save_due_move(db: StudiesDB, entity: EntityRepeatDueMoveInsert) {
    await db.repeat_due_moves.add(entity)
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
            studies: 'id',
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
    sections!: EntitySectionId[]
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



export const StudiesDBContext = createContext<StudiesDBReturn>()

export type StudiesDBReturn = {
    db: StudiesDB,
    new_study(): Promise<Study>
    new_section(study_id: EntityStudyId): Promise<Section>
    new_chapter(section_id: EntitySectionId): Promise<Chapter>
    study_by_id(id: EntityStudyId): Promise<Study>,
    update_study(study: EntityStudyInsert): Promise<void>
    update_section(section: EntitySectionInsert): Promise<void>
    update_chapter(chapter: EntityChapterInsert): Promise<void>
    delete_study(study: Study): Promise<void>
    delete_section(section: Section): Promise<void>
    delete_chapter(chapter: Chapter): Promise<void>

    new_play_uci_tree_replay(): Promise<PlayUciTreeReplay>
    new_steps_tree(): Promise<StepsTree>
    new_tree_step_node(node: TreeStepNode): Promise<void>

    update_play_uci_tree_replay(entity: EntityPlayUciTreeReplayInsert): Promise<void>
    update_tree_step_node(entity: EntityTreeStepNodeInsert): Promise<void>
    delete_tree_nodes(nodes: TreeStepNode[]): Promise<void>;



    new_section_with_name(id: EntityStudyId, section_name: string, order: number): Promise<Section>;
    new_chapter_from_pgn(id: EntitySectionId, chapter_name: string, pgn: PGN, order: number): Promise<Chapter>;



    list_studies(): Promise<Study[]>;
    light_list_studies(): Promise<Study[]>;
    list_studies_with_sections(): Promise<Study[]>;


    put_repeat_study_sections(entity: EntityRepeatStudyInsert): Promise<void>;
    get_or_new_repeat_study(study_id: EntityStudyId): Promise<RepeatStudy>;
    load_repeat_due_moves(repeat_study_id: EntityRepeatStudyId, sections: EntitySectionId[]): Promise<RepeatDueMove[]>

    play_replay_by_steps_tree_id(steps_tree_id: EntityStepsTreeId): Promise<PlayUciTreeReplay>
    add_repeat_move_attempt(entity: EntityRepeatMoveAttemptInsert): Promise<void>
    load_repeat_move_attempts(due_move_id: EntityRepeatDueMoveId): Promise<RepeatMoveAttempt[]>

    save_due_move(due_move: EntityRepeatDueMoveInsert): Promise<void>;
}

export const StudiesDBProvider = (props: { children: JSX.Element }) => {

    let db = new StudiesDB()


    let res: StudiesDBReturn = {
        db,
        new_study() { return db_new_study(db) },
        new_section(study_id: EntityStudyId) { return db_new_section(db, study_id) },
        new_chapter(section_id: EntitySectionId) { return db_new_chapter(db, section_id) },
        study_by_id(id: EntityStudyId) {
            return db_study_by_id(db, id)
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
        delete_chapter(chapter: Chapter) {
            return db_delete_chapter(db, chapter)
        },
        delete_section(section: Section) {
            return db_delete_section(db, section)
        },
        delete_study(study: Study) {
            return db_delete_study(db, study)
        },

        new_play_uci_tree_replay() { return db_new_play_uci_tree_replay(db) },
        new_steps_tree() { return db_new_steps_tree(db) },
        new_tree_step_node(node: TreeStepNode) { 
            return db_new_tree_step_node(db, node) 
        },
        update_play_uci_tree_replay(entity: EntityPlayUciTreeReplayInsert) {
            return db_update_tree_replay(db, entity)
        },
        update_tree_step_node(entity: EntityTreeStepNode) {
            return db_update_tree_step_node(db, entity)
        },
        delete_tree_nodes(nodes: TreeStepNode[]) {
            return db_delete_tree_nodes(db, nodes)
        },

        new_section_with_name(id: EntityStudyId, section_name: string, order: number): Promise<Section> {
            return db_new_section_with_name(db, id, section_name, order)
        },
        new_chapter_from_pgn(id: EntitySectionId, chapter_name: string, pgn: PGN, order: number): Promise<Chapter> {
            return db_new_chapter_from_pgn(db, id, chapter_name, pgn, order)
        },

        list_studies() { return db_list_studies(db) },
        light_list_studies() { return db_light_list_studies(db) },
        list_studies_with_sections() { return db_list_studies_with_sections(db) },

        put_repeat_study_sections(entity: EntityRepeatStudyInsert) {
            return db_put_repeat_study(db, entity)
        },
        get_or_new_repeat_study(study_id: EntityStudyId) {
            return db_get_or_new_repeat_study(db, study_id)
        },
        load_repeat_due_moves(repeat_study_id: EntityRepeatStudyId, sections: EntitySectionId[]) {
            return db_load_repeat_due_moves(db, repeat_study_id, sections)
        },
        play_replay_by_steps_tree_id(steps_tree_id: EntityStepsTreeId) {
            return db_play_replay_by_steps_tree_id(db, steps_tree_id)
        },
        add_repeat_move_attempt(entity: EntityRepeatMoveAttemptInsert) {
                return db_new_repeat_move_attempt(db, entity) 
        },
        load_repeat_move_attempts(due_move_id: EntityRepeatDueMoveId) {
            return db_load_repeat_move_attempts(db, due_move_id)
        },

        save_due_move(due_move: EntityRepeatDueMoveInsert) {
            return db_save_due_move(db, due_move)
        }
    }

    return (<>
        <StudiesDBContext.Provider value={res}>
            {props.children}
        </StudiesDBContext.Provider></>)
}


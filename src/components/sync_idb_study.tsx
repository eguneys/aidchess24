import Dexie, { Entity, EntityTable, InsertType } from "dexie";
import { Chapter, Section, Study } from "./StudyComponent";
import { createContext, JSX } from "solid-js";
import { NAG, Path, Step } from "./step_types";
import { PlayUciTreeReplay, StepsTree, TreeStepNode } from "./ReplayTreeComponent";


async function db_new_play_uci_tree_replay(db: StudiesDB) {
    let tree = StepsTree(gen_id8())
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
    return Math.random().toString(16).slice(2, 8)
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


class StudiesDB extends Dexie {
    studies!: EntityTable<EntityStudy, "id">
    sections!: EntityTable<EntitySection, "id">
    chapters!: EntityTable<EntityChapter, "id">

    play_uci_tree_replays!: EntityTable<EntityPlayUciTreeReplay, "id">
    steps_trees!: EntityTable<EntityStepsTree, "id">
    tree_step_nodes!: EntityTable<EntityTreeStepNode, "id">


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
        })


        this.studies.mapToClass(EntityStudy)
        this.sections.mapToClass(EntitySection)
        this.chapters.mapToClass(EntityChapter)

        this.play_uci_tree_replays.mapToClass(EntityPlayUciTreeReplay)
        this.steps_trees.mapToClass(EntityStepsTree)
        this.tree_step_nodes.mapToClass(EntityTreeStepNode)
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


    }

    return (<>
        <StudiesDBContext.Provider value={res}>
            {props.children}
        </StudiesDBContext.Provider></>)
}


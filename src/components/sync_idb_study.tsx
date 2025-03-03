import Dexie, { Entity, EntityTable, InsertType } from "dexie";
import { Chapter, Section, Study } from "./StudyComponent";
import { createContext, JSX } from "solid-js";

function gen_id8() {
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
    let new_chapter = Chapter(gen_id8(), section_id)
    await db.chapters.add(new_chapter.entity)
    return new_chapter
}



async function db_study_by_id(db_return: StudiesDBReturn, id: EntityStudyId): Promise<Study> {
    let { db } = db_return

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
        (await db.chapters.where('section_id').equals(section.id).toArray()).forEach(e_chapter => {
            let res = Chapter(e_chapter.id, section.id)
            res.set_entity(e_chapter)

            section.add_chapter(res)
        })
        section.sort_chapters()
    })


    return study
}


class StudiesDB extends Dexie {
    studies!: EntityTable<EntityStudy, "id">
    sections!: EntityTable<EntitySection, "id">
    chapters!: EntityTable<EntityChapter, "id">


    remove_database() {
        this.delete()
    }


    constructor() {
        super('StudiesDB')


        this.version(1).stores({
            studies: 'id',
            sections: 'id, study_id',
            chapters: 'id, section_id'
        })


        this.studies.mapToClass(EntityStudy)
        this.sections.mapToClass(EntitySection)
        this.chapters.mapToClass(EntityChapter)
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
    name!: string
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
}

export const StudiesDBProvider = (props: { children: JSX.Element }) => {

    let db = new StudiesDB()


    let res = {
        db,
        new_study() { return db_new_study(db) },
        new_section(study_id: EntityStudyId) { return db_new_section(db, study_id) },
        new_chapter(section_id: EntitySectionId) { return db_new_chapter(db, section_id) },
        study_by_id(id: EntityStudyId) {
            return db_study_by_id(this, id)
        },
        update_study(study: EntityStudyInsert) {
            return db_update_study(db, study)
        },
        update_section(section: EntitySectionInsert) {
            return db_update_section(db, section)
        },
        update_chapter(chapter: EntityChapterInsert) {
            return db_update_chapter(db, chapter)
        }
    }

    return (<>
        <StudiesDBContext.Provider value={res}>
            {props.children}
        </StudiesDBContext.Provider></>)
}


import Dexie, { Entity, EntityTable } from "dexie";
import { Study } from "./StudyComponent";
import { createContext, JSX } from "solid-js";

function gen_id8() {
    return Math.random().toString(16).slice(2, 8)
}

async function db_new_study(db: StudiesDB) {
    let new_study = Study()


    return await db.studies.add({
        id: gen_id8(),
        name: new_study.name
    })
}


async function db_study_by_id(db: StudiesDB, id: EntityStudyId): Promise<Study> {
    let e_study = await db.studies.get(id)

    if (!e_study) {
        throw new Error("No Study by given " + id)
    }


    let res = Study()

    res.set_name(e_study.name)

    return res
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
            studies: 'id, name',
            sections: 'id, study_id, name',
            chapters: 'id, section_id, name'
        })


        this.studies.mapToClass(EntityStudy)
        this.sections.mapToClass(EntitySection)
        this.chapters.mapToClass(EntityChapter)
    }
}

type EntityStudyId = string
type EntitySectionId = string
type EntityChapterId = string

class EntityStudy extends Entity<StudiesDB> {
    id!: EntityStudyId
    name!: string
}
class EntitySection extends Entity<StudiesDB> {
    id!: EntitySectionId
    study_id!: EntityStudyId
    name!: string
}
class EntityChapter extends Entity<StudiesDB> {
    id!: EntityChapterId
    section_id!: EntitySectionId
    name!: string
}



export const StudiesDBContext = createContext<StudiesDBReturn>()

type StudiesDBReturn = {
    new_study(): Promise<EntityStudyId>
    study_by_id(id: EntityStudyId): Promise<Study>
}

export const StudiesDBProvider = (props: { children: JSX.Element }) => {

    let db = new StudiesDB()


    let res = {
        new_study() {
            return db_new_study(db)
        },
        study_by_id(id: EntityStudyId) {
            return db_study_by_id(db, id)
        }
    }

    return (<>
        <StudiesDBContext.Provider value={res}>
            {props.children}
        </StudiesDBContext.Provider></>)
}


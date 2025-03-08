import { useContext } from "solid-js";
import type { Store } from ".";
import { EntityChapterId, EntitySectionId, EntityStudyId, ModelChapter, ModelStudy, StudiesDBContext, StudiesDBReturn } from "../components/sync_idb_study";
import { query, revalidate } from "@solidjs/router";

export type Agent = {
    Studies: Studies,
    Chapters: Chapters
}

type Chapters = {
    get(id: EntityChapterId): Promise<ModelChapter>
    by_section_id(id: EntitySectionId): Promise<ModelChapter[]>
    create(section_id: EntitySectionId, order: number): Promise<ModelChapter>
    delete(model: ModelChapter): Promise<void>
}

type Studies = {
    mine(): Promise<ModelStudy[]>
    auto(): Promise<ModelStudy[]>
    featured(): Promise<ModelStudy[]>
    all(): Promise<ModelStudy[]>
    get(id: EntityStudyId): Promise<ModelStudy>
    create(): Promise<ModelStudy>
    delete(id: EntityStudyId): Promise<void>
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
            revalidate(get.keyFor(study.id))
            revalidate(all.key)
            return study
        },
        delete: async (id: EntityStudyId) => {
            await db.delete_study(id)
            revalidate(get.keyFor(id))
            revalidate(all.key)
        }
    }
}

function createAgentChapters(db: StudiesDBReturn): Chapters {
    const by_section_id = query((id: EntitySectionId) => db.get_chapters_by_section_id(id), 'chapters_by_section_id')
    const get = query((id: EntityChapterId) => db.get_chapter_by_id(id), 'chapters_by_id')

    return {
        by_section_id,
        get,
        create: async (section_id: EntitySectionId, order: number) => {
            let chapter = await db.new_chapter(section_id, order)
            revalidate(get.keyFor(chapter.id))
            revalidate(by_section_id.keyFor(chapter.section_id))
            return chapter
        },
        delete: async (chapter: ModelChapter) => {
            await db.delete_study(chapter.id)
            revalidate(get.keyFor(chapter.id))
            revalidate(by_section_id.keyFor(chapter.section_id))
        }
    }
}

export function createAgent(_: Store): Agent {
    let db = useContext(StudiesDBContext)!

    let Studies = createAgentStudies(db)

    let Chapters = createAgentChapters(db)

    return {
        Studies,
        Chapters
    }
}
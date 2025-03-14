import { SetStoreFunction, unwrap } from "solid-js/store";
import { StoreActions, StoreState } from ".";
import type { Agent } from "./createAgent";
import { createAsync } from "@solidjs/router";
import { EntityChapterId, EntityChapterInsert, EntitySectionId, EntityStudyId, ModelChapter } from "../components/sync_idb_study";
import { batch, createSignal } from "solid-js";
import { PGN } from "../components2/parse_pgn";

export function createChapters(agent: Agent, actions: Partial<StoreActions>, state: StoreState, setState: SetStoreFunction<StoreState>) {

    type Source = ["chapters", EntitySectionId] | ["chapter", EntityChapterId]
    const [source, set_source] = createSignal<Source>()

    const chapters = createAsync<{ list: ModelChapter[]}>(async (value: { list: ModelChapter[] }) => {
        let s = source()

        if (s === undefined) {
            return { list: [] }
        }

        if (s[0] === 'chapters') {
            let list = await agent.Chapters.by_section_id(s[1]) 
            return { list }
        }

        let chapter_id = s[1]
        let i = value.list.findIndex(_ => _.id === chapter_id)

        if (i === -1) {
            let chapter = await agent.Chapters.get(chapter_id)
            return { list: [...value.list, chapter] }
        }

        return value
    }, { initialValue: { list: [] }})

    Object.assign(actions, {
        load_chapters(section_id: EntitySectionId) {
            set_source(["chapters", section_id])
        },
        load_chapter(chapter_id: EntityChapterId) {
            set_source(["chapter", chapter_id])
        },
        async create_chapter(study_id: EntityStudyId, section_id: EntitySectionId, name?: string, pgn?: PGN) {
            let chapter = await agent.Chapters.create(section_id, name, pgn)
            batch(() => {
                setState("chapters", "list", state.chapters.list.length, chapter)
                setState("studies", study_id, "sections", _ => _.id === chapter.section_id, "chapter_ids", _ => [..._, chapter.id])
            })
            return chapter
        },
        async update_chapter(_study_id: EntityStudyId, _section_id: EntitySectionId, data: EntityChapterInsert) {
            await agent.Chapters.update_chapter(data)
            setState("chapters", "list", _ => _.id === data.id, data)
        },
        async order_chapters(study_id: EntityStudyId, section_id: EntitySectionId, chapter_id: EntitySectionId, new_order: number) {
            await agent.Chapters.order_chapters(section_id, chapter_id, new_order)

            setState("studies", study_id, "sections", _ => _.id === section_id, "chapter_ids", chapter_ids => {
                let old_order = chapter_ids.indexOf(chapter_id)
                chapter_ids.splice(old_order, 1)
                chapter_ids.splice(new_order, 0, chapter_id)

                return [...chapter_ids]
            })
        },
        async delete_chapter(study_id: EntityStudyId, section_id: EntitySectionId, id: EntityChapterId) {
            await agent.Chapters.delete(id)

            batch(() => {
                setState("chapters", "list", _ => _.filter(_ => _.id !== id))
                setState("studies", study_id, "sections", _ => _.id === section_id, "chapter_ids", _ => _.filter(_ => _ !== id))
            })
        }
    })

    return () => chapters.latest
}
import { SetStoreFunction } from "solid-js/store";
import { StoreActions, StoreState } from ".";
import { Agent } from "./createAgent";
import { createAsync } from "@solidjs/router";
import { EntityChapterId, EntityChapterInsert, EntitySectionId, EntityStudyId, ModelChapter } from "../components/sync_idb_study";
import { createSignal } from "solid-js";

export function createChapters(agent: Agent, actions: Partial<StoreActions>, state: StoreState, setState: SetStoreFunction<StoreState>) {

    type Source = ["chapters", EntitySectionId] | ["chapter", EntityChapterId]
    const [source, set_source] = createSignal<Source>()

    const chapters = createAsync<ModelChapter[]>(async (value: ModelChapter[]) => {
        let s = source()

        if (s === undefined) {
            return []
        }

        if (s[0] === 'chapters') {
            return agent.Chapters.by_section_id(s[1])
        }

        let chapter_id = s[1]
        let i = value.findIndex(_ => _.id === chapter_id)

        if (i === -1 || !value[i].tree_replay) {
            let chapter = await agent.Chapters.get(chapter_id)

            if (i === -1) {
                value.push(chapter)
            } else {
                value.splice(i, 1, chapter)
            }
            return [...value]
        }

        return value
    }, { initialValue: []})

    Object.assign(actions, {
        load_chapters(section_id: EntitySectionId) {
            set_source(["chapters", section_id])
        },
        load_chapter(chapter_id: EntityChapterId) {
            set_source(["chapter", chapter_id])
        },
        async create_chapter(study_id: EntityStudyId, section_id: EntitySectionId) {
            let chapter = await agent.Chapters.create(section_id)
            setState("chapters", state.chapters.length, chapter)
            setState("studies", study_id, "sections", _ => _.id === chapter.section_id, "chapter_ids", _ => [..._, chapter.id])
            return chapter
        },
        async update_chapter(_study_id: EntityStudyId, section_id: EntitySectionId, data: EntityChapterInsert) {
            await agent.Chapters.update_chapter(section_id, data)
            setState("chapters", _ => _.id === data.id, data)
        },
        async order_chapters(study_id: EntityStudyId, section_id: EntitySectionId, chapter_id: EntitySectionId, new_order: number) {
            await agent.Chapters.order_chapters(section_id, chapter_id, new_order)

            setState("studies", study_id, "sections", _ => _.id === section_id, "chapter_ids", chapter_ids => {
                let old_order = chapter_ids.indexOf(chapter_id)
                chapter_ids.splice(old_order, 1)
                chapter_ids.splice(new_order, 0, chapter_id)

                return [...chapter_ids]
            })
        }

    })

    return () => chapters.latest
}
import { SetStoreFunction } from "solid-js/store";
import { StoreActions, StoreState } from ".";
import { Agent } from "./createAgent";
import { createAsync } from "@solidjs/router";
import { EntityChapterId, EntityChapterInsert, EntitySectionId, EntityStudyId, ModelChapter } from "../components/sync_idb_study";
import { createSignal } from "solid-js";

export function createChapters(agent: Agent, actions: Partial<StoreActions>, _state: StoreState, setState: SetStoreFunction<StoreState>) {

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
            console.log(value)
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
        async create_chapter(section_id: EntitySectionId) {
            let chapter = await agent.Chapters.create(section_id)
            setState("chapters", { [chapter.id]: chapter })
            return chapter
        },
        async update_chapter(_study_id: EntityStudyId, section_id: EntitySectionId, data: EntityChapterInsert) {
            await agent.Chapters.update_chapter(section_id, data)
            setState("chapters", _ => _.id === data.id, data)
        },

    })

    return chapters
}
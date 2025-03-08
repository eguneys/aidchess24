import { SetStoreFunction } from "solid-js/store";
import { StoreActions, StoreState } from ".";
import { Agent } from "./createAgent";
import { createAsync } from "@solidjs/router";
import { EntitySectionId, ModelChapter } from "../components/sync_idb_study";

export function createChapters(agent: Agent, actions: Partial<StoreActions>, state: StoreState, setState: SetStoreFunction<StoreState>) {


    const chapters = createAsync<ModelChapter[]>(async () => {
        if (!state.section_id) {
            return []
        }
        return agent.Chapters.by_section_id(state.section_id)
    }, { initialValue: []})

    Object.assign(actions, {
        load_chapters(section_id: EntitySectionId) {
            setState({ section_id })
        },
        async create_chapter(section_id: EntitySectionId, order: number) {
            await agent.Chapters.create(section_id, order)
        }

    })

    return chapters
}
import { SetStoreFunction } from "solid-js/store"
import { StoreActions, StoreState } from "."
import { Agent } from "./createAgent"
import { EntitySectionId, EntityStudyId, ModelRepeatDueMove } from "./sync_idb_study"
import { createAsync } from "@solidjs/router"
import { createSignal } from "solid-js"

export function createDueMoves(agent: Agent, actions: Partial<StoreActions>, _state: StoreState, _setState: SetStoreFunction<StoreState>) {

    type Source = [EntityStudyId, EntitySectionId[]]
    const [source, set_source] = createSignal<Source>()

    const due_moves = createAsync<{ list: ModelRepeatDueMove[]}>(async () => {
        let s = source()

        if (s === undefined) {
            return { list: [] }
        }

        return { list: await agent.DueMoves.by_study_id(...s) }
    }, { initialValue: { list: [] }})

    Object.assign(actions, {
        load_due_moves(study_id: EntityStudyId, section_ids: EntitySectionId[]) {
            set_source([study_id, section_ids])
        }
    })

    return () => due_moves.latest
}
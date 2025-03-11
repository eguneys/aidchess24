import type { Agent } from "./createAgent";
import { StoreActions, StoreState } from ".";
import { SetStoreFunction } from "solid-js/store";
import { EntityChapterId, ModelReplayTree } from "../components/sync_idb_study";
import { createAsync } from "@solidjs/router";
import { createSignal } from "solid-js";

export function createReplayTree(agent: Agent, actions: Partial<StoreActions>, _state: StoreState, _setState: SetStoreFunction<StoreState>) {

    const [source, set_source] = createSignal<EntityChapterId>()
    const default_replay_tree: ModelReplayTree = {
        id: '',
        steps_tree_id: '',
        cursor_path: '',
        steps_tree: {
            id: '',
            flat_nodes: {}
        }
    }

    const replay_tree = createAsync<ModelReplayTree>(async () => {
        let s = source()
        if (!s) {
            return default_replay_tree
        }
        return agent.ReplayTree.by_chapter_id(s)
    }, { initialValue: default_replay_tree })


    Object.assign(actions, {
        load_replay_tree(chapter_id: EntityChapterId) {
            set_source(chapter_id)
        }
    })

    return replay_tree
}
import type { Agent } from "./createAgent";
import { StoreActions, StoreState } from ".";
import { SetStoreFunction } from "solid-js/store";
import { EntityChapterId, ModelReplayTree, ModelTreeStepNode } from "../components/sync_idb_study";
import { createAsync } from "@solidjs/router";
import { Accessor, batch, createSignal } from "solid-js";
import { initial_step_play_san, next_step_play_san, parent_path, Path, SAN } from "../components/step_types";
import { find_at_path, find_children_at_path } from "../components2/ReplayTreeComponent";

export function createReplayTree(agent: Agent, actions: Partial<StoreActions>, state: StoreState, setState: SetStoreFunction<StoreState>): Accessor<ModelReplayTree> {

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

    const goto_path = (path: Path) => {
        agent.ReplayTree.update({ id: state.replay_tree.id, cursor_path: path })
        setState("replay_tree", "cursor_path", path)
    }

    Object.assign(actions, {
        load_replay_tree(chapter_id: EntityChapterId) {
            set_source(chapter_id)
        },
        goto_path,
        goto_path_if_can(res: Path | undefined) {
            if (res !== undefined) {
                goto_path(res)
            }
        },
        delete_at_and_after_path(path: Path) {
            let parent = parent_path(path)
            let d_node = state.replay_tree.steps_tree.flat_nodes[parent].find(_ => _.step.path === path)!
            agent.ReplayTree.delete_tree_node(d_node.id)
            setState("replay_tree", "steps_tree", "flat_nodes", parent, _ => _.filter(_ => _.step.path !== path))
        },
        async add_child_san_to_current_path(san: SAN) {
            let path = state.replay_tree.cursor_path

            let children = find_children_at_path(state.replay_tree.steps_tree, path)

            let existing = children.find(_ => _.step.san === san)

            if (existing) {
                return existing
            }

            let parent = parent_path(path)
            let parent_node = find_at_path(state.replay_tree.steps_tree, path)

            let step = parent_node ? next_step_play_san(parent_node.step, san) : initial_step_play_san(san)

            let new_node: ModelTreeStepNode = await agent.ReplayTree.create_node(state.replay_tree.steps_tree_id, step)

            setState("replay_tree", "steps_tree", "flat_nodes", parent, _ => {
                return [..._, new_node]
            })

            return new_node
        }
    })

    return () => replay_tree.latest
}

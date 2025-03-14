import type { Agent } from "./createAgent";
import { StoreActions, StoreState } from ".";
import { SetStoreFunction } from "solid-js/store";
import { EntityChapterId, ModelChapter, ModelReplayTree, ModelTreeStepNode } from "./sync_idb_study";
import { createAsync } from "@solidjs/router";
import { Accessor, createSignal } from "solid-js";
import { initial_step_play_san, NAG, next_step_play_san, parent_path, Path, SAN } from "./step_types";
import { chapter_as_export_pgn, find_at_path, find_children_at_path } from "../components2/ReplayTreeComponent";

export function createReplayTree(agent: Agent, actions: Partial<StoreActions>, state: StoreState, setState: SetStoreFunction<StoreState>): Accessor<ModelReplayTree> {

    const [source, set_source] = createSignal<EntityChapterId>()
    const default_replay_tree: Accessor<ModelReplayTree> = () => ({
        id: '',
        steps_tree_id: '',
        cursor_path: '',
        success_path: undefined,
        failed_path: undefined,
        hide_after_path: undefined,
        steps_tree: {
            id: '',
            flat_nodes: {}
        }
    })

    const replay_tree = createAsync<ModelReplayTree>(async () => {
        let s = source()
        if (!s) {
            return default_replay_tree()
        }
        return agent.ReplayTree.by_chapter_id(s)
    }, { initialValue: default_replay_tree() })

    const goto_path = (path: Path) => {
        agent.ReplayTree.update({ id: state.replay_tree.id, cursor_path: path })
        setState("replay_tree", "cursor_path", path)
    }
    const set_success_path = (path: Path) => {
        agent.ReplayTree.update({ id: state.replay_tree.id, success_path: path })
        setState("replay_tree", "success_path", path)
    }
    const set_failed_path = (path: Path) => {
        agent.ReplayTree.update({ id: state.replay_tree.id, failed_path: path })
        setState("replay_tree", "failed_path", path)
    }
    const set_hide_after_path = (path: Path) => {
        agent.ReplayTree.update({ id: state.replay_tree.id, hide_after_path: path })
        setState("replay_tree", "hide_after_path", path)
    }

    Object.assign(actions, {
        reset_replay_tree() {
            set_source(undefined)
        },
        load_replay_tree(chapter_id: EntityChapterId) {
            set_source(chapter_id)
        },
        set_success_path,
        set_failed_path,
        set_hide_after_path,
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
            goto_path(parent)
        },
        async tree_step_node_set_nags(node: ModelTreeStepNode, nags: NAG[]) {
            let parent = parent_path(node.step.path)
            let data = {
                id: node.id,
                nags
            }
            await agent.ReplayTree.update_tree_node(data)

            let pp = state.replay_tree.steps_tree.flat_nodes[parent]

            setState("replay_tree", "steps_tree", "flat_nodes", 
                parent,
                pp.indexOf(node),
                "nags", nags
            )
        },
        async add_child_san_to_current_path(san: SAN) {
            let path = state.replay_tree.cursor_path

            let children = find_children_at_path(state.replay_tree.steps_tree, path)

            let existing = children.find(_ => _.step.san === san)

            if (existing) {
                return existing
            }

            let node = find_at_path(state.replay_tree.steps_tree, path)

            let step = node ? next_step_play_san(node.step, san) : initial_step_play_san(san)

            let new_node: ModelTreeStepNode = await agent.ReplayTree.create_node(state.replay_tree.steps_tree_id, step)

            let nodes = state.replay_tree.steps_tree.flat_nodes[path]

            if (!nodes) {
                setState("replay_tree", "steps_tree", "flat_nodes", path, [new_node])
            } else {
                setState("replay_tree", "steps_tree", "flat_nodes", path, _ => {
                    return [..._, new_node]
                })
            }

            return new_node
        },
        async chapter_as_export_pgn(study_name: string, section_name: string, chapter: ModelChapter) {
            let res = await agent.ReplayTree.by_chapter_id(chapter.id)
            return chapter_as_export_pgn(study_name, section_name, chapter, res.steps_tree)
        }
    })

    return () => replay_tree.latest
}

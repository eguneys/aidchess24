import { createSignal } from "solid-js"
import { FEN, make_step_and_play, Path, Ply, SAN, Step } from "./step_types"
import { Chess, Position } from "chessops"
import { INITIAL_FEN, parseFen } from "chessops/fen"

export type TreeStepNode = {
    path: Path,
    step: Step,
    children: TreeStepNode[],
    add_child_san(san: SAN): TreeStepNode
    remove_child_san(san: SAN): TreeStepNode | undefined
    remove_child(child: TreeStepNode): TreeStepNode | undefined
}

export type StepsTree = {
    initial_fen: FEN | undefined,
    root: TreeStepNode[]
    add_child_san(path: Path, san: SAN): TreeStepNode | undefined
    remove_child_at_path(path: Path): TreeStepNode | undefined
    find_at_path(path: Path): TreeStepNode | undefined
}

export function StepsTree(): StepsTree {
    let [root, set_root] = createSignal<TreeStepNode[]>([])

    const find_at_path = (path: Path) => {
        return find_parent_and_child_at_path(path)?.[1]
    }

    const find_parent_and_child_at_path = (path: Path): [TreeStepNode | undefined, TreeStepNode] | undefined => {

        if (path === '') {
            return undefined
        }

        let ps = path.split(' ')
        let i_path = 0
        let parent: TreeStepNode | undefined = undefined
        let i = root()

        while (true) {

            let path_at_level = ps.slice(0, i_path + 1).join(' ')

            let sub = i.find(_ => _.path === path_at_level)

            if (!sub) {
                return undefined
            }

            i_path++
            if (i_path === ps.length) {
                return [parent, sub]
            }

            parent = sub
            i = sub.children

        }

        
    }

    return {
        get initial_fen() {
            if (root().length === 0) {
                return undefined
            }
            return root()[0].step.before_fen
        },
        get root() {
            return root()
        },
        add_child_san(path: Path, san: SAN) {
            if (path === '') {

                let pos = Chess.fromSetup(parseFen(INITIAL_FEN).unwrap()).unwrap()
                let child = TreeStepNode(0, pos, san, '')
                set_root([...root(), child])
                return child
            }

            let node = find_at_path(path)
            if (node) {
                return node.add_child_san(san)
            }
            return undefined
        },
        remove_child_at_path(path: Path) {
            let pc = find_parent_and_child_at_path(path)
            if (!pc) {
                return undefined
            }
            if (!pc[0]) {
                let rr = root()
                let i = rr.indexOf(pc[1])
                rr.splice(i, 1)
                set_root([...rr])
                return pc[1]
            }
            pc[0].remove_child(pc[1])
            return pc[1]
        },
        find_at_path
    }
}

export type TreeReplayComponent = {
    steps: StepsTree
}

export function TreeStepNode(ply: Ply, pos: Position, san: SAN, base_path: Path): TreeStepNode {

    let [children, set_children] = createSignal<TreeStepNode[]>([])

    pos = pos.clone()
    let step = make_step_and_play(ply, pos, san, base_path)

    return {
        get path() {
            return step.path
        },
        step,
        get children() {
            return children()
        },
        remove_child(child: TreeStepNode) {
            let cc = children()
            let i = cc.indexOf(child)

            if (i === -1) {
                return undefined
            }

            cc.splice(i, 1)
            set_children([...cc])
            return child
        },
        add_child_san(san: SAN) {
            let child = TreeStepNode(ply + 1, pos, san, step.path)
            set_children([...children(), child])
            return child
        },
        remove_child_san(san: SAN) {
            let cc = children()
            let i = cc.findIndex(_ => _.step.san !== san)
            if (i === -1) {
                return undefined
            }
            let child = cc.splice(i, 1)[0]
            set_children([...cc])
            return child
        }
    }
}


export function TreeReplayComponent(): TreeReplayComponent {

    let steps = StepsTree()
    
    return {
        steps
    }

}
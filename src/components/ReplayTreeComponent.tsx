import { createEffect, createMemo, createSignal, For, on, onCleanup, onMount, Show } from "solid-js"
import { FEN, make_step_and_play, NAG, Path, Ply, SAN, Step } from "./step_types"
import { Chess, Color, makeUci, Position } from "chessops"
import { INITIAL_FEN, parseFen } from "chessops/fen"
import { parsePgn, ChildNode, PgnNodeData } from "chessops/pgn"
import { parseSan } from "chessops/san"
import { Key } from "@solid-primitives/keyed"
import './ReplayTreeComponent.scss'

export type PGN = {
    orientation?: Color,
    chapter?: string,
    event?: string,
    site?: string,
    white?: string,
    black?: string,
    fen?: string,
    tree: StepsTree
}

export function parse_PGNS(pgn: string): PGN[] {
    return parsePgn(pgn).map(g => {
        let event = g.headers.get('Event')
        let site = g.headers.get('Site')

        let white = g.headers.get('White')
        let black = g.headers.get('Black')

        let chapter = g.headers.get('Chapter')
        let orientation = g.headers.get('Orientation') as Color

        let fen = g.headers.get('FEN')

        let before_fen = fen ?? INITIAL_FEN
        let i_pos = Chess.fromSetup(parseFen(before_fen).unwrap()).unwrap()

        let tree = StepsTree()

        g.moves.children.forEach(child => {
            append_children(child, i_pos, '')
        })

        function append_children(child: ChildNode<PgnNodeData>, before_pos: Position, path: Path) {
            let san = child.data.san
            let move = parseSan(before_pos, san)!

            let after_pos = before_pos.clone()
            after_pos.play(move)
            let uci = makeUci(move)
            let nags = child.data.nags

            tree.add_child_san(path, san)!
            .set_nags(nags ?? [])

            let next_path = path.length === 0 ? uci : `${path} ${uci}`

            child.children.forEach(child => {
                append_children(child, after_pos, next_path)
            })
        }

        return {
            event,
            site,
            white,
            black,
            chapter,
            fen,
            orientation,
            tree
        }
    })
}



export type TreeStepNode = {
    ply: Ply,
    san: SAN,
    path: Path,
    step: Step,
    children: TreeStepNode[],
    nags: NAG[],
    set_nags(nags: NAG[]): void,
    add_child_san(san: SAN): TreeStepNode
    remove_child_san(san: SAN): TreeStepNode | undefined
    remove_child(child: TreeStepNode): TreeStepNode | undefined
    nb_first_variations: number
    first_node_with_variations: TreeStepNode | undefined
    length: number
}

export type StepsTree = {
    initial_fen: FEN | undefined,
    as_pgn: string,
    root: TreeStepNode[]
    add_sans_at_root(san: SAN[]): TreeStepNode[]
    add_child_san(path: Path, san: SAN): TreeStepNode | undefined
    remove_child_at_path(path: Path): TreeStepNode | undefined
    find_at_path(path: Path): TreeStepNode | undefined
    find_parent_and_child_at_path(path: Path): [TreeStepNode | undefined, TreeStepNode] | undefined
    siblings_of(path: any): TreeStepNode[] | undefined
    previous_branch_points(path: string): TreeStepNode[] | undefined
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


    function render_data(data: Step, show_index = false) {
        let ply = data.ply
        let i = (ply % 2 === 1 || show_index) ? (Math.ceil(ply / 2) + (ply % 2 === 1 ? '.' : '...')) : ''
        let tail = ply % 2 === 1 ? '' : ' '
        return `${i} ${data.san}${data.comments ? ' { ' + data.comments + ' }' : ''}${tail}`
    }

    function render_lines(ts: TreeStepNode[], show_index = false) {

        let res = ''
        if (ts.length === 0) {
        } else if (ts.length === 1) {
            res += render_data(ts[0].step, show_index)
            res += render_lines(ts[0].children, false)
        } else {
            res += render_data(ts[0].step, false).trimEnd()
            res += ' ' + ts.slice(1).map(_ => `(${render_lines([_], true).trimEnd()})`).join(' ')
            res += ' ' + render_lines(ts[0].children, true)
        }
        return res
    }

    return {
        get as_pgn() {
            return render_lines(root(), true)
        },
        get initial_fen() {
            if (root().length === 0) {
                return undefined
            }
            return root()[0].step.before_fen
        },
        get root() {
            return root()
        },
        add_sans_at_root(sans: SAN[]) {
            if (sans.length === 0) {
                return []
            }

            let san0 = sans[0]

            let child = this.add_child_san('', san0)!
            let res = [child]

            sans.slice(1).forEach(san => {
                child = child.add_child_san(san)
                res.push(child)
            })
            return res
        },
        add_child_san(path: Path, san: SAN) {
            if (path === '') {

                let rr = root()

                let exists = rr.find(_ => _.san === san)
                if (exists) {
                    return exists
                }

                let pos = Chess.fromSetup(parseFen(INITIAL_FEN).unwrap()).unwrap()
                let child = TreeStepNode(0, pos, san, '')
                set_root([...rr, child])
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
        find_at_path,
        find_parent_and_child_at_path,
        siblings_of(path: Path) {
            let parent = find_parent_and_child_at_path(path)?.[0]
            if (parent) {
                return parent.children
            }
            if (path.split(' ').length === 1) {
                return root()
            }
        },
        previous_branch_points(path: Path) {


            let res = []
            let i = root()

            let add_variation = i.length > 1

            for (let uci of path.split(' ')) {

                let next = i.find(_ => _.step.uci === uci)

                if (!next) {
                    return undefined
                }

                if (add_variation) {
                    res.push(next)
                    add_variation = false
                }
                if (next.children.length > 1) {
                    add_variation = true
                }
                i = next.children
            }
            return res
        }
    }
}



export function TreeStepNode(ply: Ply, pos: Position, san: SAN, base_path: Path): TreeStepNode {

    let [children, set_children] = createSignal<TreeStepNode[]>([])
    let [nags, set_nags] = createSignal<NAG[]>([])

    pos = pos.clone()
    let step = make_step_and_play(ply, pos, san, base_path)

    let nb_first_variations = () => {
        return children_first_variations()?.length ?? 0
    }
    let children_first_variations = () => {
        return first_node_with_variations()?.children
    }

    let first_node_with_variations = (): TreeStepNode | undefined => {
        let cc = children()
        if (cc.length === 0) {
            return undefined
        } else if (cc.length === 1) {
            return cc[0].first_node_with_variations
        } else {
            return self
        }
    }

    let self = {
        get nags() {
            return nags()
        },
        set_nags,
        get path() {
            return step.path
        },
        get ply() {
            return step.ply
        },
        get san() {
            return step.san
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

            let cc = children()

            let exists = cc.find(_ => _.san === san)

            if (exists) {
                return exists
            }

            let child = TreeStepNode(ply + 1, pos, san, step.path)
            set_children([...cc, child])
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
        },
        
        get nb_first_variations() {
            return nb_first_variations()
        },
        get first_node_with_variations() {
            return first_node_with_variations()
        },
        get length() {
            let cc = children()
            if (cc.length > 1) {
                return 1
            }
            if (cc.length === 0) {
                return 0
            }
            let res = 1
            let i = cc[0]
            while (i?.children.length === 1) {
                res ++
                i = i.children[0]
            }
            return res
        }
    }
    return self
}

/*
const alekhine = `
[Event "e4 vs Minor Defences: Alekhine"]
[Site "https://lichess.org/study/F8wyMEli/XtCmR5GS"]
[Result "*"]
[UTCDate "2023.04.06"]
[UTCTime "17:47:58"]
[Variant "Standard"]
[ECO "B04"]
[Opening "Alekhine Defense: Modern Variation, Larsen-Haakert Variation"]
[Annotator "https://lichess.org/@/heroku"]

1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Nc6 (4... Nb6 5. a4 a5 6. Nc3 g6 (6... Bf5 7. d5 e6 8. dxe6 Bxe6 9. Bg5 Qd7 10. exd6 Bxd6 11. Nb5 Nd5 12. Nxd6+ Qxd6) 7. exd6 cxd6 (7... exd6 8. Bg5 f6 9. Bf4 d5 10. Bd3 Bd6 11. Bxd6 Qxd6 12. O-O O-O 13. Qd2) 8. d5 Bg7 9. Be3 O-O 10. Bd4 N8d7 11. Bxg7 Kxg7 12. Qd4+ Nf6 13. Nd2 Bd7 14. Nde4 Rc8 15. h4 h5 16. f3) (4... c6 5. Be2 g6 6. c4 Nc7 7. exd6 Qxd6 8. Nc3 Bg7 9. O-O O-O 10. h3 Ne6 11. Be3 Nf4 12. Re1) (4... Bf5 5. Bd3 Bxd3 6. Qxd3 e6 7. O-O Nc6 8. c4 Nb6 9. exd6 cxd6 10. Nc3 Be7 11. d5 Nb4 12. Qe4 e5 13. c5 dxc5 14. a3 Na6 15. Rd1 O-O) 5. c4 Nb6 6. e6 fxe6 7. Nc3 g6 8. h4 Bg7 9. Be3 e5 10. d5 Nd4 11. Nxd4 exd4 12. Bxd4 Bxd4 13. Qxd4 e5 14. Qe3 *
`
*/


export type PlayUciTreeReplayComponent = {
    steps: StepsTree,
    cursor_path: Path,
    cursor_path_step: Step | undefined,
    goto_path: (path: Path) => void,
    get_prev_path: () => Path | undefined,
    get_next_path: () => Path | undefined,
    get_last_path(): Path
    get_first_path(): Path | undefined
    goto_last_if_can(): void
    goto_next_if_can(): void
    goto_prev_if_can(): void
    goto_first_if_can(): void
    get_down_path(): Path | undefined
    goto_down_if_can(): void
    get_up_path(): Path | undefined
    goto_up_if_can(): void
    previous_branch_points_at_cursor_path: TreeStepNode[]
}

export function PlayUciTreeReplayComponent(pgn?: string): PlayUciTreeReplayComponent {

    let steps = StepsTree()

    if (pgn) {
        steps = parse_PGNS(pgn)[0].tree
    }

    let [cursor_path, set_cursor_path] = createSignal<Path>('')

    let sticky_paths: Path[] = []

    createEffect(on(cursor_path, (path: Path) => {
        steps.previous_branch_points(path)?.map(branch => {
            if (!sticky_paths.includes(branch.path)) {
                steps.siblings_of(branch.path)?.forEach(sibling => {
                    sticky_paths = sticky_paths
                    .filter(_ => _ !== sibling.path)
                })

                sticky_paths.push(branch.path)
            }
        })
    }))

    const goto_path = (path: Path) => {
        set_cursor_path(path)
    }

    const get_prev_path = () => {
        let c = cursor_path()

        if (c === '') {
            return undefined
        }

        return c.split(' ').slice(0, -1).join(' ')
    }

    const get_next_path = () => {
        let c = cursor_path()

        let children = steps.find_at_path(c)?.children ?? steps.root

        if (children.length === 1) {
            return children[0].path
        }

        return children.find(_ => sticky_paths.includes(_.path))?.path ?? children[0]?.path
    }

    const get_first_path = () => {
        let pc = steps.find_parent_and_child_at_path(cursor_path())

        if (!pc) {
            return undefined
        }

        let i = pc

        if (!i[0]) {
            return ''
        }

        if (i[0].children.length > 1) {
            return i[0].path
        }

        while (true) {
            if (!i[0]) {
                break
            }
            if (i[0].children.length > 1) {
                break
            }

            let _i = steps.find_parent_and_child_at_path(i[0].path)

            if (!_i) {
                break
            }
            i = _i
        }
        return i[1].path
    }

    const get_last_path = () => {
        let step = steps.find_at_path(cursor_path())

        if (!step) {
            return steps.root.find(_ => sticky_paths.includes(_.path))?.path ?? steps.root[0]?.path
        }

        let i = step

        if (i.children.length > 1) {
            return i.children.find(_ => sticky_paths.includes(_.path))?.path ?? i.children[0]?.path
        }

        while (i.children.length === 1) {
            i = i.children[0]
        }
        return i.path
    }

    const get_up_path = () => {
        let pc = steps.find_parent_and_child_at_path(cursor_path())

        if (!pc) {
            return undefined
        }

        let cc: TreeStepNode[] = pc[0]?.children ?? []

        if (!pc[0]) {
            cc = steps.root
        } else if (pc[0].children.length === 1) {
            while (true) {
                pc = steps.find_parent_and_child_at_path(pc[0].path)
                if (!pc) {
                    return undefined
                }

                if (!pc[0]) {
                    cc = steps.root
                    break
                }

                if (pc[0].children.length > 1) {
                    cc = pc[0].children
                    break
                }
            }
        }

        let i = cc.indexOf(pc[1])

        let c = cc[i - 1]

        if (!c) {
            return undefined
        }

        return c.path
    }

    const get_down_path = () => {
        let pc = steps.find_parent_and_child_at_path(cursor_path())

        if (!pc) {
            return undefined
        }

        let cc: TreeStepNode[] = pc[0]?.children ?? []

        if (!pc[0]) {
            cc = steps.root
        } else if (pc[0].children.length === 1) {
            while (true) {
                pc = steps.find_parent_and_child_at_path(pc[0].path)
                if (!pc) {
                    return undefined
                }

                if (!pc[0]) {
                    cc = steps.root
                    break
                }

                if (pc[0].children.length > 1) {
                    cc = pc[0].children
                    break
                }
            }
        }

        let i = cc.indexOf(pc[1])

        let c = cc[i + 1]

        if (!c) {
            return undefined
        }

        return c.path
    }




    return {
        steps,
        get cursor_path() {
            return cursor_path()
        },
        set cursor_path(path: Path) {
            set_cursor_path(path)
        },
        get cursor_path_step() {
            return steps.find_at_path(cursor_path())?.step
        },
        goto_path,
        get_prev_path,
        get_next_path,
        goto_prev_if_can() {
            let res = get_prev_path()
            if (res !== undefined) {
                goto_path(res)
            }
        },
        goto_next_if_can() {
            let res = get_next_path()
            if (res !== undefined) {
                goto_path(res)
            }
        },
        get_first_path,
        get_last_path,
        get_up_path,
        get_down_path,
        goto_up_if_can() {
            let res = get_up_path()
            if (res !== undefined) {
                goto_path(res)
            }
        },
        goto_down_if_can() {
            let res = get_down_path()
            if (res !== undefined) {
                goto_path(res)
            }
        },
        goto_last_if_can() {
            let res = get_last_path()
            if (res !== undefined) {
                goto_path(res)
            }
        },
        goto_first_if_can() {
            let res = get_first_path()
            if (res !== undefined) {
                goto_path(res)
            }
        },
        get previous_branch_points_at_cursor_path() {
            return steps.previous_branch_points(cursor_path()) ?? []
        }
    }
}


export function PlayUciTreeReplay(props: { play_replay: PlayUciTreeReplayComponent, on_context_menu?: (e: MouseEvent, _: Path) => void }) {

    const steps = props.play_replay.steps

    let $moves_el: HTMLElement
    createEffect(() => {

        let cursor_path = props.play_replay.cursor_path
        let cont = $moves_el.parentElement
        if (!cont) {
            return
        }

        const target = $moves_el.querySelector<HTMLElement>('.on-path-end')
        if (!target) {
            cont.scrollTop = cursor_path.length > 0 ? 99999 : 0
            return
        }

        let top = target.offsetTop - cont.offsetHeight / 2 + target.offsetHeight
        cont.scrollTo({ behavior: 'smooth', top })
    })

    const on_key_down = (e: KeyboardEvent) => {
        let catched = false
        if (e.key === 'ArrowLeft') {
            props.play_replay.goto_prev_if_can()
            catched = true
        }
        if (e.key === 'ArrowRight') {
            props.play_replay.goto_next_if_can()
            catched = true
        }
        if (e.key === 'ArrowUp') {
            props.play_replay.goto_up_if_can()
            catched = true
        }
        if (e.key === 'ArrowDown') {
            props.play_replay.goto_down_if_can()
            catched = true
        }
        if (catched) {
            e.preventDefault()
        }
    }

    onMount(() => {

        document.addEventListener('keydown', on_key_down)

        onCleanup(() => {
            document.removeEventListener('keydown', on_key_down)
        })
    })


    return (<>
        <div class='replay-tree'>
            <div class='moves-wrap'>
                <div ref={_ => $moves_el = _} class='moves'>
                    <NodesShorten nodes={steps.root}
                        cursor_path={props.play_replay.cursor_path}
                        on_set_cursor={(path: Path) => props.play_replay.cursor_path = path}
                        on_context_menu={(e: MouseEvent, path: Path) => props.on_context_menu?.(e, path)}
                         />
                </div>
            </div>
            <div class='branch-sums'>
                <button 
                    disabled={props.play_replay.get_up_path() === undefined}
                    class={"fbt prev" + (props.play_replay.get_up_path() === undefined ? ' disabled' : '')}
                    onClick={() => props.play_replay.goto_up_if_can()}
                    data-icon="" />
                <button 
                    disabled={props.play_replay.get_down_path() === undefined} 
                    class={"fbt prev" + (props.play_replay.get_down_path() === undefined ? ' disabled' : '')} 
                    onClick={() => props.play_replay.goto_down_if_can()} 
                    data-icon="" />

                <For each={props.play_replay.previous_branch_points_at_cursor_path}>{branch =>
                    <div class='fbt' onClick={() => props.play_replay.cursor_path = branch.path}>
                        <Show when={branch.ply & 1}>
                            <span class='index'>{ply_to_index(branch.ply)}</span>
                        </Show>
                        {branch.san}
                    </div>
                }</For>
            </div>
            <div class='replay-jump'>
                <button disabled={props.play_replay.get_first_path() === undefined} 
                    class={"fbt first" + (props.play_replay.get_first_path() === undefined ? ' disabled' : '')}
                    onClick={() => props.play_replay.goto_first_if_can()} data-icon="" />
                <button disabled={props.play_replay.get_prev_path() === undefined} 
                    class={"fbt prev" + (props.play_replay.get_prev_path() === undefined ? ' disabled' : '')} 
                    onClick={() => props.play_replay.goto_prev_if_can()} data-icon="" />
                <button disabled={props.play_replay.get_next_path() === undefined} 
                    class={"fbt next" + (props.play_replay.get_next_path() === undefined ? ' disabled' : '')}
                    onClick={() => props.play_replay.goto_next_if_can()} data-icon="" />
                <button disabled={props.play_replay.get_last_path() === undefined} 
                    class={"fbt last" + (props.play_replay.get_last_path() === undefined ? 'disabled' : '')} 
                    onClick={() => props.play_replay.goto_last_if_can()} data-icon="" />
            </div>

        </div>
    </>)
}


function NodesShorten(props: {nodes: TreeStepNode[], cursor_path: Path, on_set_cursor: (_: Path) => void, on_context_menu: (e: MouseEvent, _: Path) => void }) {
    return (<>
    <Show when={props.nodes.length === 1}>
        <StepNode {...props} node={props.nodes[0]} />
        <NodesShorten {...props} nodes={props.nodes[0].children} />
    </Show>
    <Show when={props.nodes.length > 1}>
        <div class='lines'>
            <Key each={props.nodes} by="path">{node =>
                <div class='line'>
                    <Show when={props.cursor_path.startsWith(node().path)} fallback={
                        <>
                            <StepNode {...props} node={node()} show_index={true} collapsed={true} />
                            <span class='collapsed'>..{node().length} {node().nb_first_variations}</span>
                        </>
                    }>
                        <>
                            <StepNode {...props} node={node()} show_index={true} />
                            <NodesShorten {...props} nodes={node().children} />
                        </>
                    </Show>
                </div>
            }</Key>
        </div>
        </Show >
    </>)
}

function StepNode(props: { node: TreeStepNode, show_index?: boolean, collapsed?: boolean, cursor_path: Path, on_set_cursor: (_: Path) => void, on_context_menu: (e: MouseEvent, _: Path) => void }) {

    let show_index = createMemo(() => props.node.ply % 2 === 0 || props.show_index)
    let dots = createMemo(() => props.node.ply % 2 === 0 ? '.' : '...')

    const path = createMemo(() => props.node.path)

    const on_path = createMemo(() => props.cursor_path.startsWith(path()))
    const on_path_end = createMemo(() => path() === props.cursor_path)

    const klass = createMemo(() => {
        let res = ['move']

        if (props.collapsed) {
            res.push('collapsed')
        }

        if (on_path()) {
            res.push('on-path')
        }

        if (on_path_end()) {
            res.push('on-path-end')
        }

        return res.join(' ')
    })

    return (<>
    <div onContextMenu={(e) => { e.preventDefault(); props.on_context_menu(e, props.node.path) }} onClick={() => { props.on_set_cursor(props.node.path) } } class={klass()}>
        <Show when={show_index()}><span class='index'>{Math.floor(props.node.ply / 2) + 1}{dots()}</span></Show>
        {props.node.san}
    </div>
    </>)
}

export const ply_to_index = (ply: number) => {
    let res = Math.floor(ply / 2) + 1
    return `${res}.` + (ply % 2 === 1 ? '..' : '')
}


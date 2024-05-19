
import { Chess, Position, makeUci, parseUci } from 'chessops'
import { INITIAL_FEN, makeFen, parseFen } from 'chessops/fen'
import { PgnNodeData, ChildNode, parsePgn } from 'chessops/pgn'
import { makeSan, parseSan } from 'chessops/san'
import { Signal, createSignal, untrack } from 'solid-js'
import { FinalEvalAccuracy, ceval } from './chess_ceval'
import { chessgroundDests } from 'chessops/compat'

export { INITIAL_FEN } from 'chessops/fen'

export const fen_color = (fen: string) => {
    return parseFen(fen).unwrap().turn
}

export function legal_moves(fen: string) {
    let i_pos = Chess.fromSetup(parseFen(fen).unwrap()).unwrap()

    let res = []

    for (let [from, to] of chessgroundDests(i_pos)) {
        res.push(...to.map(_ => from+_))
    }

    return res
}

export class Pgn {


    static make_many = (pgn: string) => {
        return parsePgn(pgn).flatMap(g => {

            let event = g.headers.get('Event')
            let site = g.headers.get('Site')

            let white = g.headers.get('White')
            let black = g.headers.get('Black')
            let puzzle = g.headers.get('Puzzle')

            let section = g.headers.get('Section')
            let chapter = g.headers.get('Chapter')

            let fen = g.headers.get('FEN')


            let child = g.moves.children[0]

            if (!child) {
                return []
            }


            let before_fen = fen ?? INITIAL_FEN
            let san = child.data.san
            let i_pos = Chess.fromSetup(parseFen(before_fen).unwrap()).unwrap()
            let move = parseSan(i_pos, san)!
            let uci = makeUci(move)

            let t = MoveTree.make(before_fen, [uci])

            append_children(t, child, i_pos, [])

            function append_children(t: MoveTree, child: ChildNode<PgnNodeData>, before_pos: Position, path: string[]) {
                let move = parseSan(before_pos, child.data.san)!

                let after_pos = before_pos.clone()
                after_pos.play(move)
                let uci = makeUci(move)
                t.append_uci(uci, path)
                child.children.forEach(child => {
                    append_children(t, child, after_pos, [...path, uci])
                })
            }

            let res = new Pgn({
                event, site, white, black,
                puzzle, section, chapter, fen
             }, t)
            return res
        })
    }


    get event() {
        return this.headers.event
    }

    get site() {
        return this.headers.site
    }

    get white() {
        return this.headers.white
    }

    get black() {
        return this.headers.black
    }

    get puzzle() {
        return this.headers.puzzle
    }

    get section() {
        return this.headers.section
    }

    get chapter() {
        return this.headers.chapter
    }

    get fen() {
        return this.headers.fen
    }

    constructor(
        readonly headers: PgnHeaders,

        readonly tree: MoveTree) { }
}

export type PgnHeaders = {
    section?: string,
    chapter?: string,
    event?: string,
    site?: string,
    white?: string,
    black?: string,
    puzzle?: string,
    fen?: string
}

export class TreeNode<V> {

    static color_of(_: TreeNode<MoveData>) {
        return fen_color(_.data.before_fen)
    }

    static make = <V>(data: V) => {
        return new TreeNode<V>(data)
    }

    get clone() {

        let res = new TreeNode({ ...this.data })
        res.children = this.children.map(_ => _.clone)

        return res
    }

    get all_leaves(): TreeNode<V>[] {
        if (this.children.length === 0) {
            return [this]
        } else {
            return this.children.flatMap(_ => _.all_leaves)
        }
    }

    get length() {

        if (this.children.length > 1) {
            return 1
        }

        if (this.children.length === 0) {
            return 0
        }

        let res = 1
        let i = this.children[0]

        while (i?.children.length === 1) {
            res++
            i = i.children[0]
        }
        return res
    }

    get nb_first_variations() {
        return this.children_first_variations?.length ?? 0
    }

    get first_node_with_variations(): TreeNode<V> | undefined {
        if (this.children.length === 0) {
            return undefined
        } else if (this.children.length === 1) {
            return this.children[0].first_node_with_variations
        } else {
            return this
        }
    }

    get children_first_variations() {
        return this.first_node_with_variations?.children
    }

    get children() {
        return this._children[0]()
    }

    set children(c: TreeNode<V>[]) {
        this._children[1](c)
    }

    _children: Signal<TreeNode<V>[]>

    constructor(readonly data: V) {
        this._children = createSignal([] as TreeNode<V>[])
    }
}


export type MoveScoreData = {
    path: string[],
    uci: string,
    score: number
}


export class MoveScoreTree {

    static make = (tree: MoveTree) => {

        function score_node(node: TreeNode<MoveData>, i: number) {


            let p_l = node.data.path.length
            let l = node.length
            let v = node.nb_first_variations
            
            let score = ((- i) * 100 + (1 / (p_l / 40)) * 10 + (l / 20) * 10) + (v + 1) * 100

            let res = TreeNode.make({ path: node.data.path, uci: node.data.uci, score })

            let n = node.children.length + i
            let s = n * (n + 1) / 2
            res.children = node.children.map((_, ii) => score_node(_, (ii + i) / s))

            return res
        }

        function calc_score(node: TreeNode<MoveScoreData>): number {
            let score = node.data.score

            return score + node.children.map(_ => calc_score(_))
            .reduce((a, b) => a + b, 0)
        }

        function normalize(node: TreeNode<MoveScoreData>, total: number) {
            node.data.score /= total
            node.children.forEach(_ => normalize(_, total))
        }


        let res = score_node(tree.root, 1)

        let total = calc_score(res)

        normalize(res, total)

        return new MoveScoreTree(res)
    }


    get clone() {
        return new MoveScoreTree(this.root.clone)
    }

    constructor(readonly root: TreeNode<MoveScoreData>) {}

    get progress_paths() {
        function find_vs(node: TreeNode<MoveScoreData>, cur: string[][], res: string[][][]) {
            cur.push(node.data.path)
            if (node.children.length === 0) {
                res.push(cur)
            } else if (node.children.length === 1) {
                find_vs(node.children[0], cur, res)
            } else {
                res.push(cur)
                node.children.forEach(child => {
                    find_vs(child, [], res)
                })
            }
        }
        let res: string[][][] = []
        find_vs(this.root, [], res)
        return res
    }


    _traverse_path(path: string[]) {

        let res = undefined
        let i = [this.root]
        for (let p of path) {
            res = i.find(_ => _.data.uci === p)!
            i = res?.children || this.root
        }
        return res
    }

    get_children(path: string[]) {
        let i = this._traverse_path(path)
        return i?.children.map(_ => _.data)
    }

    get_at(path: string[]) {
        let i = this._traverse_path(path)
        return i?.data
    }

    delete_at(path: string[]) {
        const parent = this._traverse_path(path.slice(0, -1))
        if (parent) {
            parent.children = parent.children.filter(_ => _.data.path.join('') !== path.join(''))
        }
    }
}

export type MoveData = {
    path: string[],
    before_fen: string,
    after_fen: string,
    san: string,
    uci: string,
    ply: number,
    comments?: string,
    eval_accuracy?: FinalEvalAccuracy
}

export class MoveTree {

    static make = (before_fen: string, ucis: string[]) => {
        let uci = ucis[0]
        let rest = ucis.slice(1)
        let res = new MoveTree(TreeNode.make(MoveTree.make_data(before_fen, uci, 1, [])))
        res.append_ucis(rest)
        return res
    }

    get initial_color() {
        return TreeNode.color_of(this.root)
    }

    get clone() {
        return new MoveTree(this.root.clone)
    }
    constructor(public root: TreeNode<MoveData>) {}

    static make_data(before_fen: string, uci: string, ply: number, path: string[]) {
        let setup = parseFen(before_fen).unwrap()
        let pos = Chess.fromSetup(setup).unwrap()
        let move = parseUci(uci)!
        let san = makeSan(pos, move)
        pos.play(move)
        return {
            path: [...path, uci],
            ply,
            before_fen,
            san,
            after_fen: makeFen(pos.toSetup()),
            uci,
        }
    }

    _traverse_path(path: string[]) {

        
        let res = undefined
        let i = [this.root]
        for (let p of path) {
            res = i.find(_ => _.data.uci === p)
            if (!res) {
                return undefined
            }
            i = res.children
        }
        return res
    }

    _find_path(ucis: string[]): [string[], TreeNode<MoveData>, string[]] {
        let path = []
        let rest = []
        let res = this.root
        let i = [res]
        let split = false
        for (let p of ucis) {

            if (split) {
                rest.push(p)
            } else {
                let i_res = i.find(_ => _.data.uci === p)!
                if (!i_res) {
                    split = true
                    rest.push(p)
                } else {
                    path.push(p)
                    res = i_res
                    i = untrack(() => res.children)
                }
            }
        }

        return [path, res, rest]
    }


    get all_leaves() {
        return this.root.all_leaves.map(_ => _.data)
    }

    get_children(path: string[]) {
        let i = this._traverse_path(path)
        return i?.children.map(_ => _.data)
    }

    async request_ceval_and_get_at(path: string[]) {
        let i = this.get_at(path)
        if (i) {
            i.eval_accuracy = await ceval.request_move_data(i.before_fen, i.after_fen)
            return i
        }
    }


    collect_branch_sums(path: string[]) {
        let res = []
        let i = [this.root]
        let add_variation = false
        for (let p of path) {
            let next = i.find(_ => _.data.uci === p)

            if (!next) {
                return undefined
            }

            if (add_variation) {
                res.push(next.data)
                add_variation = false
            }
            if (next.children.length > 1) {
                add_variation = true
            }
            i = next.children
        }
        return res
    }

    get_at(path: string[]) {
        let i = this._traverse_path(path)
        return i?.data
    }

    delete_at(path: string[]) {
        const parent = this._traverse_path(path.slice(0, -1))
        if (parent) {
            parent.children = parent.children.filter(_ => _.data.path.join('') !== path.join(''))
        }
    }

    append_uci(uci: string, path: string[] = []) {
        this.append_ucis([...path, uci])
    }

    append_ucis(ucis: string[]) {
        let [path, i, rest] = this._find_path(ucis)
        for (let uci of rest) {
            let child = TreeNode.make(
                MoveTree.make_data(i.data.after_fen, uci, i.data.ply + 1, path)
            )
            let i_children = untrack(() => i.children)
            i.children = [...i_children, child]
            i = child
            path = [...path, uci]
        }
    }
}


import { Chess, Position, makeUci, parseUci } from 'chessops'
import { INITIAL_FEN, makeFen, parseFen } from 'chessops/fen'
import { PgnNodeData, ChildNode, parsePgn } from 'chessops/pgn'
import { makeSan, parseSan } from 'chessops/san'
import { Signal, createSignal, untrack } from 'solid-js'

export { INITIAL_FEN } from 'chessops/fen'

export class Pgn {


    static make_many = (pgn: string) => {
        return parsePgn(pgn).map(g => {

            let event = g.headers.get('Event')
            let site = g.headers.get('Site')

            let white = g.headers.get('White')
            let black = g.headers.get('Black')
            let puzzle = g.headers.get('Puzzle')

            let fen = g.headers.get('FEN')

            let child = g.moves.children[0]

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
                puzzle
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

    constructor(
        readonly headers: PgnHeaders,

        readonly tree: MoveTree) { }
}

export type PgnHeaders = {
   event?: string, 
   site?: string,
   white?: string,
   black?: string,
   puzzle?: string,
}

export type MoveData = {
    path: string[],
    before_fen: string,
    after_fen: string,
    san: string,
    uci: string,
    ply: number,
    comments?: string,
}


export class TreeNode<V> {

    static make = <V>(data: V) => {
        return new TreeNode<V>(data)
    }

    get clone() {

        let res = new TreeNode({ ...this.data })
        res.children = this.children.map(_ => _.clone)

        return res
    }


    get length() {

        if (this.children.length > 1) {
            return 1
        }

        let res = 2
        let i = this.children[0]

        while (i?.children.length === 1) {
            res++
            i = i.children[0]
        }
        return res
    }

    get nb_first_variations() {

        if (this.children.length > 1) {
            return this.children.length
        }

        let i = this.children[0]

        while (i?.children.length === 1) {
            i = i.children[0]
        }
        return i?.children.length ?? 0

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

export class MoveTree {

    static make = (before_fen: string, ucis: string[]) => {
        let uci = ucis[0]
        let rest = ucis.slice(1)
        let res = new MoveTree(TreeNode.make(MoveTree.make_data(before_fen, uci, 1, [])))
        res.append_ucis(rest)
        return res
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
            res = i.find(_ => _.data.uci === p)!
            i = res?.children || this.root
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

    get_children(path: string[]) {
        let i = this._traverse_path(path)
        return i?.children.map(_ => _.data)
    }

    get_at(path: string[]) {
        let i = this._traverse_path(path)
        return i?.data
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

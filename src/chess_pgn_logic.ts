
import { Chess, Position, makeUci, parseUci } from 'chessops'
import { INITIAL_FEN, makeFen, parseFen } from 'chessops/fen'
import { PgnNodeData, ChildNode, parsePgn } from 'chessops/pgn'
import { makeSan, parseSan } from 'chessops/san'


export class Pgn {
    static make = (pgn: string) => {

        let g = parsePgn(pgn)[0]
        let event = g.headers.get('Event')!
        let site = g.headers.get('Site')!

        let child = g.moves.children[0]

        let before_fen = INITIAL_FEN
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
        
        let res = new Pgn(event, site, t)
        return res
    }



    constructor(readonly event: string, readonly site: string, readonly tree: MoveTree) {}
}

export type MoveData = {
    path: string[],
    before_fen: string,
    after_fen: string,
    san: string,
    uci: string,
    ply: number,
    comments?: string
}


export type TreeNode<V> = {
    data: V
    children: TreeNode<V>[]
}

class MoveTree {

    static make = (before_fen: string, ucis: string[]) => {
        let uci = ucis[0]
        let rest = ucis.slice(1)
        let res = new MoveTree({ data: MoveTree.make_data(before_fen, uci, 1, []), children: [] })
        res.append_ucis(rest)
        return res
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

        let res = this.root
        let i = [res]
        for (let p of path) {
            res = i.find(_ => _.data.uci === p)!
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
                    i = res.children
                }
            }
        }

        return [path, res, rest]
    }

    get_children(path: string[]) {
        let i = this._traverse_path(path)
        return i.children.map(_ => _.data)
    }

    get_at(path: string[]) {
        let i = this._traverse_path(path)
        return i.data
    }

    append_uci(uci: string, path: string[] = []) {
        this.append_ucis([...path, uci])
    }

    append_ucis(ucis: string[]) {
        let [path, i, rest] = this._find_path(ucis)
        for (let uci of rest) {
            let child = {
                data: MoveTree.make_data(i.data.after_fen, uci, i.data.ply + 1, path),
                children: []
            }
            i.children.push(child)
            i = child
            path = [...path, uci]
        }
    }

    delete_children(path: string[]) {

        let i = this._traverse_path(path)
        i.children = []
    }

    delete_path(path: string[]) {
        let i = this._traverse_path(path.slice(0, -1))

        let uci = path[path.length - 1]
        let index = i.children.findIndex(_ => _.data.uci === uci)
        i.children.splice(index, 1)
    }

}

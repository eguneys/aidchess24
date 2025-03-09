import { Chess, Color, makeUci, Position } from "chessops"
import { INITIAL_FEN, parseFen } from "chessops/fen"
import { ChildNode, parsePgn, PgnNodeData } from "chessops/pgn"
import { parseSan } from "chessops/san"
import { Path } from "../components/step_types"

export type PGN = {
    orientation?: Color,
    chapter?: string,
    event?: string,
    site?: string,
    white?: string,
    black?: string,
    fen?: string,
//    tree: StepsTree
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

        //let tree = StepsTree(gen_id8())

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

            //tree.add_child_san(path, san)!
            //.set_nags(nags ?? [])

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
            //tree
        }
    })
}


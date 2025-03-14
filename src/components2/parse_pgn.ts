import { Chess, Color, makeUci, Position } from "chessops"
import { INITIAL_FEN, makeFen, parseFen } from "chessops/fen"
import { ChildNode, parsePgn, PgnNodeData } from "chessops/pgn"
import { parseSan } from "chessops/san"
import { NAG, Path, Ply, Step } from "../store/step_types"

function pos_fen(pos: Position) {
    return makeFen(pos.toSetup())
}

export type PGN = {
    orientation?: Color,
    chapter?: string,
    event?: string,
    site?: string,
    white?: string,
    black?: string,
    fen?: string,
    flat_steps: Record<Path, Step[]>
    flat_comments: Record<Path, string[]>
    flat_nags: Record<Path, NAG[]>
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

        let flat_steps: Record<Path, Step[]> = {}
        let flat_comments: Record<Path, string[]> = {}
        let flat_nags: Record<Path, NAG[]> = {}

        g.moves.children.forEach(child => {
            append_children(child, i_pos, 0, '')
        })

        function append_children(child: ChildNode<PgnNodeData>, before_pos: Position, base_ply: Ply, base_path: Path) {
            let san = child.data.san
            let move = parseSan(before_pos, san)!

            let after_pos = before_pos.clone()
            after_pos.play(move)
            let uci = makeUci(move)
            let nags = child.data.nags


            let flat_steps_res = flat_steps[base_path]
            if (!flat_steps_res) {
                flat_steps_res = []
                flat_steps[base_path] = flat_steps_res
            }


            let next_path = base_path.length === 0 ? uci : `${base_path} ${uci}`

            flat_steps_res.push({
                path: next_path,
                ply: base_ply + 1,
                before_fen: pos_fen(before_pos),
                fen: pos_fen(after_pos),
                uci,
                san,
            })

            if (nags) {
                flat_nags[next_path] = nags
            }


            child.children.forEach(child => {
                append_children(child, after_pos, base_ply + 1, next_path)
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
            flat_steps,
            flat_nags,
            flat_comments
        }
    })
}


import { Chess, makeUci, Position } from "chessops"
import { INITIAL_FEN, makeFen, parseFen } from "chessops/fen"
import { parseSan } from "chessops/san"

export type FEN = string
export type UCI = string
export type SAN = string
export type Ply = number
export type Path = string

export type Step = {
    path: Path,
    ply: Ply,
    before_fen: FEN,
    fen: FEN,
    uci: UCI,
    san: SAN
}

export const fen_is_end = (fen: FEN) => Chess.fromSetup(parseFen(fen).unwrap()).unwrap().isEnd()

export function make_step_and_play(ply: Ply, pos: Position, san: SAN, base_path: Path): Step {
    let move = parseSan(pos, san)!
    let uci = makeUci(move)

    let before_fen = makeFen(pos.toSetup())

    pos.play(move)

    let fen = makeFen(pos.toSetup())

    let path = base_path.length === 0 ? uci : `${base_path} ${uci}`

    return {
        path,
        ply,
        before_fen,
        fen,
        uci,
        san
    }
}

type StepsSingle = Step[]

export function push_san(san: SAN, res: StepsSingle, pos?: Position) {
    let last = res[res.length - 1]
    if (!pos) {
        pos = Chess.fromSetup(parseFen(last?.fen ?? INITIAL_FEN).unwrap()).unwrap()
    }
    return [...res, make_step_and_play((last?.ply ?? 0) + 1, pos, san, last?.path ?? '')]
}

export function build_steps(sans: SAN[], fen: FEN = INITIAL_FEN): StepsSingle {
    let res: StepsSingle = []

    let pos = Chess.fromSetup(parseFen(fen).unwrap()).unwrap()
    for (let san of sans) {
        res = push_san(san, res, pos)
    }

    return res
}


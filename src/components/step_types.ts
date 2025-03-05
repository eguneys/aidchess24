import { Chess, makeUci, Position } from "chessops"
import { INITIAL_FEN, makeFen, parseFen } from "chessops/fen"
import { parseSan } from "chessops/san"

export type FEN = string
export type UCI = string
export type SAN = string
export type Ply = number
export type Path = string
export type NAG = number

export type Step = {
    path: Path,
    ply: Ply,
    before_fen: FEN,
    fen: FEN,
    before_uci?: UCI,
    uci: UCI,
    san: SAN,
    comments?: string
}

export const fen_pos = (fen: FEN) => Chess.fromSetup(parseFen(fen).unwrap()).unwrap()
export const fen_is_end = (fen: FEN) => fen_pos(fen).isEnd()
export const fen_turn = (fen: FEN) => fen_pos(fen).turn


export function make_step_and_play(ply: Ply, pos: Position, san: SAN, base_path: Path, before_uci?: UCI): Step {
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
        before_uci,
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
    return [...res, make_step_and_play((last?.ply ?? 0) + 1, pos, san, last?.path ?? '', last?.uci)]
}

export function build_steps(sans: SAN[], fen: FEN = INITIAL_FEN): StepsSingle {
    let res: StepsSingle = []

    let pos = Chess.fromSetup(parseFen(fen).unwrap()).unwrap()
    for (let san of sans) {
        res = push_san(san, res, pos)
    }

    return res
}


export const GLYPHS = ['!!', '!', '!?', '?!', '?', '??']
export const GLYPH_NAMES = ['brilliant', 'good', 'interesting', 'inaccuracy', 'mistake', 'blunder']

export type GLYPH = typeof GLYPHS[number]

export function glyph_to_nag(glyph: GLYPH) {
    switch (glyph) {
        case "!": return 1
        case "?": return 2
        case "!!": return 3
        case "??": return 4
        case "!?": return 5
        case "?!": return 6
    }
    return 0
}

export function nag_to_glyph(nag: NAG) {

    switch (nag) {
        case 1: return '!'
        case 2: return '?'
        case 3: return '!!'
        case 4: return '??'
        case 5: return '!?'
        case 6: return '?!'
    }
    return ''
}
import { Card } from "ts-fsrs"
import { fen_turn } from "../chess_pgn_logic"

export type NewRepeat = {
    id: number,
    name: string,
    sections: { study_id: string, section_name: string } []
}

export type UciWithPath = {
    sections_id: number,
    uci: string,
    path: string[]
}

export type RepeatMoveItem = {
    repeat_id: number,
    fen: string,
    ucis: UciWithPath[]
}

export type NewRepeatWithMoves = NewRepeat & {
    moves: (RepeatMoveItem & { card: Card }) []
}


export class DueFilters {
    constructor(readonly repeat: NewRepeatWithMoves) {}

    get total() {
        return this.repeat.moves
    }


    get due() {
        return this.repeat.moves.filter(_ => _.card.due.getTime() <= new Date().getTime())
    }

    get due_white() {
        return this.due.filter(_ => fen_turn(_.fen) === 'white')
    }

    get due_black() {
        return this.due.filter(_ => fen_turn(_.fen) === 'black')
    }

    get due_10() {
        return this.due.filter(_ => _.ucis[0].path.length <= 20)
    }

    get due_10_20() {
        return this.due.filter(_ => _.ucis[0].path.length >= 20 && _.ucis[0].path.length <= 40)
    }

    get due_20plus() {
        return this.due.filter(_ => _.ucis[0].path.length >= 40)
    }
}

export type DueFilterKey = 'white' | 'black' | 'first-ten' | 'ten-twenty' | 'twenty-plus'


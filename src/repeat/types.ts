import { Card } from "ts-fsrs"

export type NewRepeat = {
    id: number,
    name: string,
    sections: { study_id: string, section_name: string } []
}

export type RepeatMoveItem = {
    repeat_id: number,
    fen: string,
    ucis: string[]
}

export type NewRepeatWithMoves = NewRepeat & {
    moves: (RepeatMoveItem & Card)[]
}
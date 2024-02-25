import { povAccuracy, povChances } from "./chess_winningChances"

export type EvalScore = {
    mate?: number
    cp?: number
}
export type FinalEvalAccuracy = {
    before_cp: EvalScore,
    after_cp: EvalScore,
    accuracy: number,
    multi_pvs4: string[]
}

class CEval {
    async request_move_data(before_fen: string, after_fen: string): Promise<FinalEvalAccuracy> {
        console.log(before_fen, after_fen)

        let before_cp = {
            cp: Math.random() * 1000
        }
        let after_cp = {
           cp: before_cp.cp - Math.random() * 200
        }
        let accuracy = povAccuracy('white', before_cp, after_cp)

        console.log(before_cp, after_cp, accuracy)
        return {
            before_cp,
            after_cp,
            accuracy,
            multi_pvs4: []
        }
    }

}


export const ceval = new CEval()
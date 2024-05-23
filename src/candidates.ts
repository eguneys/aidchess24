import { Signal } from "solid-js"
import { makePersistedNamespaced } from "./storage"

type CandidatesPosition = {
    fen: string,
    candidates: string[]
}

const parsePuzzles = (csv: string) => {
    return csv.trim().split('\n').map(_ => {
        let [_scp, snb_cd, fen, pvs] = _.split(',')
        //let cp = parseInt(scp)
        let nb_cd = parseInt(snb_cd)

        let candidates = pvs.split('/').map(_ => {
            let [uci, _scp] = _.split(' ')
            //let cp = parseInt(scp)

            return uci
        }).slice(0, nb_cd)

        return {
            fen,
            candidates,
        }
    })
}

const fetch_candidates = () => fetch('puzzles/puzzles.csv')
.then(_ => _.text())
.then(_ => parsePuzzles(_))

class CandidatesRepertoire {


    i_next: Signal<number>
    all!: CandidatesPosition[]

    constructor() {
        this.i_next = makePersistedNamespaced(0, 'candidates_i_next')
    }

    async fetch_candidates() {
        this.all = await fetch_candidates()
    }

    get_current_8() {
        let i_next = this.i_next[0]()
        return this.all.slice(i_next, i_next + 8)
    }

    get_next_8() {
        let i_next = this.i_next[0]() + 1

        if (i_next + 8 > this.all.length) {
            i_next = 0
        }
        this.i_next[1](i_next)

        return this.get_current_8()
    }
}


let res = new CandidatesRepertoire()
await res.fetch_candidates()

export default res
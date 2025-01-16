import { Chess, makeUci, Position } from "chessops"
import { INITIAL_FEN, makeFen, parseFen } from "chessops/fen"
import { parseSan } from "chessops/san"
import { createMemo, createSignal, For, mapArray, Show } from "solid-js"
import './PlayUciReplay.scss'

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

function make_step_and_play(ply: Ply, pos: Position, san: SAN, base_path: Path): Step {
    let move = parseSan(pos, san)!
    let uci = makeUci(move)

    let before_fen = makeFen(pos.toSetup())

    pos.play(move)

    let fen = makeFen(pos.toSetup())

    let path = `${base_path} ${uci}`

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

function push_san(san: SAN, res: StepsSingle, pos?: Position) {
    let last = res[res.length - 1]
    if (!pos) {
        pos = Chess.fromSetup(parseFen(last?.fen ?? INITIAL_FEN).unwrap()).unwrap()
    }
    return [...res, make_step_and_play((last?.ply ?? 0) + 1, pos, san, last?.path ?? '')]
}

function build_steps(sans: SAN[], fen: FEN = INITIAL_FEN): StepsSingle {
    let res: StepsSingle = []

    let pos = Chess.fromSetup(parseFen(fen).unwrap()).unwrap()
    for (let san of sans) {
        res = push_san(san, res, pos)
    }

    return res
}

export type PlayUciSingleReplayComponent = {
    initial_fen: FEN,
    plies: Ply[],
    sans: SAN[],
    ply_sans: string[],
    steps: Step[],
    last_step: Step | undefined,
    ply_step: Step | undefined,
    play_san: (san: SAN) => void,
    goto_ply: (ply: Ply) => void
    get_prev_ply: () => Ply | undefined,
    get_next_ply: () => Ply | undefined,
    goto_prev_ply_if_can: () => void,
    goto_next_ply_if_can: () => void,
    is_on_last_ply: boolean
}

export function PlayUciSingleReplayComponent(initial_fen: FEN = INITIAL_FEN, _sans: SAN[] = []): PlayUciSingleReplayComponent {

    let [steps, set_steps] = createSignal<Step[]>(build_steps(_sans, initial_fen))
    const last_step = createMemo(() => { 
        let ss = steps()
        return ss[ss.length - 1]
    })

    let [i_ply, set_i_ply] = createSignal(last_step()?.ply ?? 0)

    const ply_step = createMemo(() => {
        let ply = i_ply()
        let ss = steps()
        return ss.find(_ => _.ply === ply)
    })



    let sans = createMemo(mapArray(steps, step => step.san))
    let plies = createMemo(mapArray(steps, step => step.ply))

    let ply_sans = createMemo(() => {
        let ss = sans()
        let pp = plies()

        return ss.map((san, i) => {
            let ply = pp[i]

            return `${ply} ${san}`
        })
    })

    const goto_ply = (ply: Ply) => {
        set_i_ply(ply)
    }
    const get_prev_ply = () => {
        let res = i_ply() - 1
        return plies().find(_ => _ === res)
    }
    const get_next_ply = () => {
        let res = i_ply() + 1
        return plies().find(_ => _ === res)
    }
    
    return {
        initial_fen,
        get steps() {
            return steps()
        },
        get plies() {
            return plies()
        },
        get sans() {
            return sans()
        },
        get ply_sans() {
            return ply_sans()
        },
        get ply_step() {
            return ply_step()
        },
        get last_step() {
            return last_step()
        },
        goto_ply,
        get_prev_ply,
        get_next_ply,
        goto_prev_ply_if_can() {
            let res = get_prev_ply()
            if (res !== undefined) {
                goto_ply(res)
            }
            if (i_ply() === 1) {
                set_i_ply(0)
            }
        },
        goto_next_ply_if_can() {
            let res = get_next_ply()
            if (res !== undefined) {
                goto_ply(res)
            }
        },
        play_san(san: SAN) {
            let last = last_step()
            if (!last) {
                set_steps(build_steps([san]))
                return
            }

            let ss = steps()
            set_steps(push_san(san, ss))

            set_i_ply(last.ply + 1)
        },
        get is_on_last_ply() {
            return i_ply() === (last_step()?.ply ?? 0)
        }
    }

}


export function PlayUciSingleReplay(props: { play_replay: PlayUciSingleReplayComponent }) {
    const ply_sans = createMemo(mapArray(() => props.play_replay.ply_sans, ply_san => {
        let [ply, san] = ply_san.split(' ')
        return {
            ply: parseInt(ply),
            san
        }
    }))

    const goto_ply = (ply: Ply) => {
        props.play_replay.goto_ply(ply)
    }

    const i_ply = createMemo(() => props.play_replay.ply_step?.ply)

    return (<>
        <div class='replay-single'>
            <div class='moves'>
            <For each={ply_sans()}>{(ply_san) => 
                <>
                    <Show when={ply_san.ply % 2 === 1}>
                        <span class='index'>{Math.ceil(ply_san.ply / 2)}</span>
                    </Show>
                    <span onClick={() => goto_ply(ply_san.ply)} class={'move' + (ply_san.ply === i_ply() ? ' active' : '')}>{ply_san.san}</span>
                </>
            }</For>
            </div>
        </div>
    </>)
}
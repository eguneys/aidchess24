import { createEffect, createMemo, createSignal, For, mapArray, Match, on, Show, Switch } from "solid-js"
import './PlayUciReplay.scss'
import { build_steps, Ply, push_san, SAN, Step } from "./step_types"
import { Judgement, StepLazyQueueWork, StepsWithStockfishComponent, StepWithSearch } from "./StockfishComponent"

export type PlayUciSingleReplayComponent = {
    plies: Ply[],
    sans: SAN[],
    ply_sans: SAN[],
    steps_up_to_ply: Step[],
    steps: Step[],
    last_step: Step | undefined,
    ply_step: Step | undefined,
    ply: number,
    play_san: (san: SAN) => void,
    goto_ply: (ply: Ply) => void
    get_prev_ply: () => Ply | undefined,
    get_next_ply: () => Ply | undefined,
    goto_prev_ply_if_can: () => void,
    goto_next_ply_if_can: () => void,
    is_on_last_ply: boolean,
    set_sans(_: SAN[]): void
}

export function PlayUciSingleReplayComponent(): PlayUciSingleReplayComponent {

    let [steps, set_steps] = createSignal<Step[]>([])
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
        set_sans(sans: SAN[]) {
            set_steps(build_steps(sans))
            set_i_ply(sans.length)
        },
        get steps() {
            return steps()
        },
        get steps_up_to_ply() {
            return steps().slice(0, i_ply())
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
        get ply() {
            return i_ply()
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


export function PlayUciSingleReplay(props: { play_replay: PlayUciSingleReplayComponent, steps_stockfish: StepsWithStockfishComponent }) {
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

    createEffect(on(() => props.play_replay.steps, (steps) => 
        props.steps_stockfish.set_steps(steps)))

    let $moves_el: HTMLElement

    const judgement_klass = (i: number) => {

        let ss = props.steps_stockfish.steps_with_stockfish[i]

        if (!ss) {
            return ''
        }

        let d20pv6 = ss.d20pv6[1]()
        let d20pv1 = ss.d20pv1[1]()
        let d8pv6 = ss.d8pv6[1]()
        let d8pv1 = ss.d8pv1[1]()

        if (d20pv6) {
            return (d20pv6.judgement ?? '') + ' d20pv6'
        }

        if (d20pv1) {
            return (d20pv1.judgement ?? '') + ' d20pv1'
        }

        if (d8pv6) {
            return (d8pv6.judgement ?? '') + ' d8pv6'
        }
        if (d8pv1) {
            return (d8pv1.judgement ?? '') + ' d8pv1'
        }
    }

    createEffect(on(ply_sans, (sans) => {
        if (sans.length < 7) return

        let cont = $moves_el.parentElement!

        let st: number | undefined
        if (props.play_replay.ply < 3) {
            st = 0
        } else if (props.play_replay.is_on_last_ply) {
            st = 99999
        } else {
            let ply_el = cont.querySelector('.active') as HTMLElement | undefined
            if (ply_el) {
                st = ply_el.offsetTop - $moves_el.offsetHeight / 2 + ply_el.offsetHeight / 2
            }
        }
        if (st !== undefined) {
            cont.scrollTo({behavior: 'smooth', top: st })
        }
    }))

    return (<>
        <div class='replay-single'>
            <div ref={_ => $moves_el = _} class='moves'>
            <For each={ply_sans()}>{(ply_san, i) => 
                <>
                    <Show when={ply_san.ply % 2 === 1}>
                        <span class='index'>{Math.ceil(ply_san.ply / 2)}</span>
                    </Show>
                    <span onClick={() => goto_ply(ply_san.ply)} class={'move ' + (judgement_klass(i())) + (ply_san.ply === i_ply() ? ' active' : '')}>
                            <span class='san'>{ply_san.san}</span>
                            <Show when={props.steps_stockfish.steps_with_stockfish[i()]}>{ ss =>
                                <StepLazyQueueWorkOnSingleReplay ss={ss()} />
                            }</Show>
                        </span>
                </>
            }</For>
            </div>
        </div>
    </>)
}


function StepLazyQueueWorkOnSingleReplay(props: { ss: StepLazyQueueWork }) {

    return (<>
        <Switch fallback={
            <StepWithSearchOnReplay step={props.ss.d8pv1[0]()}/>
        }>
            <Match when={props.ss.d20pv6[1]()}>{ step => <StepWithSearchOnReplay step={step()}/> }</Match>
            <Match when={props.ss.d20pv1[1]()}>{ step => <StepWithSearchOnReplay step={step()}/> }</Match>
            <Match when={props.ss.d8pv6[1]()}>{ step => <StepWithSearchOnReplay step={step()}/> }</Match>
            <Match when={props.ss.d8pv1[1]()}>{ step => <StepWithSearchOnReplay step={step()}/> }</Match>
        </Switch>
    </>)
}

export function StepWithSearchOnReplay(props: { step: StepWithSearch }) {

    const cp = () => props.step.search?.cp
    const judgement = () => props.step.judgement

    const judgement_glyph = (j: Judgement) => {
        return j === 'good' ? '✓' : j === 'inaccuracy' ? '?!' : j === 'mistake' ? '?' : '??'
    }
    const depth = () => props.step.progress?.depth

    console.log(props.step.san, props.step.search)

    return (<>
        <span class='eval'>
            <Show when={cp() !== undefined} fallback={
                <span class='loading'>.{depth()}</span>
            }>
                <span class='eval'>{renderEval(cp()!)}</span>
            </Show>
            <Show when={judgement()} fallback={
                <span class='loading'>.</span>
            }>{judgement =>
                <span class='judgement'>{judgement_glyph(judgement())}</span>
            }</Show>
        </span>
    </>)
}

/* lila/ui/ceval/src/util.ts */
export function renderEval(e: number): string {
  e = Math.max(Math.min(Math.round(e / 10) / 10, 99), -99);
  return (e > 0 ? '+' : '') + e.toFixed(1);
}
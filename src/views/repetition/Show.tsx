import { batch, createContext, createEffect, createMemo, createResource, createSignal, For, on, Show, Suspense, untrack, useContext } from "solid-js"
import { StudiesDBContext, StudiesDBProvider } from "../../components/sync_idb_study"
import { A, useParams, useSearchParams } from "@solidjs/router"
import { RepeatShowType } from "./List"
import { non_passive_on_wheel, PlayUciBoard, PlayUciComponent } from "../../components/PlayUciComponent"
import { PlayUciTreeReplayComponent } from "../../components/ReplayTreeComponent"
import { arr_rnd } from "../../random"
import './Show.scss'
import { fen_turn, nag_to_glyph, Ply } from "../../components/step_types"
import { INITIAL_FEN } from "chessops/fen"
import { annotationShapes } from "../../annotationShapes"
import { RepeatAttemptResult, RepeatDueMove, RepeatMoveAttempt } from "./types"
import TimeAgo from "../../components/TimeAgo"
import { FSRS } from "ts-fsrs"

export default () => {
    return (<>
    <StudiesDBProvider>
        <ShowComponent />
    </StudiesDBProvider>
    </>)
}

const FSRSContext = createContext(new FSRS({enable_fuzz: true}))

function ShowComponent() {

    let fs = useContext(FSRSContext)
    let db = useContext(StudiesDBContext)!

    let [searchParams] = useSearchParams()
    let repeat_type: RepeatShowType = (searchParams.filter ?? 'white') as RepeatShowType

    let params = useParams()

    let [study] = createResource(() => db.study_by_id(params.id))
    let [repeat_study] = createResource(async () => {
        let res = await db.get_or_new_repeat_study(params.id)

        return res
    })

    createEffect(on(repeat_study, (r) => {
        if (!r) {
            return
        }
        r.create_effects_listen_load_db(db)
    }))

    const play_uci = PlayUciComponent()

    const filtered_all = createMemo(() => {
        let r = repeat_study()
        if (!r) {
            return undefined
        }

        switch (repeat_type) {
            case 'first-ten': return r.due_first_ten
            case 'ten-twenty': return r.due_ten_twenty
            case 'twenty-plus': return r.due_twenty_plus
            case 'white': return r.due_white
            case 'black': return r.due_black
        }
    })

    const [filtered_all_populated] = createResource<RepeatDueMove[], RepeatDueMove[]>(filtered_all, async (all) => {
        await Promise.all(all.map(_ => _.once_listen_load_db(db)))
        return all
    })

    const filtered_dues = createMemo(() => filtered_all_populated()?.filter(_ => _.is_due))

    const filter_title = () => {
        switch (repeat_type) {
            case 'first-ten': return 'First Ten'
            case 'ten-twenty': return 'First Ten to Twenty'
            case 'twenty-plus': return 'Twenty Plus'
            case 'white': return 'White'
            case 'black': return 'Black'
        }
    }

    const [trigger_next_due_move, set_trigger_next_due_move] = createSignal<boolean>(true, { equals: false })

    const one_random_due = createMemo<RepeatDueMove | undefined>((prev) => {
        let res = filtered_dues()
        if (res === undefined) {
            return undefined
        }

        if (!trigger_next_due_move()) {
            return prev
        }

        return arr_rnd(res)
    })

    const [one_selected_due, set_one_selected_due] = createSignal<RepeatDueMove | undefined>(undefined)

    const select_one_attempt_result = (attempt_result?: RepeatMoveAttempt) => {

        if (!attempt_result) {
            set_one_selected_due(undefined)
            return
        }


        let due_move = filtered_all()?.find(_ => _.id === attempt_result.repeat_due_move_id)

        if (!due_move) {
            return
        }

        batch(() => {
            set_repeat_attempt_result(undefined)
            set_show_previous_moves(false)
            set_one_selected_due(due_move)
        })
    }

    const one_particular_due = createMemo(() => one_selected_due() ?? one_random_due())

    const [play_replay] = createResource(() => [one_particular_due()?.node.tree_id],
        ([u_id]) => u_id ? db.play_replay_by_steps_tree_id(u_id) : undefined)

    const [show_previous_moves, set_show_previous_moves] = createSignal(false)

    const show_at_path = createMemo(() =>
        one_particular_due()?.node.path.split(' ').slice(0, -1).join(' ')
    )
    const solution_uci = createMemo(() => one_particular_due()?.node.uci)



    createEffect(() => {
        let r = play_replay()
        if (!r) {
            return
        }
        let path = show_at_path()!

        let show_previous = show_previous_moves()

        untrack(() => {
            batch(() => {
                r.goto_path(path)
                r.hide_after_path = show_previous ? path : ''
            })
        })
    })

    const [repeat_attempt_result, set_repeat_attempt_result] = createSignal<RepeatAttemptResult | undefined>(undefined)

    const color = () => fen_turn(one_particular_due()?.node.before_fen ?? INITIAL_FEN)
    const movable = () => !!play_replay() && play_replay()!.cursor_path === show_at_path()

    createEffect(on(() => play_replay()?.cursor_path_step, (step) => {
        if (!step) {
            play_uci.set_fen_and_last_move(INITIAL_FEN)
            return
        }

        play_uci.set_fen_and_last_move(step.fen, step.uci)
    }))


    createEffect(on(() => play_uci.on_last_move_added, (lm) => {
        if (!lm) {
            return
        }

        let [uci, san] = lm

        let r = play_replay()!

        let node = r.add_child_san_to_current_path(san)!

        if (uci === solution_uci()) {
            if (show_previous_moves()) {
                set_repeat_attempt_result('solved-with-hint')
            } else {
                if (one_selected_due()) {
                    set_repeat_attempt_result('solved-with-hint')
                } else {
                    set_repeat_attempt_result('solved')
                }
            }
            r.success_path = node.path

        } else {
            if (show_previous_moves()) {
                set_repeat_attempt_result('failed-with-hint')
            } else {
                set_repeat_attempt_result('failed')
            }
            r.failed_path = node.path
        }
    }))

    const on_show_answer = () => {
        set_repeat_attempt_result('failed-with-skip')
        let path = one_particular_due()!.node.path
        play_replay()!.failed_path = path
        play_replay()!.goto_path(path)
    }



    createEffect(on(repeat_attempt_result, (attempt_result) => {
        if (attempt_result !== undefined) {
            play_replay()!.hide_after_path = undefined

            let due_move = one_particular_due()!
            let repeat_move_attempt = due_move.add_attempt_with_spaced_repetition(fs, attempt_result)

            batch(() => {
                set_trigger_next_due_move(false)
                console.log(due_move.is_unsaved, 'is unsaved')
                if (due_move.is_unsaved) {
                    db.save_due_move(due_move.entity)
                }
                db.add_repeat_move_attempt(repeat_move_attempt.entity)
            })

        }
    }))

    const set_on_wheel = (i: number) => {
        if (!play_replay()) {
            return
        }
        if (i > 0) {
            play_replay()!.goto_next_if_can()
        } else {
            play_replay()!.goto_prev_if_can()
        }
    }

    let annotation = createMemo(() => {
        if (!play_replay()) {
            return []
        }

        let step = play_replay()!.cursor_path_step

        if (!step) {
            return []
        }

        if (play_replay()!.failed_path === step.path) {
            return annotationShapes(step.uci, step.san, '✗')
        }
        if (play_replay()!.success_path === step.path) {
            if (repeat_attempt_result()?.includes('hint')) {
                return annotationShapes(step.uci, step.san, '✓')
            } else {
                return annotationShapes(step.uci, step.san, '!')
            }
        }

        let nag = step.nags[0]

        if (!nag) {
            return []
        }

        return annotationShapes(step.uci, step.san, nag_to_glyph(nag))
    })

    const on_next_due_move = () => {
        batch(() => {
            set_trigger_next_due_move(true)
            set_repeat_attempt_result(undefined)
            set_show_previous_moves(false)
            set_one_selected_due(undefined)
        })
    }

    const move_attempts = createMemo(() => one_particular_due()?.attempts)

    const session_attempts = createMemo(() => {
        let res: RepeatMoveAttempt[] = ((filtered_all()?.map(_ => _.last_attempt).filter(Boolean) ?? []) as RepeatMoveAttempt[])

        res.sort((a, b) => a.created_at - b.created_at)

        return res
    })

    const latest_move_attempt = createMemo(() => {
        let aa = move_attempts()
        if (!aa) {
            return undefined
        }
        return aa[aa.length - 1]
    })

    const on_attempt_click = (attempt: RepeatMoveAttempt) => {
        select_one_attempt_result(attempt)
    }

    return (<>
    <main class='repeat-show'>
        <Suspense fallback={
            <div class='Loading ...'></div>
        }>

        <div class='header'>
            <div class='title'>{study()?.name}</div>
            <div class='filter'><span class='label'>Filter:</span> 
                <span class='value'>{filter_title()}</span> moves
            </div>
            <div class='due-moves'><span class='label'>Due:</span> 
                <Suspense>
                    <span class='value'>{filtered_dues()?.length}</span> moves left
                </Suspense>
            </div>
        </div>
        <div on:wheel={non_passive_on_wheel(set_on_wheel)} class='board-wrap'>
            <PlayUciBoard shapes={annotation()} orientation={color()} color={color()} movable={movable()} play_uci={play_uci}/>
        </div>
        <div class='replay-wrap'>
            <Suspense>
            <Show when={play_replay()} fallback={
              <>
                <span>Great; No due moves at this time.</span>
                <A href="/repetition">Go Back to Repetitions</A>
              </>
            }>{ play_replay =>
            <>
                <PlayUciTreeReplayComponent play_replay={play_replay()} />
                <div class="controls">
                    <Show when={repeat_attempt_result() === undefined && !show_previous_moves()}>
                        <button onClick={() => set_show_previous_moves(true)}>Hint: Show Previous Moves</button>
                    </Show>
                    <Show when={repeat_attempt_result() === undefined} fallback={
                        <button onClick={on_next_due_move}>Goto Next Due Move</button>
                    }>
                        <button onClick={on_show_answer}>Show Answer</button>
                    </Show>
                </div>
            </>
            }</Show>
            </Suspense>
        </div>
        <div class='underboard'>
            <div class='move-history'>
                <h4>Latest Attempts for this Move</h4>
                <div class='attempts'>
                    <For each={move_attempts()}>{ (attempt, i) => 
                        <MoveAttemptComponent latest={i() === move_attempts()!.length - 1} attempt={attempt} time={true} />
                    }</For>
                </div>
            </div>
            <div class='session-history'>
                <h4>Latest Attempts for Today </h4>
                <div class='attempts'>
                    <For each={session_attempts()}>{ attempt => 
                        <MoveAttemptComponent latest={attempt === latest_move_attempt()} attempt={attempt!} time={false} on_click={() => on_attempt_click(attempt!)} />
                    }</For>
                </div>
            </div>
        </div>
        </Suspense>

    </main>
    </>)

}


function MoveAttemptComponent(props: { attempt: RepeatMoveAttempt, ply?: Ply, time?: boolean, latest?: boolean, on_click?: () => void }) {
    const klass = createMemo(() => {
        return ' ' + props.attempt.attempt_result
    })

    const data_icon = () => {

        if (props.attempt.attempt_result.includes('skip')) {
            return "" // skip
        }
        if (props.attempt.attempt_result.includes('solved')) {
            if (props.attempt.attempt_result.includes('hint')) {
                return "" // check
            } else {
                return "" // star
            }
        }
        return "" // cross
    }

    return (<div onClick={() => props.on_click?.()} class={'attempt ' + (props.latest ? ' latest' : '') + (props.time ? '' : ' selectable') + klass()}>
        <i data-icon={data_icon()}></i>
        <Show when={props.ply}>
            <span class='ply'>{props.ply}</span>
        </Show>
        <Show when={props.time}>
            <TimeAgo timestamp={props.attempt.created_at} />
        </Show>
    </div>)
}
import { batch, createContext, createEffect, createMemo, createSignal, For, on, Show, Suspense, untrack, useContext, useTransition } from "solid-js"
import { A, useParams, useSearchParams } from "@solidjs/router"
import { createRepeatProps, RepeatShowType } from "./List"
import { arr_rnd } from "../../random"
import './Show.scss'
import { INITIAL_FEN } from "chessops/fen"
import { annotationShapes } from "../../components2/annotationShapes"
import { FSRS } from "ts-fsrs"
import { ModelRepeatDueMove, ModelRepeatMoveAttempt } from "../../store/sync_idb_study"
import { RepeatAttemptResult } from "../../store/repeat_types"
import { fen_pos, fen_turn, nag_to_glyph, Ply } from "../../store/step_types"
import { non_passive_on_wheel, PlayUciBoard } from "../../components2/PlayUciBoard"
import { parseSquare } from "chessops"
import { usePersistedStore, useStore } from "../../store"
import { createReplayTreeComputed, ReplayTreeComponent } from "../../components2/ReplayTreeComponent"
import TimeAgo from "../../components2/TimeAgo"
import { Key } from "chessground/types"

export default () => {
    return (<>
        <ShowComponent />
    </>)
}

const FSRSContext = createContext(new FSRS({ }))

function ShowComponent() {

    let fs = useContext(FSRSContext)

    let [searchParams] = useSearchParams()
    let repeat_type: RepeatShowType = (searchParams.filter ?? 'white') as RepeatShowType



    const filter_title = () => {
        switch (repeat_type) {
            case 'first-ten': return 'First Ten'
            case 'ten-twenty': return 'First Ten to Twenty'
            case 'twenty-plus': return 'Twenty Plus'
            case 'white': return 'White'
            case 'black': return 'Black'
        }
    }

    let [store, { 
        play_uci,
        add_child_san_to_current_path,
        goto_path, 
        goto_path_if_can,
        set_success_path,
        set_failed_path,
        set_hide_after_path,
    
        save_due_move_if_not,
        add_attempt_with_spaced_repetition,

        load_study,
        load_replay_tree_by_steps_id
    }] = useStore()

    let [, {
    /*    set_repeat_selected_study */
    }] = usePersistedStore()

    /*
    let [, {
        set_repeat_selected_study
    }] = usePersistedStore()
     */

    let r_props = createRepeatProps()
    let c_props = createReplayTreeComputed({sticky_path_effects: true })

    let params = useParams()
    //set_repeat_selected_study(params.id)
    load_study(params.id)

    const due_list_by_type = createMemo(() => {
        switch(repeat_type) {
            case 'first-ten': return r_props.due_first_ten
            case 'ten-twenty': return r_props.due_ten_twenty
            case 'twenty-plus': return r_props.due_twenty_plus
            case 'white': return r_props.due_white
            case 'black': return r_props.due_black
        }
    })
    const all_list_by_type = createMemo(() => {
        switch(repeat_type) {
            case 'first-ten': return r_props.all_first_ten
            case 'ten-twenty': return r_props.all_ten_twenty
            case 'twenty-plus': return r_props.all_twenty_plus
            case 'white': return r_props.all_white
            case 'black': return r_props.all_black
        }
    })

    const [trigger_next_due_move, set_trigger_next_due_move] = createSignal<boolean>(true, { equals: false })

    const one_random_due = createMemo<ModelRepeatDueMove | undefined>((prev) => {
        let res = due_list_by_type()
        if (res === undefined) {
            return undefined
        }

        if (!trigger_next_due_move()) {
            return prev
        }
        console.log('random in')

        return arr_rnd(res)
    })

    const [one_selected_due, set_one_selected_due] = createSignal<ModelRepeatDueMove | undefined>(undefined)

    const select_one_attempt_result = (attempt_result?: ModelRepeatMoveAttempt) => {

        if (!attempt_result) {
            set_one_selected_due(undefined)
            return
        }


        let due_move = all_list_by_type()?.find(_ => _.id === attempt_result.repeat_due_move_id)

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

    const [show_previous_moves, set_show_previous_moves] = createSignal(false)

    const show_at_path = createMemo(() =>
        one_particular_due()?.tree_step_node.step.path.split(' ').slice(0, -1).join(' ')
    )
    const solution_uci = createMemo(() => one_particular_due()?.tree_step_node.step.uci)

    const [pending, start] = useTransition()

    createEffect(() => {
        let due = one_particular_due()

        if (!due) {
            return
        }

        start(() => {
            untrack(() => {
                set_repeat_attempt_result(undefined)
                load_replay_tree_by_steps_id(due.tree_step_node.tree_id, false)
            })
        })
    })

    let awaiting_tree_load = () => {
        let due = one_particular_due()
        return pending() || due?.tree_step_node.tree_id !== store.replay_tree.steps_tree_id
    }

    const [repeat_attempt_result, set_repeat_attempt_result] = createSignal<RepeatAttemptResult | undefined>(undefined)


    createEffect(() => {

        if (awaiting_tree_load()) {
            return
        }

        let path = show_at_path()
        if (path === undefined) {
            return
        }

        let show_previous = show_previous_moves()

        batch(() => {
            untrack(() => {
                goto_path(path)
                set_hide_after_path(show_previous ? path : '')
            })
        })
    })

    const [i_idle, set_i_idle] = createSignal<number>()

    createEffect(on(repeat_attempt_result, (attempt_result) => {
        if (awaiting_tree_load()) {
            return
        }

        if (attempt_result !== undefined) {
            set_hide_after_path(undefined)

            let due_move = one_particular_due()!

            add_attempt_with_spaced_repetition(fs, due_move, attempt_result)

            batch(() => {
                set_trigger_next_due_move(false)
                save_due_move_if_not(due_move)

                if (attempt_result.includes('solved')) {
                    console.log('trigger set timeout')
                    set_i_idle(setTimeout(() => {
                        batch(() => {
                            set_trigger_next_due_move(true)
                            set_i_idle(undefined)
                        })
                    }, 600))
                }
            })
        }
    }))

    const color = () => fen_turn(one_particular_due()?.tree_step_node.step.before_fen ?? INITIAL_FEN)
    const movable = () => store.replay_tree.cursor_path === show_at_path()

    const on_play_orig_key = async (orig: Key, dest: Key) => {

        const pos = () => fen_pos(store.play_fen)

        let position = pos()
        let turn_color = position.turn

        let piece = position.board.get(parseSquare(orig)!)!

        let uci = orig + dest
        if (piece.role === 'pawn' &&
            ((dest[1] === '8' && turn_color === 'white') || (dest[1] === '1' && turn_color === 'black'))) {
            uci += 'q'
        }

        let san = play_uci(uci)


        let node = await add_child_san_to_current_path(san)
        set_hide_after_path(undefined)
        goto_path(node.step.path)

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
            set_success_path(node.step.path)

        } else {
            if (show_previous_moves()) {
                set_repeat_attempt_result('failed-with-hint')
            } else {
                set_repeat_attempt_result('failed')
            }
            set_failed_path(node.step.path)
        }
    }

    const on_show_answer = () => {
        set_repeat_attempt_result('failed-with-skip')
        let path = one_particular_due()!.tree_step_node.step.path
        set_failed_path(path)
        goto_path(path)
    }




    const set_on_wheel = (i: number) => {
        if (i > 0) {
            goto_path_if_can(c_props.get_next_path)
        } else {
            goto_path_if_can(c_props.get_prev_path)
        }
    }



    let annotation = createMemo(() => {
        let step = c_props.step_at_cursor_path

        if (!step) {
            return []
        }

        if (store.replay_tree.failed_path === step.step.path) {
            return annotationShapes(step.step.uci, step.step.san, '✗')
        }
        if (store.replay_tree.success_path === step.step.path) {
            if (repeat_attempt_result()?.includes('hint')) {
                return annotationShapes(step.step.uci, step.step.san, '✓')
            } else {
                return annotationShapes(step.step.uci, step.step.san, '!')
            }
        }

        let nag = step.nags?.[0]

        if (!nag) {
            return []
        }

        return annotationShapes(step.step.uci, step.step.san, nag_to_glyph(nag))
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
        let res: ModelRepeatMoveAttempt[] = ((all_list_by_type()?.map(_ => _.attempts[0]).filter(Boolean) ?? []) as ModelRepeatMoveAttempt[])

        res.sort((a, b) => b.created_at - a.created_at)

        return res
    })

    const latest_move_attempt = createMemo(() => {
        let aa = move_attempts()
        if (!aa) {
            return undefined
        }
        return aa[0]
    })

    const on_attempt_click = (attempt: ModelRepeatMoveAttempt) => {
        select_one_attempt_result(attempt)
    }

    return (<>
    <main class='repeat-show'>
        <Suspense fallback={
            <div class='Loading ...'></div>
        }>

        <div class='header'>
            <div class='title'>{r_props.study?.name}</div>
            <div class='filter'><span class='label'>Filter:</span> 
                <span class='value'>{filter_title()}</span> moves
            </div>
            <div class='due-moves'><span class='label'>Due:</span> 
                <Suspense>
                    <span class='value'>{due_list_by_type().length}</span> moves left
                </Suspense>
            </div>
        </div>
        <div on:wheel={non_passive_on_wheel(set_on_wheel)} class='board-wrap'>
            <PlayUciBoard shapes={annotation()} orientation={color()} color={color()} movable={movable()} fen={store.play_fen} last_move={store.last_move} play_orig_key={on_play_orig_key}/>
        </div>
        <div class='replay-wrap'>
            <Suspense>
            <Show when={one_particular_due()} fallback={
              <>
                <span>Great; No due moves at this time.</span>
                <A href="/repetition">Go Back to Repetitions</A>
              </>
            }>
            <>
                <ReplayTreeComponent lose_focus={false}/>
                <div class="controls">
                    <Show when={i_idle() === undefined} fallback={
                        <span class='idle'>...</span>
                    }>
    
                        <Show when={repeat_attempt_result() === undefined && !show_previous_moves()}>
                            <button onClick={() => set_show_previous_moves(true)}>Hint: Show Previous Moves</button>
                        </Show>
                        <Show when={repeat_attempt_result() === undefined} fallback={
                            <button onClick={on_next_due_move}>Goto Next Due Move</button>
                        }>
                            <button onClick={on_show_answer}>Show Answer</button>
                        </Show>

                    </Show>
                </div>
            </>
            </Show>
            </Suspense>
        </div>
        <div class='underboard'>
            <div class='move-history'>
                <h4>Latest Attempts for this Move</h4>
                <div class='attempts'>
                    <For each={move_attempts()}>{ (attempt, i) => 
                        <MoveAttemptComponent latest={i() === 0} attempt={attempt} time={true} />
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


function MoveAttemptComponent(props: { attempt: ModelRepeatMoveAttempt, ply?: Ply, time?: boolean, latest?: boolean, on_click?: () => void }) {
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

    return (<div onClick={() => props.on_click?.()} 
        class={'attempt' + klass()}
        classList={{
            latest: props.latest,
            selectable: !props.time
        }}>

        <i data-icon={data_icon()}></i>
        <Show when={props.ply}>
            <span class='ply'>{props.ply}</span>
        </Show>
        <Show when={props.time}>
            <TimeAgo timestamp={props.attempt.created_at} />
        </Show>
    </div>)
}
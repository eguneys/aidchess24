import { createContext, createMemo, createSignal, For, Show, Suspense, useContext } from "solid-js"
import { A, useParams, useSearchParams } from "@solidjs/router"
import { createRepeatProps, RepeatShowType } from "./List"
import './Show.scss'
import { annotationShapes } from "../../components2/annotationShapes"
import { FSRS } from "ts-fsrs"
import { ModelRepeatDueMove, ModelRepeatMoveAttempt } from "../../store/sync_idb_study"
import { RepeatAttemptResult } from "../../store/repeat_types"
import { fen_pos, fen_turn, nag_to_glyph, Ply } from "../../store/step_types"
import { non_passive_on_wheel, PlayUciBoard } from "../../components2/PlayUciBoard"
import { parseSquare } from "chessops"
import { useStore } from "../../store"
import { createReplayTreeComputed, ReplayTreeComponent } from "../../components2/ReplayTreeComponent"
import TimeAgo from "../../components2/TimeAgo"
import { Key } from "chessground/types"
import { INITIAL_FEN } from "chessops/fen"

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
        set_failed_path,
        set_hide_after_path,
    
        save_due_move_if_not,
        add_attempt_with_spaced_repetition,

        load_study,
    }] = useStore()

    let r_props = createRepeatProps()
    let c_props = createReplayTreeComputed(store)

    let params = useParams()
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

    const is_list_no_item = createMemo(() => false)
    const is_loaded_idle = createMemo(() => false)
    const is_attempt_result = createMemo(() => false)

    const [due_move, set_due_move] = createSignal<ModelRepeatDueMove>()
    const [attempt_result, _set_attempt_result] = createSignal<RepeatAttemptResult>()

    const [show_previous_moves, set_show_previous_moves] = createSignal<boolean>()


    function set_attempt_result(attempt_result: RepeatAttemptResult) {
        let due = due_move()!
        _set_attempt_result(attempt_result)
        set_hide_after_path(undefined)
        add_attempt_with_spaced_repetition(fs, due, attempt_result)
        save_due_move_if_not(due)
    }

    const on_next_due_move = () => {
    }

    const select_one_attempt_result = (attempt_result: ModelRepeatMoveAttempt) => {
        let due_move = all_list_by_type()?.find(_ => _.id === attempt_result.repeat_due_move_id)

        if (!due_move) {
            return
        }
    }

    //const solution_uci = createMemo(() => due_move()?.tree_step_node.step.uci)

    const color = () => fen_turn(due_move()?.tree_step_node.step.before_fen ?? INITIAL_FEN)
    const movable = () => is_loaded_idle()

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


        /*
        let show_previous_moves = state.current_state.show_previous_moves
        let is_previous_attempt = state.current_state.is_previous_attempt

        if (uci === solution_uci()) {
            if (show_previous_moves) {
                set_attempt_result('solved-with-hint')
            } else {
                if (is_previous_attempt) {
                    set_attempt_result('solved-with-hint')
                } else {
                    set_attempt_result('solved')
                }
            }
            set_success_path(node.step.path)

        } else {
            if (show_previous_moves) {
                set_attempt_result('failed-with-hint')
            } else {
                set_attempt_result('failed')
            }
            set_failed_path(node.step.path)
        }
            */
    }

    const on_show_answer = () => {
        set_attempt_result('failed-with-skip')
        let path = due_move()!.tree_step_node.step.path
        set_failed_path(path)
        goto_path(path)
    }

    const move_attempts = createMemo(() => due_move()?.attempts)

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

        let result = attempt_result()
        if (!result) {
            return []
        }

        if (store.replay_tree.failed_path === step.step.path) {
            return annotationShapes(step.step.uci, step.step.san, '✗')
        }
        if (store.replay_tree.success_path === step.step.path) {
            if (result.includes('hint')) {
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
            <Show when={!is_list_no_item()} fallback={
              <>
                <span>Great; No due moves at this time.</span>
                <A href="/repetition">Go Back to Repetitions</A>
              </>
            }>
            <>
                <ReplayTreeComponent lose_focus={false}/>
                <div class="controls">
                    <Show when={is_loaded_idle() || is_attempt_result()} fallback={
                        <span class='idle'>...</span>
                    }>
    
                        <Show when={is_loaded_idle() && !show_previous_moves()}>
                            <button onClick={() => set_show_previous_moves(true)}>Hint: Show Previous Moves</button>
                        </Show>
                        <Show when={is_loaded_idle()} fallback={
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
import { batch, createContext, createEffect, createMemo, For, on, Show, Suspense, useContext } from "solid-js"
import { A, useParams, useSearchParams } from "@solidjs/router"
import { createRepeatProps, RepeatShowType } from "./List"
import { arr_rnd } from "../../random"
import './Show.scss'
import { INITIAL_FEN } from "chessops/fen"
import { annotationShapes } from "../../components2/annotationShapes"
import { FSRS } from "ts-fsrs"
import { ModelRepeatDueMove, ModelRepeatMoveAttempt } from "../../store/sync_idb_study"
import { RepeatAttemptResult } from "../../store/repeat_types"
import { fen_pos, fen_turn, nag_to_glyph, parent_path, Ply } from "../../store/step_types"
import { non_passive_on_wheel, PlayUciBoard } from "../../components2/PlayUciBoard"
import { parseSquare } from "chessops"
import { StoreActions, useStore } from "../../store"
import { createReplayTreeComputed, ReplayTreeComponent } from "../../components2/ReplayTreeComponent"
import TimeAgo from "../../components2/TimeAgo"
import { Key } from "chessground/types"
import { createStore, produce } from "solid-js/store"

export default () => {
    return (<>
        <ShowComponent />
    </>)
}

const FSRSContext = createContext(new FSRS({ }))

type StateBoot = { state: 'boot', next: undefined }
type StateLoadList = { state: 'load-list', next: undefined }
type StateListNoItem = { state: 'list-no-item' }
type StateSelectNext = { state: 'select-next', next?: ModelRepeatDueMove }
type StateLoadNext = { state: 'load-next', next: ModelRepeatDueMove, is_previous_attempt: boolean }
type StateLoadedPreview = { state: 'loaded-preview', next: ModelRepeatDueMove, is_previous_attempt: boolean }
type StateLoadedIdle = { state: 'loaded-idle', next: ModelRepeatDueMove, show_previous_moves: boolean, is_previous_attempt: boolean }
type StateAttemptResult = { state: 'attempt-result', next: ModelRepeatDueMove, attempt_result: RepeatAttemptResult, is_previous_attempt: boolean }
type StateAutoGoNext = { state: 'auto-go-next', next: ModelRepeatDueMove, is_previous_attempt: boolean }

const is_load_list = (state: SomeState): state is StateLoadList => state.state === 'load-list'
const is_list_no_item = (state: SomeState): state is StateListNoItem => state.state === 'list-no-item'
const is_select_next = (state: SomeState): state is StateSelectNext => state.state === 'select-next'
const is_load_next = (state: SomeState): state is StateLoadNext => state.state === 'load-next'
const is_loaded_preview = (state: SomeState): state is StateLoadedPreview => state.state === 'loaded-preview'
const is_loaded_idle = (state: SomeState): state is StateLoadedIdle => state.state === 'loaded-idle'
const is_attempt_result = (state: SomeState): state is StateAttemptResult => state.state === 'attempt-result'


type SomeState = StateBoot | StateLoadList | StateListNoItem
    | StateSelectNext | StateLoadNext | StateLoadedPreview
    | StateLoadedIdle | StateAttemptResult | StateAutoGoNext


type StoreState = { current_state: SomeState }

type EventEnter = { event: 'enter', due_list_by_type: ModelRepeatDueMove[]  }
type EventDueListChange = { event: 'due-list-change', due_list_by_type: ModelRepeatDueMove[] }
type EventNext = { event: 'next', next: ModelRepeatDueMove }
type EventTreeLoaded = { event: 'tree-loaded' }

type SomeEvent = EventEnter | EventDueListChange | EventNext 
    | EventTreeLoaded

function h_event_load_list(_current: SomeState, 
    event: SomeEvent, 
    set: (next: SomeState) => void,
    _actions: StoreActions) {
    if (event.event === 'due-list-change' || event.event === 'enter') {
        if (event.due_list_by_type !== undefined) {
            set({
                state: 'select-next',
                next: undefined,
            })
        }
    }
}
function h_event_list_no_item(_current: SomeState, 
    event: SomeEvent, 
    set: (next: SomeState) => void,
    _actions: StoreActions) {
    if (event.event === 'due-list-change') {
        if (event.due_list_by_type !== undefined) {
            set({
                state: 'select-next',
                next: undefined,
            })
        }
    }
}
function h_event_select_next(current: StateSelectNext, event: SomeEvent, set: (next: SomeState) => void, actions: StoreActions) {
    if (event.event === 'next') {
        set({
            state: 'load-next',
            next: event.next,
            is_previous_attempt: false
        })
    } else {
        if (event.event === 'enter' || event.event === 'due-list-change') {

            let ll = event.due_list_by_type

            let next = arr_rnd(ll)

            if (!next) {
                set({
                    state: 'list-no-item'
                })
            } else {
                transition(current, { event: 'next', next }, set, actions)
            }

        }
    }
}

function h_event_load_next(current: StateLoadNext,
    event: SomeEvent,
    set: (next: SomeState) => void,
    actions: StoreActions) {
        console.log('EVENT', event)
    if (event.event === 'tree-loaded') {
        set({
            state: 'loaded-preview',
            next: current.next,
            is_previous_attempt: current.is_previous_attempt
        })
    }
    if (event.event === 'enter') {
        const { load_replay_tree_by_steps_id } = actions
        console.log('loading')
        load_replay_tree_by_steps_id(current.next.tree_step_node.tree_id, false)
    }
}

function h_event_loaded_preview(current: StateLoadedPreview, 
    event: SomeEvent, 
    set: (next: SomeState) => void,
    actions: StoreActions) {

    const { set_hide_after_path, goto_path_force, set_replay_tree_has_used } = actions

    if (event.event === 'enter') {
        let is_previous_attempt = current.is_previous_attempt
        let due = current.next
        let show_at_path = parent_path(due.tree_step_node.step.path)
        set_replay_tree_has_used()
        set_hide_after_path('')
        goto_path_force(parent_path(show_at_path))
        setTimeout(() => {
            batch(() => {
                goto_path_force(show_at_path)
                set({
                    state: 'loaded-idle',
                    next: due,
                    is_previous_attempt: is_previous_attempt,
                    show_previous_moves: false,
                })
            })
        }, 555)
    }
}
function h_event_loaded_idle(current: StateLoadedIdle, 
    event: SomeEvent, 
    _set: (next: SomeState) => void,
    actions: StoreActions) {

    const { set_hide_after_path } = actions
    if (event.event === 'enter') {
        let due = current.next
        let show_at_path = parent_path(due.tree_step_node.step.path)
        let show_previous = current.show_previous_moves
        set_hide_after_path(show_previous ? show_at_path : '')
    }
}
function h_event_attempt_result(_current: SomeState, 
    _event: SomeEvent, 
    _set: (next: SomeState) => void,
    _actions: StoreActions) {

}


function transition(current: SomeState, event: SomeEvent, set: (next: SomeState) => void, actions: StoreActions) {
    if (is_load_list(current)) {
        h_event_load_list(current, event, set, actions)
    } else if (is_list_no_item(current)) {
        h_event_list_no_item(current, event, set, actions)
    } else if (is_select_next(current)) {
        h_event_select_next(current, event, set, actions)
    } else if (is_load_next(current)) {
        h_event_load_next(current, event, set, actions)
    } else if (is_loaded_preview(current)) {
        h_event_loaded_preview(current, event, set, actions)
    } else if (is_loaded_idle(current)) {
        h_event_loaded_idle(current, event, set, actions)
    } else if (is_attempt_result(current)) {
        h_event_attempt_result(current, event, set, actions)
    }
}


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

    const [state, set_state] = createStore<StoreState>({
        current_state: { state: 'boot', next: undefined }
    })


    const [,actions] = useStore()
    const set_current_state = (new_state: SomeState) => { 
        let will_transition = state.current_state.state !== new_state.state
        batch(() => {
            set_state('current_state', new_state)
            if (will_transition) {
                transition(new_state, { event: 'enter', due_list_by_type: due_list_by_type() }, set_current_state, actions)
            }
        })
    }

    setTimeout(() => {
        set_current_state({ state: 'load-list', next: undefined })
    })

    const is_tree_loaded = createMemo(on(() => [state.current_state.state, store.replay_tree_just_loaded] as [string, boolean], ([,just_loaded]: [string, boolean]) => {
        if (is_load_next(state.current_state)) {
            return just_loaded
        }
    }))


    createEffect(on(due_list_by_type, (ll) => {
        transition(state.current_state, { event: 'due-list-change', due_list_by_type: ll }, set_current_state, actions)
    }))

    createEffect(on(is_tree_loaded, (yes) => {
        if (yes) {
            transition(state.current_state, { event: 'tree-loaded' }, set_current_state, actions)
        }
    }))

    createEffect(on(() => is_attempt_result(state.current_state), () => {
        if (is_attempt_result(state.current_state)) {
            set_hide_after_path(undefined)
            let due = state.current_state.next

            add_attempt_with_spaced_repetition(fs, due, state.current_state.attempt_result)
            save_due_move_if_not(due)

            if (state.current_state.attempt_result.includes('solved')) {
                setTimeout(() => {
                    set_current_state({
                        state: 'select-next',
                        next: undefined,
                    })
                }, 777)
            }
        }
    }))
 

    createEffect(() => console.log(state.current_state.state))

    const on_next_due_move = () => {
        set_current_state({
            state: 'select-next',
            next: undefined
        })
    }

    const select_one_attempt_result = (attempt_result: ModelRepeatMoveAttempt) => {
        let due_move = all_list_by_type()?.find(_ => _.id === attempt_result.repeat_due_move_id)

        if (!due_move) {
            return
        }

        set_current_state({
            state: 'load-next',
            next: due_move,
            is_previous_attempt: true,
        })
    }

    const set_attempt_result = (attempt_result: RepeatAttemptResult) => {

        if (!is_loaded_idle(state.current_state)) {
            return
        }

        let is_previous_attempt = state.current_state.is_previous_attempt
        let next = state.current_state.next


        set_current_state({
            state: 'attempt-result',
            attempt_result,
            is_previous_attempt,
            next
        })
    }


    const current_due = createMemo(() => {
        if (is_list_no_item(state.current_state)) {
            return undefined
        }
        return state.current_state.next
    })

    const solution_uci = createMemo(() => current_due()?.tree_step_node.step.uci)

    const color = () => fen_turn(current_due()?.tree_step_node.step.before_fen ?? INITIAL_FEN)
    const movable = () => is_loaded_idle(state.current_state)

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


        if (!is_loaded_idle(state.current_state)) {
            return
        }

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
    }

    const on_show_answer = () => {
        set_attempt_result('failed-with-skip')
        let path = current_due()!.tree_step_node.step.path
        set_failed_path(path)
        goto_path(path)
    }

    const set_show_previous_moves = (value: boolean) => {
        if (is_loaded_idle(state.current_state)) {
            set_state("current_state", produce(state => {
                if (is_loaded_idle(state)) {
                    state.show_previous_moves = value
                }
            }))
        }
    }

    const move_attempts = createMemo(() => current_due()?.attempts)

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
        if (!is_attempt_result(state.current_state)) {
            return []
        }

        let attempt_result = state.current_state.attempt_result

        if (store.replay_tree.failed_path === step.step.path) {
            return annotationShapes(step.step.uci, step.step.san, '✗')
        }
        if (store.replay_tree.success_path === step.step.path) {
            if (attempt_result.includes('hint')) {
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
            <Show when={!is_list_no_item(state.current_state)} fallback={
              <>
                <span>Great; No due moves at this time.</span>
                <A href="/repetition">Go Back to Repetitions</A>
              </>
            }>
            <>
                <ReplayTreeComponent lose_focus={false}/>
                <div class="controls">
                    <Show when={is_loaded_idle(state.current_state) || is_attempt_result(state.current_state)} fallback={
                        <span class='idle'>...</span>
                    }>
    
                        <Show when={is_loaded_idle(state.current_state) && !state.current_state.show_previous_moves}>
                            <button onClick={() => set_show_previous_moves(true)}>Hint: Show Previous Moves</button>
                        </Show>
                        <Show when={is_loaded_idle(state.current_state)} fallback={
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
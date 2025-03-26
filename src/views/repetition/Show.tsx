import { batch, createComputed, createContext, createMemo, createSignal, For, Show, Suspense, useContext } from "solid-js"
import { A, useParams, useSearchParams } from "@solidjs/router"
import { createRepeatProps, RepeatShowType } from "./List"
import './Show.scss'
import { annotationShapes } from "../../components2/annotationShapes"
import { FSRS } from "ts-fsrs"
import { ModelRepeatDueMove, ModelRepeatMoveAttempt } from "../../store/sync_idb_study"
import { RepeatAttemptResult } from "../../store/repeat_types"
import { fen_pos, fen_turn, nag_to_glyph, parent_path, Path, Ply } from "../../store/step_types"
import { non_passive_on_wheel, PlayUciBoard } from "../../components2/PlayUciBoard"
import { useStore } from "../../store"
import { createReplayTreeComputed, ReplayTreeComponent } from "../../components2/ReplayTreeComponent"
import TimeAgo from "../../components2/TimeAgo"
import { Key } from "chessground/types"
import { INITIAL_FEN } from "chessops/fen"
import { arr_rnd } from "../../random"
import { parseSquare, parseUci } from "chessops"
import { makeSan } from "chessops/san"

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
        goto_path, 
        goto_path_if_can,
        set_failed_path,
        set_success_path,
        set_hide_after_path,

        add_child_san_to_current_path,
    
        save_due_move_if_not,
        add_attempt_with_spaced_repetition,

        load_study,
        load_chapters_for_sections,
        load_due_moves,

        load_replay_tree_by_due_move
    }] = useStore()

    let c_props = createReplayTreeComputed(store)

    const replay_tree = () => store.replay_tree
    const fen = () => c_props.fen
    const last_move = () => c_props.last_move


    let r_props = createRepeatProps()
    const handle_load_chapters = () => {
        load_chapters_for_sections(r_props.selected_section_ids)
    }
    const handle_load_due_moves = () => {
        let study_id = r_props.selected_study_id
        let section_ids = r_props.selected_section_ids

        if (study_id && section_ids.length > 0) {
            load_due_moves(study_id, section_ids)
        }
    }

    let params = useParams()
    createComputed(() => load_study(params.id))
    createComputed(handle_load_chapters)
    createComputed(handle_load_due_moves)

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

    const [attempt_result, _set_attempt_result] = createSignal<RepeatAttemptResult>()

    const random_due_move = createMemo((prev?: ModelRepeatDueMove) => {
        let ll = due_list_by_type()
        if (attempt_result() !== undefined) {
            return prev
        }
        if (ll.length > 0) {
            return arr_rnd(ll)
        }
    })

    const [selected_due_move, set_selected_due_move] = createSignal<ModelRepeatDueMove>()

    const due_move = createMemo(() => selected_due_move() ?? random_due_move())

    const handle_load_replay_tree = () => {
        let due = due_move()
        if (!due) {
            return
        }
        load_replay_tree_by_due_move(due)
    }
    createComputed(handle_load_replay_tree)


    const is_list_no_item = createMemo(() => due_move() === undefined)


    const has_attempted_due_move = createMemo(() => attempt_result() !== undefined)

    const solution_uci = createMemo(() => due_move()?.tree_step_node.step.uci)

    const color = createMemo(() => fen_turn(due_move()?.tree_step_node.step.before_fen ?? INITIAL_FEN))
    const movable = createMemo(() => !has_attempted_due_move())

    const [show_previous_moves, _set_show_previous_moves] = createSignal<boolean>()

    const set_show_previous_moves = (value: boolean) => {
        if (value) {
            let due = due_move()!
            set_hide_after_path(parent_path(due.tree_step_node.step.path))
        } else {
            set_hide_after_path('')
        }

        _set_show_previous_moves(value)
    }


    const handle_goto_path = (path?: Path) => {
        goto_path_if_can(path)
    }

    async function set_attempt_result(attempt_result: RepeatAttemptResult) {
        _set_attempt_result(attempt_result)
        set_hide_after_path(undefined)

        let due = due_move()!

        await add_attempt_with_spaced_repetition(fs, due, attempt_result)
        await save_due_move_if_not(due)

        if (attempt_result.includes('solved')) {
            await new Promise(resolve => {
                setTimeout(() => {
                    on_next_due_move()
                    resolve(void 0)
                }, 800)
            })
        }
    }

    const on_next_due_move = () => {
        batch(() => {
            _set_attempt_result(undefined)
            set_show_previous_moves(false)
            set_selected_due_move(undefined)
        })
    }

    const select_one_attempt_result = (attempt_result: ModelRepeatMoveAttempt) => {
        let due_move = all_list_by_type()?.find(_ => _.id === attempt_result.repeat_due_move_id)

        if (!due_move) {
            return
        }


        batch(() => {
            _set_attempt_result(undefined)
            set_show_previous_moves(false)
            set_selected_due_move(due_move)
        })
    }

    const on_play_orig_key = async (orig: Key, dest: Key) => {

        const pos = () => fen_pos(fen())

        let position = pos()
        let turn_color = position.turn

        let piece = position.board.get(parseSquare(orig)!)!

        let uci = orig + dest
        if (piece.role === 'pawn' &&
            ((dest[1] === '8' && turn_color === 'white') || (dest[1] === '1' && turn_color === 'black'))) {
            uci += 'q'
        }

        let move = parseUci(uci)!
        let san = makeSan(position, move)


        let node = await add_child_san_to_current_path(san)
        set_hide_after_path(undefined)
        goto_path(node.step.path)

        const is_previous_attempt = selected_due_move() !== undefined

        if (uci === solution_uci()) {
            if (show_previous_moves()) {
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
            if (show_previous_moves()) {
                set_attempt_result('failed-with-hint')
            } else {
                set_attempt_result('failed')
            }
            set_failed_path(node.step.path)
        }
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

        //res.sort((a, b) => b.id.localeCompare(a.id))
        res.sort((a, b) => a.created_at - b.created_at)

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

    const is_due_move_idle = createMemo(() => true)

    return (<>
    <main class='repeat-show'>
        <Suspense fallback={
            <div class='Loading ...'></div>
        }>

        <div class='header'>
            <Suspense>
                <div class='title'>{r_props.study?.name}</div>
                <div class='filter'><span class='label'>Filter:</span>
                    <span class='value'>{filter_title()}</span> moves
                </div>
                <div class='due-moves'><span class='label'>Due:</span>
                    <span class='value'>{due_list_by_type().length}</span> moves left
                </div>

            </Suspense>
        </div>
        <div on:wheel={non_passive_on_wheel(set_on_wheel)} class='board-wrap'>
            <PlayUciBoard shapes={annotation()} orientation={color()} color={color()} movable={movable()} fen={fen()} last_move={last_move()} play_orig_key={on_play_orig_key} />
        </div>
        <div class='replay-wrap'>
            <Suspense fallback={
                <div class='loading'>
                    Loading..
                </div>
            }>
            <Show when={!is_list_no_item()} fallback={
              <div class='no-dues'>
                <span>Great; No due moves at this time.</span>
                <A href="/repetition">Go Back to Repetitions</A>
              </div>
            }>
            <>
                <ReplayTreeComponent handle_goto_path={handle_goto_path} replay_tree={replay_tree()} lose_focus={false}/>
                <div class="controls">
                    <Show when={is_due_move_idle()} fallback={
                        <span class='idle'>...</span>
                    }>
    
                        <Show when={!has_attempted_due_move() && !show_previous_moves()}>
                            <button onClick={() => set_show_previous_moves(true)}>Hint: Show Previous Moves</button>
                        </Show>
                        <Show when={has_attempted_due_move()} fallback={
                            <button onClick={on_show_answer}>Show Answer</button>
                        }>
                            <button onClick={on_next_due_move}>Goto Next Due Move</button>
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
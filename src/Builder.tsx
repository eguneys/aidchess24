import { batch, createEffect, createMemo, createResource, createSignal, Match, on, onCleanup, onMount, Show, Switch, useContext } from "solid-js"
import { StockfishContext, StockfishProvider } from "./ceval2/StockfishContext"
import { Color, opposite } from "chessops"
import { PlayUciBoard, PlayUciComponent } from "./components/PlayUciComponent"
import './Builder.scss'

import { judgement_to_glyph, PlayUciSingleReplay, PlayUciSingleReplayComponent } from "./components/PlayUciReplayComponent"
import { makePersistedNamespaced } from "./storage"
import { stepwiseScroll } from "./common/scroll"
import { usePlayer } from "./sound"
import { fen_turn, INITIAL_FEN } from "./chess_pgn_logic"
import { Path, Ply, SAN, Step } from "./components/step_types"
import { PlayUciTreeReplay, PlayUciTreeReplayComponent, ply_to_index, TreeStepNode } from "./components/ReplayTreeComponent"
import { COOLDOWN_TIME, DEPTH8, StepLazyQueueWork, StepsWithStockfishComponent } from "./components/StockfishComponent"
import { arr_rnd } from "./random"
import { annotationShapes } from "./annotationShapes"
import createRAF from "@solid-primitives/raf"

export default () => {
    return (<StockfishProvider>
        <LoadingStockfishContext/>
    </StockfishProvider>)
}

function WelcomeInfo() {
    return (<>
    <div class='info'>
        <h2>Repertoire Builder</h2>
        <p>
            Play against the engine. Select your difficulty with skill setting.
            Engine always selects among the top 6 moves.
        </p>
        <p>
            Game ends when the evaluation drops below -2 for the player.
        </p>
        <p>
            You will see the latest evaluation and the accuracy of the moves in the move replay.
        </p>
        <p>
            You can save your played lines for building up your repertoire, and practice against later.
        </p>
        <p>
            You can tell the engine to stick to playing a specific line you have already played.
        </p>
        <p>
            Right click on the moves to open settings for that move. Switch between "Match" and "Repertoire" tabs.
        </p>
        <p>
            The goal is to find the top moves only, and play as long as you can, and repeat as much as possible.
        </p>
        <small> We recommend selecting the "Third" skill level for starters. Thus it will make some sub optimal moves, well suited for about 1800 lichess rated player. Later you can select "Top" option for GM level opening preparation.</small>
        <p class='right'>
            Have fun!
        </p>
    </div>
    </>)
}

function LoadingStockfishContext() {

    let [ss] = createResource(() => useContext(StockfishContext))

    const loading_percent = createMemo(() => {
        if (ss()?.state === 'idle') {
            return undefined
        }
        let nb = ss()?.download_nb
        if (nb) {
            return Math.ceil((nb.bytes / (nb.total === 0 ? 70 * 1024 * 1024 : nb.total)) * 100)
        }
    })


    const [default_hide_welcome_page, set_default_hide_welcome_page] = makePersistedNamespaced(false, 'builder.show_welcome_page')
    const [show_welcome_page, set_show_welcome_page] = createSignal(!default_hide_welcome_page())

    return (<>
        <Show when={ss()}>{s =>
            <Show when={s().state === 'loading' || show_welcome_page()} fallback={
                <WithStockfishLoaded on_welcome_page={() => set_show_welcome_page(true)}/>
            }>
                <main class='welcome'>
                    <WelcomeInfo/>
                    <Show when={loading_percent()} fallback={
                        <div class='start info'>
                            <button onClick={() => set_show_welcome_page(false)} class='button'>New Game</button>
                            <div class='hide-box'>
                                <label for='hide'>Don't show this again</label>
                                <input checked={default_hide_welcome_page()} onChange={e => set_default_hide_welcome_page(e.currentTarget.checked)} id='hide' type='checkbox'></input>
                            </div>
                        </div>
                    }>{percent => 
                        <p class='loading'>
                            <span class='info'>Loading Engine {percent()}%</span>
                        </p>
                    }</Show>
                </main>
            </Show>

        }</Show>
    </>)
}

type BuilderResult = 'flag' | 'highdrop' | 'drop' | 'checkmate' | 'stalemate' | 'threefold' | 'insufficient'

function WithStockfishLoaded(props: { on_welcome_page: () => void }) {

    const Player = usePlayer()
    Player.setVolume(0.2)

    let [sans, set_sans] = makePersistedNamespaced<SAN[]>([], 'builder.current.sans')

    const [search_depth, set_search_depth] = createSignal(DEPTH8)

    let game_id = ''
    const steps_stockfish = StepsWithStockfishComponent()

    const play_replay = PlayUciSingleReplayComponent()
    let play_uci = PlayUciComponent()

    const [player_color, set_player_color] = makePersistedNamespaced<Color>('white', 'builder.player_color')

    const engine_color = createMemo(() => opposite(player_color()))

    const ply_stockfish_step = createMemo(() => {
        let ply = play_replay.ply
        let ss = steps_stockfish.steps_with_stockfish
        return ss.find(_ => _.step.ply === ply)
    })



    const last_stockfish_step = createMemo(() => {
        let ss = steps_stockfish.steps_with_stockfish
        return ss[ss.length - 1]
    })

    function pv6_for_depth_option(work: StepLazyQueueWork) {
        if (search_depth() === DEPTH8) {
            return work.d8pv6
        }
        return work.d20pv6
    }

    function pv6_for_depth_option_force(work: StepLazyQueueWork) {
        if (search_depth() === DEPTH8) {
            return work.d8pv6[0]()
        }
        return work.d20pv6[0]()
    }


    const [play_cooldown, set_play_cooldown] = createSignal<number | undefined>(1)

    batch(() => {
        steps_stockfish.set_game_id(game_id)
        play_replay.set_sans(sans())
        start_play_cooldown()
    })

    function start_play_cooldown() {
        clearTimeout(play_cooldown())

        set_play_cooldown(setTimeout(() => {
            set_play_cooldown(undefined)
        }, COOLDOWN_TIME))
    }

    createEffect(() => {

        let cooldown = play_cooldown()

        if (cooldown !== undefined) {
            return
        }

        if (builder_result() !== undefined) {
            return
        }

        let last = last_stockfish_step()
        if (!last) {
            if (engine_color() === 'white') {
                last = steps_stockfish.initial_step
            } else {
                return
            }
        }

        let turn = fen_turn(last.step.fen)

        if (turn === engine_color()) {

            let stick_line = get_stick_line()

            if (stick_line && stick_line.startsWith(last.step.path)) {
                let next_uci = stick_line.slice(last.step.path.length).trim().split(' ')[0]

                if (next_uci) {
                    play_uci.play_uci(next_uci)
                    return
                }

            }


            let pdd = pv6_for_depth_option(last)[0]()
            createEffect(on(() => pdd.search, (s) => {
                if (!s) {
                    return
                }

                let cp = s.cp!

                let all = s.pvs

                let ca = s.pvs.filter(_ => Math.abs(_.cp! - cp) <= 10)
                let cb = s.pvs.filter(_ => Math.abs(_.cp! - cp) <= 30)
                let cc = s.pvs.filter(_ => Math.abs(_.cp! - cp) <= 60)
                let cd = s.pvs.filter(_ => Math.abs(_.cp! - cp) <= 100)
                let ce = s.pvs.filter(_ => Math.abs(_.cp! - cp) < 200)

                let a = ca.filter(_ => _.cp! < 150)
                let b = cb.filter(_ => _.cp! < 150)
                let c = cc.filter(_ => _.cp! < 150)
                let d = cd.filter(_ => _.cp! < 150)
                let e = ce.filter(_ => _.cp! < 150)

                function first_non_zero<T>(a: T[][]) {
                    return a.find(_ => _.length > 0)!
                }

                /*
                    console.log('cbaccall',
                        cp,
                        c.map(_ => `${_.cp}, ${_.moves[0]}`),
                        b.map(_ => `${_.cp}, ${_.moves[0]}`),
                        a.map(_ => `${_.cp}, ${_.moves[0]}`),
                        cc.map(_ => `${_.cp}, ${_.moves[0]}`),
                        all.map(_ => `${_.cp}, ${_.moves[0]}`),
                    )
                        */

                let pvs
                let skill = get_skill()
                switch(skill) {
                    case "A": pvs = first_non_zero([a, ca, all])
                     break
                    case "B": pvs = first_non_zero([b, a, ca, cb, all])
                     break
                    case "C": pvs = first_non_zero([c, b, a, ca, cb, cc, all])
                     break
                    case "D": pvs = first_non_zero([d, c, b, a, ca, cb, cc, cd, all])
                     break
                    case "E": pvs = first_non_zero([e, d, c, b, a, ca, cb, cc, cd, ce, all])
                     break
                }

                play_uci.play_uci(arr_rnd(pvs).moves[0])
            }))
        }
    })

    createEffect(on(() => play_uci.on_last_move_added, (last_move) => {
        if (last_move) {
            batch(() => {
                start_play_cooldown()
                play_replay.play_san(last_move[1])
            })
        }
    }))

    createEffect(on(() => play_replay.sans, set_sans))

    createEffect(on(() => play_replay.ply_step, (ps) => {
        play_uci.set_fen_and_last_move(ps?.fen ?? INITIAL_FEN, ps?.uci)
    }))

    createEffect(on(() => play_replay.ply_step, (current, prev) => {
        if (current) {
            if (!prev || prev.ply === current.ply - 1) {
                Player.move(current)
            }
        }
    }))

    const onWheel = stepwiseScroll((e: WheelEvent) => {
        const target = e.target as HTMLElement;
        if (
            target.tagName !== 'PIECE' &&
            target.tagName !== 'SQUARE' &&
            target.tagName !== 'CG-BOARD'
        )
            return;
        e.preventDefault();
        set_on_wheel(Math.sign(e.deltaY))
    })

    const set_on_wheel = (i: number) => {
        if (i > 0) {
            if (tab() === 'match') {
                play_replay.goto_next_ply_if_can()
            }
            if (tab() === 'repertoire') {
                play_replay_tree.goto_next_if_can()
            }
        } else {
            if (tab() === 'match') {
                play_replay.goto_prev_ply_if_can()
            }
            if (tab() === 'repertoire') {
                play_replay_tree.goto_prev_if_can()
            }
        }
    }



    const on_rematch = (color: Color = player_color()) => {
        batch(() => {
            set_player_color(color)
            set_sans([])
            play_replay.set_sans(sans())
            play_uci.set_fen_and_last_move(INITIAL_FEN)
            set_builder_result(undefined)
            start_play_cooldown()
            stop_clock_with_reset()
        })
    }

    createEffect(on(search_depth, () => {
        steps_stockfish.steps_with_stockfish.forEach(_ => {
            batch(() => {
                _.clear()
                pv6_for_depth_option_force(_)
            })
        })
        let last = last_stockfish_step()
        if (last) {
            pv6_for_depth_option(last)[0]()
        }
    }))

    createEffect(on(last_stockfish_step, (last_step) => {
        if (!last_step) {
            return
        }

        let pdd = pv6_for_depth_option_force(last_step)
        createEffect(on(() => pdd.search, search => {
            let cp = search?.cp

            if (!cp) {
                return
            }

            if ((player_color() === 'white' && cp < -200) 
                || (player_color() === 'black' && cp > 200)) {
                set_builder_result('drop')
            }

            if ((player_color() === 'white' && cp > 500) 
                || (player_color() === 'black' && cp < -500)) {
                set_builder_result('highdrop')
            }
        }))
    }))

    createEffect(() => {
        let is_checkmate = play_replay.is_checkmate
        let is_stalemate = play_replay.is_stalemate
        let is_threefold = play_replay.is_threefold
        let is_insufficient = play_replay.is_insufficient

        if (is_checkmate) {
            set_builder_result('checkmate')
        }
        if (is_stalemate) {
            set_builder_result('stalemate')
        }
        if (is_threefold) {
            set_builder_result('threefold')
        }
        if (is_insufficient) {
            set_builder_result('insufficient')
        }
    })

    let [first_cursor_path, set_first_cursor_path] = makePersistedNamespaced<Path>('', 'builder.current.cursor_path')

    let [first_pgn, set_first_pgn] = makePersistedNamespaced<string | undefined>(undefined, 'builder.current.pgn')
    const [builder_result, set_builder_result] = createSignal<BuilderResult | undefined>(undefined)

    const play_replay_tree = PlayUciTreeReplayComponent(first_pgn())
    play_replay_tree.cursor_path = first_cursor_path()

    createEffect(on(() => play_replay_tree.cursor_path, path => {
        set_first_cursor_path(path)
    }))

    createEffect(on(() => play_replay_tree.cursor_path_step, (ps) => {
        if (ps) {
            play_uci.set_fen_and_last_move(ps.fen, ps.uci)
        } else {
            play_uci.set_fen_and_last_move(INITIAL_FEN)
        }
    }))

    const on_save_line = (ply?: Ply) => {
        batch(() => {
            set_context_menu_step_single(undefined)
            if (ply) {
                play_replay.goto_ply(ply)
            }

            let steps = play_replay.steps_up_to_ply

            let sans = steps.map(_ => _.san)

            let res = play_replay_tree.steps.add_sans_at_root(sans)
            let final_path = res[res.length - 1]?.path

            if (!final_path) {
                return
            }

            set_tab('repertoire')
            play_replay_tree.cursor_path = final_path

            set_first_pgn(play_replay_tree.steps.as_pgn)
        })
    }



    const [tab, set_tab] = createSignal('match')


    createEffect(on(tab, (t) => {
        let ps = t === 'repertoire' ? play_replay_tree.cursor_path_step : play_replay.ply_step
        if (ps) {
            play_uci.set_fen_and_last_move(ps.fen, ps.uci)
        } else {
            play_uci.set_fen_and_last_move(INITIAL_FEN)
        }
    }))

    let $el_builder_ref: HTMLElement
    let $el_context_menu: HTMLElement

    const on_tree_context_menu = (e: MouseEvent, path: Path) => {
        play_replay_tree.cursor_path = path
        set_context_menu_step(play_replay_tree.steps.find_at_path(path))

        let x = e.clientX
        let y = e.clientY

        let context_bounds = $el_context_menu.getBoundingClientRect()
        let bounds = $el_builder_ref.getBoundingClientRect()
        x -= bounds.left
        y -= bounds.top


        x = Math.min(x, document.body.clientWidth - context_bounds.width - bounds.left - 20)

        let top = `${y}px`
        let left = `${x}px`

        $el_context_menu.style.top = top
        $el_context_menu.style.left = left
    }

    let $el_replay_context_menu: HTMLElement
    const on_replay_context_menu = (e: MouseEvent, ply: Ply) => {
        play_replay.goto_ply(ply)
        set_context_menu_step_single(play_replay.ply_step)

        let x = e.clientX
        let y = e.clientY

        let context_bounds = $el_replay_context_menu.getBoundingClientRect()
        let bounds = $el_builder_ref.getBoundingClientRect()
        x -= bounds.left
        y -= bounds.top


        x = Math.min(x, document.body.clientWidth - context_bounds.width - bounds.left - 20)

        let top = `${y}px`
        let left = `${x}px`

        $el_replay_context_menu.style.top = top
        $el_replay_context_menu.style.left = left
    }



    onMount(() => {

        const on_click = () => {
            set_context_menu_step(undefined)
            set_context_menu_step_single(undefined)
        }

        document.addEventListener('click', on_click)

        onCleanup(() => {
            document.removeEventListener('click', on_click)
        })
    })

    const [context_menu_step, set_context_menu_step] = createSignal<TreeStepNode | undefined>(undefined)
    const [context_menu_step_single, set_context_menu_step_single] = createSignal<Step | undefined>(undefined)

    const on_delete_move = (path: Path) => {
        play_replay_tree.steps.remove_child_at_path(path)
        set_context_menu_step(undefined)
    }


    const on_depth_changed = (depth: number) => {
        set_search_depth(depth)
    }

    const movable = createMemo(() => {
        return play_replay.is_on_last_ply && builder_result() === undefined
    })

    onMount(() => {

        const on_key_press = (e: KeyboardEvent) => {
            if (e.key === 'f') {
                set_player_color(opposite(player_color()))
            }
        }

        document.addEventListener('keypress', on_key_press)

        onCleanup(() => {
            document.removeEventListener('keypress', on_key_press)
        })
    })

    type Skill = "A" | "B" | "C" | "D" | "E"

    const [get_skill, set_skill] = makePersistedNamespaced<Skill>("C", 'builder.skill')

    const [get_stick_line, set_stick_line] = makePersistedNamespaced<Path | undefined>(undefined, 'builder.stick-line')

    //set_stick_line('g1f3 g8f6 f3g1 f6g8 g1f3 g8f6 f3g1 f6g8 g1f3 g8f6 f3g1 f6g8')

    const on_stick_line = (path: Path) => {
        set_stick_line(path)
        set_context_menu_step(undefined)
        set_context_menu_step_single(undefined)
    }

    const last_step_sharpness = createMemo(() => {

        let last_step = ply_stockfish_step()

        if (!last_step) {
            return undefined
        }

        let last_eval = pv6_for_depth_option(last_step)[0]()

        if (!last_eval) {
            return undefined
        }
        let mm = createMemo(on(() => last_eval.search, search => {
            if (!search) {
                return undefined
            }

            let cp = search.cp!
            return search.pvs.filter(_ => Math.abs(cp - _.cp!) < 45).length
        }))
        return mm()
    })

    const on_analyze_lichess = (step: Step) => {
        let fen = step.fen
        window.open(`https://lichess.org/analysis?fen=${fen}`, '_blank')
        set_context_menu_step_single(undefined)
        set_context_menu_step(undefined)
    }

    const annotation = createMemo(() => {
        let last = ply_stockfish_step()
        if (!last) {
            return undefined
        }
        let turn = fen_turn(last.step.fen)


        if (turn === engine_color()) {
            let { uci, san } = last.step

            let pdd = pv6_for_depth_option(last)[0]()

            let mm = createMemo(() => {
                if (!pdd.judgement) {
                    return undefined
                }
                let glyph = judgement_to_glyph(pdd.judgement)

                return annotationShapes(uci, san, glyph)
            })

            return mm()
        }
    })

    const [default_clock_time, _set_default_clock_time] = createSignal(7 * 60 * 1000)
    const [clock_millis, set_clock_millis] = createSignal(default_clock_time())

    let last_now: number | undefined
    let [clock_is_running, clock_start, clock_stop] = createRAF(now => {
        if (!last_now) {
            last_now = now
        }

        let dt = (now - last_now)
        last_now = now

        let millis = Math.max(0, clock_millis() - dt)

        set_clock_millis(millis)

        if (millis === 0) {
            set_builder_result('flag')
        }
    })

    function stop_clock_with_reset() {
        batch(() => {
            clock_stop()
            last_now = undefined
            set_clock_millis(default_clock_time())
        })
    }

    onMount(() => {

        const on_pause_clock = () => {
            clock_stop()
            last_now = undefined
        }

        const on_resume_clock = () => {
            clock_start()
        }

        window.addEventListener('blur', on_pause_clock)
        window.addEventListener('focus', on_resume_clock)

        onCleanup(() => {
            window.removeEventListener('blur', on_pause_clock)
            window.removeEventListener('focus', on_resume_clock)
        })
    })

    createEffect(on(builder_result, (_r) => {
        clock_stop()
        last_now = undefined
    }))

    createEffect(on(() => play_replay.last_step, (step) => {
        if (!step) {
            if (player_color() === 'white') {
                clock_start()
            }
            return
        }

        if (fen_turn(step.fen) === player_color()) {
            set_clock_millis(default_clock_time())
            clock_start()
        } else {
            stop_clock_with_reset()
        }
    }))

    const [settings_open, set_settings_open] = createSignal(false)

    return (<>
    <main ref={_ => $el_builder_ref = _} onWheel={onWheel} class='builder'>
        <div class='board-wrap'>
            <PlayUciBoard shapes={annotation()} orientation={player_color()} color={player_color()} movable={movable()} play_uci={play_uci} />
        </div>
        <div class='replay-wrap'>
                <div class='header'>
                    <div class='tabs-wrap'>
                        <div onClick={() => set_tab('match')} class={'tab' + (tab() === 'match' ? ' active' : '')}>Match</div>
                        <div onClick={() => set_tab('repertoire')} class={'tab' + (tab() === 'repertoire' ? ' active' : '')}>Repertoire</div>
                    </div>
                    <div class='icons-wrap'>
                      <i class={settings_open() ? 'open' : ''} onClick={() => set_settings_open(!settings_open())} data-icon=''></i>
                      <i onClick={props.on_welcome_page} data-icon=''></i>
                    </div>
                </div>
                <Show when={tab() === 'match'}>
                    <>
                    <Show when={settings_open()}>
                        <div class='settings-anchor'>
                        <div class='engine-wrap'>
                            <div class='skill'>
                            <label for="skill">Difficulty Tier:</label>
                            <select name="skill" id="skill" onChange={e => set_skill(e.currentTarget.value as Skill)}>
                                <option value="A" selected={get_skill()==="A"}>Top</option>
                                <option value="B" selected={get_skill()==="B"}>Second</option>
                                <option value="C" selected={get_skill()==="C"}>Third</option>
                                <option value="D" selected={get_skill()==="D"}>Fourth</option>
                                <option value="E" selected={get_skill()==="E"}>Fifth</option>
                            </select>
                            </div>
                            <div class='depth'>
                            <fieldset>
                                <div class='option'>
                                    <input checked={true} onChange={(e) => {if (e.target.checked) { on_depth_changed(DEPTH8) }}} type='radio' name='depth' id='level8' />
                                    <label for='level8'>Depth {DEPTH8}</label>
                                </div>
                                <div class='option'>
                                    <input onChange={(e) => {if (e.target.checked) { on_depth_changed(20) }}} type='radio' name='depth' id='level20' />
                                    <label for='level20'>Depth 20</label>
                                </div>
                            </fieldset>
                            </div>
                        </div>
                        </div>
                    </Show>
                    <PlayUciSingleReplay 
                        play_replay={play_replay} 
                        steps_stockfish={steps_stockfish} 
                        last_step_sharpness={last_step_sharpness()}
                        on_context_menu={on_replay_context_menu}
                    />
                    <div class='result-wrap'>

                        <Switch>
                            <Match when={builder_result() === 'flag'}>
                                <span class='result'>Game Over</span>
                                <small class='drop'>Ran out of time</small>
                            </Match>
                            <Match when={builder_result() === 'highdrop'}>
                                <span class='result'>Game Over</span>
                                <small class='drop'>Evaluation is High Above 5</small>
                            </Match>
                            <Match when={builder_result() === 'drop'}>
                                <span class='result'>Game Over</span>
                                <small class='drop'>Evaluation Dropped Below -2</small>
                            </Match>
                            <Match when={builder_result() === 'checkmate'}>
                                <span class='result'>Checkmate</span>
                                <small class='drop'>Victory is <span class='victory'>{fen_turn(play_replay.last_step!.before_fen)}</span></small>
                            </Match>
                            <Match when={builder_result() === 'stalemate'}>
                                <span class='result'>Stalemate</span>
                                <small class='drop'>Game is a draw</small>
                            </Match>
                            <Match when={builder_result() === 'threefold'}>
                                <span class='result'>3 Fold Repetition</span>
                                <small class='drop'>Game is a draw</small>
                            </Match>
                            <Match when={builder_result() === 'insufficient'}>
                                <span class='result'>Insufficient Material</span>
                                <small class='drop'>Game is a draw</small>
                            </Match>
                        </Switch>
                    </div>
                    <div class='tools-wrap'>
                        <button onClick={() => on_rematch()} class='rematch'>Rematch</button>
                        <button onClick={() => on_rematch(engine_color())} class={`color ${engine_color()}`}><i></i></button>
                    </div>
                    <div class='clock-wrap'>
                        <ClockTime time={clock_millis()} isRunning={clock_is_running()}/>
                    </div>
                    </>
                </Show>

                <Show when={tab() === 'repertoire'}>
                    <>
                    <PlayUciTreeReplay play_replay={play_replay_tree} on_context_menu={on_tree_context_menu}/>
                    </>
                </Show>
            </div>

            <Show when={context_menu_step()}>{step =>
                <div onClick={e => { e.preventDefault(); e.stopImmediatePropagation(); }} ref={_ => $el_context_menu = _} class='context-menu'>
                    <div class='title'>{ply_to_index(step().ply)}{step().san}</div>
                    <a onClick={() => on_stick_line(step().path)} class='stick' data-icon=''>Play only this line</a>
                    <a onClick={() => on_delete_move(step().path)} class='delete' data-icon=''>Delete move</a>
                </div>
            }</Show>
            <Show when={context_menu_step_single()}>{step =>
                <div onClick={e => { e.preventDefault(); e.stopImmediatePropagation(); }} ref={_ => $el_replay_context_menu = _} class='context-menu'>
                    <div class='title'>{ply_to_index(step().ply)}{step().san}</div>
                    <a onClick={() => on_stick_line(step().path)} class='stick' data-icon=''>Play only this line</a>
                    <a onClick={() => on_save_line(step().ply)} class='save' data-icon=''>Save this line</a>
                    <a onClick={() => on_analyze_lichess(step())} class='analyze' data-icon=''>Analyze on lichess</a>
                </div>
            }</Show>
    </main>
    </>)
}

type Millis = number

const pad2 = (num: number): string => (num < 10 ? '0' : '') + num;

function ClockTime(props: { time: Millis, isRunning: boolean }) {

  const date = createMemo(() => new Date(props.time));
  const millis = createMemo(() => date().getUTCMilliseconds())
  const minutes = createMemo(() => date().getUTCMinutes())
  const seconds = createMemo(() => date().getUTCSeconds())

  const low_klass = createMemo(() => props.isRunning && millis() < 500 ? ' low' : '')

  return <div class='clock'>
      {pad2(minutes())}<span class={'sep' + low_klass()}>:</span>{pad2(seconds())}
  </div>
}

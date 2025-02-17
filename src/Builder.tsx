import { batch, createEffect, createMemo, createResource, createSignal, on, onCleanup, onMount, Show, useContext } from "solid-js"
import { StockfishContext, StockfishProvider } from "./ceval2/StockfishContext"
import { Color, opposite } from "chessops"
import { PlayUciBoard, PlayUciComponent } from "./components/PlayUciComponent"
import './Builder.scss'

import { PlayUciSingleReplay, PlayUciSingleReplayComponent } from "./components/PlayUciReplayComponent"
import { makePersistedNamespaced } from "./storage"
import { stepwiseScroll } from "./common/scroll"
import { usePlayer } from "./sound"
import { fen_turn, INITIAL_FEN } from "./chess_pgn_logic"
import { Path, SAN } from "./components/step_types"
import { PlayUciTreeReplay, PlayUciTreeReplayComponent, ply_to_index, TreeStepNode } from "./components/ReplayTreeComponent"
import { StepLazyQueueWork, StepsWithStockfishComponent } from "./components/StockfishComponent"
import { arr_rnd } from "./random"

export default () => {
    return (<StockfishProvider>
        <LoadingStockfishContext/>
    </StockfishProvider>)
}

function LoadingStockfishContext() {

    let [ss] = createResource(() => useContext(StockfishContext))

    const loading_percent = createMemo(() => {
        let nb = ss()?.download_nb
        if (nb) {
            return Math.ceil((nb.bytes / (nb.total === 0 ? 70 * 1024 * 1024 : nb.total)) * 100)
        }
    })

    return (<>
        <Show when={ss()}>{s =>
            <Show when={s().state === 'loading'} fallback={
                <WithStockfishLoaded/>
            }>
                <div class='loading'>
                    <span class='info'>Loading {loading_percent() ?? '--'}%</span>
                </div>
            </Show>

        }</Show>
    </>)
}

type BuilderResult = 'drop'

function WithStockfishLoaded() {

    const Player = usePlayer()
    Player.setVolume(0.2)

    let [sans, set_sans] = makePersistedNamespaced<SAN[]>([], 'builder.current.sans')

    const [search_depth, set_search_depth] = createSignal(8)

    let game_id = ''
    const steps_stockfish = StepsWithStockfishComponent()

    const play_replay = PlayUciSingleReplayComponent()
    let play_uci = PlayUciComponent()

    const [player_color, set_player_color] = createSignal<Color>('white')

    const engine_color = createMemo(() => opposite(player_color()))

    const last_stockfish_step = createMemo(() => {
        let ss = steps_stockfish.steps_with_stockfish
        return ss[ss.length - 1]
    })

    function pv6_for_depth_option(work: StepLazyQueueWork) {
        if (search_depth() === 8) {
            return work.d8pv6
        }
        return work.d20pv6
    }

    function pv1_for_depth_option_force(work: StepLazyQueueWork) {
        if (search_depth() === 8) {
            return work.d8pv1[0]()
        }
        return work.d20pv1[0]()
    }

    createEffect(on(last_stockfish_step, last => {
        if (!last) {
            return
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

                let a = s.pvs.filter(_ => Math.abs(_.cp! - cp) <= 10)
                let b = s.pvs.filter(_ => Math.abs(_.cp! - cp) <= 30)
                let c = s.pvs.filter(_ => Math.abs(_.cp! - cp) <= 60)
                let d = s.pvs.filter(_ => Math.abs(_.cp! - cp) <= 100)
                let e = s.pvs.filter(_ => Math.abs(_.cp! - cp) < 200)

                a = a.filter(_ => _.cp! < 150)
                b = b.filter(_ => _.cp! < 150)
                c = c.filter(_ => _.cp! < 150)
                d = d.filter(_ => _.cp! < 150)
                e = e.filter(_ => _.cp! < 150)

                function first_non_zero<T>(a: T[][]) {
                    return a.find(_ => _.length > 0)!
                }
                //console.log(c, b, a, all)
                let pvs
                let skill = get_skill()
                switch(skill) {
                    case "A": pvs = first_non_zero([a, all])
                     break
                    case "B": pvs = first_non_zero([b, a, all])
                     break
                    case "C": pvs = first_non_zero([c, b, a, all])
                     break
                    case "D": pvs = first_non_zero([d, c, b, a, all])
                     break
                    case "E": pvs = first_non_zero([e, d, c, b, a, all])
                     break
                }

                play_uci.play_uci(arr_rnd(pvs).moves[0])
            }))
        }
    }))

    createEffect(on(() => play_uci.on_last_move_added, (last_move) => {
        if (last_move) {
            play_replay.play_san(last_move[1])
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


    steps_stockfish.set_game_id(game_id)
    play_replay.set_sans(sans())

    const on_rematch = () => {
        set_sans([])
        play_replay.set_sans(sans())
        play_uci.set_fen_and_last_move(INITIAL_FEN)
        set_builder_result(undefined)
    }

    createEffect(on(search_depth, () => {
        steps_stockfish.steps_with_stockfish.forEach(_ => {
            batch(() => {
                _.clear()
                pv1_for_depth_option_force(_)
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

        let pdd = pv1_for_depth_option_force(last_step)
        createEffect(on(() => pdd.search, search => {
            let cp = search?.cp

            if (!cp) {
                return
            }

            if (cp < -200) {
                set_builder_result('drop')
            }
        }))
    }))


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

    const on_save_line = () => {
        batch(() => {
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

    onMount(() => {

        const on_click = () => {
            set_context_menu_step(undefined)
        }

        document.addEventListener('click', on_click)

        onCleanup(() => {
            document.removeEventListener('click', on_click)
        })
    })

    const [context_menu_step, set_context_menu_step] = createSignal<TreeStepNode | undefined>(undefined)

    const on_delete_move = (path: Path) => {
        play_replay_tree.steps.remove_child_at_path(path)
        set_context_menu_step(undefined)
    }


    const on_depth_changed = (depth: number) => {
        set_search_depth(depth)
    }

    const movable = createMemo(() => {
        return !play_uci.isEnd && play_replay.is_on_last_ply && builder_result() === undefined
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

    const [get_skill, set_skill] = createSignal<Skill>("A")

    const [get_stick_line, set_stick_line] = createSignal<Path | undefined>(undefined)

    const on_stick_line = (path: Path) => {
        set_stick_line(path)
        set_context_menu_step(undefined)
    }

    return (<>
    <div ref={_ => $el_builder_ref = _} onWheel={onWheel} class='builder'>
        <div class='board-wrap'>
            <PlayUciBoard orientation={player_color()} color={player_color()} movable={movable()} play_uci={play_uci} />
        </div>
        <div class='replay-wrap'>
            <div class='tabs-wrap'>
                <div onClick={() => set_tab('match')}  class={'tab' + (tab() === 'match' ? ' active' : '')}>Match</div>
                <div onClick={() => set_tab('repertoire')} class={'tab' + (tab() === 'repertoire' ? ' active' : '')}>Repertoire</div>
            </div>
                <Show when={tab() === 'match'}>
                    <>
                        <div class='engine-wrap'>
                            <div class='skill'>
                            <label for="skill">Skill:</label>
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
                                    <input checked={true} onChange={(e) => {if (e.target.checked) { on_depth_changed(8) }}} type='radio' name='depth' id='level8' />
                                    <label for='level8'>Depth 8</label>
                                </div>
                                <div class='option'>
                                    <input onChange={(e) => {if (e.target.checked) { on_depth_changed(20) }}} type='radio' name='depth' id='level20' />
                                    <label for='level20'>Depth 20</label>
                                </div>
                            </fieldset>
                            </div>
                        </div>
                        <PlayUciSingleReplay play_replay={play_replay} steps_stockfish={steps_stockfish} />
                        <div class='result-wrap'>
                            <Show when={builder_result() === 'drop'}>
                                <span class='result'>Game Over</span>
                                <small class='drop'>Evaluation Dropped Below -2</small>
                            </Show>
                        </div>
                        <div class='tools-wrap'>
                            <button onClick={on_save_line} class='save'>Save Line</button>
                            <button onClick={on_rematch} class='rematch'>Rematch</button>
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
    </div>
    </>)
}
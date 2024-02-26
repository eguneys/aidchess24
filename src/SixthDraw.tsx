import './Sixth.css'
import { INITIAL_FEN } from "chessops/fen";
import Chessboard from "./Chessboard";
import { ChesstreeShorten, Treelala2 } from "./Chesstree2"
import { Shala } from "./Shalala";
import { For, Show, Signal, createEffect, createMemo, createSignal, on, onCleanup, onMount } from 'solid-js';
import { FinalEvalAccuracy } from './chess_ceval';
import { MoveData } from './chess_pgn_logic';
import { arr_rnd } from './random';


class SixthPath {

    _populated_node: Signal<MoveData | undefined>

    get populated_node() {
        return this._populated_node[0]()
    }

    set populated_node(_: MoveData | undefined) {
        this._populated_node[1](_)
    }



    _node: Signal<MoveData | undefined>

    get node() {
        return this._node[0]()
    }

    set node(_: MoveData | undefined) {
        this._node[1](_)
    }

    _eval_accuracy: Signal<FinalEvalAccuracy | undefined>

    set accuracy(_: FinalEvalAccuracy | undefined) {
        this._eval_accuracy[1](_)
    }

    get accuracy() {
        return this._eval_accuracy[0]()
    }

    get is_empty() {
        return this.node === undefined
    }

    get is_analysed() {
        return this.accuracy !== undefined
    }

    get is_keep() {
        return this.accuracy && this.accuracy.accuracy > 70
    }

    get is_dropped() {
        return this.is_analysed && !this.is_keep
    }

    _is_predropped: Signal<boolean>

    get is_predropped(){
        return this._is_predropped[0]()
    }



    set is_predropped(_: boolean) {
        this._is_predropped[1](_)
    }

    get is_populated() {
        return this.populated_node !== undefined
    }

    get status_klass() {
        let res = ['status']
        if (this.is_populated) {
            res.push('populated')
        }
        if (this.is_predropped) {
            res.push('predrop')
        } else if (this.is_analysed) {
            if (this.is_keep) {
                res.push('keep')
            }
            if (this.is_dropped) {
                res.push('drop')
            }
        } else {
            res.push('played')
        }
        return res.join(' ')
    }

    get status() {
        if (this.is_populated) {
            return 'populated.'
        }
        if (this.is_predropped) {
            return 'pre-dropped.'
        } else if (this.is_analysed) {

            if (this.is_keep) {
                return 'kept.'
            }
            if (this.is_dropped) {
                return 'dropped.'
            }
        } else {
            return 'played.'
        }
    }

    constructor() {
        this._populated_node = createSignal<MoveData | undefined>()
        this._node = createSignal<MoveData | undefined>()
        this._eval_accuracy = createSignal<FinalEvalAccuracy | undefined>()
        this._is_predropped = createSignal(false)
    }
}


const SixthDraw = () => {

    let shalala = new Shala()
    const tree_lala = new Treelala2(INITIAL_FEN)

    const paths = [
        new SixthPath(),
        new SixthPath(),
        new SixthPath(),
        new SixthPath(),
        new SixthPath(),
        new SixthPath(),
    ]

    const next_path = createMemo(() => paths.find(_ => _.is_empty))

    createEffect(on(() => shalala.add_uci, (uci?: string) => {
        if (!uci) {
            return
        }

        let pp = next_path()
        if (pp) {
          let path = tree_lala.add_uci(uci)


          pp.node = tree_lala.tree!.get_at(path)
        }
    }))

    createEffect(on(next_path, (p, p0) => {
        if (!p && !!p0) {
            begin_engines_turn()
                .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
                .then(_ => {
                    tree_lala.drop_failed_paths()
                })
                .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
                .then(() =>
                    begin_engines_populate()
                )
                .then(() => {
                    paths.forEach(_ => {
                        _.populated_node = undefined
                        _.node = undefined
                        _.accuracy = undefined
                        _.is_predropped = false
                    })
                })

        }
    }))

    async function begin_engines_populate() {

        const p = paths.find(_ => !_.is_populated && (_.is_predropped || _.is_dropped))

        if (!p) {
            return
        }

        let ps = paths
        .filter(_ => _.is_populated)
        .map(_ => _.populated_node!.path)

        ps.push(...tree_lala.tree!.all_leaves.map(_ => _.path))

        let p_eval = (await tree_lala.tree!.request_ceval_and_get_at(arr_rnd(ps)))!

        let p_children = tree_lala.tree!.get_children(p_eval.path)!
        let pvs = p_eval.eval_accuracy!.multi_pvs4
            .filter(_ => !p_children.some(c => c.uci === _))
        let uci = arr_rnd(pvs)
        tree_lala.cursor_path = p_eval.path
        tree_lala.add_and_reveal_uci(uci)

        p.populated_node = tree_lala.tree!.get_at(tree_lala.cursor_path)


        await new Promise(resolve => setTimeout(resolve, 1000))
        await begin_engines_populate()
    }

    async function begin_engines_turn() {

        const p = paths.find(_ => !_.is_predropped && !_.is_analysed)

        if (!p) {
            return
        }

        const i = (await tree_lala.tree!.request_ceval_and_get_at(p.node!.path))!
        const eval_accuracy = i.eval_accuracy!

        p.accuracy = eval_accuracy

        if (p.is_keep) {
            // good move
            tree_lala._solved_paths.add_path(i.path)
        } else {
            // blunder
            tree_lala.add_failed_path(i.path)
            paths
            .filter(_ => _ !== p && _.node!.path.join('').startsWith(i.path.join('')))
            .forEach(_ => _.is_predropped = true)
        }

        await new Promise(resolve => setTimeout(resolve, 1000))
        await begin_engines_turn()
    }


    createEffect(on(() => tree_lala.fen_last_move, (res) => {
        if (res) {
            let [fen, last_move] = res
            shalala.on_set_fen_uci(fen, last_move)
        } else {
            shalala.on_set_fen_uci(INITIAL_FEN)
        }
    }))


    createEffect(on(() => shalala.on_wheel, (dir) => {
        if (dir) {
            tree_lala.on_wheel(dir)
        }
    }))



    const onWheel = (e: WheelEvent) => {
        const target = e.target as HTMLElement;
        if (
            target.tagName !== 'PIECE' &&
            target.tagName !== 'SQUARE' &&
            target.tagName !== 'CG-BOARD'
        ) return;
        e.preventDefault();
        shalala.set_on_wheel(Math.sign(e.deltaY))
    }

    let el_sixth: HTMLDivElement

    onMount(() => {
        el_sixth.addEventListener('wheel', onWheel, { passive: false })
    })
    onCleanup(() => {
        el_sixth.removeEventListener('wheel', onWheel)
    })


    return (<>
        <div ref={_ => el_sixth = _} class='sixth'>
            <div class='board-wrap'>
                <Chessboard
                    movable={next_path() !== undefined}
                    doPromotion={shalala.promotion}
                    onMoveAfter={shalala.on_move_after}
                    fen_uci={shalala.fen_uci}
                    color={shalala.turnColor}
                    dests={shalala.dests} />
            </div>
            <div class='replay-wrap'>
                <div class='replay-header'>
                    <h2 class='eval-title'> +0.2 </h2>
                </div>
                <div class='replay'>
                    <div class='replay-v'>
                        <ChesstreeShorten lala={tree_lala} />
                    </div>
                    <div class='tools'>
                        <For each={paths}>{path => 
                            <div class='sixth-path'>
                                <Show when={path.node} fallback={
                                    <>
                                        --
                                    </>
                                }>{node =>
                                    <>
                                        <span><span class='index'>{`${Math.ceil(node().ply / 2)}${node().ply % 2 === 0 ? '... ' : '. '}`}</span>{node().san}</span>
                                        <span class={path.status_klass}>{path.status}</span>

                                    </>
                                    }</Show>

                            </div>
                        }</For>
                    </div>
                </div>
            </div>
            <div class='howto'>
                <h1> Sixth Game </h1>
                <h2> How to Play </h2>
                <ul>
                    <li><p>You play an analysis game against the engine.</p></li>
                    <li><p>You play both white and black, Then it's your turn.</p></li>
                    <li><p>You have 6 plies to play. You can play any line you like.</p></li>
                    <li><p>Then it's engine's turn. It also has 6 plies.</p></li>
                    <li><p>Engine will analyse your lines, and prefer to keep your accurate moves, and surely drop your inaccurate moves, and make a new move for each dropped move.</p></li>
                    <li><p>Each accurate move you get a point. 4, 5 or 6 accurate moves you get bonus points. No accurate moves game ends.</p></li>
                    <li><p>You can use your plies either as separate lines or a single line, whichever you feel is comfortable for you.</p></li>
                    <li><p>Essentially you can be playing at most 6 games at once, against the engine.</p></li>
                    <li><p class='underline'>When an inaccurate move drops, it will automatically drop next moves that comes after it if there is any. So if you rely on a single line, and first move fails, game ends.</p></li>
                </ul>
                <br />
            </div>

            <div class='under'>
                <br />
                <div class='howto'>
                    <h2> Considerations </h2>
                    <ul>
                        <li>Two player real time adaptation.</li>

                        <li>Player doesn't choose a color. Essentially player will try to find a drawing line without blundering for both sides. This might come as easy, just exchanging pieces willingly might put you in a situation.</li>
                        <li>To make things interesting and combat this, engine might have a temper that doesn't so much prefer your moves but picks other random but accurate moves adding more diversity to the game.</li>

                        <li>Occasionaly, user might want to show a losing line, by indicating the played move as a blunder and give a continuation. This might be incentivized somehow. Similarly user might want to indicate a line as a forcing line, like if a move is the only best move available.</li>

                    </ul>
                    <br />
                </div>
            </div>
        </div>
    </>)
}


export default SixthDraw
import './Sixth.css'
import { INITIAL_FEN } from "chessops/fen";
import Chessboard from "./Chessboard";
import { ChesstreeShorten, Treelala2 } from "./Chesstree2"
import { Shala } from "./Shalala";
import { For, Show, createEffect, createSignal, on } from 'solid-js';

const SixthDraw = () => {

    let shalala = new Shala()
    const tree_lala = new Treelala2(INITIAL_FEN)

    const [plies, set_plies] = createSignal(6)

    const [paths, set_paths] = createSignal<string[][]>([], { equals: false })

    const [engine_state, set_engine_state] = createSignal('idle')


    createEffect(on(() => shalala.add_uci, (uci?: string) => {
        if (!uci) {
            return
        }

        let pp = plies()

        if (pp > 0) {
          set_plies(pp - 1)
          let path = tree_lala.add_uci(uci)

          let ps = paths()
          ps.push(path)
          set_paths(ps)

          if (pp - 1 === 0) {

            begin_engines_turn()
            .then(_ => {
                set_engine_state('drop_fails')
                return new Promise(r => setTimeout(r, 1000)).then(_ => {
                    tree_lala.drop_failed_paths()
                    set_engine_state('idle')
                })
            })
            .then(_ => {
                set_plies(6)
            })
          }
        }
    }))

    async function begin_engines_turn() {
        let pp = paths()

        const p = pp.shift()
        if (!p) {
            return
        }

        const i = await tree_lala.tree!.request_ceval_and_get_at(p)
        const eval_accuracy = i?.eval_accuracy!
        if (eval_accuracy.accuracy > 70) {
            // good move
            tree_lala._solved_paths.add_path(p)
        } else if (eval_accuracy.accuracy < 60) {
            // blunder
            tree_lala._failed_paths.add_path(p)
            pp = pp.filter(_ => !_.join('').startsWith(p.join('')))
        } else {
            // decent
            tree_lala._solved_paths.add_path(p)
        }

        set_paths(pp)

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
        )
            return;
        e.preventDefault();
        shalala.set_on_wheel(Math.sign(e.deltaY))
    }

    return (<>
        <div onWheel={onWheel} class='sixth'>
            <div class='board-wrap'>
                <Chessboard
                    movable={plies() > 0}
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
                        <For each={paths()}>{path =>
                            <small>{path}</small>
                        }</For>
                        <Show when={plies() === 0} fallback={
                            <>
                                <h2>{plies()} plies left</h2>
                                <p>Your turn</p>
                            </>
                        }>{
                                <>
                                    <p> Engine's turn.. </p>
                                    <Show when={engine_state() === 'idle'} fallback={
                                        <p> Dropping Paths. </p>
                                    }>{
                                            <p> Analysing moves. </p>
                                        }</Show>
                                </>
                            }</Show>
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
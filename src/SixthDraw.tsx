import './Sixth.css'
import { INITIAL_FEN } from "chessops/fen";
import Chessboard from "./Chessboard";
import Chesstree2, { ChesstreeShorten, Treelala2 } from "./Chesstree2"
import { Shala } from "./Shalala";
import { createEffect, on } from 'solid-js';

const SixthDraw = () => {

    let shalala = new Shala()
    const tree_lala = new Treelala2(INITIAL_FEN)



    createEffect(on(() => shalala.add_uci, (uci?: string) => {
        if (!uci) {
            return
        }

        tree_lala.add_uci(uci)
    }))



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
                    movable={true}
                    doPromotion={shalala.promotion}
                    onMoveAfter={shalala.on_move_after}
                    fen_uci={shalala.fen_uci}
                    color={shalala.turnColor}
                    dests={shalala.dests} />
            </div>
            <div class='replay-wrap'>
                <div class='replay'>
                    <div class='replay-v'>
                        <ChesstreeShorten lala={tree_lala} />
                    </div>
                </div>
            </div>
        </div>
    </>)
}


export default SixthDraw
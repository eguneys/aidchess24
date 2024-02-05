import { createEffect, onMount } from 'solid-js'
import { Chessground } from 'chessground'
import { Api } from 'chessground/api'
import { Color, Dests, Key } from 'chessground/types'

const Chessboard = (props: { movable?: boolean, fen_uci?: [string, string | undefined], doPromotion: Key | undefined, onMoveAfter: (orig: Key, dest: Key) => void, color: Color, dests: Dests }) => {

    let board: HTMLElement
    let ground: Api

    onMount(() => {

      let color = props.color
      let dests = props.dests

      let config = {
        premovable: {
          enabled: false
        },
        movable: {
          color,
          free: false,
          dests,
          events: {
            after: props.onMoveAfter
          }
        }
      }
      ground = Chessground(board, config)
    })

    createEffect(() => {
      if (!props.fen_uci) {
        return
      }
      let [fen, uci] = props.fen_uci
      let lastMove: Key[] = []
      if (uci) {
        lastMove.push(uci.slice(0, 2) as Key)
        lastMove.push(uci.slice(2, 4) as Key)
      }
      let movableColor = props.movable ? props.color : undefined
      ground.set({fen, lastMove, turnColor: props.color, movable: {
        color: movableColor,
        dests: props.dests
      }})
    })

    createEffect(() => {
      let key = props.doPromotion
      if (key) {
        let piece = ground.state.pieces.get(key)!
        ground.setPieces(
          new Map([
            [
              key,
              {
                color: piece.color,
                role: 'queen',
                promoted: true
              }
            ]
          ])
        )
      }
    })


    return (<>
      <div ref={(el) => board = el} class='is2d chessboard'>

      </div>
    </>)
}


export default Chessboard
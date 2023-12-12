import { createEffect, onMount } from 'solid-js'
import { Chessground } from 'chessground'
import { Api } from 'chessground/api'
import { Color, Dests, Key } from 'chessground/types'

const Chessboard = (props: { onMoveAfter: (orig: Key, dest: Key) => void, color: Color, dests: Dests }) => {

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

      ground.set({
        movable: { color: props.color, dests: props.dests }
      })
    })


    return (<>
      <div ref={(el) => board = el} class='is2d chessboard'>

      </div>
    </>)
}


export default Chessboard
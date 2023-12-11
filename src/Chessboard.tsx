import { createEffect, onMount } from 'solid-js'
import { Shess } from 'shess'

let shess: Shess = Shess.init()

const Chessboard = (props: { pull_fen: (_: string) => void, fen: string, dests: {[key: string]: string[] } }) => {

    let board: HTMLElement

    onMount(() => {
  
      board.appendChild(shess.el)
  
      shess.init()

      shess.fen(props.fen)
      shess.pull_fen(props.pull_fen)
    })

    createEffect(() => {
      shess.fen(props.fen)
      shess.dests(props.dests)
    })



    return (<>
      <div ref={(el) => board = el} class='chessboard'>

      </div>
    </>)
}


export default Chessboard
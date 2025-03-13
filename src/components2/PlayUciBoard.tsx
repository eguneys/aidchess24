import { Chessground } from "chessground"
import { Api } from "chessground/api"
import { Color, Key } from "chessground/types"
import { FEN, fen_pos, SAN, UCI } from "../components/step_types"
import { createEffect, createMemo, onMount } from "solid-js"
import { chessgroundDests } from "chessops/compat"
import { DrawShape } from "chessground/draw"

export function PlayUciBoard(props: { 
  shapes?: DrawShape[],
  orientation?: Color,
    movable?: boolean,
    color: Color, fen: FEN, 
    last_move: [UCI, SAN] | undefined, play_orig_key?: (orig: Key, dest: Key) => void }) {

    let board: HTMLDivElement
    let ground: Api

    let pos = createMemo(() => fen_pos(props.fen))
    let dests = createMemo(() => chessgroundDests(pos()))
    let check = createMemo(() => pos().isCheck())

    onMount(() => {
      let color = props.color
      let check = pos().isCheck()

      let config = {
        fen: props.fen,
        check,
        premovable: {
          enabled: false
        },
        movable: {
          color,
          free: false,
          dests: dests(),
          events: {
            after: props.play_orig_key
          }
        }
      }
      ground = Chessground(board, config)
    })


    createEffect(() => {
      let lastMove: Key[] | undefined = undefined
      if (props.last_move) {
        let [uci] = props.last_move
        lastMove = [uci.slice(0, 2) as Key, uci.slice(2, 4) as Key]
      }
      ground.set({
        lastMove,
        fen: props.fen,
        turnColor: props.color,
        orientation: props.orientation ?? 'white',
        check: check(),
        movable: {
          color: props.movable ? props.color : undefined,
          dests: dests()
        }
      }) 
    })


    createEffect(() => { ground.setAutoShapes(props.shapes ?? []) })

    return (<><div ref={(el) => board = el} class='is2d chessboard'> </div></>)
}
import { Chessground } from "chessground"
import { Api } from "chessground/api"
import { DrawShape } from "chessground/draw"
import { FEN, Key } from "chessground/types"
import { Chess, Color, parseSquare, parseUci } from "chessops"
import { chessgroundDests } from "chessops/compat"
import { INITIAL_FEN, makeFen, parseFen } from "chessops/fen"
import { makeSan } from "chessops/san"
import { batch, createEffect, createMemo, createSignal, on, onMount } from "solid-js"
import './chessground.css'
import { SAN, UCI } from "./step_types"

export type PlayUciComponent = {
    play_orig_key: (orig: Key, dest: Key) => void,
    play_uci: (uci: UCI) => void,
    set_fen: (fen: FEN) => void,
    set_last_move: (last_move?: UCI) => void,
    set_fen_and_last_move: (fen: FEN, last_move?: UCI) => void
    dests: Map<Key, Key[]>,
    fen: FEN,
    last_move: [UCI, SAN] | undefined,
    on_last_move_added: [UCI, SAN] | undefined,
    check: boolean,
    isEnd: boolean
}



export function PlayUciComponent(): PlayUciComponent {

  let [fen, set_fen] = createSignal<FEN>(INITIAL_FEN)

  let [last_move, set_last_move] = createSignal<[UCI, SAN] | undefined>(undefined)
  let [on_last_move_added, set_on_last_move_added] = createSignal<[UCI, SAN] | undefined>(undefined)

  let pos = createMemo(() => Chess.fromSetup(parseFen(fen()).unwrap()).unwrap())
  let color = createMemo(() => pos().turn)
  let dests = createMemo(() => chessgroundDests(pos()))

  const play_uci = (uci: string) => {

    let position = pos()

    let move = parseUci(uci)!

    let san = makeSan(position, move)
    position.play(move)

    batch(() => {
      set_last_move([uci, san])
      set_on_last_move_added([uci, san])
      set_fen(makeFen(position.toSetup()))

      if (uci.length === 5) {
        //set_promotion(dest)
      }
    })
  }

  const set_last_move_uci = (uci?: UCI) => {
    if (!uci) {
      set_last_move(undefined)
      return
    }
    let san = makeSan(pos(), parseUci(uci)!)
    set_last_move([uci, san])
  }

    return {
        play_orig_key(orig: Key, dest: Key) {

            let position = pos()
            let turn_color = color()

            let piece = position.board.get(parseSquare(orig)!)!

            let uci = orig + dest
            if (piece.role === 'pawn' &&
                ((dest[1] === '8' && turn_color === 'white') || (dest[1] === '1' && turn_color === 'black'))) {
                uci += 'q'
            }

            play_uci(uci)
        },
        play_uci,
        set_fen_and_last_move(fen: FEN, last_move?: UCI) {
          batch(() => {
            set_last_move_uci(last_move)
            set_fen(fen)
          })
        },
        set_fen(fen: string) {
          set_fen(fen)
        },
        set_last_move(uci?: UCI) {
          set_last_move_uci(uci)
        },
        get dests() {
            return dests()
        },
        get fen() {
            return fen()
        },
        get last_move() {
          return last_move()
        },
        get on_last_move_added() {
          return on_last_move_added()
        },
        get check() {
          return pos().isCheck()
        },
        get isEnd() {
          return pos().isEnd()
        }
    }
}


export function PlayUciBoard(props: { shapes?: DrawShape[], color: Color, orientation?: Color, movable: boolean, play_uci: PlayUciComponent}) {

    let board: HTMLElement
    let ground: Api

    onMount(() => {
      let color = props.color
      let dests = props.play_uci.dests

      let config = {
        fen: props.play_uci.fen,
        check: props.play_uci.check,
        premovable: {
          enabled: false
        },
        movable: {
          color,
          free: false,
          dests,
          events: {
            after: props.play_uci.play_orig_key
          }
        }
      }
      ground = Chessground(board, config)
    })

    createEffect(() => {
      let lastMove: Key[] | undefined = undefined
      if (props.play_uci.last_move) {
        let [uci] = props.play_uci.last_move
        lastMove = [uci.slice(0, 2) as Key, uci.slice(2, 4) as Key]
      }
      ground.set({
        lastMove,
        fen: props.play_uci.fen,
        turnColor: props.color,
        orientation: props.orientation ?? 'white',
        check: props.play_uci.check,
        movable: {
          color: props.movable ? props.color : undefined,
          dests: props.play_uci.dests
        }
      }) 
    })

    /*
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
      */

    createEffect(() => { ground.setAutoShapes(props.shapes ?? []) })

    return (<>
      <div ref={(el) => board = el} class='is2d chessboard'>

      </div>
    </>)

}


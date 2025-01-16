import { Chessground } from "chessground"
import { Api } from "chessground/api"
import { DrawShape } from "chessground/draw"
import { FEN, Key } from "chessground/types"
import { Chess, Color, parseSquare, parseUci } from "chessops"
import { chessgroundDests } from "chessops/compat"
import { INITIAL_FEN, makeFen, parseFen } from "chessops/fen"
import { makeSan } from "chessops/san"
import { batch, createEffect, createMemo, createSignal, onMount } from "solid-js"
import './chessground.css'
import { SAN, UCI } from "./PlayUciReplayComponent"

export type PlayUciComponent = {
    play_orig_key: (orig: Key, dest: Key) => void,
    play_uci: (uci: UCI) => void,
    set_fen_last_move: (fen: FEN, last_move?: [UCI, SAN]) => void,
    dests: Map<Key, Key[]>,
    fen_last_move: [FEN, [UCI, SAN]] | undefined,
    fen: FEN,
    last_move: [UCI, SAN] | undefined,
    add_last_move: [UCI, SAN] | undefined,
    check: boolean,
    isEnd: boolean
}



export function PlayUciComponent(): PlayUciComponent {

  let [pos, set_pos] = createSignal(Chess.fromSetup(parseFen(INITIAL_FEN).unwrap()).unwrap(), { equals: false })

  let [last_move, set_last_move] = createSignal<[UCI, SAN] | undefined>(undefined)
  let [add_last_move, set_add_last_move] = createSignal<[UCI, SAN] | undefined>(undefined)

  let fen = createMemo(() => makeFen(pos().toSetup()))
  let color = createMemo(() => pos().turn)
  let dests = createMemo(() => chessgroundDests(pos()))

  const play_uci = (uci: string) => {

    let position = pos()

    let move = parseUci(uci)!

    let san = makeSan(position, move)
    position.play(move)

    batch(() => {

      set_last_move([uci, san])
      set_add_last_move([uci, san])
      set_pos(position)

      if (uci.length === 5) {
        //set_promotion(dest)
      }
    })
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
        set_fen_last_move(fen: string, last_move?: [UCI, SAN]) {
          batch(() => {
            set_pos(Chess.fromSetup(parseFen(fen).unwrap()).unwrap())
            set_last_move(last_move)
          })
        },
        get dests() {
            return dests()
        },
        get fen_last_move() {
            let f = fen()
            let l = last_move()
            if (!l) {
                return undefined
            }
            let res: [string, [string, string]] = [f, l]
            return res
        },
        get fen() {
            return fen()
        },
        get last_move() {
            return last_move()
        },
        get add_last_move() {
          return add_last_move()
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
      let fen, uci
      if (!props.play_uci.fen_last_move) {
        fen = INITIAL_FEN
      } else {
        // @ts-ignore
        let _
        [fen, [uci, _]] = props.play_uci.fen_last_move
      }
      let lastMove: Key[] = []
      if (uci) {
        lastMove.push(uci.slice(0, 2) as Key)
        lastMove.push(uci.slice(2, 4) as Key)
      }
      let movableColor = props.movable ? props.color : undefined
      ground.set({fen, lastMove, turnColor: props.color, movable: {
        color: movableColor,
        dests: props.play_uci.dests
      }})
    })

    createEffect(() => {
      let color = props.orientation ?? 'white'
      ground.set({
        orientation: color
      })
    })

    createEffect(() => {
      let check = props.play_uci.check
      ground.set({ check })
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

    createEffect(() => {
      if (props.shapes) {
         ground.setAutoShapes(props.shapes)
      } else {
        ground.setAutoShapes([])
      }
    })

    return (<>
      <div ref={(el) => board = el} class='is2d chessboard'>

      </div>
    </>)

}


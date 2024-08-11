import './Shalala.css'
import { Signal, batch, createMemo, createSignal } from 'solid-js'
import { INITIAL_FEN, makeFen, parseFen } from 'chessops/fen'
import { Chess, Color, Position, parseSquare, parseUci, } from 'chessops'
import { chessgroundDests } from 'chessops/compat'
import { Dests, Key } from 'chessground/types'

type Memo<A> = () => A

export class Shala {

    static init = () => {
        return new Shala()
    }

    get position() {
        return this._position[0]()
    }

    set position(p: Position) {
        this._position[1](p)
    }

    get turnColor() {
      return this.m_color()
    }

    get promotion() {
      return this._promotion[0]()
    }

    set promotion(dest: Key | undefined) {
      this._promotion[1](dest)
    }

    get add_uci() {
      return this._add_uci[0]()
    }

    set add_uci(uci: string | undefined) {
      this._add_uci[1](uci)
    }


    get last_move() {
      return this._last_move[0]()
    }

    set last_move(uci: string | undefined) {
      this._last_move[1](uci)
    }



    _add_uci: Signal<string | undefined>
    _promotion: Signal<Key | undefined>
    _position: Signal<Position>
    m_fen: Memo<string>
    m_dests: Memo<Dests>
    m_color: Memo<Color>

    _last_move: Signal<string | undefined>

    constructor() {

      this._on_wheel = createSignal<number | undefined>(undefined, { equals: false })
      this._last_move = createSignal<string | undefined>(undefined, { equals: false })
      this._add_uci = createSignal<string | undefined>(undefined, { equals: false })
      this._promotion = createSignal<Key | undefined>(undefined, { equals: false })

      this._position = createSignal(Chess.fromSetup(parseFen(INITIAL_FEN).unwrap()).unwrap(), { equals: false })

      this.m_dests = createMemo(() => chessgroundDests(this.position))

      this.m_fen = createMemo(() => makeFen(this.position.toSetup()))

      this.m_color = createMemo(() => this.position.turn)

    }

    _on_wheel: Signal<number | undefined>

    set_on_wheel = (dir: number) => {
      this._on_wheel[1](dir)
    }

    get on_wheel() {
      return this._on_wheel[0]()
    }

    on_set_fen_uci = (fen: string, last_move?: string) => {
      batch(() => {
        this.add_uci = undefined
        this.last_move = last_move
        this.position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap()
      })
    }

    reset_move_after = () => {
      this.position = this.position
    }

    on_move_after = (orig: Key, dest: Key) => {
      
      let piece = this.position.board.get(parseSquare(orig)!)!

      let uci = orig + dest
      if (piece.role === 'pawn' && 
      ((dest[1] === '8' && this.turnColor === 'white') || (dest[1] === '1' && this.turnColor === 'black'))) {
        uci += 'q'
      }

      this.position.play(parseUci(uci)!)

      batch(() => {

        this.last_move = uci
        this.position = this.position

        if (uci.length === 5) {
          this.promotion = dest
        }
        this.add_uci = uci
      })
    }

    get fen_uci(): [string, string | undefined] {

      let fen = this.fen
      let uci = this.last_move

      return [fen, uci]
    }

    get fen() {
        return this.m_fen()
    }

    get dests() {
        return this.m_dests()
    }
}
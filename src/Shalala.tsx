import './Shalala.css'
import Chessboard from './Chessboard'
import Chesstree from './Chesstree'
import { Signal, createMemo, createSignal } from 'solid-js'
import { INITIAL_FEN, makeFen, parseFen } from 'chessops/fen'
import { Chess, Color, Position, parseSquare, parseUci, } from 'chessops'
import { chessgroundDests } from 'chessops/compat'
import { Dests, Key } from 'chessground/types'

type Memo<A> = () => A

class Shala {

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

    set promotion(dest: Key) {
      this._promotion[1](dest)
    }

    _promotion: Signal<Key | undefined>
    _position: Signal<Position>
    m_fen: Memo<string>
    m_dests: Memo<Dests>
    m_color: Memo<Color>

    constructor() {

      this._promotion = createSignal(undefined, { equals: false }) as Signal<Key | undefined>

      this._position = createSignal(Chess.fromSetup(parseFen(INITIAL_FEN).unwrap()).unwrap(), { equals: false })

      this.m_dests = createMemo(() => chessgroundDests(this.position))

      this.m_fen = createMemo(() => makeFen(this.position.toSetup()))

      this.m_color = createMemo(() => this.position.turn)

    }

    on_move_after = (orig: Key, dest: Key) => {
      
      let piece = this.position.board.get(parseSquare(orig)!)!

      let uci = orig + dest
      if (piece.role === 'pawn' && 
      ((dest[1] === '8' && this.turnColor === 'white') || (dest[1] === '1' && this.turnColor === 'black'))) {
        uci += 'q'
      }

      this.position.play(parseUci(uci)!)
      this.position = this.position

      if (uci.length === 5) {
        this.promotion = dest
      }
    }


    get fen() {
        return this.m_fen()
    }

    get dests() {
        return this.m_dests()
    }
}

const Shalala = () => {

    let shalala = Shala.init()

    return (<>
    <div class='shalala'>
      <div class='chessboard-wrap'>
        <Chessboard 
        doPromotion={shalala.promotion}
        onMoveAfter={shalala.on_move_after} 
        color={shalala.turnColor} 
        dests={shalala.dests} />
      </div>
      <div class='chesstree-wrap'>
        <Chesstree/>
      </div>
    </div>
        </>)
}


export default Shalala
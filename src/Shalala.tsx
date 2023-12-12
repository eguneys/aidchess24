import './Shalala.css'
import Chessboard from './Chessboard'
import Chesstree from './Chesstree'
import { Signal, createMemo, createSignal } from 'solid-js'
import { INITIAL_FEN, makeFen, parseFen } from 'chessops/fen'
import { Chess, Color, Position, parseUci, } from 'chessops'
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

    _position: Signal<Position>
    m_fen: Memo<string>
    m_dests: Memo<Dests>
    m_color: Memo<Color>

    constructor() {

        this._position = createSignal(Chess.fromSetup(parseFen(INITIAL_FEN).unwrap()).unwrap(), { equals: false })

        this.m_dests = createMemo(() => chessgroundDests(this.position))

        this.m_fen = createMemo(() => makeFen(this.position.toSetup()))

        this.m_color = createMemo(() => this.position.turn)

    }

    on_move_after = (orig: Key, dest: Key) => {
      let uci = orig + dest
      this.position.play(parseUci(uci)!)
      this.position = this.position
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
        <Chessboard onMoveAfter={shalala.on_move_after} color={shalala.m_color()} dests={shalala.dests} />
      </div>
      <div class='chesstree-wrap'>
        <Chesstree/>
      </div>
    </div>
        </>)
}


export default Shalala
import './Shalala.css'
import Chessboard from './Chessboard'
import Chesstree from './Chesstree'
import { Signal, createMemo, createSignal } from 'solid-js'
import { INITIAL_FEN, makeFen, parseFen } from 'chessops/fen'
import { Chess, Position, makeSquare } from 'chessops'

type Dests = { [key: string]: string[] }

type Memo<A> = () => A

function compatShessDests(pos: Position) {
    let res: Dests = {}

    let ctx = pos.ctx()
    for (let [from, squares] of pos.allDests(ctx)) {
        if (squares.nonEmpty()) {

            res[makeSquare(from)] = Array.from(squares, makeSquare)

        }
    }
    return res
}


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

    constructor() {

        this._position = createSignal(Chess.fromSetup(parseFen(INITIAL_FEN).unwrap()).unwrap())

        this.m_dests = createMemo(() => compatShessDests(this.position))

        this.m_fen = createMemo(() => makeFen(this.position.toSetup()))

    }

    pull_fen = (board_fen: string) => {
      let fen = board_fen.replace('d', 'p') + ' b KQkq - 0 1'
      console.log(fen)
      this.position = Chess.fromSetup(parseFen(fen).unwrap()).unwrap()
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
        <Chessboard pull_fen={shalala.pull_fen} fen={shalala.fen} dests={shalala.dests} />
      </div>
      <div class='chesstree-wrap'>
        <Chesstree/>
      </div>
    </div>
        </>)
}


export default Shalala
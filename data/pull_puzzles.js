import fs from 'fs'
import { ChildNode, Node, makePgn, emptyHeaders } from 'chessops/pgn'
import { makeSan } from 'chessops/san'
import { makeFen, parseFen } from 'chessops/fen'
import { Chess } from 'chessops/chess'
import { parseUci } from 'chessops/util'

const parse_tenk = (tenk) => {
  let i = 0;
  return tenk.trim().split('\n').map(line => {
    let xx = line.split(',')
    let [id, fen, mmoves, rating, _y, _z, _w, tags] = xx

    let blunder = mmoves.split(' ').slice(0, 1)[0]
    let moves = mmoves.split(' ').slice(1)

    i++;
    return {
      i,
      id,
      fen,
      blunder,
      moves,
      tags,
      rating: parseInt(rating)
    }
  })
}


function pz_pgn(pz) {
    let setup = parseFen(pz.fen).unwrap()
    let pos = Chess.fromSetup(setup).unwrap()

    const root = new Node()

    let san = makeSan(pos, parseUci(pz.blunder))
    let next = new ChildNode({ san })
    root.children.push(next)

    pos.play(parseUci(pz.blunder))

    pz.moves.forEach(mv => {
      let san = makeSan(pos, parseUci(mv))
      next.children.push(next = new ChildNode({ san }))
  
      pos.play(parseUci(mv))
    })


    let headers = emptyHeaders()


    headers.set("Puzzle", pz.id)
    headers.set("FEN", pz.fen)



    let pgn = makePgn({ headers, moves: root })

    return pgn
}


function read_puzzles() {
    let data = fs.readFileSync('./lichess_db_puzzle.csv', { encoding: 'utf8' })

    let res = parse_tenk(data)

    let u1600 = res.filter(_ => _.rating > 1600 && _.rating < 1700)
    let u2000 = res.filter(_ => _.rating > 2000 && _.rating < 2100)
    let u2200 = res.filter(_ => _.rating > 2200 && _.rating < 2300)

    let mix200 = res.slice(0, 1000)

    shuffleArray(mix200)
    shuffleArray(u1600)
    shuffleArray(u2000)
    shuffleArray(u2200)

    u1600 = u1600.slice(0, 50)
    u2000 = u2000.slice(0, 50)
    u2200 = u2200.slice(0, 50)

    mix200 = res.slice(0, 200)

    fs.writeFileSync('u1600.pgn', u1600.map(pz_pgn).join('\n'))
    fs.writeFileSync('u2000.pgn', u2000.map(pz_pgn).join('\n'))
    fs.writeFileSync('u2200.pgn', u2200.map(pz_pgn).join('\n'))
    fs.writeFileSync('mix200.pgn', mix200.map(pz_pgn).join('\n'))
}

read_puzzles()



function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}


import { test, expect } from 'vitest'
import { parse_PGNS, StepsTree } from '../ReplayTreeComponent'
import { INITIAL_FEN } from 'chessops/fen'

test('pgn', () => {
    const alekhine = `
[Event "e4 vs Minor Defences: Alekhine"]
[Site "https://lichess.org/study/F8wyMEli/XtCmR5GS"]
[Result "*"]
[UTCDate "2023.04.06"]
[UTCTime "17:47:58"]
[Variant "Standard"]
[ECO "B04"]
[Opening "Alekhine Defense: Modern Variation, Larsen-Haakert Variation"]
[Annotator "https://lichess.org/@/heroku"]

1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Nc6 (4... Nb6 5. a4 a5 6. Nc3 g6 (6... Bf5 7. d5 e6 8. dxe6 Bxe6 9. Bg5 Qd7 10. exd6 Bxd6 11. Nb5 Nd5 12. Nxd6+ Qxd6) 7. exd6 cxd6 (7... exd6 8. Bg5 f6 9. Bf4 d5 10. Bd3 Bd6 11. Bxd6 Qxd6 12. O-O O-O 13. Qd2) 8. d5 Bg7 9. Be3 O-O 10. Bd4 N8d7 11. Bxg7 Kxg7 12. Qd4+ Nf6 13. Nd2 Bd7 14. Nde4 Rc8 15. h4 h5 16. f3) (4... c6 5. Be2 g6 6. c4 Nc7 7. exd6 Qxd6 8. Nc3 Bg7 9. O-O O-O 10. h3 Ne6 11. Be3 Nf4 12. Re1) (4... Bf5 5. Bd3 Bxd3 6. Qxd3 e6 7. O-O Nc6 8. c4 Nb6 9. exd6 cxd6 10. Nc3 Be7 11. d5 Nb4 12. Qe4 e5 13. c5 dxc5 14. a3 Na6 15. Rd1 O-O) 5. c4 Nb6 6. e6 fxe6 7. Nc3 g6 8. h4 Bg7 9. Be3 e5 10. d5 Nd4 11. Nxd4 exd4 12. Bxd4 Bxd4 13. Qxd4 e5 14. Qe3 *
`


    let res = parse_PGNS(alekhine)

    expect(res.length).toBe(1)

    let tree = res[0].tree

    expect(tree.root.length).toBe(1)
    expect(tree.find_at_path('e2e4 g8f6')).toBeDefined()
    expect(tree.find_at_path('e2e4 g8f6 e4e5 f6d5 d2d4 d7d6 g1f3')?.children.length).toBe(4)
})


test('remove children', () => {

    let tree = StepsTree()

    let e4 = tree.add_child_san('', 'e4')!
    tree.add_child_san('', 'd4')!
    let e5 = tree.add_child_san('e2e4', 'e5')!
    tree.add_child_san('e2e4', 'c5')!


    expect(tree.find_at_path('e2e4 e7e5')).toBe(e5)

    expect(tree.remove_child_at_path('e2e4 e7e5')).toBe(e5)

    expect(e4.children.length).toBe(1)

    expect(tree.remove_child_at_path('e2e4')).toBe(e4)

    expect(tree.root.length).toBe(1)

    expect(tree.remove_child_at_path('d2d4'))

    expect(tree.initial_fen).toBeUndefined()
})

test('add branches', () => {

    let tree = StepsTree()

    let e4 = tree.add_child_san('', 'e4')
    tree.add_child_san('e2e4', 'e5')
    let c5 = tree.add_child_san('e2e4', 'c5')

    expect(c5).toBeDefined()
    expect(c5!.path).toBe('e2e4 c7c5')

    expect(e4!.children.length).toBe(2)

})

test('add child', () => {

    let tree = StepsTree()

    expect(tree.initial_fen).toBeUndefined()


    let e4 = tree.add_child_san('', 'e4')
    expect(e4).toBeDefined()
    expect(e4!.path).toBe('e2e4')

    expect(tree.initial_fen).toBe(INITIAL_FEN)

    let e5 = tree.add_child_san('e2e4', 'e5')

    expect(e5).toBeDefined()
    expect(e5!.path).toBe('e2e4 e7e5')


    let d4 = tree.add_child_san('', 'd4')

    expect(tree.initial_fen).toBe(INITIAL_FEN)

    expect(d4).toBeDefined()
    expect(d4!.path).toBe('d2d4')

    expect(tree.root.length).toBe(2)

})


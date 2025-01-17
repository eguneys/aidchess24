import { test, expect } from 'vitest'
import { StepsTree } from '../ReplayTreeComponent'
import { INITIAL_FEN } from 'chessops/fen'

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


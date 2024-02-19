import './tree.css'
import { For, Match, Show, Switch, batch, createEffect, createSignal, on, untrack } from 'solid-js'
import { INITIAL_FEN, MoveData, MoveTree, TreeNode } from './chess_pgn_logic'

export const _alekhine = `
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


const Chesstree = (props: { pgn?: MoveTree, before_fen?: string, add_uci?: string, on_wheel?: number, on_set_fen_uci: (fen: string, uci: string) => void }) => {

    let before_fen = props.before_fen ?? INITIAL_FEN

    let [cursor_path, set_cursor_path] = createSignal<string[]>([], { equals: false })

    let [tree, set_tree] = createSignal<MoveTree | undefined>(undefined, { equals: false })


    createEffect(() => {

      let pgn = props.pgn
      if (pgn) {
        set_tree(pgn)
        on_set_path([])
      }
    })

    const root = () => tree()?.root

    const on_set_path = (path: string[]) => {
        let t = untrack(() => tree())
        if (t) {
            let i = t.get_at(path)
            if (i) {
            let fen = i.after_fen
            let last_move = i.uci
              props.on_set_fen_uci(fen, last_move)
              set_cursor_path(i.path)

            }
        }
    }

    createEffect(on(() => props.on_wheel, (on_wheel: number | undefined) => {
      if (on_wheel) {

        let path = cursor_path()
        if (on_wheel < 0) {

          if (path.length > 1) {
            on_set_path(path.slice(0, -1))
          }
        } else {

          let t = tree()
          if (t) {
            let i = t._traverse_path(path)
            let new_path = i?.children[0]?.data.path
            if (new_path) {
              on_set_path(new_path)
            }
          }
        }
      }
    }))

    createEffect(() => {
        let uci = props.add_uci
        if (!uci) {
            return
        }
        let t = untrack(() => tree())
        let path = untrack(() => cursor_path())
        if (!t) {
            t = MoveTree.make(before_fen, [uci])
        } else {
            t.append_uci(uci, path)
        }
        path = [...path, uci]
        batch(() => {
          set_tree(t)
          set_cursor_path(path)
        })
    })


    let el_move: HTMLDivElement
    createEffect(() => {

      let path = cursor_path()
      let cont = el_move.parentElement
      if (!cont) {
        return
      }

      const target = el_move.querySelector<HTMLElement>('.on_path_end')
      if (!target) {
        cont.scrollTop = path.length > 0 ? 99999 : 0
        return
      } 

      let top = target.offsetTop - cont.offsetHeight / 2 + target.offsetHeight
      cont.scrollTo({behavior: 'smooth', top})
    })



    return (<>
      <div ref={_ => el_move = _} class='chesstree'>
          <Show when={root()} fallback={
            <>
              
            </>
          }>{root =>
            <RenderLines on_set_path={on_set_path} cursor_path={cursor_path()} lines={[root()]}/>
          }</Show>
      </div>
    </>)
}

const RenderLines = (props: {on_set_path: (_: string[]) => void, cursor_path: string[], lines: TreeNode<MoveData>[], show_index?: true}) => {

    return (<>
    <For each={props.lines}>{ line =>
    <>
                <RenderData on_set_path={props.on_set_path} cursor_path={props.cursor_path} data={line.data} show_index={props.show_index}/>
                <Switch>
                  <Match when={line.children.length === 1}>
                    <RenderLines  on_set_path={props.on_set_path} cursor_path={props.cursor_path} lines={line.children} />
                  </Match>
                  <Match when={line.children.length > 1}>
                    <div class='lines'>
                        <For each={line.children}>{ child =>
                          <div class='line'><RenderLines  on_set_path={props.on_set_path} cursor_path={props.cursor_path} lines={[child]} show_index={true}/></div>
                        }</For>
                    </div>
                  </Match>
                </Switch>
    </>
        }</For>
    </>)
}

const RenderData = (props: { on_set_path: (_: string[]) => void, cursor_path: string[], data: MoveData, show_index?: true }) => {

    let index = `${Math.ceil(props.data.ply / 2)}.`
    if (props.data.ply % 2 === 0) {
        index += '..'
    }

    let on_path = () => props.cursor_path.join('').startsWith(props.data.path.join(''))
    let on_path_end = () => props.cursor_path.join('') === props.data.path.join('')

    let move_on_path_klass = () => ['move', on_path_end()?'on_path_end':on_path()?'on_path':''].join(' ')
    return <>
      <div onClick={() => props.on_set_path(props.data.path)} class={move_on_path_klass()} ><Show when={props.show_index || props.data.ply & 1}><span class='index'>{index}</span></Show>{props.data.san}</div>
    </>
}

export default Chesstree
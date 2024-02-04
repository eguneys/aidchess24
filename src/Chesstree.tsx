import './tree.css'
import { For, Match, Show, Switch, createEffect, createSignal } from 'solid-js'
import { MoveData, Pgn, TreeNode } from './chess_pgn_logic'

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

const Chesstree = () => {

    let [cursor_path, set_cursor_path] = createSignal(['e2e4', 'g8f6'])
    const pgn = Pgn.make(alekhine)

    createEffect(() => {
        console.log(cursor_path())
    })
    return (<>
      <div class='chesstree'>
          <RenderLines on_set_path={set_cursor_path} cursor_path={cursor_path()} lines={[pgn.tree.root]}/>
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
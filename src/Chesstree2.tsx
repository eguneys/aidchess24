import './tree.css'
import { For, Match, Show, Signal, Switch, batch, createEffect, createSignal } from 'solid-js'
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

export class Treelala {
        static make = (tree?: MoveTree, initial_fen: string = tree?.root.data.before_fen || INITIAL_FEN) => {
        let res = new Treelala(initial_fen, tree)
        return res
    }

    _tree: Signal<MoveTree | undefined>
    _cursor_path: Signal<string[]>


    _hidden_paths: Signal<string[][]>
    _revealed_paths: Signal<string[][]>
    _failed_paths: Signal<string[][]>
    _solved_paths: Signal<string[][]>


    get solved_paths() {
      return this._solved_paths[0]()
    }

    set solved_paths(paths: string[][]) {
      this._solved_paths[1](paths)
    }





    get failed_paths() {
      return this._failed_paths[0]()
    }

    set failed_paths(paths: string[][]) {
      this._failed_paths[1](paths)
    }




    get revealed_paths() {
      return this._revealed_paths[0]()
    }

    set revealed_paths(paths: string[][]) {
      this._revealed_paths[1](paths)
    }



    get hidden_paths() {
      return this._hidden_paths[0]()
    }

    set hidden_paths(paths: string[][]) {
      this._hidden_paths[1](paths)
    }

    get cursor_path() {
        return this._cursor_path[0]()
    }

    get tree() {
        return this._tree[0]()
    }

    set cursor_path(path: string[]) {
        this._cursor_path[1](path)
    }

    set tree(tree: MoveTree | undefined) {
        this._tree[1](tree)
    }

    try_set_cursor_path(path: string[]) {
      let hidden_paths = this.hidden_paths
      if (hidden_paths.find(_ => path.join('').startsWith(_.join('')))) {
        return false
      }
      this.cursor_path = path
      return true
    }

    get fen_last_move() {
        let t = this.tree
        if (t) {
            let i = t.get_at(this.cursor_path)
            if (!i) {
              return undefined
            }
            let fen = i.after_fen
            let last_move = i.uci
            return [fen, last_move]
        }
    }

    constructor(readonly initial_fen: string, tree?: MoveTree) {
        this._cursor_path = createSignal<string[]>([], { equals: false })
        this._tree = createSignal(tree)

        this._hidden_paths = createSignal<string[][]>([], { equals: false })
        this._revealed_paths = createSignal<string[][]>([], { equals: false })
        this._failed_paths = createSignal<string[][]>([], { equals: false })
        this._solved_paths = createSignal<string[][]>([], { equals: false })
    }

  get is_revealed() {
    return this.hidden_paths.length === 0
  }

  reveal_hidden_paths = () => {
    this.revealed_paths = this.hidden_paths
    this.hidden_paths = []
  }


  reveal_one_random = () => {

    if (!this.tree) {
      return false
    }

    const cc = this.tree?._traverse_path(this.cursor_path)?.children ?? [this.tree.root]

    const c_found = weightedRandomSelect(cc)
    if (c_found) {
      let hh = this.hidden_paths
      hh = hh.filter(_ => _.join('') !== c_found.data.path.join(''))
      let cc0cc = c_found.children.map(_ => _.data.path)
      hh.push(...cc0cc)
      this.hidden_paths = hh
      this.cursor_path = c_found.data.path
      return true
    }

    return false
  }

  try_next_uci_fail = (uci: string) => {

    if (!this.tree) {
      return false
    }

    const a0 = this.tree?._traverse_path(this.cursor_path) ?? this.tree.root
    const cc = this.tree?._traverse_path(this.cursor_path)?.children ?? [this.tree.root]

    const c_found = cc.find(_ => _.data.uci === uci)
    if (c_found) {
      let hh = this.hidden_paths
      hh = hh.filter(_ => _.join('') !== c_found.data.path.join(''))
      let cc0cc = c_found.children.map(_ => _.data.path)
      hh.push(...cc0cc)
      this.hidden_paths = hh
      let rr = this.solved_paths
      rr.push(cc[0].data.path)
      this.solved_paths = rr
      this.cursor_path = c_found.data.path
      return true
    } else {

      if (this.is_revealed) {
        setTimeout(() => {
          this.cursor_path = this.cursor_path
        }, 100)
        return
      }

      this.add_uci(uci)
      this.failed_paths.push([...a0.data.path, uci])

      setTimeout(() => {
        this.on_wheel(-1)
      }, 100)
      return false
    }
  }



    on_wheel = (dir: number) => {
        let path = this.cursor_path
        if (dir < 0) {
          if (path.length > 0) {
            this.try_set_cursor_path(path.slice(0, -1))
          }
        } else {
          let t = this.tree
          if (t) {

            let i
            if (path.length === 0) {
              i = [t.root]
            } else {
              i = t._traverse_path(path)?.children
            } 
            let new_path = i?.[0]?.data.path
            if (new_path) {
              this.try_set_cursor_path(new_path)
            }
          }
        }
    }

    add_uci(uci: string) {
      let t = this.tree
      let path = this.cursor_path
      if (!t) {
        t = MoveTree.make(this.initial_fen, [uci])
      } else {
        t.append_uci(uci, path)
      }
      path = [...path, uci]
      batch(() => {
        this.tree = t
        this.cursor_path = path
      })
    }
}



const Chesstree2 = (props: { lala: Treelala }) => {

    let el_move: HTMLDivElement
    createEffect(() => {

      let path = props.lala.cursor_path
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
          <Show when={props.lala.tree} fallback={
            <>
              
            </>
          }>{tree =>
            <RenderLines 
            on_set_path={path => props.lala.try_set_cursor_path(path)} 
            cursor_path={props.lala.cursor_path} 
            hidden_paths={props.lala.hidden_paths}
            revealed_paths={props.lala.revealed_paths}
            solved_paths={props.lala.solved_paths}
            failed_paths={props.lala.failed_paths}
            lines={[tree().root]}/>
          }</Show>
      </div>
    </>)
}

const RenderLines = (props: {
  on_set_path: (_: string[]) => void, 
  cursor_path: string[], 
  solved_paths: string[][],
  revealed_paths: string[][],
  failed_paths: string[][],
  hidden_paths: string[][],
  lines: TreeNode<MoveData>[], show_index?: true}) => {

    return (<>
    <For each={props.lines}>{ line =>
    <>
                <RenderData data={line.data} {...props}/>
                <Switch>
                  <Match when={line.children.length === 1}>
                    <RenderLines  {...props} lines={line.children} />
                  </Match>
                  <Match when={line.children.length > 1}>
                    <div class='lines'>
                        <For each={line.children}>{ child =>
                          <div class='line'><RenderLines {...props} lines={[child]} show_index={true}/></div>
                        }</For>
                    </div>
                  </Match>
                </Switch>
    </>
        }</For>
    </>)
}

const RenderData = (props: { on_set_path: (_: string[]) => void, 
  solved_paths: string[][], 
  revealed_paths: string[][], 
  failed_paths: string[][], 
  hidden_paths: string[][], 
  cursor_path: string[], data: MoveData, show_index?: true, collapsed?: true }) => {

    let index = `${Math.ceil(props.data.ply / 2)}.`
    if (props.data.ply % 2 === 0) {
        index += '..'
    }

    let on_path = () => props.cursor_path.join('').startsWith(props.data.path.join(''))
    let on_path_end = () => props.cursor_path.join('') === props.data.path.join('')

    let my_path = props.data.path.join('')
    let on_hidden_path_start = () => props.hidden_paths.find(_ => _.join('') === my_path)!
    let on_hidden_path_rest = () => props.hidden_paths.find(_ => my_path.startsWith(_.join('')))!

    let on_revealed_path_start = () => props.revealed_paths.find(_ => _.join('') === my_path)!
    let on_revealed_path_rest = () => props.revealed_paths.find(_ => my_path.startsWith(_.join('')))!

    let on_failed_path = () => props.failed_paths.find(_ => _.join('') === my_path)!
    let on_solved_path = () => props.solved_paths.find(_ => _.join('') === my_path)!



    let move_on_path_klass = () => ['move', 
    on_path_end()?'on_path_end':on_path()?'on_path':'',
    on_hidden_path_start() ? 'on_hidden_path_start':on_hidden_path_rest() ? 'on_hidden_path': '',
    on_revealed_path_start() ? 'on_revealed_path_start':on_revealed_path_rest() ? 'on_revealed_path': '',
    on_failed_path() ? 'on_failed_path': '',
    on_solved_path() ? 'on_solved_path': '',
    props.collapsed ? 'collapsed': ''
   ].join(' ')
    return <>
      <div onClick={() => props.on_set_path(props.data.path)} class={move_on_path_klass()} ><Show when={props.show_index || props.data.ply & 1}><span class='index'>{index}</span></Show>{props.data.san}</div>
    </>
}

export default Chesstree2



export const ChesstreeShorten = (props: { lala: Treelala }) => {


    let el_move: HTMLDivElement
    createEffect(() => {

      let path = props.lala.cursor_path
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
          <Show when={props.lala.tree} fallback={
            <>
              
            </>
          }>{tree =>
            <RenderLinesShorten
            on_set_path={path => props.lala.try_set_cursor_path(path)} 
            cursor_path={props.lala.cursor_path} 
            hidden_paths={props.lala.hidden_paths}
            revealed_paths={props.lala.revealed_paths}
            solved_paths={props.lala.solved_paths}
            failed_paths={props.lala.failed_paths}
            lines={[tree().root]}/>
          }</Show>
      </div>
    </>)
}


const RenderLinesShorten = (props: {
  on_set_path: (_: string[]) => void, 
  cursor_path: string[], 
  solved_paths: string[][],
  revealed_paths: string[][],
  failed_paths: string[][],
  hidden_paths: string[][],
  lines: TreeNode<MoveData>[], show_index?: true}) => {


    return (<>
      <For each={props.lines}>{line =>
        <>
          <RenderData data={line.data} {...props} />
          <Switch>
            <Match when={line.children.length === 1}>
              <RenderLinesShorten {...props} lines={line.children} />
            </Match>
            <Match when={line.children.length > 1}>
              <div class='lines'>
                <For each={line.children}>{child =>
                  <div class='line'>
                    <Show when={props.cursor_path.join('').startsWith(child.data.path.join(''))} fallback= {
                      <RenderLinesShortenCollapsed {...props} lines={[child]} show_index={true} />
                    }>
                      <RenderLinesShorten {...props} lines={[child]} />
                    </Show>
                    </div>
                }</For>
              </div>
            </Match>
          </Switch>
        </>
      }</For>
    </>)
}

const RenderLinesShortenCollapsed = (props: {
  on_set_path: (_: string[]) => void, 
  cursor_path: string[], 
  solved_paths: string[][],
  revealed_paths: string[][],
  failed_paths: string[][],
  hidden_paths: string[][],
  lines: TreeNode<MoveData>[], show_index?: true}) => {

    return (<>
      <For each={props.lines}>{line =>
        <>
          <RenderData data={line.data} {...props} collapsed={true} />
          <span class='collapsed'> ..{line.length} {line.nb_first_variations}</span>
        </>
      }</For>
    </>)

  }



/* https://github.com/eguneys/openingsexercise/blob/master/src/pgn.ts#L133 */
function weightedRandomSelect<T>(array: T[]) {
  let totalWeight = (array.length * (array.length + 1)) / 2;
  let randNum = Math.floor(Math.random() * totalWeight) + 1;
  let weightSum = 0;
  for (let i = 0; i < array.length; i++) {
    weightSum += array.length - i;
    if (randNum <= weightSum) {
      return array[i];
    }
  }
}
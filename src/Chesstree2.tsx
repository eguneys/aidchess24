import './tree.css'
import { For, Match, Show, Signal, Switch, batch, createEffect, createMemo, createSignal, untrack } from 'solid-js'
import { INITIAL_FEN, MoveData, MoveTree, TreeNode, fen_color } from './chess_pgn_logic'
import { arr_rnd } from './random'

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

const expand_long_path = (path: string[]) => {
  let res: string[][] = []
  for (let p of path) {
    if (res.length === 0) {
      res.push([p])
    } else {
      res.push([...res[res.length - 1], p])
    }
  }
  return res
}


export class TwoPaths2 {

  static set_for_saving(paths: string[][]): TwoPaths2 {
    let res = new TwoPaths2()
    res.paths = paths
    return res
  }

  _paths: Signal<string[][]>

  get paths() {
    return this._paths[0]()
  }

  set paths(_: string[][]) {
    this._paths[1](_)
  }

  constructor() {
    this._paths = createSignal<string[][]>([], { equals: false })
  }

  get clone() {
    let res = new TwoPaths2()
    res.paths = this.paths.slice(0)
    return res
  }

  get_for_saving(): string[][] {
    return this.paths
  }

  merge_dup(paths: TwoPaths2) {
    paths.paths.forEach(_ => untrack(() => this.add_path(_)))
  }

  replace_all(tp: TwoPaths2) {
    this.paths = tp.paths.slice(0)
  }

  add_path(path: string[]) {

    let bs = this.paths

    if (bs.find(_ => _.join('') === path.join(''))) {
      return
    }

    /*
    if (bs.find(_ => _.join('').startsWith(path.join('')))) {
      return
    }

    let rm = bs.findIndex(_ => path.join('').startsWith(_.join('')))
    if (rm !== -1) {
      bs.splice(rm, 1, path)
    } else {
      bs.push(path)
    }
    */
   bs.push(path)
    this.paths = bs
  }

  remove_path(path: string[]) {
    this.paths = this.paths.filter(_ => _.join('') !== path.join(''))
  }

  clear() {
    this.paths = []
  }

}

export class Treelala2 {

    
  static make = (tree?: MoveTree, initial_fen: string = tree?.before_fen || INITIAL_FEN) => {
    let res = new Treelala2(initial_fen, tree)
    return res
  }

  _tree: Signal<MoveTree | undefined>

  _cursor_path: Signal<string[]>

  _hidden_paths: TwoPaths2
  _revealed_paths: Signal<string[][]>
  _failed_paths: Signal<string[][]>
  _solved_paths: TwoPaths2

  get cursor_after_color() {
    let p = this.cursor_path

    return fen_color(this.tree?.get_at(p)?.after_fen ?? INITIAL_FEN)
  }

  get is_cursor_path_at_a_leaf() {

    let p = this.cursor_path

    if (this.failed_paths.find(_ => _.join('') === p.join(''))) {
      return false
    }

    return this.tree?.get_children(p)?.length === 0
  }

  get hidden_paths() {
    return this._hidden_paths.paths
  }
  get revealed_paths() {
    return this._revealed_paths[0]()
  }

  set revealed_paths(_: string[][]) {
    this._revealed_paths[1](_)
  }



  get failed_paths() {
    return this._failed_paths[0]()
  }

  set failed_paths(_: string[][]) {
    this._failed_paths[1](_)
  }

  get solved_paths() {
    return this._solved_paths
  }

  get solved_paths_expanded() {
    return this._solved_paths.paths
  }


  get initial_color() {
    return this.tree?.initial_color
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


  collect_branch_sums(path: string[]) {
    if (!this.tree) {
      return []
    }

      let res = []
      let i = this.tree.root
      let add_variation = i.length > 1 
      for (let p of path) {
          let next = i.find(_ => _.data.uci === p)

          if (!next) {
              return undefined
          }

          if (add_variation) {
              res.push(next.data)
              add_variation = false
          }

          let c0 = next.children.filter(_ => 
            !this.failed_paths
            .some(f => f.join('') === _.data.path.join('')))
          if (c0.length > 1) {
              add_variation = true
          }
          i = next.children
      }
      return res
  }

 



  clear_failed_paths() {
    batch(() => {
      this.failed_paths.forEach(path => {
        this.tree?.delete_at(path)
      })
      this.failed_paths = []
    })
  }

  try_set_cursor_path(path: string[]) {
    let hidden_paths = this.hidden_paths
    if (hidden_paths.find(_ => path.join('').startsWith(_.join('')))) {
      return false
    }
    this.cursor_path = path
    return true
  }



  constructor(readonly initial_fen: string, tree?: MoveTree) {
    this._cursor_path = createSignal<string[]>([], { equals: false })
    this._tree = createSignal(tree)

    this._hidden_paths = new TwoPaths2()
    this._revealed_paths = createSignal<string[][]>([], { equals: false })
    this._failed_paths = createSignal<string[][]>([], { equals: false })
    this._solved_paths = new TwoPaths2()
  }

  get is_revealed() {
    return this.hidden_paths.length === 0
  }

  set_random_cursor_hide_rest() {
    let w_path = arr_rnd(this.tree!.all_leaves.map(_ => _.path))
    let path = arr_rnd(expand_long_path(w_path).slice(1, -1))

    if (this.solved_paths.paths.find(_ => _.join('') === path.join(''))) {
      path = arr_rnd(expand_long_path(w_path).slice(1, -1))
    }

    this.cursor_path = path

    let cc = this.tree!.get_children(path)
    this._hidden_paths.clear()
    cc?.forEach(_ => this._hidden_paths.add_path(_.path))
  }

  reveal_hidden_paths = () => {
    batch(() => {
      this.hidden_paths.forEach(_ => {
        this.revealed_paths.push(_)
      })
      this._hidden_paths.clear()
      this.revealed_paths = this.revealed_paths
    })
  }

  add_and_reveal_uci(uci: string) {
    this.revealed_paths.push(this.add_uci(uci))
    this.revealed_paths = this.revealed_paths
  }



  reveal_one_random = () => {

    if (!this.tree) {
      return false
    }

    const cc = this.tree?._traverse_path(this.cursor_path)?.children ?? this.tree.root

    //const c_found = weightedRandomSelect(cc)
    const c_found = getRandomWeightedItem(cc)

    if (c_found) {
      batch(() => {
        this._hidden_paths.remove_path(c_found.data.path)
        c_found.children.forEach(_ => this._hidden_paths.add_path(_.data.path))
        this.cursor_path = c_found.data.path
      })
      return true
    }

    return false
  }

  try_next_uci_fail = (uci: string) => {

    if (!this.tree) {
      return false
    }

    const a0 = this.tree?._traverse_path(this.cursor_path)
    const cc = this.tree?._traverse_path(this.cursor_path)?.children ?? this.tree.root

    const c_found = cc.find(_ => _.data.uci === uci) ??  cc.find(_ => castles_uci_fix(_.data) === uci)



    if (c_found) {


      let in_failed_path = this.failed_paths.find(_ => _.join('') === c_found.data.path.join(''))

      if (in_failed_path) {
        this.cursor_path = c_found.data.path
        return false
      }

      batch(() => {
        this._hidden_paths.remove_path(c_found.data.path)
        c_found.children.forEach(_ => this._hidden_paths.add_path(_.data.path))
        this._solved_paths.add_path(c_found.data.path)
        this.cursor_path = c_found.data.path
      })
      return true
    } else {

      if (this.is_revealed) {
        setTimeout(() => {
          this.cursor_path = this.cursor_path
        }, 100)
        return
      }

      this.add_uci(uci)
      this.add_failed_path([...(a0?.data.path ?? []), uci])

      return false
    }
  }

  add_failed_path(path: string[]) {
    let fs = this.failed_paths
    fs = fs.filter(_ => _.join('') !== path.join(''))
    fs.push(path)
    this.failed_paths = fs
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
              i = t.root
            } else {
              i = t._traverse_path(path)?.children
            } 

            let new_path = i?.map(_ => _.data.path)
            .find(_ => !this.hidden_paths?.some(h => _.join('').startsWith(h.join(''))))
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
        t = MoveTree.make(this.initial_fen, [[uci]])
      } else {
        t.append_uci(uci, path)
      }
      path = [...path, uci]
      batch(() => {
        this.tree = t
        this.cursor_path = path
      })
      return path
    }


    drop_failed_paths() {
      return batch(() => {

        let fs = this.failed_paths
        fs.forEach(_ => this.tree?.delete_at(_))
        let cursor_path = this.cursor_path
        while (cursor_path.length > 0 && !this.tree?.get_at(cursor_path)) {
          cursor_path.pop()
        }
        this.cursor_path = cursor_path
        this.failed_paths = []
        return fs
      })
    }


  get can_navigate_next() {
    let path = this.cursor_path
    let t = this.tree
    if (t) {

      let i
      if (path.length === 0) {
        i = t.root
      } else {
        i = t._traverse_path(path)?.children
      }

      let new_path = i?.map(_ => _.data.path)
        .find(_ => !this.hidden_paths?.some(h => _.join('').startsWith(h.join(''))))
        return new_path !== undefined
    }
    return false
  }

  get can_navigate_prev() {
    return this.cursor_path.length > 0
  }

  navigate_first(): void {
    let ps = expand_long_path(this.cursor_path).reverse().slice(1)
    let path = (ps.find(_ => (this.tree!.get_children(_.slice(0, -1))?.length ?? 0) > 1) || ps[ps.length - 1]) ?? []

    this.try_set_cursor_path(path)
  }
  navigate_prev(): void {
    this.try_set_cursor_path(this.cursor_path.slice(0, -1))
  }

  navigate_next(): void {
    let path = this.cursor_path
    let t = this.tree
    if (t) {

      let i
      if (path.length === 0) {
        i = t.root
      } else {
        i = t._traverse_path(path)?.children
      }

      let new_path = i?.map(_ => _.data.path)
        .find(_ => !this.hidden_paths?.some(h => _.join('').startsWith(h.join(''))))
      if (new_path) {
        this.try_set_cursor_path(new_path)
      }
    }
  }
  navigate_last(): void {
    let path = this.cursor_path
    let t = this.tree
    if (t) {

      let i
      if (path.length === 0) {
        i = t.root
      } else {
        i = t._traverse_path(path)?.children
      }

      let new_path = i?.map(_ => _.data.path)
        .find(_ => !this.hidden_paths?.some(h => _.join('').startsWith(h.join(''))))
      if (new_path) {

        let i = t._traverse_path(new_path)
        while (i!.children.length === 1) {
          if (this.hidden_paths?.some(h => i!.children[0].data.path.join('').startsWith(h.join('')))) {
            break
          }
          i = i!.children[0]
        }

        new_path = i!.data.path
        this.try_set_cursor_path(new_path)
      }
    }

  }
  
  get can_navigate_up() {
    let path = this.cursor_path

    let t = this.tree

    if (t) {

      let i = path

      while (i.length > 0) {
        const cc = t._traverse_path(i.slice(0, -1))?.children ?? t.root
        if (cc && cc.length > 1) {

          let ic = cc?.findIndex(_ => _.data.path.join('') === i.join('')) - 1

          return ic >= 0
        }

        i = i.slice(0, -1)
      }
    }


    return false
  }

  get can_navigate_down() {

        let path = this.cursor_path

    let t = this.tree

    if (t) {

      let i = path
      while (i.length > 0) {
        const cc = t._traverse_path(i.slice(0, -1))?.children ?? t.root
        if (cc && cc.length > 1) {

          let ic = cc?.findIndex(_ => _.data.path.join('') === i.join('')) + 1

          return ic < cc.length
        }

        i = i.slice(0, -1)
      }
    }

  }

  navigate_up(): void {
    let path = this.cursor_path

    let t = this.tree

    if (t) {

      let i = path
      while (i.length > 0) {
        const cc = t._traverse_path(i.slice(0, -1))?.children ?? t.root
        if (cc && cc.length > 1) {

          let ic = cc?.findIndex(_ => _.data.path.join('') === i.join('')) - 1

          this.cursor_path = cc[ic].data.path

          break;
        }

        i = i.slice(0, -1)
      }
    }
  }

   navigate_down(): void {
    let path = this.cursor_path

    let t = this.tree

    if (t) {

      let i = path
      while (i.length > 0) {
        const cc = t._traverse_path(i.slice(0, -1))?.children ?? t.root
        if (cc && cc.length > 1) {

          let ic = cc?.findIndex(_ => _.data.path.join('') === i.join('')) + 1

          this.cursor_path = cc[ic].data.path

          break;
        }

        i = i.slice(0, -1)
      }
    }
  }
 


}



const Chesstree2 = (props: { lala: Treelala2 }) => {

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
            solved_paths={props.lala.solved_paths_expanded}
            failed_paths={props.lala.failed_paths}
            lines={tree().root}/>
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
      <Switch>
        <Match when={props.lines.length === 1}>
          <>
            <RenderData data={props.lines[0].data} {...props} />
            <RenderLines  {...props} lines={props.lines[0].children} />
          </>
        </Match>
        <Match when={props.lines.length > 1}>
          <div class='lines'>
          <For each={props.lines}>{line =>
            <div class='line'>
              <RenderData data={line.data} {...props} />
              <Switch>
                <Match when={line.children.length === 1}>
                  <RenderLines  {...props} lines={line.children} />
                </Match>
                <Match when={line.children.length > 1}>
                  <div class='lines'>
                    <For each={line.children}>{child =>
                      <div class='line'><RenderLines {...props} lines={[child]} show_index={true} /></div>
                    }</For>
                  </div>
                </Match>
              </Switch>
            </div>
          }</For>
          </div>
        </Match>
        </Switch>
    </>)
}

const RenderData = (props: { on_set_path: (_: string[]) => void, 
  solved_paths: string[][], 
  revealed_paths: string[][], 
  failed_paths: string[][], 
  hidden_paths: string[][], 
  cursor_path: string[], data: MoveData, show_index?: boolean, collapsed?: true }) => {

    let nag_klass = ['', 'good', 'mistake', 'best', 'blunder', 'interesting', 'dubious']



    let index = `${Math.ceil(props.data.ply / 2)}.`
    if (props.data.ply % 2 === 0) {
        index += '..'
    }

    let on_path = createMemo(() => props.cursor_path.join('').startsWith(props.data.path.join('')))
    let on_path_end = createMemo(() => props.cursor_path.join('') === props.data.path.join(''))

    let my_path = createMemo(() => props.data.path.join(''))
    let on_hidden_path_start = createMemo(() => props.hidden_paths.find(_ => _.join('') === my_path())!)
    let on_hidden_path_rest = createMemo(() => props.hidden_paths.find(_ => my_path().startsWith(_.join('')))!)

    let on_revealed_path = createMemo(() => props.revealed_paths.find(_ => _.join('') === my_path())!)

    let on_failed_path = createMemo(() => props.failed_paths.find(_ => _.join('') === my_path())!)

    let on_solved_path = createMemo(() => props.solved_paths.find(_ => _.join('') === my_path())!)

    let nags = createMemo(() => nag_klass[props.data.nags?.[0] ?? 0])

    let move_on_path_klass = createMemo(() => ['move', 
      nags(),
    on_path_end()?'on_path_end':on_path()?'on_path':'',
    on_hidden_path_start() ? 'on_hidden_path_start':on_hidden_path_rest() ? 'on_hidden_path': '',
    on_revealed_path() ? 'on_revealed_path': '',
    on_failed_path() ? 'on_failed_path': '',
    on_solved_path() ? 'on_solved_path': '',
    props.collapsed ? 'collapsed': ''
   ].join(' '))

    return <>
      <div onClick={() => props.on_set_path(props.data.path)} class={move_on_path_klass()} ><Show when={props.show_index || props.data.ply & 1}><span class='index'>{index}</span></Show>{props.data.san}<RenderNags nags={props.data.nags ?? []}/></div>
    </>
}


export let text = ['', '!', '?', '!!', '??', '!?', '?!']
text[22] = '⨀'

const RenderNags = (props: { nags: number[] }) => {
  return (<> <span class='nag'>{text[props.nags[0]]}</span> </>)
}

export default Chesstree2



export const ChesstreeShorten = (props: { lala: Treelala2 }) => {


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
            <Switch>
              <Match when={tree().root.length === 1}>
              <RenderLinesShorten
                on_set_path={path => props.lala.try_set_cursor_path(path)}
                cursor_path={props.lala.cursor_path}
                hidden_paths={props.lala.hidden_paths}
                revealed_paths={props.lala.revealed_paths}
                solved_paths={props.lala.solved_paths_expanded}
                failed_paths={props.lala.failed_paths}
                lines={tree().root} />
              </Match>
            <Match when={tree().root.length > 1}>
            <div class='lines'>
            <For each={tree().root}>{ line =>
              <div class='line'>
              <RenderLinesShorten
                on_set_path={path => props.lala.try_set_cursor_path(path)}
                cursor_path={props.lala.cursor_path}
                hidden_paths={props.lala.hidden_paths}
                revealed_paths={props.lala.revealed_paths}
                solved_paths={props.lala.solved_paths_expanded}
                failed_paths={props.lala.failed_paths}
                lines={[line]} />
              </div>
            }</For>
            </div>
            </Match>
            </Switch>
          }</Show>
      </div>
    </>)
}

const can_inline_node = (node: TreeNode<MoveData>) => {
  let res = 0

  while (node !== undefined) {
    if (node.children.length > 1) {
      return false
    }
    node = node.children[0]

    if (res++ > 5) {

      return false
    }
  }

  return true
}

const RenderLinesShorten = (props: {
  on_set_path: (_: string[]) => void, 
  cursor_path: string[], 
  solved_paths: string[][],
  revealed_paths: string[][],
  failed_paths: string[][],
  hidden_paths: string[][],
  lines: TreeNode<MoveData>[], show_index?: boolean, hide_data?: boolean}) => {

    let hide_data = props.hide_data
    props.hide_data = undefined

    return (<>
      <For each={props.lines}>{line =>
        <>
          <Show when={!hide_data}>
             <RenderData data={line.data} {...props} />
          </Show>
          <Switch>
            <Match when={line.children.length === 1}>
              <RenderLinesShorten {...props} lines={line.children} show_index={false} />
            </Match>
            <Match when={line.children.length === 2 && can_inline_node(line.children[1])}>
              <RenderData data={line.children[0].data} {...props} show_index={false}/>
              <div class='inline'><RenderLinesShorten {...props} lines={[line.children[1]]} show_index={true}/></div>
              <RenderLinesShorten {...props} lines={[line.children[0]]} hide_data={true}/>
            </Match>
            <Match when={line.children.length > 1}>
              <div class='lines'>
                <For each={line.children}>{child =>
                  <div class='line'>
                    <Show when={props.cursor_path.join('').startsWith(child.data.path.join(''))} fallback= {
                      <RenderLinesShortenCollapsed {...props} lines={[child]} show_index={true} />
                    }>
                      <RenderLinesShorten {...props} lines={[child]} show_index={true} />
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
  lines: TreeNode<MoveData>[], show_index?: boolean}) => {

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
/*
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
*/

/* https://chat.openai.com/share/07606c60-87eb-446d-819a-88e2517d7373 */
function getRandomWeightedItem<T>(array: T[]) {
  // Calculate the weights
  const weights = array.map((_item, index) => 1 / (index + array.length));

  // Calculate the total weight
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  // Get a random number between 0 and the total weight
  const random = Math.random() * totalWeight;

  // Select an item based on the random number and weights
  let cumulativeWeight = 0;
  for (let i = 0; i < array.length; i++) {
    cumulativeWeight += weights[i];
    if (random < cumulativeWeight) {
      return array[i];
    }
  }
}


const castles_uci_fix = (data: MoveData) => {
  let from = data.uci.slice(0, 2)
  let to_rank = data.uci[3]
  if (data.san === 'O-O') {
    return from + 'g' + to_rank
  } else if (data.san === 'O-O-O') {
    return from + 'c' + to_rank
  }
}


/*
function merge_dup(a: string[][], b: string[][]) {
  let res = a.slice(0)
  b.forEach(b => {
    if (res.every(_ => _.join('') !== b.join(''))) {
      res.push(b)
    }
  })
  return res
}
*/
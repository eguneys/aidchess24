import { createEffect, createMemo, For, JSX, on, Show } from "solid-js"
import { ChesstreeShorten, Treelala2 } from "../Chesstree2"
import { Pgn } from "../chess_pgn_logic"
import './ChessTreeWithTools.scss'

export const ply_to_index = (ply: number) => {
  let res = Math.floor(ply / 2) + 1
  return `${res}.` + (ply %2 === 0 ? '..' : '')
}



export const ChessTreeWithTools = (props: { 
    pgn: Pgn, 
    children: JSX.Element, 
    cursor_path: string[],
    hide_after_path?: string[],
    can_navigate?: boolean, 
    on_wheel?: number,
    on_fen_last_move: (_: [string, string]) => void }) => {

    const is_pending_move = createMemo(() => props.can_navigate)
    const lala = createMemo(() => Treelala2.make(props.pgn.tree.clone))

    const branch_sums = createMemo(() => lala().collect_branch_sums(lala().cursor_path))

    createEffect(on(() => props.hide_after_path, (hide) => {
        lala()._hidden_paths.clear()
        if (hide) {
            lala()._hidden_paths.add_path(hide)
        }
    }))

    createEffect(on(() => props.on_wheel, dir => {
        if (dir) {
           lala().on_wheel(dir)
        }
    }))

    createEffect(on(() => lala().fen_last_move, res => {
        if (res) {
            props.on_fen_last_move(res)
        }
    }))

    createEffect(on(() => props.cursor_path, _ => {
        lala().cursor_path = _
    }))

    return (<>
        <div class='replay'>
            <div class='replay-v'>
                <ChesstreeShorten lala={lala()} />
            </div>
            <div class='branch-sums'>
                <button disabled={is_pending_move() || !lala().can_navigate_up} onClick={() => lala().navigate_up()} class={"fbt prev" + (!is_pending_move() && lala().can_navigate_up ? '' : ' disabled')} data-icon="" />
                <button disabled={is_pending_move() || !lala().can_navigate_down} onClick={() => lala().navigate_down()} class={"fbt prev" + (!is_pending_move() && lala().can_navigate_down ? '' : ' disabled')} data-icon="" />
                <For each={branch_sums()}>{branch =>
                    <div class='fbt' onClick={() => lala().try_set_cursor_path(branch.path)}><Show when={branch.ply & 1}><span class='index'>{ply_to_index(branch.ply)}</span></Show>{branch.san}</div>
                }</For>
            </div>
            <div class='replay-jump'>
                <button onClick={() => lala().navigate_first()} class={"fbt first" + (!is_pending_move() && lala().can_navigate_prev ? '' : ' disabled')} data-icon="" />
                <button onClick={() => lala().navigate_prev()} class={"fbt prev" + (!is_pending_move() && lala().can_navigate_prev ? '' : ' disabled')} data-icon="" />
                <button onClick={() => lala().navigate_next()} class={"fbt next" + (!is_pending_move() && lala().can_navigate_next ? '' : ' disabled')} data-icon="" />
                <button onClick={() => lala().navigate_last()} class={"fbt last" + (!is_pending_move() && lala().can_navigate_next ? '' : ' disabled')} data-icon="" />
            </div>

            <div class='tools'>
                {props.children}
            </div>
        </div>
    </>)
}


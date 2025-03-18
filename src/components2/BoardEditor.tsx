import { INITIAL_FEN } from "chessops/fen"
import './BoardEditor.scss'
import { Color, Role, ROLES } from "chessops"
import { createEffect, createSelector, createSignal, For, onMount } from "solid-js"
import { FEN } from "chessground/types"
import { Api } from "chessground/api"
import { Chessground } from "chessground"
import { dragNewPiece } from "chessground/drag"


type Spare = 'pointer' | `${Color} ${Role}` | 'trash'

export const BoardEditor = () => {

    const [spare, set_spare] = createSignal()
    const isSelected = createSelector(spare)
    const [drag_new_piece, set_drag_new_piece] = createSignal<[Color, Role, MouseEvent]>()

    const on_click_spare = (spare: Spare, e: MouseEvent) => {
        console.log(spare, e)
        if (spare === 'pointer') {

        } else if (spare === 'trash') {

        } else {
            let [color, role] = spare.split(' ') as [Color, Role]

            console.log(color, role)

            set_drag_new_piece([color, role, e])

        }
    }

    return (<>

        <div class='editor is2d'>
            <Spare klass="spare-top" color="black" on_spare={on_click_spare} is_selected={isSelected} />
            <div class='board-wrap'>
                <PlayUciBoardFree drag_new_piece={drag_new_piece()} fen={INITIAL_FEN} />
            </div>
            <Spare klass="spare-bottom" color="white" on_spare={on_click_spare} is_selected={isSelected}/>

            <div class='tools-wrap'>
                <div class='metadata'>
                <div class='color'>
                <select>
                    <option value="white">White's Turn</option>
                    <option value="black">Black's Turn</option>
                </select>
                </div>

                <div class='castling'>
                    <strong>Castling</strong>
                    <div>
                        <label><input type='checkbox'></input>White O-O</label>
                        <label><input type='checkbox'></input>O-O-O</label>
                    </div>
                    <div>
                        <label><input type='checkbox'></input>Black O-O</label>
                        <label><input type='checkbox'></input>O-O-O</label>
                    </div>
                </div>
                <div class='enpassant'>
                    <label for='enpassant-select'>En passant</label>
                    <select id='enpassant-select'>
                        <option value="" selected={true}></option>
                    </select>
                </div>
                </div>
                <div class='actions'>
                    <button>Starting Position</button>
                    <button>Clear Board</button>
                </div>
            </div>
        </div>
    </>)
}

export function PlayUciBoardFree(props: { 
    fen: FEN, 
    drag_new_piece?: [Color, Role, MouseEvent]
}) {

    let board: HTMLDivElement
    let ground: Api

    onMount(() => {
      let config = {
        fen: props.fen,
        movable: {
          free: true,
        }
      }
      ground = Chessground(board, config)
    })

    createEffect(() => {
        let s = props.drag_new_piece
        if (!s) {
            return
        }
        dragNewPiece(ground.state, { color: s[0], role: s[1] }, s[2], true)
    })

    return (<><div ref={(el) => board = el} class='is2d chessboard'> </div></>)
}



const Spare = (props: { color: Color, klass: string, is_selected: (_: string) => boolean, on_spare: (_: Spare, e: MouseEvent) => void }) => {

    const isSelected = props.is_selected

    return (<>
    <div class={'spare' + ' ' + props.klass + ' ' + props.color}>
        <NoSquare onClick={e => props.on_spare('pointer', e)} klass='pointer' spare='pointer' selected={isSelected('pointer')} color={props.color}/>
        <For each={ROLES}>{ role => 
            <NoSquare onClick={e => props.on_spare(`${props.color} ${role}`, e)} klass="" spare={`${props.color} ${role}`} selected={isSelected(props.color + role)} color={props.color} />
        }</For>
        <NoSquare onClick={e => props.on_spare('trash', e)} klass='trash' spare='trash' selected={isSelected('trash')} color={props.color}/>
    </div></>)
}

const NoSquare = (props: { klass: string, spare: Spare, selected: boolean, color: Color, onClick: (_: MouseEvent) => void }) => {
    return (<>
    <div onMouseDown={props.onClick} class={'no-square' + ' ' + props.klass} classList={{selected: props.selected}}>
        <div>
        <div class={'piece' + ' ' + props.spare} classList={{ [props.color]: true }}>
        </div>
        </div>
    </div></>)
}
import { INITIAL_FEN } from "chessops/fen"
import { PlayUciBoard } from "./PlayUciBoard"
import './BoardEditor.scss'
import { Color, Role, ROLES } from "chessops"
import { createMemo, createSelector, createSignal, For, onMount } from "solid-js"
import { FEN } from "chessground/types"
import { Api } from "chessground/api"
import { Chessground } from "chessground"
import { fen_pos } from "../store/step_types"


type Spare = 'pointer' | `${Color} ${Role}` | 'trash'

export const BoardEditor = () => {

    const pieces = []

    const [spare, set_spare] = createSignal()
    const isSelected = createSelector(spare)

    return (<>

        <div class='editor is2d'>
            <Spare klass="spare-top" color="black" is_selected={isSelected} />
            <div class='board-wrap'>
                <PlayUciBoardFree color="white" fen={INITIAL_FEN} last_move={undefined} />
            </div>
            <Spare klass="spare-bottom" color="white" is_selected={isSelected}/>

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
}) {

    let board: HTMLDivElement
    let ground: Api

    let pos = createMemo(() => fen_pos(props.fen))

    onMount(() => {
      let config = {
        fen: props.fen,
        movable: {
          free: true,
        }
      }
      ground = Chessground(board, config)
    })

    return (<><div ref={(el) => board = el} class='is2d chessboard'> </div></>)
}



const Spare = (props: { color: Color, klass: string, is_selected: (_: string) => boolean }) => {

    const isSelected = props.is_selected

    return (<>
    <div class={'spare' + ' ' + props.klass + ' ' + props.color}>
        <NoSquare klass='pointer' spare='pointer' selected={isSelected('pointer')} color={props.color}/>
        <For each={ROLES}>{ role => 
            <NoSquare klass="" spare={`${props.color} ${role}`} selected={isSelected(props.color + role)} color={props.color} />
        }</For>
        <NoSquare klass='trash' spare='trash' selected={isSelected('trash')} color={props.color}/>
    </div></>)
}

const NoSquare = (props: { klass: string, spare: Spare, selected: boolean, color: Color }) => {
    return (<>
    <div class={'no-square' + ' ' + props.klass} classList={{selected: props.selected}}>
        <div>
        <div class={'piece' + ' ' + props.spare} classList={{ [props.color]: true }}>
        </div>
        </div>
    </div></>)
}
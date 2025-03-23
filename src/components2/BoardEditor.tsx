import { EMPTY_FEN, INITIAL_FEN, makeFen, parseCastlingFen, parseFen } from "chessops/fen"
import './BoardEditor.scss'
import { Board, Castles, Color, parseSquare, Piece, Role, ROLES, Setup } from "chessops"
import { batch, createEffect, createMemo, createSelector, createSignal, For, onCleanup, onMount } from "solid-js"
import { FEN, Key } from "chessground/types"
import { Api } from "chessground/api"
import { Chessground } from "chessground"
import { dragNewPiece } from "chessground/drag"
import { eventPosition, opposite } from 'chessground/util'
import { Config } from "chessground/config"
import { createStore } from "solid-js/store"
import { square } from "chessops/debug"
import { setupPosition } from "chessops/variant"

function getEnPassantOptions(fen: string): string[] {
    const unpackRank = (packedRank: string) =>
        [...packedRank].reduce((accumulator, current) => {
            const parsedInt = parseInt(current);
            return accumulator + (parsedInt >= 1 ? 'x'.repeat(parsedInt) : current);
        }, '');
    const checkRank = (rank: string, regex: RegExp, offset: number, filesEnPassant: Set<number>) => {
        let match: RegExpExecArray | null;
        while ((match = regex.exec(rank)) != null) {
            filesEnPassant.add(match.index + offset);
        }
    };
    const filesEnPassant: Set<number> = new Set();
    const [positions, turn] = fen.split(' ');
    const ranks = positions.split('/');
    const unpackedRank = unpackRank(ranks[turn === 'w' ? 3 : 4]);
    checkRank(unpackedRank, /pP/g, turn === 'w' ? 0 : 1, filesEnPassant);
    checkRank(unpackedRank, /Pp/g, turn === 'w' ? 1 : 0, filesEnPassant);
    const [rank1, rank2] =
        filesEnPassant.size >= 1
            ? [unpackRank(ranks[turn === 'w' ? 1 : 6]), unpackRank(ranks[turn === 'w' ? 2 : 5])]
            : [null, null];
    return Array.from(filesEnPassant)
        .filter(e => rank1![e] === 'x' && rank2![e] === 'x')
        .map(e => String.fromCharCode('a'.charCodeAt(0) + e) + (turn === 'w' ? '6' : '3'));
}



type Spare = 'pointer' | `${Color} ${Role}` | 'trash'

export const BoardEditor = (props: { orientation: Color, on_change_fen: (_: FEN | undefined) => void }) => {

    const initial_fen = () => INITIAL_FEN
    const [board_fen, set_board_fen] = createSignal(INITIAL_FEN)

    const [get_turn, set_turn] = createSignal<Color>('white')
    const [get_ep_square, set_ep_square] = createSignal<Key | undefined>()

    const CASTLING_TOGGLES = ['K', 'Q', 'k', 'q'] as const
    const [castling_toggles, set_castling_toggles] = createStore({
        Q: false,
        K: false,
        k: false,
        q: false
    })

    const castling_toggle_fen = createMemo(() => {

        let fen = ''
        let ct = castling_toggles
        CASTLING_TOGGLES.forEach(c => {
            if (ct[c]) fen += c
        })

        return fen
    })

    const setup = createMemo<Setup>(() => {
        let initialFen =  initial_fen()
        let fen = board_fen() ?? initialFen
        const board = parseFen(fen).unwrap(setup => setup.board, _ => Board.empty())

        const turn = get_turn()
        const castlingRights = parseCastlingFen(board, castling_toggle_fen()).unwrap()

        let epSquare = get_ep_square() ? parseSquare(get_ep_square()!) : undefined
        return {
            board,
            turn,
            castlingRights,
            epSquare,
            pockets: undefined,
            remainingChecks: undefined,
            halfmoves: 0,
            fullmoves: 0
        }
    })


    const fen = createMemo(() => makeFen(setup()))
    const legal_fen = createMemo(() => {
        return setupPosition('chess', setup()).unwrap(
            pos => makeFen(pos.toSetup()),
            _ => undefined
        )
    })


    const ep_options = createMemo(() => getEnPassantOptions(fen()))

    createEffect(() => {
        props.on_change_fen(legal_fen())
    })

    const set_setup = (setup: Setup) => {
        batch(() => {
            set_turn(setup.turn)
            set_ep_square(setup.epSquare ? square(setup.epSquare) as Key : undefined)

            let castles = Castles.fromSetup(setup)

            set_castling_toggles('Q', castles.rook.white.a !== undefined)
            set_castling_toggles('K', castles.rook.white.h !== undefined)
            set_castling_toggles('q', castles.rook.black.a !== undefined)
            set_castling_toggles('k', castles.rook.black.h !== undefined)
        })
    }

    const set_fen = (fen: FEN) => {
        parseFen(fen).unwrap(
            setup => {
                batch(() => {
                    set_board_fen(fen)
                    set_setup(setup)
                })
                return true
            },
            _ => false
        )
    }

    const [spare, set_spare] = createSignal<Spare>('pointer')
    const isSelected = createSelector(spare)
    const [drag_new_piece, set_drag_new_piece] = createSignal<[Color, Role, MouseEvent]>()

    const on_click_spare = (spare: Spare, e: MouseEvent) => {

        set_spare(spare)

        if (spare === 'pointer') {
        } else if (spare === 'trash') {

        } else {
            let [color, role] = spare.split(' ') as [Color, Role]

            set_drag_new_piece([color, role, e])
        }
    }

    const make_cursor = createMemo(() => {

        let url, cursor

        switch (spare()) {
            case 'pointer': 
                cursor = 'pointer'
            break
            case 'trash':
                url = '/cursors/trash.cur' 
                break
            default:
                url = `/cursors/${spare().split(' ').join('-')}.cur`
        }

        if (cursor) {
            return { cursor }
        }
        if (url) {
            let res = {
                cursor: `url('${url}'), default`
            }
            return res
        }
    })

    const on_toggle_spare = () => {
        let [color, role] = spare().split(' ') as [Color, Role]
        set_spare(`${opposite(color)} ${role}`)
    }

    return (<>

        <div class='editor is2d' style={make_cursor()}>
            <Spare klass="spare-top" color={opposite(props.orientation)} on_spare={on_click_spare} is_selected={isSelected} />
            <div class='board-wrap'>
                <PlayUciBoardFree on_toggle_spare={on_toggle_spare} spare={spare()} orientation={props.orientation} on_change_fen={set_board_fen} drag_new_piece={drag_new_piece()} fen={board_fen()} />
            </div>
            <Spare klass="spare-bottom" color={props.orientation} on_spare={on_click_spare} is_selected={isSelected}/>

            <div class='tools-wrap'>
                <div class='metadata'>
                <div class='color'>
                <select on:change={(e) => set_turn(e.target.value as Color)}>
                    <option value="white" selected={get_turn() === 'white'}>White's Turn</option>
                    <option value="black" selected={get_turn() === 'black'}>Black's Turn</option>
                </select>
                </div>

                <div class='castling'>
                    <strong>Castling</strong>
                    <div>
                        <label><input type='checkbox' checked={castling_toggles['K']} onChange={(e) => set_castling_toggles('K', e.target.checked)}></input>White O-O</label>
                        <label><input type='checkbox' checked={castling_toggles['Q']} onChange={(e) => set_castling_toggles('Q', e.target.checked)}></input>O-O-O</label>
                    </div>
                    <div>
                        <label><input type='checkbox' checked={castling_toggles['k']} onChange={(e) => set_castling_toggles('k', e.target.checked)}></input>Black O-O</label>
                        <label><input type='checkbox' checked={castling_toggles['q']} onChange={(e) => set_castling_toggles('q', e.target.checked)}></input>O-O-O</label>
                    </div>
                </div>
                <div class='enpassant'>
                    <label for='enpassant-select'>En passant</label>
                    <select id='enpassant-select' onChange={e => set_ep_square(e.target.value as Key | undefined)}>
                        <option value="" selected={true}></option>
                        <For each={ep_options()}>{ key => 
                                <option value={key}>{key}</option>
                        }</For>
                    </select>
                </div>
                </div>
                <div class='actions'>
                    <button onClick={() => set_fen(INITIAL_FEN)}>Starting Position</button>
                    <button onClick={() => set_fen(EMPTY_FEN)} >Clear Board</button>
                </div>
            </div>
        </div>
    </>)
}

export function PlayUciBoardFree(props: { 
    spare: Spare,
    fen: FEN, 
    orientation: Color,
    drag_new_piece?: [Color, Role, MouseEvent],
    on_change_fen: (fen: FEN) => void,
    on_toggle_spare: () => void
}) {

    const on_change = () => {
        props.on_change_fen(ground.getFen())
    }

    
    
    let board: HTMLDivElement
    let ground: Api

    onMount(() => {
        let config: Config = {
            fen: props.fen,
            orientation: props.orientation,
            autoCastle: false,
            movable: {
                free: true,
                color: 'both'
            },
            draggable: {
                showGhost: true,
                deleteOnDropOff: true,
            },
            premovable: {
                enabled: false
            },
            selectable: {
                enabled: false
            },
            highlight: {
                lastMove: false
            },
            events: {
                change: on_change
            }
        }
        ground = Chessground(board, config)

        const on_mouse_down = (e: MouseEvent) => {
            let sel = props.spare
            if (sel !== 'pointer') {
                e.preventDefault()
            }
            const pos = eventPosition(e)
            if (!pos) {
                return
            }
            let key = ground.getKeyAtDomPos(pos)
            if (!key) {
                return
            }

            if (sel === 'trash') {
                delete_piece(key)
            } else if (sel !== 'pointer') {

                const existing = ground.state.pieces.get(key)

                let [color, role] = sel.split(' ') as [Color, Role]

                let piece: Piece = {
                    color,
                    role
                }

                let is_same_piece = existing && existing.color === piece.color && existing.role === piece.role


                if (is_same_piece) {
                    delete_piece(key)
                } else {
                    ground.setPieces(new Map([[key, piece]]))
                    on_change()
                }
            }

        }
 
        const delete_piece = (key: Key) => {
            ground.setPieces(new Map([[key, undefined]]))
            on_change()
        }

        const on_context_menu = (e: MouseEvent) => {
            let sel = props.spare
            if (sel !== 'pointer') {
                e.preventDefault()
            }

            if (sel !== 'pointer') {
                ground.state.drawable.current = undefined;
                ground.state.drawable.shapes = [];


                if (e.type === 'contextmenu' && sel !== 'trash') {
                    ground.cancelMove()
                    props.on_toggle_spare()
                }
            }
        }


        board.addEventListener('mousedown', on_mouse_down)
        board.addEventListener('contextmenu', on_context_menu)

        onCleanup(() => {
            board.removeEventListener('mousedown', on_mouse_down)
            board.removeEventListener('contextmenu', on_context_menu)
        })
    })

    createEffect(() => {
        ground.set({ fen: props.fen })
    })

    createEffect(() => {
        ground.set({ orientation: props.orientation })
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



const Spare = (props: { color: Color, klass: string, is_selected: (_: Spare) => boolean, on_spare: (_: Spare, e: MouseEvent) => void }) => {

    const isSelected = props.is_selected

    return (<>
    <div class={'spare' + ' ' + props.klass + ' ' + props.color}>
        <NoSquare onClick={e => props.on_spare('pointer', e)} klass='pointer' spare='pointer' selected={isSelected('pointer')} color={props.color}/>
        <For each={ROLES}>{ role => 
            <NoSquare onClick={e => props.on_spare(`${props.color} ${role}`, e)} klass="" spare={`${props.color} ${role}`} selected={isSelected(`${props.color} ${role}`)} color={props.color} />
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
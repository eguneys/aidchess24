import { createContext, createResource, createSignal, JSXElement } from "solid-js";
import { LocalEval, protocol, PvData } from "./stockfish-module";
import { Color } from "chessops";
import { povChances } from "../chess_winningChances";
import throttle from "../common/throttle";

export const StockfishContext = createContext<Promise<StockfishContextRes>>()

export type StockfishContextRes = {
    download_nb: { bytes: number, total: number } | undefined,
    engine_failed: string | undefined,

    state: 'loading' | 'computing' | 'idle',
    get_best_move(game_id: string, fen: string, ply: number, multi_pv: number, depth: number): Promise<LocalEval | undefined>
}

const sortPvsInPlace = (pvs: PvData[], color: Color) =>
    pvs.sort((a, b) => povChances(color, b) - povChances(color, a));

export function StockfishProvider(props: { children: JSXElement }) {

    let res = async function() {


        let [downloaded_nb, set_downloaded_nb] = createSignal<{ total: number, bytes: number } | undefined>(undefined)
        let [engine_failed, set_engine_failed] = createSignal<string | undefined>(undefined)

        let [pp] = createResource(() => protocol({
            on_downloaded_nb(_) {
                set_downloaded_nb(_)
            },
            on_engine_failed(_) {
                set_engine_failed(_)
            }
        }))

        return {
            get download_nb() {
                return downloaded_nb()
            },
            get engine_failed() {
                return engine_failed()
            },
            get state() {
                let p = pp()
                if (pp.loading || !p) {
                    return 'loading'
                }
                return p.state
            },
            async get_best_move(game_id: string, fen: string, ply: number, multi_pv: number, depth: number) {

                let set_resolve = (_: LocalEval) => {}


                let p = pp()

                if (!p) {
                    return undefined
                }

                let threads = Math.max(1, navigator.hardwareConcurrency - 2)
                let hash_size = 16


                p.start({
                    threads,
                    hash_size,
                    game_id,
                    stop_requested: false,
                    path: [],
                    search: {
                        depth
                    },
                    multi_pv,
                    ply,
                    threatMode: false,
                    initial_fen: fen,
                    current_fen: fen,
                    moves: [],
                    emit: throttle(200, function (ev: LocalEval): void {
                        if (ev.depth === depth) {
                            set_resolve(ev)
                        }
                    })
                })


                return new Promise<LocalEval>(resolve => {
                    set_resolve = resolve
                })
            }
        }
    }

    return <StockfishContext.Provider value={res()}>
        <>{props.children}</>
    </StockfishContext.Provider>
}
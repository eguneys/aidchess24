import { Accessor, batch, createContext, createMemo, createResource, createSignal, DEV, EffectOptions, JSXElement, SignalOptions } from "solid-js";
import { LocalEval, protocol } from "./stockfish-module";
import throttle from "../common/throttle";
import { isServer } from "solid-js/web";

export const StockfishContext = createContext<StockfishContextRes>()

export type BestMoveWithDepthProgress =  {
    loading: boolean,
    depth_eval: LocalEval | undefined,
    best_eval: LocalEval | undefined,
}

export type StockfishContextRes = {
    download_nb: { bytes: number, total: number } | undefined,
    engine_failed: string | undefined,

    state: 'loading' | 'computing' | 'idle'
    best_move_with_depth_progress: (game_id: string, fen: string, ply: number, multi_pv: number, depth: number) => BestMoveWithDepthProgress
    stop: () => void
}




export function StockfishProvider(props: { children: JSXElement }) {

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


    function get_best_move(game_id: string, fen: string, ply: number, multi_pv: number, depth: number,
        on_loading: () => void,
        on_depth: (ev: LocalEval) => void,
        on_best_move: (ev: LocalEval) => void) {
        let p = pp()

        if (!p) {
            on_loading()
            return () => {}
        }

        let threads = Math.max(1, navigator.hardwareConcurrency - 2)
        let hash_size = 256


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
                    on_best_move(ev)
                }
            }),
            on_pvs: throttle(200, function (ev: LocalEval): void {
                on_depth(ev)
            }),
        })
    }


    let cache: Record<string, BestMoveWithDepthProgress> = {}

    function best_move_with_depth_progress(game_id: string, fen: string, ply: number, multi_pv: number, depth: number) {

        let [loading, set_loading] = createSignal(true)
        let [depth_eval, set_depth_eval] = createSignal<LocalEval | undefined>(undefined)
        let [best_eval, set_best_eval] = createSignal<LocalEval | undefined>(undefined)

        const on_loading = () => {
            set_loading(true)
        }

        const on_depth = (d: LocalEval) => {
            batch(() => {
                set_loading(false)
                set_depth_eval(d)
            })
        }

        const on_best_move = (ev: LocalEval) => {
            batch(() => {
                set_loading(false)
                set_depth_eval(undefined)
                set_best_eval(ev)
            })
        }

        let key = [fen, multi_pv, depth].join('$$')
        let keys = (() => {
            let depths = depth === 8 ? [20, 8] : [20]
            let pvs = multi_pv === 1 ? [6, 1] : [1]

            return depths.flatMap(depth => pvs.map(multi_pv =>
                [fen, multi_pv, depth].join('$$')))
        })()

        let cc = keys.find(key => cache[key])
        if (cc) {
            return cache[cc]
        } else {
             get_best_move(game_id, fen, ply, multi_pv, depth, on_loading, on_depth, on_best_move)
        }

        cache[key] = {
            get loading() { return loading() },
            get depth_eval() { return depth_eval() },
            get best_eval() { return best_eval() },
        }

        return cache[key]
    }


    let res = {
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
        best_move_with_depth_progress,
        stop() {
            pp()?.stop()
        }
    }

    return <StockfishContext.Provider value={res}>
        <>{props.children}</>
    </StockfishContext.Provider>
}


export const EQUALS_FALSE_OPTIONS = { equals: false } as const satisfies SignalOptions<unknown>;

export function createLazyMemoAndCacheGet<T>(
  calc: (prev: T | undefined) => T,
  value?: T,
  options?: EffectOptions,
): [Accessor<T>, Accessor<T | undefined>] {
  if (isServer) {
    let calculated = false;
    let a = () => {
      if (!calculated) {
        calculated = true;
        value = calc(value);
      }
      return value as T;
    };

    let b = () => {
        if (calculated) {
            return value as T
        }
    }

    return [a, b]
  }

  let isReading = false,
    isStale: boolean | undefined = true;

  const [track, trigger] = createSignal(void 0, EQUALS_FALSE_OPTIONS),
    memo = createMemo<T>(
      p => (isReading ? calc(p) : ((isStale = !track()), p)),
      value as T,
      DEV ? { name: options?.name, equals: false } : EQUALS_FALSE_OPTIONS,
    );

  let [track_cache, trigger_cache] = createSignal(void 0, EQUALS_FALSE_OPTIONS)
  let v: T | undefined
  let a = (): T => {
    isReading = true;
    if (isStale) isStale = trigger();
    v = memo();
    isReading = false;
    trigger_cache()
    return v;
  };
  let b = () => {
    track_cache()
    if (v) {
        return v
    }
    return undefined
  }

  return [a, b]
}
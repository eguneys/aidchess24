import StockfishWeb from 'lila-stockfish-web'
import { objectStorage } from './objectStorage'
import { defined } from 'chessops'

export type DownloadStatus = {
  download?: { bytes: number, total: number }
  error?: string
}

export type StockfishHooks = {
  on_status: (status?: DownloadStatus) => void,
  on_received: (data: string) => void,
  on_connected: (uci: (_: string) => void) => void
}

export type SearchBy = { movetime: number } | { depth: number } | { nodes: number }

export interface LocalEval extends EvalScore {
  millis: number,
  fen: string,
  depth: number,
  nodes: number,
  pvs: PvData[]
}

export interface PvData extends EvalScore {
  moves: string[],
}

export interface EvalScore {
  cp?: number,
  mate?: number
}

export type Work = {
  threads: number,
  hash_size: number | undefined,
  game_id: string | undefined,
  stop_requested: boolean,

  path: string[],
  search: SearchBy,
  multi_pv: number,
  ply: number,
  threatMode: boolean,
  initial_fen: string,
  current_fen: string,
  moves: string[],
  emit: (ev: LocalEval) => void

}


type ProtocolHooks = {
  on_downloaded_nb: (_: {total: number, bytes: number}) => void,
  on_engine_failed: (_: string) => void
}

export async function protocol(hooks: ProtocolHooks) {

  let send_uci: (_: string) => void

  await boot({
    on_received: parse_received,
    on_status(status?: DownloadStatus) {
      if (!status) {
        return
      }
      if (status.download) {
        hooks.on_downloaded_nb(status.download)
      }
      if (status.error) {
        hooks.on_engine_failed(status.error)
      }
    },
    on_connected(_: (_: string) => void) {
      send_uci = _
    }
  })

  send('uci')

  function send(cmd: string) {
    send_uci?.(cmd)
  }

  function compute(work?: Work) {
    next_work = work
    stop()
    swap_work()
  }

  function is_computing() {
    return !!work && !work.stop_requested
  }

  function parse_received(command: string) {
    const parts = command.trim().split(/\s+/g)
    if (parts[0] === 'uciok') {
      send('ucinewgame')
      send('isready')
    } else if (parts[0] === 'readyok') {
      swap_work()
    } else if (parts[0] === 'id' && parts[1] === 'name') {
      //set_engine_name(parts.slice(2).join(' '))
    } else if (parts[0] === 'bestmove') {
      if (work && current_eval) {
        work.emit(current_eval)
      }
      work = undefined
      swap_work()
      return
    } else if(work && !work.stop_requested && parts[0] === 'info') {
      let depth = 0,
      nodes,
      multi_pv = 1,
      millis,
      eval_type,
      is_mate = false,
      pov_ev,
      moves: string[] = []

      for (let i = 1; i < parts.length; i++) {
        switch (parts[i]) {
          case 'depth':
            depth = parseInt(parts[++i])
            break
          case 'nodes':

          nodes = parseInt(parts[++i])
          break
          case 'multipv':
            multi_pv = parseInt(parts[++i])
            break
          case 'time':
            millis = parseInt(parts[++i])
            break
            case 'score':
              is_mate = parts[++i] === 'mate'
              pov_ev = parseInt(parts[++i])
              if (parts[i + 1] === 'lowerbound' || parts[i + 1] === 'upperbound') eval_type = parts[++i]
              break
              case 'pv':
                moves = parts.slice(++i)
                i = parts.length
                break
        }
      }

      if (is_mate && !pov_ev) return

      if (expected_pvs < multi_pv) expected_pvs = multi_pv

      if (!defined(nodes) || !defined(millis) || !defined(is_mate) || !defined(pov_ev)) return

      const pivot = 1
      const ev = work.ply % 2 === pivot ? -pov_ev : pov_ev


      if (eval_type && multi_pv === 1) return

      const pv_data = {
        moves,
        cp: is_mate ? undefined: ev,
        mate: is_mate ? ev: undefined,
        depth
      }

      if (multi_pv === 1) {
        current_eval = {
          fen: work.current_fen,
          depth,
          nodes,
          millis,
          cp: is_mate? undefined: ev,
          mate: is_mate ? ev: undefined,
          pvs: [pv_data]
        }
      } else if (current_eval) {
        current_eval.pvs.push(pv_data)
        current_eval.depth = Math.min(current_eval.depth, depth)
      }

      if (multi_pv === expected_pvs && current_eval) {
        work.emit(current_eval)
        if (depth >= 40) stop()
      }
    } else if (command && !['Stockfish', 'id', 'option', 'info'].includes(parts[0])) {
      console.warn(`SF: ${command}`)
    }

  }

  let expected_pvs = 0

  let work: Work | undefined,
  next_work: Work | undefined,
  current_eval: LocalEval | undefined

  function swap_work() {
    if (work) return

    work = next_work
    next_work = undefined

    if (work) {
      current_eval = undefined
      expected_pvs = 1

      set_option('Threads', work.threads)
      set_option('Hash', work.hash_size || 16)
      set_option('MultiPV', Math.max(1, work.multi_pv))

      if (game_id && game_id !== work.game_id) send('ucinewgame')
      game_id = work.game_id

      send(['position fen', work.initial_fen, 'moves', work.moves].join(' '))

      const [by, value] = Object.entries(work.search)[0]

      send(`go ${by} ${value}`)
    }
  }

  let options = new Map([
    ['Threads', '1'],
    ['Hash', '16'],
    ['MultiPV', '1'],
    ['UCI_Variant', 'chess'],
  ])

  function set_option(name: string, value: string | number): void {
    value = value.toString()
    if (options.get(name) !== value) {
      send(`setoption name ${name} value ${value}`)
      options.set(name, value)
    }

  }

  function stop() {
    if (work && !work.stop_requested) {
      work.stop_requested = true
      send('stop')
    }
  }

  let game_id: string | undefined

  return {
    start(work: Work) {
      compute(work)
    },
    stop() {
      compute()
    },
    destroy() {
      send('quit')
    },
    get state(): 'computing' | 'idle' {
      if (is_computing()) {
        return 'computing'
      }
      return 'idle'
    }
  }
}

type BootHooks = {
  on_status: (_?: DownloadStatus) => void
  on_received: (_: string) => void
  on_connected: (_: (cmd: string) => void) => void
}

export async function boot(hooks: BootHooks) {

  const on_status = (_?: DownloadStatus) => {
    hooks.on_status(_)
  }

  const on_received = (_: string) => {
    hooks.on_received(_)
  }

  const on_connected = (send_uci: (cmd: string) => void) => {
    hooks.on_connected(send_uci)
  }


  let makeModule = await import('lila-stockfish-web/sf17-79.js')
  let module: StockfishWeb = await new Promise((resolve, reject) => {

    makeModule.default({
      wasmMemory: sharedWasmMemory(2560),
      onError: (msg: string) => reject(new Error(msg)),
      locateFile: (file: string) => `stockfish/${file}`
    })
      .then(resolve)
      .catch(reject)
  })

  let store = await objectStorage<Uint8Array>({ store: '.aidchess.nnue' }).catch(() => undefined)

  let nnue_filenames: string[] = []
  for (let i = 0; ; i++) {
    let nnue_filename = module.getRecommendedNnue(i)
    if (!nnue_filename || nnue_filenames.includes(nnue_filename)) break
    nnue_filenames.push(nnue_filename)
  }
  let models = await get_models(nnue_filenames)
  models.forEach((nnueBuffer, i) => module.setNnueBuffer(nnueBuffer!, i))

  module.onError = makeErrorHandler()
  module.listen = (data: string) => on_received(data)

  on_connected(cmd => module.uci(cmd))

  async function get_models(nnue_filenames: string[]): Promise<(Uint8Array | undefined)[]> {

    return Promise.all(
      nnue_filenames.map(async nnue_filename => {
        let stored_buffer = await store?.get(nnue_filename).catch(() => undefined)

        if (stored_buffer && stored_buffer.byteLength > 128 * 1024) return stored_buffer
        const req = new XMLHttpRequest()

        req.open('get', `stockfish/nnue/${nnue_filename}`, true)
        req.responseType = 'arraybuffer'
        req.onprogress = e => on_status({ download: { bytes: e.loaded, total: e.total } })


        const nnueBuffer = await new Promise<Uint8Array>((resolve, reject) => {
          req.onerror = () => reject(new Error(`fetch '${nnue_filename}' failed: ${req.status}`))
          req.onload = () => {
            if (req.status / 100 === 2) resolve(new Uint8Array(req.response))
            else reject(new Error(`fetch '${nnue_filename}' failed: ${req.status}`))
          }
          req.send()
        })

        on_status()
        store?.put(nnue_filename, nnueBuffer).catch(() => console.warn(`IDB store failed`))
        return nnueBuffer
      })
    )

  }


  function makeErrorHandler() {
    return (msg: string): void => {
      if (msg.startsWith('BAD_NNUE') && store) {
        const index = Math.max(0, Number(msg.slice(9)))
        const nnue_filename = module.getRecommendedNnue(index)
        setTimeout(() => {
          console.warn(`Corrupt NNUE file, removing ${nnue_filename} from IDB`)
          store!.remove(nnue_filename)
        }, 2000)
      } else on_status({ error: msg })
    }
  }
}


export const sharedWasmMemory = (lo: number, hi = 32767): WebAssembly.Memory => {
  let shrink = 4; // 32767 -> 24576 -> 16384 -> 12288 -> 8192 -> 6144 -> etc
  while (true) {
    try {
      return new WebAssembly.Memory({ shared: true, initial: lo, maximum: hi });
    } catch (e) {
      if (hi <= lo || !(e instanceof RangeError)) throw e;
      hi = Math.max(lo, Math.ceil(hi - hi / shrink));
      shrink = shrink === 4 ? 3 : 4;
    }
  }
};

import { Color } from "chessops";
import { povChances } from "../chess_winningChances";
import throttle from "../common/throttle";
import { Engines } from "./engines";
import { CevalEngine, CevalOpts, PvData, Step, Tree_LocalEval, Tree_Path, Work } from "./types";

export default class CevalCtrl {

    opts!: CevalOpts;
    engines: Engines;

    private worker: CevalEngine | undefined;


    enabled!: boolean
    download?: { bytes: number, total: number }

    searchMs!: number
    multiPv!: number

    engineFailed(_msg: string) {

    }

    constructor(opts: CevalOpts) {
        this.configure(opts)
        this.engines = new Engines(this)
    }


    configure(opts: CevalOpts) {
        this.opts = opts
        this.enabled = false
    }

    setSearch(s?: { searchMs?: number, multiPv?: number}) {
        this.searchMs = s?.searchMs ?? 8000
        this.multiPv = s?.multiPv ?? 1
    }

    threads = () => {
        return this.engines.active?.minThreads ?? 1
    }

    hashSize = () => {
        return this.maxHash()
    }

    maxHash = () => this.engines.active?.maxHash ?? 16

    onEmit = throttle(200, (ev: Tree_LocalEval, work: Work) => {
        this.sortPvsInPlace(ev.pvs, work.ply % 2 === 0 ? 'white': 'black')
        this.opts.emit(ev)
    })

    doStart = (path: Tree_Path, steps: Step[]) => {

        const step = steps[steps.length - 1]

        const work: Work = {
            threads: this.threads(),
            hashSize: this.hashSize(),
            stopRequested: false,
            path,
            searchMs: this.searchMs,
            multiPv: this.multiPv,
            ply: step.ply,
            threatMode: false,
            initialFen: steps[0].fen,
            currentFen: step.fen,
            moves: [],
            emit: (ev: Tree_LocalEval) => {
                if (!this.enabled) return;
                this.onEmit(ev, work)
            }
        }

        for (let i = 1; i < steps.length; i++) {
            const s = steps[i]
            work.moves.push(s.uci!)
        }

        if (!this.worker) this.worker = this.engines.make()


        this.worker.start(work)
    }

    stop = () => {
        this.worker?.stop()
    }

    start = (path: string, steps: Step[]) => {
        this.doStart(path, steps)
    }

    private sortPvsInPlace = (pvs: PvData[], color: Color) =>
    pvs.sort((a, b) => povChances(color, b) - povChances(color, a))
}
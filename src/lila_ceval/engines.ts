import CevalCtrl from "./ctrl";
import { StockfishWebEngine } from "./stockfishWebEngine";
import { BrowserEngineInfo, CevalEngine, EngineInfo } from "./types";

type WithMake = {
    info: BrowserEngineInfo;
    make: (e: BrowserEngineInfo) => CevalEngine;
}

export class Engines {

    private _active: EngineInfo | undefined = undefined
    localEngines: BrowserEngineInfo[]
    localEngineMap: Map<string, WithMake>


    get active() {
        return this._active ?? this.activate()
    }

    activate() {
        this._active = this.getEngine()
        return this._active
    }

    constructor(private ctrl: CevalCtrl) {
        this.localEngineMap = this.makeEngineMap()
        this.localEngines = [...this.localEngineMap.values()].map(e => e.info)
    }

    status = (status: { download?: { bytes: number; total: number}; error?: string } = {}) => {
        if (this.ctrl.enabled) this.ctrl.download = status.download;
        if (status.error) this.ctrl.engineFailed(status.error);
    }

    makeEngineMap() {
        return new Map<string, WithMake>([
            {
                info: {
                    id: '__sf16nnue40',
                    name: 'Stockfish 16 NNUE 40MB',
                    short: 'SF 16 40MB',
                    tech: 'NNUE',
                    minMem: 2048,
                    assets: {
                        root: 'npm/lila-stockfish-web',
                        js: 'sf-nnue-40.js'
                    }
                },
                make: (e: BrowserEngineInfo) => new StockfishWebEngine(e, this.status)
            }
        ].map(e => [e.info.id, { info: withDefaults(e.info as BrowserEngineInfo), make: e.make}]))
    }

    make(): CevalEngine {
        const e = (this._active = this.getEngine())

        if (!e) throw Error(`Engine not found`)

        return this.localEngineMap.get(e.id)!.make(e as BrowserEngineInfo)
    }


    getEngine(): EngineInfo | undefined {
        return this.localEngines[0]
    }
}

function maxHashMB() {
    return 512
}

const maxHash = maxHashMB()

const withDefaults = (engine: BrowserEngineInfo): BrowserEngineInfo => ({
    minMem: 1024,
    maxHash,
    minThreads: 2,
    maxThreads: 32,
    ...engine
})
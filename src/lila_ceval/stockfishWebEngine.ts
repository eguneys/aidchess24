import StockfishWeb from "lila-stockfish-web";
import { BrowserEngineInfo, CevalEngine, CevalState, EngineInfo, EngineNotifier, Work } from "./types";
import { Protocol } from "./protocol";

export class StockfishWebEngine implements CevalEngine {

    failed!: Error
    protocol!: Protocol
    module?: StockfishWeb

    constructor(
        readonly info: BrowserEngineInfo,
        readonly status?: EngineNotifier) {

            this.protocol = new Protocol()
            this.boot().catch(e => {
                console.error(e)
                this.failed = e
                this.status?.({ error: String(e) })
            })
        }

    getInfo(): EngineInfo {
        return this.info;
    }


    async boot() {

    }

    getState(): CevalState {
        return this.failed
        ? CevalState.Failed
        : !this.module
        ? CevalState.Loading
        : this.protocol.isComputing()
        ? CevalState.Computing
        : CevalState.Idle
    }

    start(work: Work): void {
        this.protocol.compute(work)
    }
    stop(): void {
        this.protocol.compute(undefined)
    }
    destroy(): void {
        this.module?.postMessage('quit')
        this.module = undefined
    }

}
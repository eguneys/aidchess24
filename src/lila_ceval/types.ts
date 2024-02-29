export interface CevalOpts {
  emit: (ev: Tree_LocalEval) => void;
}

interface EvalScore {
    cp?: number;
    mate?: number;
}

export interface PvData extends EvalScore {
    moves: string[]
}

export type Tree_Path = string;

export interface Tree_LocalEval extends EvalScore {
    fen: string,
    depth: number,
    nodes: number,
    pvs: PvData[],
    millis: number
}

export interface Work {
  threads: number;
  hashSize: number | undefined;
  stopRequested: boolean;

  path: string;
  searchMs: number;
  multiPv: number;
  ply: number;
  threatMode: boolean;
  initialFen: string;
  currentFen: string;
  moves: string[];
  emit: (ev: Tree_LocalEval) => void;
}

export interface EngineInfo {
  id: string;
  name: string;
  tech?: 'HCE' | 'NNUE' | 'EXTERNAL';
  short?: string;
  minThreads?: number;
  maxThreads?: number;
  maxHash?: number;
}

export interface BrowserEngineInfo extends EngineInfo {
    minMem?: number;
    assets: { root?: string, js: string, nnue?: string };
}

export type EngineNotifier = (status?: {
  download?: { bytes: number, total: number };
  error?: string;
}) => void;

export enum CevalState {
  Initial,
  Loading,
  Idle,
  Computing,
  Failed,
}


export interface CevalEngine {
  getInfo(): EngineInfo;
  getState(): CevalState;
  start(work: Work): void;
  stop(): void;
  destroy(): void;
}


export type Step = {
  ply: number,
  fen: string,
  uci: string
}
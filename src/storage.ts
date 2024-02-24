import { makePersisted } from "@solid-primitives/storage";
import { Signal, createSignal } from "solid-js";

export class RepertoireStatStore {

    constructor(readonly study_name: string, i_chapter: number) { 
        this._solved_paths = makePersisted(createSignal<[string[][], string[][]]>([[], []]), {
            name: `.repertoire_stat.name.${study_name}.chapter.${i_chapter}`
        })
    }

    _solved_paths: Signal<[string[][], string[][]]>

  set solved_paths(solved_paths: [string[][], string[][]]) {
    this._solved_paths[1](solved_paths)
  }

  get solved_paths() {
    return this._solved_paths[0]()
  }

}
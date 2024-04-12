import { Signal } from "solid-js";
import { makePersistedNamespaced } from "./storage";


export class DashboardRepertoireStats {

    make_persisted<T>(def: T, name: string) {
        return makePersistedNamespaced<T>(def, 
            `dashboard.openings.id.${this.study_id}.${name}`)
    }

    _progress: Signal<number>

    _sections_progress: Signal<[string, number][]>

    get progress() {
      return this._progress[0]()
    }

    set progress(_: number) {
      this._progress[1](_)
    }

    get sections_progress() {
      return this._sections_progress[0]()
    }

    set sections_progress(_: [string, number][]) {
      this._sections_progress[1](_)
    }

    constructor(readonly study_id: string) {

      this._progress = this.make_persisted(0, 'progress')

      this._sections_progress = this.make_persisted<[string, number][]>([], 'sections')

    }

}


export class OpeningsStore {

    make_persisted<T>(def: T, name: string) {
        return makePersistedNamespaced<T>(def, 
            `.openings.id.${this.study_id}.${name}`)
    }

  _i_section_name: Signal<string | undefined>
  _i_chapter_index: Signal<number>


  get i_section_name() {
    return this._i_section_name[0]()
  }

  set i_section_name(_: string | undefined) {
    this._i_section_name[1](_)
  }

  get i_chapter_index() {
    return this._i_chapter_index[0]()
  }

  set i_chapter_index(_: number) {
    this._i_chapter_index[1](_)
  }

    constructor(readonly study_id: string) {
      this._i_section_name = this.make_persisted<string | undefined>(undefined, 'i_section_name')
      this._i_chapter_index = this.make_persisted(0, 'i_chapter_idx')
    }
}


export class OpeningsChapterStatStore {

  _practice_progress: Signal<number>
  _dm_pass: Signal<number>
  _dm_fail: Signal<number>
  _quiz_pass: Signal<number>
  _quiz_fail: Signal<number>

  get practice_progress() {
    return this._practice_progress[0]()
  }

  set practice_progress(_: number) {
    this._practice_progress[1](_)
  }

  get dm_pass() {
    return this._dm_pass[0]()
  }

  get dm_fail() {
    return this._dm_fail[0]()
  }
  get quiz_pass() {
    return this._quiz_pass[0]()
  }
  get quiz_fail() {
    return this._quiz_fail[0]()
  }
  
  set dm_pass(_: number) {
    this._dm_pass[1](_)
  }

  set dm_fail(_: number) {
    this._dm_fail[1](_)
  }
  set quiz_pass(_: number) {
    this._quiz_pass[1](_)
  }
  set quiz_fail(_: number) {
    this._quiz_fail[1](_)
  }



    _solved_paths: Signal<string[][]>
  
    set solved_paths(solved_paths: string[][]) {
      this._solved_paths[1](solved_paths)
    }
  
    get solved_paths() {
      return this._solved_paths[0]()
    }

    make_persisted<T>(def: T, name: string) {
        return makePersistedNamespaced<T>(def, 
            `openings.id.${this.study_id}.section.${this.section}.chapter.${this.chapter}.${name}`)
    }

    constructor(readonly study_id: string, readonly section: string, readonly chapter: string) { 

      this._solved_paths = this.make_persisted<string[][]>([], 'solved_paths')

      this._practice_progress = this.make_persisted(0, 'practice_progress')

      this._dm_pass = this.make_persisted(0, 'dm_pass')
      this._dm_fail = this.make_persisted(0, 'dm_fail')
      this._quiz_pass = this.make_persisted(0, 'quiz_pass')
      this._quiz_fail = this.make_persisted(0, 'quiz_fail')
    }
}
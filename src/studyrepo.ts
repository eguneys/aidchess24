import { Color } from "chessground/types"
import { Pgn } from "./chess_pgn_logic"
import { makePersistedNamespaced } from "./storage"
import { Signal } from "solid-js"

export type PGNStudy = {
    id: string,
    name: string,
    orientation?: Color,
    chapters: PGNChapter[]
}

export type PGNChapter = {
    name: string,
    site: string,
    pgn: Pgn
}


const reformatStudyPGN = (pgns: string, id: string, study_name: string, orientation?: Color): PGNStudy => {
    let chapters = Pgn.make_many(pgns).map(pgn => {

        let site = pgn.site?.includes('http') ? pgn.site : `https://lichess.org/study/${id}`
        let event = pgn.event

        let chapter
        if (!event?.includes(': ')) {

          if (pgn.white !== '?') {
            let white = pgn.white
            let black = pgn.black

            chapter = `${white} vs ${black} at ${event}`
          } else {
            chapter = event!
          }
        } else {
          [study_name, chapter] = event.split(': ')
        }

        return {
            name: chapter,
            site,
            pgn,
        }

    })

    return {
        id,
        name: study_name,
        orientation,
        chapters
    }
}


export type PGNSectionStudy = {
  id: string,
  name: string,
  orientation?: Color,
  imported?: true,
  sections: PGNSection[]
}

export type PGNSection = {
  name: string,
  chapters: PGNSectionChapter[]
}

export type PGNSectionChapter = {
  name: string,
  pgn: Pgn
}



const reformatSectionStudyPGN = (pgns: string, id: string, study_name: string, orientation?: Color, imported?: true): PGNSectionStudy => {
  let sections: PGNSection[] = []
    Pgn.make_many(pgns).map(pgn => {
      let section: string, chapter_name: string
      if (pgn.section) {

        section = pgn.section
        chapter_name = pgn.chapter!
      } else {
        let event = pgn.event!
        ;[study_name, section, chapter_name] = event.split(':')

      }

        let ss = sections.find(_ => _.name === section)

        if (!ss) {
          sections.push(ss = {
            name: section,
            chapters: []
          })
        }

        ss?.chapters.push({
          name: chapter_name,
          pgn
        })
    })

    return {
        id,
        name: study_name,
        orientation,
        imported,
        sections
    }
}





const read_study_pgn = (id: string, study_name: string, orientation?: Color) => 
    fetch(`pgns/${id}.pgn`).then(_ => _.text()).then(_ => reformatStudyPGN(_, id, study_name, orientation))

const read_section_study_pgn = (id: string, study_name: string, orientation?: Color) => 
    fetch(`pgns/${id}.section.pgn`).then(_ => _.text()).then(_ => reformatSectionStudyPGN(_, id, study_name, orientation))

const read_imported_study_pgn = (id: string, study_name: string) => {
  let [pgn] = makePersistedNamespaced('', 'pgn.imported.' + id)
  return reformatSectionStudyPGN(pgn(), id, study_name, 'white', true)
}

class StudyRepo {

    static init = () => {
        let res = new StudyRepo()



        return res
    }


    read_section_study(id: string) {
      let { study_name, orientation, imported } = RepertoiresFixture.study_by_id(id) || RepertoiresFixture.imported_by_id(id)

      if (imported) {
        return read_imported_study_pgn(id, study_name)
      }
      return read_section_study_pgn(id, study_name, orientation)
    }

    read_study(id: string) {

        let {study_name, orientation} = RepertoiresFixture.study_by_id(id)
        return read_study_pgn(id, study_name, orientation)
    }
}


export default StudyRepo.init()


export type StudyInRepertoireCategory = {
  study_link: string,
  study_name: string,
  category: string,
  orientation?: Color
  imported?: true
}

const HardCategories: any = {
  'Openings': [
    ['Berlin Defence', 'berlin', 'white'],
    ['Slav Defense', 'slav', 'black'],
    ['London System', 'london-system', 'black'],
    ['Caro-Kann Defense', 'caro-kann', 'white'],
    ['Petroff Defense', 'petroff', 'white'],
    ['Philidor Defence', 'philidor', 'white'],
    ['Accelerated Dragon', 'accelerated-dragon', 'white'],
    ['Caro Kann', '', 'white'],
    ['Four-Knights', '', 'white'],
    ['Sicilian Defense', '', 'white'],
    ['French Defense', '', 'black'],
  ],
  'Masters': [
    ['Bobby Fischer 60 Memorable Games', '', 60],
    ['Magnus Carlsen 2023', ''],
    ['Tata Steel 2023', ''],
  ],
  'Tactics': [
    ['50 Puzzles 1600', '', 50],
    ['50 Puzzles 2000', '', 50],
    ['50 Puzzles 2200', '', 50],
  ],
  'Endgames': [
    ['100 Endgames You Must Know', ''],
    ['King and Pawn Endgames', '']
  ]
}

class _RepertoiresFixture {

  static init = () => {

    function import_hard(category: string) {

      return HardCategories[category].map((_: any) => ({
        category,
        study_name: _[0],
        study_link: _[1],
        orientation: _[3]
      }))

    }

    let res = new _RepertoiresFixture()

    res.openings = import_hard('Openings')
    res.masters = import_hard('Masters')
    res.tactics = import_hard('Tactics')
    res.endgames = import_hard('Endgames')


    res.all = [...res.openings, ...res.masters, ...res.tactics, ...res.endgames]

    res.recent = []
    res.completed = []

    res.imported = makePersistedNamespaced<StudyInRepertoireCategory[]>([], 'fixture.imported')

    return res
  }

  delete_imported_study(id: string) {
    let ii = this.imported[0]()
    ii = ii.filter(_ => _.study_link !== id)
    this.imported[1](ii)

    let [_, set_pgn] = makePersistedNamespaced('', 'pgn.imported.' + id)

    set_pgn('')



    /* https://stackoverflow.com/questions/24551578/clear-localstorage-values-with-certain-prefix */
    Object.entries(localStorage).map(
      x => x[0]
    ).filter(
      x => x.includes(`.openings.id.${id}`)
    ).map(
      x => localStorage.removeItem(x))
  }

  save_import_pgn(study_name: string, study_link: string, pgn: string) {

    let ss = reformatSectionStudyPGN(pgn, study_link, study_name, 'white', true)
    study_name = ss.name
    let ii = this.imported[0]()
    
    ii.push({
      category: 'openings',
      study_name,
      study_link,
      imported: true
    })
    this.imported[1](ii)

    let [_, set_pgn] = makePersistedNamespaced('', 'pgn.imported.' + study_link)

    set_pgn(pgn)
  }

  all!: StudyInRepertoireCategory[]
  openings!: StudyInRepertoireCategory[]
  masters!: StudyInRepertoireCategory[]
  tactics!: StudyInRepertoireCategory[]
  endgames!: StudyInRepertoireCategory[]
  recent!: StudyInRepertoireCategory[]
  completed!: StudyInRepertoireCategory[]
  imported!: Signal<StudyInRepertoireCategory[]>

  imported_by_id(id: string) {

    let _ = this.imported[0]().find(_ => _.study_link === id)!
    return _
  }



  study_by_id(id: string) {

    let _ = this.all.find(_ => _.study_link === id)!
    return _
  }

}


export const RepertoiresFixture = _RepertoiresFixture.init()
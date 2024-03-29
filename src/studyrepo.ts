import { Color } from "chessground/types"
import { Pgn } from "./chess_pgn_logic"

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

            let white = pgn.white
            let black = pgn.black

            chapter = `${white} vs ${black} at ${event}`
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

const read_study_pgn = (id: string, study_name: string, orientation?: Color) => 
    fetch(`pgns/${id}.pgn`).then(_ => _.text()).then(_ => reformatStudyPGN(_, id, study_name, orientation))


class StudyRepo {

    static init = () => {
        let res = new StudyRepo()



        return res
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
  nb_chapters: number,
  category: string,
  orientation?: Color
}

const HardCategories: any = {
  'Openings': [
    ['Slav Defense', '', 28, 'black'],
    ['Sicilian Defense', '', 11, 'white'],
    ['French Defense', '', 14, 'black'],
    ['e4 vs Minor Defenses', '', 7, 'white'],
    ['Spanish Opening', ''],
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
        nb_chapters: _[2],
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

    return res
  }


  all!: StudyInRepertoireCategory[]
  openings!: StudyInRepertoireCategory[]
  masters!: StudyInRepertoireCategory[]
  tactics!: StudyInRepertoireCategory[]
  endgames!: StudyInRepertoireCategory[]
  recent!: StudyInRepertoireCategory[]
  completed!: StudyInRepertoireCategory[]


  study_by_id(id: string) {

    let _ = this.all.find(_ => _.study_link === id)!
    return _
  }

}


export const RepertoiresFixture = _RepertoiresFixture.init()
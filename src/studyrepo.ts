import { Node, Game, PgnNodeData, parsePgn } from 'chessops/pgn'


export type PGNStudy = {
    name: string,
    chapters: PGNChapter[]
}

export type PGNChapter = {
    name: string,
    site: string,
    moves: Node<PgnNodeData>
}


const reformatStudyPGN = (pgns: Game<PgnNodeData>[], study_name: string): PGNStudy => {
    let chapters = pgns.map(pgn => {

        let moves = pgn.moves
        let site = pgn.headers.get('Site')!
        let event = pgn.headers.get('Event')!

        let chapter
        if (!event.includes(': ')) {

            let white = pgn.headers.get('White')!
            let black = pgn.headers.get('Black')!

            chapter = `${white} vs ${black} at ${event}`
        } else {
          [study_name, chapter] = event.split(': ')
        }

        return {
            name: chapter,
            site,
            moves
        }

    })
    return {
        name: study_name,
        chapters
    }
}

const read_study_pgn = (id: string, study_name: string) => 
    fetch(`pgns/${id}.pgn`).then(_ => _.text()).then(_ => reformatStudyPGN(parsePgn(_), study_name))


class StudyRepo {

    static init = () => {
        let res = new StudyRepo()



        return res
    }


    read_study(id: string) {

        let study_name = RepertoiresFixture.study_name_by_id(id)
        return read_study_pgn(id, study_name)
    }
}


export default StudyRepo.init()


export type StudyInRepertoireCategory = {
  study_link: string,
  study_name: string,
  category: string
}

const HardCategories: any = {
  'Openings': [
    ['Slav Defense', 'TCnt4Tx7'],
    ['Sicilian Defense', 'dgldIBYr'],
    ['French Defense', 'bLcOj6sO'],
    ['e4 vs Minor Defenses', 'F8wyMEli'],
    ['Spanish Opening', ''],
  ],
  'Masters': [
    ['Bobby Fischer 60 Memorable Games', 'nk2t0m1n'],
    ['Magnus Carlsen 2023', ''],
    ['Tata Steel 2023', ''],
  ],
  'Tactics': [
    ['50 Puzzles 1600', 'u1600'],
    ['50 Puzzles 2000', 'u2000'],
    ['50 Puzzles 2200', 'u2200'],
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
        study_link: _[1]
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


  study_name_by_id(id: string) {

    let _ = this.all.find(_ => _.study_link === id)!
    return _.study_name
  }

}


export const RepertoiresFixture = _RepertoiresFixture.init()
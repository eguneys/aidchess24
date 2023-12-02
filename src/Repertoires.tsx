
type StudyInRepertoireCategory = {
  study_link: string,
  study_name: string,
  category: string
}

const HardCategories: any = {
  'Openings': [
    ['Slav Defense', ''],
    ['Sicilian Defense', ''],
    ['French Defense', ''],
  ],
  'Masters': [
    ['Bobby Fischer 60 Memorable Games', ''],
    ['Magnus Carlsen 2023', ''],
    ['Tata Steel 2023', ''],
  ],
  'Tactics': [
    ['50 Puzzles 1600', ''],
    ['50 Puzzles 2000', ''],
    ['50 Puzzles 2200', ''],
  ],
  'Endgames': [
    ['100 Endgames You Must Know', ''],
    ['King and Pawn Endgames', '']
  ]
}

class RepertoiresFixture {
  static init = () => {

    function import_hard(category: string) {

      return HardCategories[category].map((_: any) => ({
        category,
        study_name: _[0],
        study_link: _[1]
      }))

    }

    let res = new RepertoiresFixture()

    res.openings = import_hard('Openings')
    res.masters = import_hard('Masters')
    res.tactics = import_hard('Tactics')
    res.endgames = import_hard('Endgames')

    res.recent = []
    res.completed = []
  }


  openings!: StudyInRepertoireCategory[]
  masters!: StudyInRepertoireCategory[]
  tactics!: StudyInRepertoireCategory[]
  endgames!: StudyInRepertoireCategory[]
  recent!: StudyInRepertoireCategory[]
  completed!: StudyInRepertoireCategory[]

}


function Repertoires() {

  console.log(new RepertoiresFixture())

  return (
    <>
      <h1>Openings</h1>
      <h1>Masters</h1>
      <h1>Tactics</h1>
      <h1>Endgames</h1>
      <h1>Recent Studies</h1>
      <h1>Completed Studies</h1>
    </>
  )
}

export default Repertoires

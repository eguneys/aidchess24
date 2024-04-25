import { For, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import './Repertoires.scss'

import { RepertoiresFixture, StudyInRepertoireCategory  } from './studyrepo'

const CategoryView = (props: { name: string, list: StudyInRepertoireCategory[]}) => {

  const navigate = useNavigate()
  return (<>
    <div class='category'>
       <h1>{props.name}</h1>
       <ul>
        <For each={props.list}>{ (item: StudyInRepertoireCategory) => 
          <Show fallback={
            <li onClick={() => navigate(`/${item.category.toLowerCase()}/${item.study_link}`)}><h3>{item.study_name}</h3></li>
          } when={item.study_link === ''}>
            <li class='soon'><h3>{item.study_name}</h3><span>Coming Soon</span></li>
          </Show>
        }</For>
       </ul>
    </div>
  </>)
}


function Repertoires() {

  let fixture = RepertoiresFixture

  const on_import_new_study = () => {
    let id = import_id_el.value
    let pgn = import_text_el.value

    import_id_el.value = ''
    import_text_el.value = ''

    if (id.length < 3 || pgn.length < 3) {
      return
    }

    let name = 'Imported Replace Here'
    RepertoiresFixture.save_import_pgn(name, id, pgn)
    window.location.reload()
  }

  let import_text_el: HTMLTextAreaElement
  let import_id_el: HTMLInputElement

  return (
    <>
      <div class='repertoires'>

        <div class='categories'>
        <CategoryView name="Openings" list={fixture.openings}/>
        <CategoryView name="Masters" list={fixture.masters}/>
        <CategoryView name="Imported" list={fixture.imported[0]()}/>
        <div class='category'>
          <h1>Import New Study</h1>
          <input ref={_ => import_id_el = _} style={`padding: 0.2em; margin: 0.2em;`} type='text' placeholder='Short Id'/>
          <p> Paste the PGN of the Study here </p>
          <div style={`display: flex; flex-flow: column; gap: 0.2em;`}>
          <textarea ref={_ => import_text_el = _} rows={10} cols={40}/>
          <button onClick={() => on_import_new_study()} style={`align-self: flex-end; padding: 1em;`}>Import</button>
          </div>
        </div>
        {/*
        <CategoryView name="Tactics" list={fixture.tactics}/>
        <CategoryView name="Endgames" list={fixture.endgames}/>
        <CategoryView name="Recent Studies" list={fixture.recent}/>
        <CategoryView name="Completed Studies" list={fixture.completed}/>
  */}
      </div>
      </div>
    </>
  )
}

export default Repertoires

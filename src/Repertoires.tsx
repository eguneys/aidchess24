import { For, Show, createSignal, useContext } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import './Repertoires.scss'
import { RepertoiresDBContext } from './components/idb_repository'

import { RepertoiresFixture, StudyInRepertoireCategory  } from './studyrepo'

const CategoryView = (props: { name: string, list: StudyInRepertoireCategory[]}) => {

  const navigate = useNavigate()
  return (<>
    <div class='category'>
       <h1>{props.name}</h1>
       <ul>
        <For each={props.list}>{ (item: StudyInRepertoireCategory) => 
          <Show fallback={
            <li onClick={() => navigate(`/${item.category.toLowerCase()}/${item.study_id}`)}><h3>{item.study_name}</h3></li>
          } when={item.study_id === ''}>
            <li class='soon'><h3>{item.study_name}</h3><span>Coming Soon</span></li>
          </Show>
        }</For>
       </ul>
    </div>
  </>)
}


function Repertoires() {

  const rdb = useContext(RepertoiresDBContext)!
  let fixture = RepertoiresFixture

  const on_import_new_study = async () => {

    let pgn



    if (show_paste_pgn()) {
      let id = import_id_el.value
      pgn = import_text_el.value

      if (id.length < 3 || id.length > 20 || pgn.length < 30) {
        return
      }

      RepertoiresFixture.save_import_pgn(id, pgn)
    } else {
      let li = import_li.value
  
  
      let m = li.match(/https:\/\/lichess.org\/study\/(\w*)\/?/)
  
      if (!m) {
        import_li.value = 'Incorrect lichess study'
        return
      }
  
      let link = m[0]
      let id = m[1]
  
      pgn = await fetch(`https://lichess.org/api/study/${id}.pgn`).then(_ => _.text())
      RepertoiresFixture.save_import_pgn(id, pgn, link)

      try {
        await rdb.import_study_from_lichess_id(id, pgn)
      } catch (e) {
        console.log(e)
      }
    }

    window.location.reload()
  }

  //let import_text_el: HTMLTextAreaElement
  //let import_id_el: HTMLInputElement
  let import_li: HTMLInputElement
  let import_text_el: HTMLTextAreaElement
  let import_id_el: HTMLInputElement

  const [show_paste_pgn, set_show_paste_pgn] = createSignal(false)

  return (
    <>
      <div class='repertoires'>

        <div class='categories'>
        <div class='category'>
          <h1>Import New Study </h1>

          <div style={`display: flex; flex-flow: column; gap: 0.2em;`}>
            <Show when={show_paste_pgn()} fallback={
              <>
              <input style={`padding: 0.2em; margin: 0.3em;`} ref={_ => import_li = _} type='text' placeholder='lichess study link'/>
              <a style={`cursor: pointer;`} onClick={() => { set_show_paste_pgn(true) }}> or Paste PGN </a>
              </>
            }>

          <input ref={_ => import_id_el = _} style={`padding: 0.2em; margin: 0.2em;`} type='text' placeholder='Short Id'/>
          <textarea placeholder="Paste Study PGN" ref={_ => import_text_el = _} rows={10} cols={40}/>
            </Show>
          <button onClick={() => on_import_new_study()} style={`align-self: flex-end; padding: 1em;`}>Import</button>
          </div>
        </div>

        <CategoryView name="Imported" list={fixture.imported[0]()}/>
        <CategoryView name="Auto Generated" list={fixture.openings}/>
        {/*<CategoryView name="Masters" list={fixture.masters}/>*/}
      </div>
      </div>
    </>
  )
}

export default Repertoires

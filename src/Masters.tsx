import { For, createSignal, createEffect, createResource, createMemo  } from 'solid-js'
import './Repertoire.css'
import { useParams } from '@solidjs/router'

import StudyRepo from './studyrepo'
import { Show } from 'solid-js'




const Progress = (props: { width: number }) => {
    return (<>
    
    <div class='progress'>
        <div class='bar' style={`width: ${props.width}%`}/>
        <h3>{`%${props.width}`}</h3>
    </div>
    </>)
}


const Repertoire = () => {

    const params = useParams()

    const [pgn] = createResource(params.id, StudyRepo.read_study)


    const [selected_chapter_name, set_selected_chapter_name] = createSignal()

    createEffect(() => {
       let name = pgn()?.chapters[0].name

       set_selected_chapter_name(name)
    })

    const selected_chapter = 
    createMemo(() => pgn()?.chapters.find(_ => _.name === selected_chapter_name()))

    return (<>
    <div class='repertoire'>

      <Show when={!pgn.loading} fallback={"Loading..."}>

      <div class='list-wrap'>
      <h1 class='header'>Masters</h1>
      <div class='list'>


        <div><h3 class='title'>{pgn()!.name}</h3><Progress width={30}/></div>
        <ul>
            <For each={pgn()!.chapters}>{ chapter =>
              <li onClick={() => set_selected_chapter_name(chapter.name)} class={selected_chapter_name() === chapter.name ? 'active': ''}><div><h3>{chapter.name}</h3> <Progress width={0}/></div></li>
            }</For>
        </ul>
      </div>
      </div>

      </Show>


      <Show when={selected_chapter()}>{chapter => 
        <>
        <div class='board-wrap'>
  
        </div>
        <div class='replay-wrap'>
  
          <div class='replay-header'>
            <div class='title'>
                <h5>{pgn()!.name}</h5>
                <h4>{chapter().name}</h4>
            </div>
            <h3 class='lichess'><a target="_blank" href={chapter().site}>lichess</a></h3>
          </div>
  
          <div class='replay'>
          
          </div>
        </div>
  
        </>
      }</Show>
    </div>


    </>)
}


export default Repertoire
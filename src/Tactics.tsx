import { For, createSignal, createEffect, createResource, createMemo  } from 'solid-js'
import './Repertoire.css'
import { useParams } from '@solidjs/router'

import StudyRepo from './studyrepo'
import { Show } from 'solid-js'



const ProgressOutOf = (props: { width: number, nb: number }) => {
    return (<>
    
    <div class='progress'>
        <div class='bar' style={`width: ${(props.width/props.nb) * 100}%`}/>
        <h3>{`${props.width}/${props.nb}`}</h3>
    </div>
    </>)
}




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
      <h1 class='header'>Tactics</h1>
      <div class='list'>
        <div><h3 class='title'>{pgn()!.name}</h3><ProgressOutOf width={3} nb={10}/></div>
        <div><p>Current Run</p><ProgressOutOf width={3} nb={50}/></div>
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
                <h4>3/50</h4>
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
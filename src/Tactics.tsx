import { createSignal, createEffect, createResource, createMemo  } from 'solid-js'
import './Repertoire.css'
import { useParams } from '@solidjs/router'

import StudyRepo from './studyrepo'
import { Show } from 'solid-js'
import Chesstree from './Chesstree'
import Chessboard from './Chessboard'
import { Shala } from './Shalala'



const ProgressOutOf = (props: { width: number, nb: number }) => {
    return (<>
    
    <div class='progress'>
        <div class='bar' style={`width: ${(props.width/props.nb) * 100}%`}/>
        <h3>{`${props.width}/${props.nb}`}</h3>
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

    let shalala = new Shala()

    const onWheel = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName !== 'PIECE' &&
        target.tagName !== 'SQUARE' &&
        target.tagName !== 'CG-BOARD'
      )
        return;
      e.preventDefault();
      shalala.set_on_wheel(Math.sign(e.deltaY))

    }

    return (<>
    <div onWheel={onWheel} class='repertoire'>

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
              <Chessboard
                doPromotion={shalala.promotion}
                onMoveAfter={shalala.on_move_after}
                fen_uci={shalala.fen_uci}
                color={shalala.turnColor}
                dests={shalala.dests} />

        </div>
        <div class='replay-wrap'>
  
          <div class='replay-header'>
            <div class='title'>
                <h5>{pgn()!.name}</h5>
                <h4>3/50</h4>
            </div>
            <h3 class='lichess'><a target="_blank" href={`https://lichess.org/training/${chapter().pgn.puzzle}`}>lichess</a></h3>
          </div>
  
          <div class='replay'>
            <div class='replay-v'>
              <Chesstree pgn={chapter().pgn} on_wheel={shalala.on_wheel} add_uci={shalala.add_uci} on_set_fen_uci={shalala.on_set_fen_uci}/>
            </div>
          </div>
        </div>
  
        </>
      }</Show>
    </div>


    </>)
}


export default Repertoire
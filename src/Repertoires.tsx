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

  return (
    <>
      <div class='repertoires'>
        <CategoryView name="Openings" list={fixture.openings}/>
        <CategoryView name="Masters" list={fixture.masters}/>
        <CategoryView name="Tactics" list={fixture.tactics}/>
        <CategoryView name="Endgames" list={fixture.endgames}/>
        <CategoryView name="Recent Studies" list={fixture.recent}/>
        <CategoryView name="Completed Studies" list={fixture.completed}/>
      </div>
    </>
  )
}

export default Repertoires

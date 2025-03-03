import { A, useNavigate } from '@solidjs/router'
import './List.scss'
import { StudiesDBContext, StudiesDBProvider } from '../../components/sync_idb_study'
import { createEffect, createResource, For, Show, Suspense, useContext } from 'solid-js'
import { Study } from '../../components/StudyComponent'

export default () => {
    return (<>
    <StudiesDBProvider>
        <ListComponent />
    </StudiesDBProvider>
    </>)
}


const ListComponent = () => {

    let db = useContext(StudiesDBContext)!

    let navigate = useNavigate()

    const on_new_opening = async () => {
        let study = await db.new_study()

        navigate('/openings/' + study.id)
    }

    let [studies] = createResource(() => db.light_list_studies())

    const on_click_study = (study: Study) => {
        navigate('/openings/' + study.id)
    }

    return (<>
    <main class="openings-list">
        <div class='tools'>
            <button onClick={() => on_new_opening()} class='new'><i data-icon=""></i> New Opening Repertoire</button>
        </div>
        <div class='tabs'>
        </div>
        <div class='list'>
            <Suspense fallback={
                <div class='loading'>Loading your openings..</div>}
                >
            <For each={studies()} fallback={
                <div class='no-studies'>
                    <h4>No Openings here yet.</h4>
                    <p>Try importing a lichess study.</p>
                    <p>Or build an opening repertoire using 
                        <A href='/builder'>Builder</A> feature</p>
                </div>
            }>{study => 
                <div class='study'>
              <h3 onClick={() => on_click_study(study)} class='title'>{study.name}</h3>
              <div class='sections'>
                <Show when={study.sections.length === 1} fallback={
                    <For each={study.sections}>{ section => 
                        <div class='section'><i data-icon=""></i><span class='title'>{section.name}</span></div>
                    }</For>
                }>
                    <div class='section'>
                      <div class='chapters'>
                        <For each={study.sections[0].chapters}>{ chapter => 
                            <div class='chapter'><i data-icon=""></i>{chapter.name}</div>
                        }</For>
                      </div>
                    </div>
                </Show>
              </div>
              </div>
            }</For>
            </Suspense>
        </div>
    </main>
    </>)
}
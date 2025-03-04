import { A, useNavigate } from '@solidjs/router'
import './List.scss'
import { StudiesDBContext, StudiesDBProvider } from '../../components/sync_idb_study'
import { createResource, createSignal, For, Show, Suspense, useContext } from 'solid-js'
import { Study } from '../../components/StudyComponent'
import annotate_png from '../../assets/images/annotate.png'
import compact_png from '../../assets/images/compact.png'

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

    const [tab, set_tab] = createSignal('mine')

    return (<>
    <main class="openings-list">
        <aside class='subnav'>
            <nav>
                <a onClick={() => set_tab('mine')} class={'mine' + (tab() === 'mine' ? ' active': '')}>My Openings</a>
                <a onClick={() => set_tab('featured')} class={'featured' + (tab() === 'featured' ? ' active': '')}>Featured</a>
                <a onClick={() => set_tab('help')} class={'help' + (tab() === 'help' ? ' active': '')}><i data-icon=""></i>Help</a>
            </nav>
        </aside>
        <div class='content'>
            <Show when={tab()==='help'}>
                <Help/>
            </Show>
            <Show when={tab()==='featured'}>
                <h3 class='featured'> Featured Openings </h3>
                <p class='featured'>If you want to feature your openings here, please <A href='/contact'>contact me</A>.</p>
            </Show>
            <Show when={tab()==='mine'}>
                <div class='tools'>
                    <button onClick={() => on_new_opening()} class='new'><i data-icon=""></i> New Opening Repertoire</button>
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
                      <h3 onClick={() => on_click_study(study)} class='title'><i data-icon=""></i>{study.name}</h3>
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
        </Show>
        </div>
    </main>
    </>)
}


function Help() {
    return (<>
    <div class='help'>
        <h2>Openings Feature</h2>
        <p>
            A learning tool to save your opening lines. Similar to, but a little more flexible than, lichess studies.
        </p>
        <h3> Annotate Positions </h3>
        <p>
            <img alt="annotate positions" src={annotate_png}></img>
        </p>
        <h3> Compact View of variations </h3>
        <p>
            <img alt="compact variations" src={compact_png}></img>
        </p>
        <h3> Local First </h3>
        <p>
            Everything is saved on your computer locally, no cloud involved. Also no collaboration features.
        </p>

    </div>
    </>)
}
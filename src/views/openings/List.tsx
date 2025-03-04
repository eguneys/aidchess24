import { A, useNavigate } from '@solidjs/router'
import './List.scss'
import { StudiesDBContext, StudiesDBProvider } from '../../components/sync_idb_study'
import { createResource, createSignal, For, Show, Suspense, useContext } from 'solid-js'
import { Study } from '../../components/StudyComponent'
import annotate_png from '../../assets/images/annotate.png'
import compact_png from '../../assets/images/compact.png'
import sections_png from '../../assets/images/sections.png'
import import_lichess_png from '../../assets/images/importlichess.png'

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

    let auto_studies = () => []
    let featured_studies = () => []

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
                <a onClick={() => set_tab('auto')} class={'auto' + (tab() === 'auto' ? ' active': '')}>Auto Generated</a>
                <a onClick={() => set_tab('help')} class={'help' + (tab() === 'help' ? ' active': '')}><i data-icon=""></i>Help</a>
            </nav>
        </aside>
        <div class='content'>
            <Show when={tab()==='help'}>
                <Help/>
            </Show>
            <Show when={tab()==='featured'}>
                <h3 class='featured'> Featured Openings </h3>
                <small class='featured'>If you want to feature your openings here, please <A href='/contact'>contact here</A>.</small>
                <div class='list'>
                    <Suspense fallback={
                        <div class='loading'>Loading featured openings..</div>}
                        >
                    <For each={featured_studies()} fallback={
                        <div class='no-studies'>
                            <p>No Openings listed here yet. Likely to be coming soon.</p>
                            <a onClick={() => set_tab('mine')}>Meanwhile create your own opening, or import a lichess study.</a>
                        </div>
                    }>{study => 
                        <StudyListItem study={study} on_click_study={() => on_click_study(study)}/>
                    }</For>
                    </Suspense>
                </div>
            </Show>
            <Show when={tab()==='auto'}>
                <h3 class='auto'> Auto Generated Openings </h3>
                <small class='auto'>Openings listed below are compiled via programmatically selecting moves from Master's Games.</small>
                <div class='list'>
                    <Suspense fallback={
                        <div class='loading'>Loading auto generated openings..</div>}
                        >
                    <For each={auto_studies()} fallback={
                        <div class='no-studies'>
                            <p>No Openings listed here yet. Likely to be coming soon.</p>
                            <a onClick={() => set_tab('mine')}>Meanwhile create your own opening, or import a lichess study.</a>
                        </div>
                    }>{study => 
                        <StudyListItem study={study} on_click_study={() => on_click_study(study)}/>
                    }</For>
                    </Suspense>
                </div>
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
                            <p>No Openings here yet.</p>
                            <p>Try importing a lichess study.</p>
                            <p>Or build an opening repertoire using 
                                <A href='/builder'>Builder</A> feature</p>
                        </div>
                    }>{study => 
                        <StudyListItem study={study} on_click_study={() => on_click_study(study)}/>
                    }</For>
                    </Suspense>
                </div>
        </Show>
        </div>
    </main>
    </>)
}

function StudyListItem(props: { study: Study, on_click_study: () => void }) {

    return (
        <div onClick={() => props.on_click_study()} class='study'>
            <h3 class='title'><i data-icon=""></i>{props.study.name}</h3>
            <div class='sections'>
                <Show when={props.study.sections.length === 1} fallback={
                    <For each={props.study.sections}>{section =>
                        <div class='section'><i data-icon=""></i><span class='title'>{section.name}</span></div>
                    }</For>
                }>
                    <div class='section'>
                        <div class='chapters'>
                            <For each={props.study.sections[0].chapters}>{chapter =>
                                <div class='chapter'><i data-icon=""></i>{chapter.name}</div>
                            }</For>
                        </div>
                    </div>
                </Show>
            </div>
        </div>
    )
}


function Help() {
    return (<>
    <div class='help'>
        <h2>Openings Feature</h2>
        <p>
            A learning tool to save your opening lines. Similar to, but a little more flexible than, lichess studies.
        </p>
        <h3> Import a Lichess Study </h3>
        <p>
            <img alt="import lichess study" src={import_lichess_png}></img>
        </p>
        <h3> Annotate Positions </h3>
        <p>
            <img alt="annotate positions" src={annotate_png}></img>
        </p>
        <h3> Compact View of variations with ease of navigation </h3>
        <p>
            <img alt="compact variations" src={compact_png}></img>
        </p>
        <h3> Chapters are further grouped into Sections </h3>
        <p>
            <img alt="chapters into sections" src={sections_png}></img>
        </p>
        <h3> Local First </h3>
        <p>

            Everything is saved on your computer locally, no cloud involved. Oh, also no collaboration features.
            <br/>
           <small>Warning: Your data may be volatile and susceptiple to loss by clearing your browser data. We still recommend using lichess studies as backup. </small>
         </p>
         <h3>
            Export to Lichess Studies
         </h3>
         <p>
            You can export your completed study as a Lichess study with one click. We recommend using this feature only once when you have completed editing your study.
            <br/>
            <small>Please note that this action requires you to authenticate your Lichess account to this website.</small>
            <br/>
            <small>If your study contains more than 64 chapters they will be departed into multiple studies.</small>
         </p>
    </div>
    </>)
}
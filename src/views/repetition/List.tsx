import { createEffect, createMemo, createSelector, For, Show, Suspense } from "solid-js"
import './List.scss'
import { A, useNavigate } from "@solidjs/router"
import { usePersistedStore, useStore } from "../../store"
import { EntitySectionId } from "../../store/sync_idb_study"
import { unwrap } from "solid-js/store"

export type RepeatShowType = 'first-ten' | 'ten-twenty' | 'twenty-plus' | 'white' | 'black'

export default () => {
    return (<>
        <ListComponent />
    </>)
}

function ListComponent() {

    let navigate = useNavigate()
    const navigate_show = (type: RepeatShowType) => {
        //navigate('/repetition/' + repeat_study()!.study_id + '?filter=' + type)
    }

    let [store, { load_studies, load_chapters }] = useStore()
    let [pstore, { 
        set_repeat_selected_study,
        toggle_repeat_study_section
    }] = usePersistedStore()

    load_studies('mine')

    const repeat_study = () => undefined
    const studies = () => Object.values(store.studies)
    const sections = () => {
        if (!pstore.repeat_selected_study_id) {
            return undefined
        } 
        let study = store.studies[pstore.repeat_selected_study_id]

        if (!study) {
            return undefined
        }

        return study.section_ids.map(id => study.sections.find(_ => _.id === id)!)
    }

    const isSelectedStudy = createSelector(() => pstore.repeat_selected_study_id)
    const isSelectedSection = (id: EntitySectionId) => pstore.selected_section_ids[pstore.repeat_selected_study_id!]?.includes(id)

    const selected_sections = createMemo(() => sections()?.filter(_ => isSelectedSection(_.id)) ?? [])
    const selected_section_ids = createMemo(() => selected_sections().map(_ => _.id))


    const all_chapters_selected = () => store.chapters.list.filter(_ => selected_section_ids().includes(_.section_id))

    createEffect(() => {
        selected_section_ids().forEach(_ => load_chapters(_))
    })

    return (<>
    <main class='repetition'>
        <div class='studies-list'>
            <div class='header'>
                <h3>Select an Opening</h3>
            </div>
            <div class='list'>
            <For each={studies()} fallback={
                <div class='no-study'>No openings here. 
                <A href="/openings">Build some openings first.</A></div>
            }>{ study =>
              <div onClick={() => set_repeat_selected_study(isSelectedStudy(study.id) ? undefined : study.id)} class={'study'}
              classList={{active: isSelectedStudy(study.id)}} >{study.name}</div>
            }</For>
            </div>
        </div>
        <div class='sections-list-multiple'>
            <div class='header'>
            <h3>Select multiple Sections</h3>
            </div>
            <div class='list'>
            <For each={sections()} fallback={
                <div class='no-section'>
                    No sections to show.
                    Select some openings first.
                </div>
            }>{ section =>
              <div onClick={() => toggle_repeat_study_section(section.id)} class='section' 
              classList={{selected: isSelectedSection(section.id)}}>{section.name}</div>
            }</For>
            </div>
        </div>
        <div class='repeat-info'>
            <Suspense fallback={<div class='loading'>Loading...</div>}>
            <div class='header'>
                <h4>Selected <span class='number'>{selected_sections().length}</span> sections</h4>
                <h4>Total <span class='number'>{all_chapters_selected().length}</span>  chapters </h4>
            </div>
            <div class='content'>
                <Show when={repeat_study()?.sections.length > 0} fallback={
                    <div class='no-selected-sections'>Please select some sections.</div>
                }>
                    <>
                        <h4> Memorize due moves through Spaced Repetition </h4>
                        <div class='filler'></div>
                        <div class='dues'>
                            <button onClick={() => navigate_show('first-ten')}><span>First 10 moves</span><span class='due'>Due: <Suspense fallback={'..'}>{due_first_ten()?.length??'..'}</Suspense></span></button>
                            <button onClick={() => navigate_show('ten-twenty')}><span>10-20 moves</span><span class='due'>  Due: <Suspense fallback={'..'}>{due_ten_twenty()?.length??'..'}</Suspense></span></button>
                            <button onClick={() => navigate_show('twenty-plus')}><span>20+ moves</span><span class='due'>   Due: <Suspense fallback={'..'}>{due_twenty_plus()?.length??'..'}</Suspense></span></button>
                            <button onClick={() => navigate_show('white')}><span>White moves</span><span class='due'>       Due: <Suspense fallback={'..'}>{due_white()?.length??'..'}</Suspense></span></button>
                            <button onClick={() => navigate_show('black')}><span>Black moves</span><span class='due'>       Due: <Suspense fallback={'..'}>{due_black()?.length??'..'}</Suspense></span></button>
                        </div>
                    </>
                </Show>
            </div>
            </Suspense>
        </div>
    </main>
    </>)

}
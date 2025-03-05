import { createEffect, createMemo, createResource, For, on, Show, Suspense, useContext } from "solid-js"
import { StudiesDBContext, StudiesDBProvider } from "../../components/sync_idb_study"
import './List.scss'
import { A, useNavigate } from "@solidjs/router"
import { Section } from "../../components/StudyComponent"
import { makePersistedNamespaced } from "../../storage"

export type RepeatShowType = 'first-ten' | 'ten-twenty' | 'twenty-plus' | 'white' | 'black'

export default () => {
    return (<>
    <StudiesDBProvider>
        <ListComponent />
    </StudiesDBProvider>
    </>)
}

function ListComponent() {
    let db = useContext(StudiesDBContext)!

    let [studies] = createResource(() => db.list_studies_with_sections())

    const [i_selected_study, set_i_selected_study] = makePersistedNamespaced(0, 'repetition.i_selected_study')

    const selected_study = createMemo(() => studies()?.[i_selected_study()])

    const sections = createMemo(() => selected_study()?.sections ?? [])

    let [repeat_study] = createResource(() => selected_study()?.id, (study_id) => {
        return db.get_or_new_repeat_study(study_id)
    })

    let selected_section_ids = createMemo(() => repeat_study()?.section_ids)

    const is_section_selected = (s: Section) => {
        return selected_section_ids()?.includes(s.id)
    }

    const select_section = (s: Section) => {
        let r = repeat_study()
        if (!r) {
            return
        }

        r.toggle_section(s)
    }

    createEffect(on(repeat_study, r => {
        if (!r) {
            return
        }
        r.create_effects_listen_and_save_db(db)
        r.create_effects_listen_load_db(db)
    }))



    let navigate = useNavigate()
    const navigate_show = (type: RepeatShowType) => {
        navigate('/repetition/' + repeat_study()!.study_id + '?filter=' + type)
    }

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
            }>{ (study, i) =>
              <div onClick={() => set_i_selected_study(i())} class={'study' + (i_selected_study() === i() ? ' active': '')}>{study.name}</div>
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
              <div onClick={() => select_section(section)} class={'section' + (is_section_selected(section) ? ' selected' : '')}>{section.name}</div>
            }</For>
            </div>
        </div>
        <div class='repeat-info'>
            <Suspense fallback={<div class='loading'>Loading...</div>}>
            <div class='header'>
                <h4>Selected <span class='number'>{repeat_study()?.sections.length}</span> sections</h4>
                <h4>Total <span class='number'>{repeat_study()?.all_chapters.length}</span>  chapters </h4>
            </div>
            <div class='content'>
                <Show when={repeat_study()?.sections.length === 0} fallback={
                    <>
                        <h4> Memorize due moves through Spaced Repetition </h4>
                        <div class='filler'></div>
                        <div class='dues'>
                            <button onClick={() => navigate_show('first-ten')}><span>First 10 moves</span><span class='due'>Due: {repeat_study()?.due_first_ten.length}</span></button>
                            <button onClick={() => navigate_show('ten-twenty')}><span>10-20 moves</span><span class='due'>Due: {repeat_study()?.due_ten_twenty.length}</span></button>
                            <button onClick={() => navigate_show('twenty-plus')}><span>20+ moves</span><span class='due'>Due: {repeat_study()?.due_twenty_plus.length}</span></button>
                            <button onClick={() => navigate_show('white')}><span>White moves</span><span class='due'>Due: {repeat_study()?.due_white.length}</span></button>
                            <button onClick={() => navigate_show('black')}><span>Black moves</span><span class='due'>Due: {repeat_study()?.due_black.length}</span></button>
                        </div>
                    </>
                }>
                    <div class='no-selected-sections'>Please select some sections.</div>
                </Show>
            </div>
            </Suspense>
        </div>
    </main>
    </>)

}
import { createComputed, createMemo, createSelector, For, Show, Suspense } from "solid-js"
import './List.scss'
import { A, useNavigate, useSearchParams } from "@solidjs/router"
import { usePersistedStore, useStore } from "../../store"
import { EntitySectionId, EntityStudyId, ModelChapter, ModelRepeatDueMove, ModelRepeatMoveAttempt, ModelSection, ModelStudy, StudiesPredicate } from "../../store/sync_idb_study"
import { fen_turn, Step } from "../../store/step_types"

export type RepeatShowType = 'first-ten' | 'ten-twenty' | 'twenty-plus' | 'white' | 'black'

export default () => {
    return (<>
        <ListComponent />
    </>)
}


function attempt_is_due(attempt: ModelRepeatMoveAttempt) {
    return attempt.card.due.getTime() < new Date().getTime()
}

function is_step_first_ten(step: Step) {
    return step.ply <= 20
}
function is_step_ten_twenty(step: Step) {
    return step.ply > 20 && step.ply <= 40
}
function is_step_twenty_plus(step: Step) {
    return step.ply > 40
}
function is_step_white(step: Step) {
    return fen_turn(step.before_fen) === 'white'
}
function is_step_black(step: Step) {
    return fen_turn(step.before_fen) === 'black'
}








type ComputedRepeatProps = {
    selected_study_id: EntityStudyId | undefined,
    isSelectedStudy: (_: EntityStudyId) => boolean
    isSelectedSection: (_: EntitySectionId) => boolean
    study: ModelStudy | undefined,
    studies: ModelStudy[]
    sections: ModelSection[] | undefined
    selected_sections: ModelSection[]
    selected_section_ids: EntitySectionId[]
    all_chapters_selected: ModelChapter[]


    all_first_ten: ModelRepeatDueMove[]
    all_ten_twenty: ModelRepeatDueMove[]
    all_twenty_plus: ModelRepeatDueMove[]
    all_white: ModelRepeatDueMove[]
    all_black: ModelRepeatDueMove[]

    due_first_ten: ModelRepeatDueMove[]
    due_ten_twenty: ModelRepeatDueMove[]
    due_twenty_plus: ModelRepeatDueMove[]
    due_white: ModelRepeatDueMove[]
    due_black: ModelRepeatDueMove[]
}

export function createRepeatProps(): ComputedRepeatProps {
    let [store] = useStore()
    let [pstore] = usePersistedStore()

    const studies = createMemo(() => Object.values(store.studies))
    const sections = createMemo(() => {
        if (!pstore.repeat_selected_study_id) {
            return undefined
        } 
        let study = store.studies[pstore.repeat_selected_study_id]

        if (!study) {
            return undefined
        }

        return study.section_ids.map(id => study.sections.find(_ => _.id === id)!)
    })



    const selected_study_id = createMemo(() => pstore.repeat_selected_study_id)
    const isSelectedStudy = createSelector(() => pstore.repeat_selected_study_id)
    const isSelectedSection = (id: EntitySectionId) => pstore.selected_section_ids[pstore.repeat_selected_study_id!]?.includes(id)

    const selected_sections = createMemo(() => sections()?.filter(_ => isSelectedSection(_.id)) ?? [])
    const selected_section_ids = createMemo(() => selected_sections().map(_ => _.id))

    const study = createMemo(() => { 
        let study_id = selected_study_id() 
        if (!study_id) {
            return undefined
        }
        return store.studies[study_id] 
    })

    const all_chapters_selected = createMemo(() => store.chapters.list.filter(_ => selected_section_ids().includes(_.section_id)))



    const all = createMemo<ModelRepeatDueMove[]>(() => store.due_moves.list)
    const due_all = createMemo<ModelRepeatDueMove[]>(() => store.due_moves.list.filter(_ => !_.attempts[0] || attempt_is_due(_.attempts[0])))

    return {
        isSelectedStudy,
        isSelectedSection,
        get selected_study_id() {
            return selected_study_id()
        },
        get study() {
            return study()
        },
        get studies() {
            return studies()
        },
        get sections() {
            return sections()
        },
        get selected_sections() {
            return selected_sections()
        },
        get selected_section_ids() {
            return selected_section_ids()
        },
        get all_chapters_selected() {
            return all_chapters_selected()
        },
        get due_first_ten() {
            return due_all().filter(_ => is_step_first_ten(_.tree_step_node.step))
        },
        get due_ten_twenty() {
            return due_all().filter(_ => is_step_ten_twenty(_.tree_step_node.step))
        },
        get due_twenty_plus() {
            return due_all().filter(_ => is_step_twenty_plus(_.tree_step_node.step))
        },
        get due_white() {
            return due_all().filter(_ => is_step_white(_.tree_step_node.step))
        },
        get due_black() {
            return due_all().filter(_ => is_step_black(_.tree_step_node.step))
        },
        get all_first_ten() {
            return all().filter(_ => is_step_first_ten(_.tree_step_node.step))
        },
        get all_ten_twenty() {
            return all().filter(_ => is_step_ten_twenty(_.tree_step_node.step))
        },
        get all_twenty_plus() {
            return all().filter(_ => is_step_twenty_plus(_.tree_step_node.step))
        },
        get all_white() {
            return all().filter(_ => is_step_white(_.tree_step_node.step))
        },
        get all_black() {
            return all().filter(_ => is_step_black(_.tree_step_node.step))
        }
    }
}

function ListComponent() {

    let [, { load_studies, load_chapters_for_sections, load_due_moves }] = useStore()
    let [, { 
        set_repeat_selected_study,
        toggle_repeat_study_section
    }] = usePersistedStore()


    let r_props = createRepeatProps()
    const handle_load_chapters = () => {
        load_chapters_for_sections(r_props.selected_section_ids)
    }
    const handle_load_due_moves = () => {
        let study_id = r_props.selected_study_id
        let section_ids = r_props.selected_section_ids

        if (study_id && section_ids.length > 0) {
            load_due_moves(study_id, section_ids)
        }
    }

    type Tab = StudiesPredicate
    let [params, set_params] = useSearchParams()

    const tab = createMemo<Tab>(() => params.filter as Tab ?? 'mine')

    const set_tab = (tab: Tab) => {
        set_params({ filter: tab })
    }

    const get_predicate = createMemo(() => {
        let res = tab()
        if (res === 'mine') {
            return res
        }
        if (res === 'featured') {
            return res
        }
        if (res === 'auto') {
            return res
        }
        return 'mine'
    })

    createComputed(() => load_studies(get_predicate()))
    createComputed(handle_load_chapters)
    createComputed(handle_load_due_moves)

   
   
    const handle_toggle_section_id = (id: EntitySectionId) => {
        toggle_repeat_study_section(id)

        handle_load_chapters()
        handle_load_due_moves()
    }


    let navigate = useNavigate()
    const navigate_show = (type: RepeatShowType) => {
        navigate('/repetition/' + r_props.selected_study_id + '?filter=' + type)
    }

    const isActive = createSelector(tab)


    return (<>
    <main class='repetition'>
        <div class='studies-list'>
            <div class='header'>
                <h3>Select an Opening</h3>
            </div>
            <div class='filter'>
                <label for="filter">Filter: </label>
                <select onChange={e => set_tab(e.target.value as Tab)} id="filter">
                    <option value="mine" id="mine" selected={isActive('mine')}>My Openings</option>
                    <option value="featured" id="featured" selected={isActive('featured')}>Featured Openings</option>
                </select>
            </div>
            <div class='list'>
            <For each={r_props.studies} fallback={
                <div class='no-study'>No openings here. 
                <A href="/openings">Build some openings first.</A></div>
            }>{ study =>
              <div onClick={() => set_repeat_selected_study(r_props.isSelectedStudy(study.id) ? undefined : study.id)} class={'study'}
              classList={{active: r_props.isSelectedStudy(study.id)}} >{study.name}</div>
            }</For>
            </div>
        </div>
        <div class='sections-list-multiple'>
            <div class='header'>
            <h3>Select multiple Sections</h3>
            </div>
            <div class='list'>
            <For each={r_props.sections} fallback={
                <div class='no-section'>
                    No sections to show.
                    Select some openings first.
                </div>
            }>{ section =>
              <div onClick={() => handle_toggle_section_id(section.id)} class='section' 
              classList={{selected: r_props.isSelectedSection(section.id)}}>{section.name}</div>
            }</For>
            </div>
        </div>
        <div class='repeat-info'>
            <Suspense fallback={<div class='loading'>Loading...</div>}>
            <div class='header'>
                <h4>Selected <span class='number'>{r_props.selected_sections.length}</span> sections</h4>
                <h4>Total <span class='number'>{r_props.all_chapters_selected.length}</span>  chapters </h4>
            </div>
            <div class='content'>
                <Show when={r_props.selected_sections.length > 0} fallback={
                    <>
                        <h4> Memorize due moves through Spaced Repetition </h4>
                    <div class='no-selected-sections'>Please select some sections.</div>
                    </>
                }>
                    <>
                        <h4> Memorize due moves through Spaced Repetition </h4>
                        <p> Select a due move category below to start playing. </p>
                        <div class='filler'></div>
                        <div class='dues'>
                            <button onClick={() => navigate_show('first-ten')}><span>First 10 moves</span>
                                        <span class='due'>Due: <Suspense fallback={'..'}>{r_props.due_first_ten?.length ?? '..'}</Suspense></span></button>
                            <button onClick={() => navigate_show('ten-twenty')}><span>10-20 moves</span>
                                        <span class='due'>  Due: <Suspense fallback={'..'}>{r_props.due_ten_twenty?.length ?? '..'}</Suspense></span></button>
                            <button onClick={() => navigate_show('twenty-plus')}><span>20+ moves</span>
                                        <span class='due'>   Due: <Suspense fallback={'..'}>{r_props.due_twenty_plus?.length ?? '..'}</Suspense></span></button>
                            <button onClick={() => navigate_show('white')}><span>White moves</span>
                                        <span class='due'>       Due: <Suspense fallback={'..'}>{r_props.due_white?.length ?? '..'}</Suspense></span></button>
                            <button onClick={() => navigate_show('black')}><span>Black moves</span>
                                        <span class='due'>       Due: <Suspense fallback={'..'}>{r_props.due_black?.length ?? '..'}</Suspense></span></button>
                        </div>
                    </>
                </Show>
            </div>
            </Suspense>
        </div>
    </main>
    </>)

}
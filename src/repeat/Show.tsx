import { JSX, children, createSignal, Show, createMemo, For, createResource, useContext, createEffect } from 'solid-js'
import './Show.scss'
import StudyRepo, { RepertoiresFixture } from '../studyrepo'
import { A, useNavigate } from '@solidjs/router'
import { RepeatsDbContext } from './repeats_context'
import { createDexieArrayQuery } from './solid-dexie'
import { DueFilterKey, DueFilters, LightRepeat, NewRepeatWithMoves } from './types'


export default () => {
    return (<>
        <WithProvider />
    </>)
}


const WithProvider = () => {

    const [create_repeat_dialog, set_create_repeat_dialog] = createSignal(false)

    const on_open_create_repeat = () => {
        set_create_repeat_dialog(true)
    }

    const db = useContext(RepeatsDbContext)!
    const repeats = createDexieArrayQuery(() => db.get_light_repeats())
    const [i_selected_repeat, set_i_selected_repeat] = createSignal(0)

    const selected_repeat = createMemo(() => repeats[i_selected_repeat()])
    const [selected_repeat_with_moves] = createResource(() => selected_repeat(), repeat => db.get_repeat_with_moves_by_light(repeat))

    const on_delete_repeat = () => {
        const s = selected_repeat()

        if (s) {
            db.remove_repeat(s.name)
        }

    }

    return (<>
        <div class='repeat-show'>
            <RepeatList repeats={repeats} set_i_selected_repeat={set_i_selected_repeat} i_selected_repeat={i_selected_repeat()} on_open_create_repeat={on_open_create_repeat} />
            <Show when={selected_repeat_with_moves()} fallback={<div class='show'></div>}>{repeat => 
                <RepeatShow on_delete={on_delete_repeat} repeat={repeat()} on_open_create_repeat={on_open_create_repeat} />
            }</Show>
            <Show when={create_repeat_dialog()}>
                <CreateNewRepeat onClose={() => {
                    set_create_repeat_dialog(false)
                }} />
            </Show>
        </div>
    </>)
}

class SelectStudySectionsModel {

    sections: Array<{study_id: string, section_name: string }> = []

    add_section(study_id: string, section_name: string) {
        this.sections = this.sections.filter(_ => !(_.study_id === study_id && _.section_name === section_name))
        this.sections.push({study_id, section_name})
    }

    remove_section(study_id: string, section_name: string) {
        this.sections = this.sections.filter(_ => !(_.study_id === study_id && _.section_name === section_name))
    }

    has(study_id: string, section_name: string) {
        return !!this.sections.find(_ => _.study_id === study_id && _.section_name === section_name)
    }

}

const CreateNewRepeat = (props: { onClose: () => void }) => {

    const studies = createMemo(RepertoiresFixture.imported[0])

    const [i_selected_study, set_i_selected_study] = createSignal(0)
    const selected_study = createMemo(() => studies()[i_selected_study()])
    const selected_study_id = createMemo(() => selected_study()?.study_id)

    const [sections] = createResource(() => selected_study()?.study_id, (id) => 
        StudyRepo.read_section_study(id)
    )

    const model = new SelectStudySectionsModel()

    const on_checked = (section_name: string, is_checked: boolean) => {
        if (is_checked) {
            model.add_section(selected_study_id(), section_name)

            if ($el_name.value === '') {
                $el_name.value = section_name
            }

        } else {
            model.remove_section(selected_study_id(), section_name)
            if ($el_name.value === section_name) {
                $el_name.value = ''
            }
        }
    }

    let $el_name: HTMLInputElement
    const repeat_name = () => $el_name.value

    const [track_section_checks, set_track_section_checks] = createSignal(undefined, { equals: false })

    const select_all = () => {
        sections()?.sections.map(_ => _.name).forEach(name => model.add_section(selected_study_id(), name))
        set_track_section_checks()
    }

    const is_section_checked = (section_name: string) => {
        track_section_checks()
        return model.has(selected_study_id(), section_name)
    }

    const db = useContext(RepeatsDbContext)!

    const on_save = () => {
        let name = repeat_name()

        if (!name || name.length < 3) {
            return
        }

        let new_repeat = { id: -1, name, sections: model.sections }


        db.add_repeat(new_repeat)

        props.onClose()
    }

    return (<>
        <Dialog onClose={props.onClose}>
            <div class='new-repeat'>
                <h3>Create a New Repeat</h3>
                <input ref={_ => $el_name = _} type='text' placeholder="Repeat Name"/>
                <div class='study-list'>
                    <h3>Studies</h3>
                    <div class='list'>
                <For each={studies()} fallback={
                    <div class='none'>
                  <A href='/repertoires'>Import some studies first</A>
                    </div>
                }>{ (study, i) => 
                    <div class={i_selected_study() === i() ? 'study active': 'study'} onClick={() => set_i_selected_study(i())}>{study.study_name}</div>
                }</For>
                </div>
                </div>
                <div class='section-list'>
                    <h3>Sections</h3>
                    <div class='controls'>
                        <button onClick={() => select_all()}>Select All</button>
                    </div>
                    <div class='list'>
                    <Show when={sections()}>{ sections => 
                        <For each={sections().sections} fallback={
                            <p>Select a Study</p>
                        }>{ section => 
                            <div class='section'>
                                <input onChange={e => on_checked(section.name, e.target.checked)} id={section.name} checked={is_section_checked(section.name)} type='checkbox'/>
                                <label for={section.name}>{section.name}</label>
                                </div>
                        }</For>
                    }</Show>
                    </div>
                </div>
                <button onClick={on_save} class='save'> Save </button>
            </div>
        </Dialog>
    </>)
}

const Dialog = (props: { onClose: () => void, children: JSX.Element }) => {

    const c = children(() => props.children)
    return (<>
    <div class='dialog'>
            <div onClick={props.onClose} class='overlay'></div>
            <div class='content'>
                {c()}
            </div>
    </div>
    </>)
}


const RepeatList = (props: { repeats: LightRepeat[], set_i_selected_repeat: (_: number) => void, i_selected_repeat: number, on_open_create_repeat: () => void }) => {


    const repeats = createMemo(() => props.repeats)
    return (<div class='list-wrap'>
        <h3>Repeats</h3>
        <div class='list'>
            <For each={repeats()}>{ (repeat, i) =>
                <div onClick={() => props.set_i_selected_repeat(i())} class={'repeat' + (i() === props.i_selected_repeat ? ' active' : '')}>{repeat.name}</div>
            }</For>

        </div>
        <button onClick={props.on_open_create_repeat}>Create a New Repeat</button>
    </div>)
}

const RepeatShow = (props: { repeat: NewRepeatWithMoves, on_delete: () => void, on_open_create_repeat: () => void }) => {

    const repeat = createMemo(() => props.repeat)

    const due_filters = createMemo(() => new DueFilters(repeat()))

    const nb_total = createMemo(() => due_filters().total.length)
    const nb_due = createMemo(() => due_filters().due.length)

    const nb_due_white = createMemo(() => due_filters().due_white.length)
    const nb_due_black = createMemo(() => due_filters().due_black.length)
    const nb_due_10 = createMemo(() => due_filters().due_10.length)
    const nb_due_10_20 = createMemo(() => due_filters().due_10_20.length)
    const nb_due_20plus = createMemo(() => due_filters().due_20plus.length)

    const navigate = useNavigate()

    const on_play_due = (filter?: DueFilterKey) => {
        let id = repeat().id

        navigate('/repeat/' + id + (filter ? `?filter=${filter}` : ''))
    }

    return (<>
        <div class='show'>
            <h2>{repeat().name}</h2>
            <div class='content'>
            <div class='sections-wrap'>
            <h3>Sections</h3>
            <div class='sections'>
                <For each={repeat().sections}>{section =>
                    <div class='section'>{section.section_name}</div>
                }</For>
            </div>

                </div>
            <div class='info'>
                <small>Total Positions: {nb_total()}</small>
                <p>Total Due: {nb_due()}</p>

                <div class='buttons'>
                    <button onClick={() => on_play_due('white')}>Play Due White <span>{nb_due_white()}</span></button>
                    <button onClick={() => on_play_due('black')}>Play Due Black <span>{nb_due_black()}</span></button>
                    <button onClick={() => on_play_due('first-ten')}>Play Due First 10 moves<span>{nb_due_10()}</span></button>
                    <button onClick={() => on_play_due('ten-twenty')}>Play Due 10-20 moves <span>{nb_due_10_20()}</span></button>
                    <button onClick={() => on_play_due('twenty-plus')}>Play Due 20+ moves <span>{nb_due_20plus()}</span></button>

                    <button onClick={() => on_play_due()}>Play All Due <span>{nb_due()}</span></button>
            </div>
            </div>
</div>
            <a class='delete' onClick={props.on_delete}>Delete Repeat</a>
        </div>
    </>)
}
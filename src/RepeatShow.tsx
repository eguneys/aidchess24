import { JSX, children, createSignal, Show, createMemo, For, createResource } from 'solid-js'
import './RepeatShow.scss'
import StudyRepo, { RepertoiresFixture } from './studyrepo'
import { A } from '@solidjs/router'


export default () => {

    const [create_repeat_dialog, set_create_repeat_dialog] = createSignal(false)

    const on_create_repeat = () => {
        set_create_repeat_dialog(true)
    }

    return (<>
        <div class='repeat-show'>
            <RepeatList on_create_repeat={on_create_repeat} />
            <RepeatShow on_create_repeat={on_create_repeat} />
            <Show when={create_repeat_dialog()}>
                <CreateNewRepeat onClose={() => set_create_repeat_dialog(false)}/>
            </Show>
        </div>
    </>)
}

const CreateNewRepeat = (props: { onClose: () => void }) => {

    const studies = createMemo(RepertoiresFixture.imported[0])

    const [i_selected_study, set_i_selected_study] = createSignal(0)
    const selected_study = createMemo(() => studies()[i_selected_study()])

    const [sections] = createResource(() => selected_study()?.study_id, (id) => 
        StudyRepo.read_section_study(id)
    )

    return (<>
        <Dialog onClose={props.onClose}>
            <div class='new-repeat'>
                <h3>Create a New Repeat</h3>
                <div class='study-list'>
                    <h3>Studies</h3>
                    <div class='list'>
                <For each={studies()} fallback={
                    <div class='none'>
                  <A href='/repertoires'>Import some studies first</A>
                    </div>
                }>{ (study, i) => 
                    <div onClick={() => set_i_selected_study(i())} class='study'>{study.study_name}</div>
                }</For>
                </div>
                </div>
                <div class='section-list'>
                    <h3>Sections</h3>
                    <div class='list'>
                    <Show when={sections()}>{ sections => 
                        <For each={sections().sections} fallback={
                            <p>Select a Study</p>
                        }>{ section => 
                            <div class='section'>
                                <input type='checkbox'/>
                                {section.name}
                                </div>
                        }</For>
                    }</Show>
                    </div>
                </div>
                <button class='save'> Save </button>
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


const RepeatList = (props: { on_create_repeat: () => void }) => {
    return (<div class='list-wrap'>
        <h3>Repeats</h3>
        <div class='list'>

        </div>
        <button onClick={props.on_create_repeat}>Create a New Repeat</button>
    </div>)
}


const RepeatShow = (props: { on_create_repeat: () => void }) => {
    return (<>
    <div class='show'>
        <button onClick={props.on_create_repeat}>Create a New Repeat</button>
    </div>
    </>)
}
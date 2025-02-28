import { Color } from "chessops"
import { StepsTree } from "./ReplayTreeComponent"
import { batch, createEffect, createMemo, createSignal, For, Show } from "solid-js"
import './StudyComponent.scss'

const SECTION_LETTERS = 'ABCDEFGHIJKLMNOP'.split('')

export type Chapter = {
    name: string,
    tree: StepsTree,
    orientation?: Color,
    event?: string,
    site?: string,
    white?: string,
    black?: string,
    set_name(name: string): void,
    set_tree(tree: StepsTree): void,
    set_orientation(orientation: Color): void,
    set_event(event: string): void,
    set_site(site: string): void,
    set_white(white: string): void,
    set_black(black: string): void,
}

export type Section = {
    name: string,
    chapters: Chapter[],
    set_name(name: string): void,
    add_chapter(chapter: Chapter): void,
    delete_chapter(chapter: Chapter): void
    change_chapter_order(chapter: Chapter, order: number): void
}

export type Study = {
    name: string,
    sections: Section[],
    set_name(name: string): void,
    add_section(section: Section): void,
    delete_section(section: Section): void
    change_section_order(section: Section, order: number): void
}

export function Chapter(): Chapter {
    let [name, set_name] = createSignal('New Chapter')
    let [tree, set_tree] = createSignal(StepsTree())

    let [orientation, set_orientation] = createSignal<Color | undefined>(undefined)
    let [event, set_event] = createSignal<string | undefined>(undefined)
    let [site, set_site] = createSignal<string | undefined>(undefined)
    let [white, set_white] = createSignal<string | undefined>(undefined)
    let [black, set_black] = createSignal<string | undefined>(undefined)

    return {
        get name() { return name() },
        get tree() { return tree() },
        get orientation() { return orientation() },
        get event() { return event() },
        get site() { return site() },
        get white() { return white() },
        get black() { return black() },
        set_name(name: string) { set_name(name) },
        set_tree(tree: StepsTree) { set_tree(tree) },
        set_orientation(orientation: Color) { set_orientation(orientation) },
        set_event(event: string) { set_event(event) },
        set_site(site: string) { set_site(site) },
        set_white(white: string) { set_white(white) },
        set_black(black: string) { set_black(black) },
    }
}

export function Section(): Section {
    let [name, set_name] = createSignal('New Section')


    let [chapters, set_chapters] = createSignal<Chapter[]>([])

    return {
        get name() { return name() },
        get chapters() { return chapters() },
        set_name(name: string) { set_name(name) },
        add_chapter(c: Chapter) {
            set_chapters([...chapters(), c])
        },
        delete_chapter(chapter: Chapter) {
            let ss = chapters()
            let i = ss.indexOf(chapter)
            if (i === -1) {
                return
            }
            ss.splice(i, 1)
            set_chapters([...ss])
        },
        change_chapter_order(chapter: Chapter, new_i: number) {
            let ss = chapters()
            let old_i = ss.indexOf(chapter)

            ss.splice(old_i, 1)
            ss.splice(new_i, 0, chapter)

            console.log(old_i, new_i, chapter === ss[new_i])

            set_chapters([...ss])
        }
    }
}

export function Study(): Study {
    let [name, set_name] = createSignal('New Opening')

    let [sections, set_sections] = createSignal<Section[]>([])

    return {
        get name() { return name() },
        get sections() { return sections() },
        set_name(name: string) { set_name(name) },
        add_section(s: Section) {
            set_sections([...sections(), s])
        },
        delete_section(section: Section) {
            let ss = sections()
            let i = ss.indexOf(section)
            if (i === -1) {
                return
            }
            ss.splice(i, 1)
            set_sections([...ss])
        },
        change_section_order(section: Section, new_i: number) {
            let ss = sections()
            let old_i = ss.indexOf(section)


            ss.splice(old_i, 1)
            ss.splice(new_i, 0, section)

            set_sections([...ss])
        }
    }
}


export function StudyDetailsComponent(props: { study: Study, section?: Section, chapter?: Chapter }) {
    return (<>
        <div class='study-details'>
            <div class='title'>
                <span class='study-name'>{props.study.name}</span>
                <Show when={props.section}>{section => 
                    <>
                        :<span class='section-name'>{section().name}</span>
                    </>
                }</Show>
                <Show when={props.chapter}>{chapter => 
                    <>
                        :<span class='chapter-name'>{chapter().name}</span>
                    </>
                }</Show>
            </div>
            <div class='tags'>

            </div>
        </div>
    </>)
}


export function SectionsListComponent(props: { study: Study, on_selected_chapter: (section: Section, chapter: Chapter) => void, on_edit_study?: () => void, on_edit_section?: (section: Section) => void, on_edit_chapter?: (section: Section, chapter: Chapter) => void, on_chapter_order_changed?: number, on_section_order_changed?: number }) {

    const on_new_section = () => {
        let new_section = Section()

        batch(() => {
            props.study.add_section(new_section)
            set_selected_section(new_section)
        })
    }



    const [i_section, set_i_section] = createSignal(0)

    const selected_section = createMemo(() => props.study.sections[i_section()])
    const set_selected_section = (section: Section) => {
        set_i_section(props.study.sections.indexOf(section))
    }

    const get_letter_nth = (i: number) => {
        return SECTION_LETTERS[i]
    }

    const on_selected_chapter = (section: Section, chapter: Chapter) => {
        props.on_selected_chapter(section, chapter)
    }

    createEffect(() => {
        let order = props.on_section_order_changed
        if (order !== undefined) {
            set_i_section(order)
        }
    })



    return (<>
    <div class='sections-list'>
        <div class='header'>
            <span class='title'>{props.study.name}</span>
            <div class='tools'>
                    <i onClick={() => props.on_edit_study?.()} data-icon=""></i>
            </div>
        </div>
        <div class='list'>
            <For each={props.study.sections} fallback={
                <NoSections />
            }>{(section, i) =>
                <Show when={section === selected_section()} fallback={
                    <SectionCollapsedComponent section={section} nth={get_letter_nth(i())} on_selected={() => set_selected_section(section)} on_edit={() => props.on_edit_section?.(section)}/>
                }>
                    <SectionComponent nth={get_letter_nth(i())} section={section} on_selected_chapter={_ => on_selected_chapter(section, _)} on_edit={() => props.on_edit_section?.(section)} on_edit_chapter={chapter => props.on_edit_chapter?.(section, chapter)} on_chapter_order_changed={props.on_chapter_order_changed}/>
                </Show>
                }</For>
            <div class='tools'>
                <button onClick={() => on_new_section()} class='new'><i data-icon=""></i><span>New Section</span></button>
            </div>
        </div>
    </div>
    </>)
}

function SectionCollapsedComponent(props: { section: Section, nth: string, on_selected: () => void, on_edit: () => void }) {
    return (<>
        <div class='section'>
            <div onClick={() => props.on_selected()} class='header'>
                <div class='title'><span class='nth'>{props.nth}</span><span class='fit-ellipsis'>{props.section.name}</span></div>
                <i onClick={() => props.on_edit()} data-icon=""></i>
            </div>
        </div>
    </>)
}

function SectionComponent(props: { section: Section, nth: string, on_selected_chapter: (chapter: Chapter) => void, on_edit: () => void, on_edit_chapter: (chapter: Chapter) => void, on_chapter_order_changed?: number }) {

    const on_new_chapter = () => {
        let new_chapter = Chapter()
        props.section.add_chapter(new_chapter)
    }

    const [i_chapter, set_i_chapter] = createSignal(0)

    const selected_chapter = createMemo(() => props.section.chapters[i_chapter()])
    const set_selected_chapter = (chapter: Chapter) => {
        set_i_chapter(props.section.chapters.indexOf(chapter))
    }

    createEffect(() => {
        props.on_selected_chapter(selected_chapter())
    })

    createEffect(() => {
        let order = props.on_chapter_order_changed
        if (order !== undefined) {
            set_i_chapter(order)
        }
    })

    return (<>
        <div class='section active'>
            <div class='header'>
                <div class='title'><span class='nth'>{props.nth}</span><span class='fit-ellipsis' title={props.section.name}>{props.section.name}</span></div>
                <i onClick={() => props.on_edit()} data-icon=""></i>
            </div>
            <div class='chapters-list'>

                <div class='list'>
                    <For each={props.section.chapters} fallback={
                        <NoChapters />
                    }>{(chapter, i) =>
                        <ChapterComponent chapter={chapter} nth={`${props.nth}${i() + 1}`} selected={selected_chapter()===chapter} on_selected={() => set_selected_chapter(chapter)}  on_edit={() => props.on_edit_chapter(chapter)}/>
                    }</For>
                </div>
                <div class='tools'>
                    <button onClick={() => on_new_chapter()} class='new'><i data-icon=""></i><span>New Chapter</span></button>
                </div>
            </div>
        </div>
    </>)
}

export function NoSections() {
    return (<>
    <div class='no-sections'>No Sections yet.</div>
    </>)
}

export function NoChapters() {
    return (<>
    <div class='no-chapters'>No Chapters yet.</div>
    </>)
}

export function ChapterComponent(props: { chapter: Chapter, nth: string, selected: boolean, on_selected: () => void, on_edit: () => void }) {

    const klass = createMemo(() => props.selected ? ' active' : '')

    return (<>
        <div onClick={() => props.on_selected()} class={'chapter' + klass()}>
            <div class='title'><span class='nth'>{props.nth}.</span>{props.chapter.name}</div>
            <i onClick={() => props.on_edit()} data-icon=""></i>
        </div>
    </>)
}


export function EditStudyComponent(props: { study: Study }) {

    const on_name_key_down = (key: string, e: HTMLInputElement) => {
        if (key === 'Escape') {
            e.value = props.study.name
        }
    }



    const on_name_changed = (e: HTMLInputElement) => {
        let name = e.value
        if (name.length < 3) {
            name = "New Chapter"
            e.value = name
        }
        props.study.set_name(name)
    }

    return (<>
        <h2>Edit Opening</h2>

        <div class='group'>
        <label for='name'>Name</label>
        <input name="name" id="name" onKeyDown={e => on_name_key_down(e.key, e.currentTarget)} onChange={(e) => on_name_changed(e.currentTarget)} type="text" placeholder="Opening Name" minLength={3} value={props.study.name}></input>
        </div>
    </>)
}

export function EditChapterComponent(props: { chapter: Chapter, section: Section, i_chapter: number, on_order_changed: (order: number) => void }) {

    const on_name_key_down = (key: string, e: HTMLInputElement) => {
        if (key === 'Escape') {
            e.value = props.section.name
        }
    }



    const on_name_changed = (e: HTMLInputElement) => {
        let name = e.value
        if (name.length < 3) {
            name = "New Chapter"
            e.value = name
        }
        props.chapter.set_name(name)
    }

    const on_order_changed = (value: string) => {
        props.on_order_changed(parseInt(value))
    }

    return (<>
        <h2>Edit Chapter</h2>

        <div class='group'>
        <label for='name'>Name</label>
        <input name="name" id="name" onKeyDown={e => on_name_key_down(e.key, e.currentTarget)} onChange={(e) => on_name_changed(e.currentTarget)} type="text" placeholder="Section Name" minLength={3} value={props.chapter.name}></input>
        </div>

        
        <div class='group'>
        <label for='order'>Set Order</label>
        <select onChange={e => on_order_changed(e.currentTarget.value)} name="order" id="order">
            <For each={props.section.chapters}>{(_, i) => 
                <option value={i()} selected={props.i_chapter === i()}>{i() + 1}</option>
            }</For>
        </select>
        </div>
    </>)
}

export function EditSectionComponent(props: { section: Section, i_section: number, nb_sections: number, on_order_changed: (order: number) => void }) {

    const on_name_key_down = (key: string, e: HTMLInputElement) => {
        if (key === 'Escape') {
            e.value = props.section.name
        }
    }

    const on_name_changed = (e: HTMLInputElement) => {
        let name = e.value
        if (name.length < 3) {
            name = "New Section"
            e.value = name
        }
        props.section.set_name(name)
    }

    const on_order_changed = (value: string) => {
        props.on_order_changed(SECTION_LETTERS.indexOf(value))
    }

    return (<>
        <h2>Edit Section</h2>

        <div class='group'>
        <label for='name'>Name</label>
        <input name="name" id="name" onKeyDown={(e) => on_name_key_down(e.key, e.currentTarget)} onChange={(e) => on_name_changed(e.currentTarget)} type="text" placeholder="Section Name" minLength={3} value={props.section.name}></input>
        </div>

        
        <div class='group'>
        <label for='order'>Set Order</label>
        <select onChange={e => on_order_changed(e.currentTarget.value)} name="order" id="order">
            <For each={SECTION_LETTERS.slice(0, props.nb_sections)}>{(letter, i) => 
                <option value={letter} selected={props.i_section === i()}>{letter}</option>
            }</For>
        </select>
        </div>
    </>)
}
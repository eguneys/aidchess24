import { Color } from "chessops"
import { parse_PGNS, PGN, PlayUciTreeReplay } from "./ReplayTreeComponent"
import { batch, createEffect, createMemo, createResource, createSignal, For, Show, Suspense } from "solid-js"
import './StudyComponent.scss'
import { EntityChapterId, EntityChapterInsert, EntityPlayUciTreeReplayId, EntitySectionId, EntitySectionInsert, EntityStudyId, EntityStudyInsert, ModelChapter, StudiesDBReturn } from "./sync_idb_study"
import { Path } from "./step_types"



export type Chapter = {
    model: ModelChapter,
    set_model(model: ModelChapter): void,
    id: EntityChapterId,
    section_id: EntityStudyId,
    tree_replay_id: EntityPlayUciTreeReplayId,
    name: string,
    play_replay: PlayUciTreeReplay,
    orientation?: Color,
    event?: string,
    site?: string,
    white?: string,
    black?: string,
    order: number,
    set_order(order: number): void,
    set_name(name: string): void,
    set_orientation(orientation: Color | undefined): void,
    set_event(event: string | undefined): void,
    set_site(site: string | undefined): void,
    set_white(white: string | undefined): void,
    set_black(black: string | undefined): void,
    create_effects_listen_and_save_db(db: StudiesDBReturn): void
    as_pgn(study_name: string, section_name: string): string
    as_pgn_for_path(path: Path): string
}

export type Section = {
    entity: EntitySectionInsert,
    id: EntitySectionId,
    study_id: EntityStudyId,
    name: string,
    chapters: Chapter[],
    order: number,
    i_chapter: number,
    set_i_chapter(i: number): void,
    sort_chapters(): void,
    set_order(order: number): void,
    set_entity(entity: EntitySectionInsert): void,
    set_name(name: string): void,
    add_chapter(chapter: Chapter): void,
    add_new_chapter(chapter: Chapter): void,
    delete_chapter(chapter: Chapter): void
    change_chapter_order(chapter: Chapter, order: number): void
    create_effects_listen_and_save_db(db: StudiesDBReturn): void
}

export type Study = {
    entity: EntityStudyInsert,
    id: EntityStudyId,
    name: string,
    sections: Section[],
    i_section: number,
    set_i_section(i: number): void,
    sort_sections(): void,
    set_entity(entity: EntityStudyInsert): void,
    set_name(name: string): void,
    add_section(section: Section): void,
    add_new_section(section: Section): void,
    delete_section(section: Section): void
    change_section_order(section: Section, order: number): void
    create_effects_listen_and_save_db(db: StudiesDBReturn): void
    as_export_pgn: string
    as_export_lichess: string[]
    is_edits_disabled: boolean
    set_is_edits_disabled(value: boolean): void
}

export function Chapter(id: EntityChapterId, section_id: EntitySectionId, play_replay: PlayUciTreeReplay): Chapter {
    let [order, set_order] = createSignal(0)
    let [name, set_name] = createSignal('New Chapter')

    let [orientation, set_orientation] = createSignal<Color | undefined>(undefined)
    let [event, set_event] = createSignal<string | undefined>(undefined)
    let [site, set_site] = createSignal<string | undefined>(undefined)
    let [white, set_white] = createSignal<string | undefined>(undefined)
    let [black, set_black] = createSignal<string | undefined>(undefined)



    return {
        set_entity(entity: EntityChapterInsert) {
            set_name(entity.name)
            set_order(entity.order)
        },
        get entity() {
            return {
                id,
                section_id,
                tree_replay_id: play_replay.id,
                name: name(),
                order: order(),
            }
        },
        get order() { return order() },
        set_order(order: number) { set_order(order) },
        id,
        section_id,
        tree_replay_id: play_replay.id,
        get name() { return name() },
        play_replay,
        get orientation() { return orientation() },
        get event() { return event() },
        get site() { return site() },
        get white() { return white() },
        get black() { return black() },
        set_name(name: string) { set_name(name) },
        set_orientation(orientation: Color) { set_orientation(orientation) },
        set_event(event: string) { set_event(event) },
        set_site(site: string) { set_site(site) },
        set_white(white: string) { set_white(white) },
        set_black(black: string) { set_black(black) },
        create_effects_listen_and_save_db(db: StudiesDBReturn) {
            createEffect(() => {
                db.update_chapter(this.entity)
            })
        },
        as_pgn(study_name: string, section_name: string) {
            let res = ''

            res += `[Event] ${study_name}: ${section_name}: ${name()}\n`
            res += `[StudyName] ${study_name}\n`
            res += `[ChapterName] ${name()}\n`
            res += '\n'
            res += play_replay.steps.as_pgn

            return res
        },
        as_pgn_for_path(path: Path) {
            return play_replay.steps.as_pgn_for_path(path)
        }
    }
}

export function Section(id: EntitySectionId, study_id: EntityStudyId): Section {
    let [i_chapter, set_i_chapter] = createSignal(0)
    let [order, set_order] = createSignal(0)
    let [name, set_name] = createSignal('New Section')


    let [chapters, set_chapters] = createSignal<Chapter[]>([])

    return {
        set_entity(entity: EntitySectionInsert) {
            set_name(entity.name)
            set_order(entity.order)
            set_i_chapter(entity.i_chapter)
        },
        get entity() {
            return {
                id,
                study_id,
                name: name(),
                order: order(),
                i_chapter: i_chapter()
            }
        },
        get i_chapter() { return i_chapter() },
        set_i_chapter(i: number) { set_i_chapter(i) },
        set_order(order: number) { set_order(order) },
        get order() { return order() },
        sort_chapters() { 
            let cc = chapters()
            cc.sort((a, b) => a.order - b.order)
            set_chapters([...cc]) 
        },
        id,
        study_id,
        get name() { return name() },
        get chapters() { return chapters() },
        set_name(name: string) { set_name(name) },
        add_new_chapter(chapter: Chapter) {
            batch(() => {
                set_chapters([...chapters(), chapter])
                let i_chapter = chapters().length - 1
                chapter.set_order(i_chapter)
                set_i_chapter(i_chapter)
            })
        },
        add_chapter(chapter: Chapter) {
            set_chapters([...chapters(), chapter])
        },
        delete_chapter(chapter: Chapter) {
            let ss = chapters()

            let s_chapter = ss[i_chapter()]
            let i = ss.indexOf(chapter)
            if (i === -1) {
                return
            }
            ss.splice(i, 1)
            batch(() => {
                set_chapters([...ss])


                let i_chapter =  ss.indexOf(s_chapter)

                if (i_chapter === -1) {
                    set_i_chapter(0)
                } else {
                    set_i_chapter(i_chapter)
                }

            })
        },
        change_chapter_order(chapter: Chapter, order: number) {
            let cc = chapters()

            cc.splice(chapter.order, 1)
            cc.splice(order, 0, chapter)

            batch(() => {
                cc.forEach((c, i) => {
                    c.set_order(i)
                })
                set_chapters([...cc])
            })

        },
        create_effects_listen_and_save_db(db: StudiesDBReturn) {
            createEffect(() => {
                db.update_section(this.entity)
            })
        }
    }
}

export function Study(id: EntityStudyId): Study {
    let [i_section, set_i_section] = createSignal(0)

    let [name, set_name] = createSignal('New Opening')

    let [sections, set_sections] = createSignal<Section[]>([])

    const [is_edits_disabled, set_is_edits_disabled] = createSignal(false)

    let entity = () => ({
        id,
        name: name(),
        i_section: i_section(),
        is_edits_disabled: is_edits_disabled()
    })

    return {
        set_entity(entity: EntityStudyInsert) {
            set_name(entity.name)
            set_i_section(entity.i_section)
            set_is_edits_disabled(entity.is_edits_disabled)
        },
        get is_edits_disabled() { return is_edits_disabled() },
        set_is_edits_disabled(value: boolean) { set_is_edits_disabled(value) },
        get i_section() { return i_section() },
        set_i_section(i: number) { set_i_section(i) },
        get entity() { return entity() },
        id,
        get name() { return name() },
        get sections() { return sections() },
        set_name(name: string) { set_name(name) },
        add_new_section(section: Section) {
            batch(() => {
                set_sections([...sections(), section])
                let i_section = sections().length - 1
                section.set_order(i_section)
                set_i_section(i_section)
            })
        },
        add_section(section: Section) {
            set_sections([...sections(), section])
        },
        delete_section(section: Section) {
            let ss = sections()

            let s_section = ss[i_section()]
            let i = ss.indexOf(section)
            if (i === -1) {
                return
            }
            ss.splice(i, 1)

            batch(() => {
                set_sections([...ss])

                let i_section =  ss.indexOf(s_section)

                if (i_section === -1) {
                    set_i_section(0)
                } else {
                    set_i_section(i_section)
                }
            })

        },
        change_section_order(section: Section, order: number) {
            let cc = sections()

            cc.splice(section.order, 1)
            cc.splice(order, 0, section)

            batch(() => {
                cc.forEach((c, i) => {
                    c.set_order(i)
                })
                set_sections([...cc])
            })

        },
        sort_sections() { 
            let cc = sections()
            cc.sort((a, b) => a.order - b.order)
            set_sections([...cc]) 
        },
        create_effects_listen_and_save_db(db: StudiesDBReturn) {
            createEffect(() => {
                db.update_study(this.entity)
            })
        },
        get as_export_pgn() {
            return sections().map(section =>
                section.chapters.map(chapter =>
                    chapter.as_pgn(name(), section.name)
                ).join('\n\n')
            ).join('\n\n\n')
        },
        get as_export_lichess() {
            let res: string[] = []
            let parted = sections().flatMap(_ => _.chapters).length > 64

            let a: string[] = []
            for (let section of sections()) {
                if (a.length > 0 && a.length + section.chapters.length > 64) {
                    res.push(a.join('\n\n'))
                    a = []
                }
                for (let chapter of section.chapters) {
                    a.push(
                        chapter.as_pgn(name() + parted ? ` Part ${res.length + 1}` : '', 
                        section.name)
                    )
                }
            }
            if (a.length > 0) {
                res.push(a.join('\n\n'))
            }
            return res
        }
    }
}


export function StudyDetailsComponent(props: { study: Study, section?: Section, chapter?: Chapter }) {

    /*
    const on_new_tag_changed = (value: string) => {
        if (value === 'Orientation') {
            set_editable_new_tag(value)
        } else if (value === 'Site') {
            set_editable_new_tag(value)
        } else if (value === 'Event') {
            set_editable_new_tag(value)
        } else if (value === 'White') {
            set_editable_new_tag(value)
        } else if (value === 'Black') {
            set_editable_new_tag(value)
        } else {
            set_editable_new_tag(undefined)
        }
    }

    const [editable_new_tag, _set_editable_new_tag] = createSignal<string | undefined>(undefined)

    const on_new_tag_edited = (value: string) => {

        let tag = editable_new_tag()

        if (tag === 'Orientation') {
            if (value === '') {
                props.chapter!.set_orientation(undefined)
            }
            if (value.toLowerCase() === 'white') {
                props.chapter!.set_orientation('white')
            }
            if (value.toLowerCase() === 'black') {
                props.chapter!.set_orientation('black')
            }
        }
        if (tag === 'Event') {
            if (value === '') {
                props.chapter!.set_event(undefined)
            } else {
                props.chapter!.set_event(value)
            }
        }
        if (tag === 'Site') {
            if (value === '') {
                props.chapter!.set_site(undefined)
            } else {
                props.chapter!.set_site(value)
            }
        }
        if (tag === 'White') {
            if (value === '') {
                props.chapter!.set_white(undefined)
            } else {
                props.chapter!.set_white(value)
            }
        }
        if (tag === 'Black') {
            if (value === '') {
                props.chapter!.set_black(undefined)
            } else {
                props.chapter!.set_black(value)
            }
        }
    }
    const on_new_tag_key_press = (key: string, value: string) => {
        if (key === 'Enter') {
            on_new_tag_edited(value)
        }
    }
        */

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
                {/*
                <Show when={props.chapter}>{ chapter => 
                    <>
                        <Show when={chapter().orientation}>{orientation => <Tag tag="Orientation" value={orientation()} />}</Show>
                        <Show when={chapter().site}>{site => <Tag tag="Site" value={site()} />}</Show>
                        <Show when={chapter().event}>{event => <Tag tag="Event" value={event()} />}</Show>
                        <Show when={chapter().white}>{white => <Tag tag="White" value={white()} />}</Show>
                        <Show when={chapter().black}>{black => <Tag tag="Black" value={black()} />}</Show>
                        <select onChange={e => on_new_tag_changed(e.currentTarget.value)}>
                            <option value="New">New Tag</option>
                            <TagOption tag="Orientation"/>
                            <TagOption tag="Site"/>
                            <TagOption tag="Event"/>
                            <TagOption tag="White"/>
                            <TagOption tag="Black"/>
                        </select>
                        <Show when={editable_new_tag()}>
                            <input onKeyDown={e => on_new_tag_key_press(e.key, e.currentTarget.value)} onChange={(e) => on_new_tag_edited(e.currentTarget.value)} type='text' placeholder={editable_new_tag()} value=""></input>
                        </Show>
                    </>
                }</Show>
                */}
            </div>
        </div>
    </>)
}

/*
function Tag(props: { tag: string, value: string }) {
    return (<div class='tag'>
        <span class='name'>{props.tag}:</span>
        <span class='value'>{props.value}</span>
    </div>)
}

function TagOption(props: { tag: string }) {
    return (<option value={props.tag}>{props.tag}</option>)
}
    */

export function SectionsListComponent(props: { db: StudiesDBReturn, study: Study, is_edits_disabled?: boolean, on_selected_chapter: (section: Section, chapter: Chapter) => void, on_edit_study?: () => void, on_edit_section?: (section: Section) => void, on_edit_chapter?: (section: Section, chapter: Chapter) => void, on_chapter_order_changed?: number, on_section_order_changed?: number }) {

    const on_new_section = async () => {
        let new_section = await props.db.new_section(props.study.id)
        props.study.add_new_section(new_section)
        set_selected_section(new_section)
        props.on_edit_section?.(new_section)
    }


    const i_section = createMemo(() => props.study.i_section)
    const set_i_section = (i: number) => props.study.set_i_section(i)

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


    const is_edits_disabled = createMemo(() => props.is_edits_disabled ?? props.study.is_edits_disabled)

    return (<>
    <div class='sections-list'>
        <div class='header'>
            <span class='title'>{props.study.name}</span>
            <div class='tools'>
                <Show when={!is_edits_disabled()}>
                    <i onClick={() => props.on_edit_study?.()} data-icon=""></i>
                </Show>
            </div>
        </div>
        <div class='list'>
            <For each={props.study.sections} fallback={
                <NoSections />
            }>{(section, i) =>
                <Show when={section === selected_section()} fallback={
                    <SectionCollapsedComponent is_edits_disabled={is_edits_disabled()} section={section} nth={get_letter_nth(i())} on_selected={() => set_selected_section(section)} on_edit={() => props.on_edit_section?.(section)}/>
                }>
                    <SectionComponent is_edits_disabled={is_edits_disabled()} db={props.db} nth={get_letter_nth(i())} section={section} on_selected_chapter={_ => on_selected_chapter(section, _)} on_edit={() => props.on_edit_section?.(section)} on_edit_chapter={chapter => props.on_edit_chapter?.(section, chapter)} on_chapter_order_changed={props.on_chapter_order_changed}/>
                </Show>
                }</For>
            <div class='tools'>
                <Show when={!is_edits_disabled()}>
                    <button onClick={() => on_new_section()} class='new'><i data-icon=""></i><span>New Section</span></button>
                </Show>
            </div>
        </div>
    </div>
    </>)
}

function SectionCollapsedComponent(props: { is_edits_disabled: boolean, section: Section, nth: string, on_selected: () => void, on_edit: () => void }) {
    return (<>
        <div class='section'>
            <div onClick={() => props.on_selected()} class='header'>
                <div class='title'><span class='nth'>{props.nth}</span><span class='fit-ellipsis'>{props.section.name}</span></div>
                <Show when={!props.is_edits_disabled}>
                    <i onClick={() => props.on_edit()} data-icon=""></i>
                </Show>
            </div>
        </div>
    </>)
}

function SectionComponent(props: { is_edits_disabled: boolean, db: StudiesDBReturn, section: Section, nth: string, on_selected_chapter: (chapter: Chapter) => void, on_edit: () => void, on_edit_chapter: (chapter: Chapter) => void, on_chapter_order_changed?: number }) {

    const on_new_chapter = async () => {
        let new_chapter = await props.db.new_chapter(props.section.id)
        props.section.add_new_chapter(new_chapter)
        set_selected_chapter(new_chapter)
        props.on_edit_chapter(new_chapter)
    }

    const i_chapter = createMemo(() => props.section.i_chapter)
    const set_i_chapter = (i: number) => props.section.set_i_chapter(i)

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
                <Show when={!props.is_edits_disabled}>
                    <i onClick={() => props.on_edit()} data-icon=""></i>
                </Show>
            </div>
            <div class='chapters-list'>

                <div class='list'>
                    <For each={props.section.chapters} fallback={
                        <NoChapters />
                    }>{(chapter, i) =>
                        <ChapterComponent is_edits_disabled={props.is_edits_disabled} chapter={chapter} nth={`${props.nth}${i() + 1}`} selected={selected_chapter()===chapter} on_selected={() => set_selected_chapter(chapter)}  on_edit={() => props.on_edit_chapter(chapter)}/>
                    }</For>
                </div>
                <div class='tools'>
                    <Show when={!props.is_edits_disabled}>
                        <button onClick={() => on_new_chapter()} class='new'><i data-icon=""></i><span>New Chapter</span></button>
                    </Show>
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

export function ChapterComponent(props: { is_edits_disabled: boolean, chapter: Chapter, nth: string, selected: boolean, on_selected: () => void, on_edit: () => void }) {

    const klass = createMemo(() => props.selected ? ' active' : '')

    return (<>
        <div onClick={() => props.on_selected()} class={'chapter' + klass()}>
            <div class='title'><span class='nth'>{props.nth}.</span>{props.chapter.name}</div>
            <Show when={!props.is_edits_disabled}>
                <i onClick={() => props.on_edit()} data-icon=""></i>
            </Show>
        </div>
    </>)
}


export function EditStudyComponent(props: { db: StudiesDBReturn, study: Study, on_delete_study: () => void }) {

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

    const on_delete_study = () => {
        props.on_delete_study()
    }

    return (<>
        <h2>Edit Opening</h2>

        <div class='group'>
        <label for='name'>Name</label>
        <input name="name" id="name" onKeyDown={e => on_name_key_down(e.key, e.currentTarget)} onChange={(e) => on_name_changed(e.currentTarget)} type="text" placeholder="Opening Name" minLength={3} value={props.study.name}></input>
        </div>

        <div class='group buttons'>
            <span class='split'></span>
            <button onClick={on_delete_study} class='delete'>Delete <i data-icon=''></i></button>
        </div>
    </>)
}

export function EditChapterComponent(props: { db: StudiesDBReturn, chapter: Chapter, section: Section, i_chapter: number, on_delete_chapter: () => void, on_order_changed: (order: number) => void }) {

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

    const on_delete_chapter = () => {
        props.on_delete_chapter()
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

        <div class='group buttons'>
            <span class='split'></span>
            <button onClick={on_delete_chapter} class='delete'>Delete <i data-icon=''></i></button>
        </div>
        </div>
    </>)
}

export function EditSectionComponent(props: { db: StudiesDBReturn, section: Section, i_section: number, nb_sections: number, on_delete_section: () => void, on_order_changed: (order: number) => void, on_import_pgns: (pgns: PGN[], section_name: string) => void }) {

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

    const on_delete_section = () => {
        props.on_delete_section()
    }

    const [tab, set_tab] = createSignal('lichess')


    const [import_study_text, set_import_study_text] = createSignal('')

    const import_lichess_link = createMemo(() => {

        let m = import_study_text().match(/\/study\/([a-zA-Z0-9]{8})\/?$/)

        if (!m) {
            return undefined
        }

        let id = m[1]

        return `https://lichess.org/api/study/${id}.pgn`
    })

    const fetch_lichess_link = async (link: string) => {
        return await fetch(link)
        .then(_ => _.text())
        .then(_ => parse_PGNS(_))
    }

    const [lichess_pgns] = createResource(import_lichess_link, fetch_lichess_link)

    const on_import_lichess = async () => {
        let pgns = lichess_pgns()
        if (!pgns) {
            return
        }
        props.on_import_pgns(pgns, props.section.name)
    }

   const import_lichess_disabled = createMemo(() => {
        return import_lichess_link() === undefined
    })

    return (<>
        <h2>Edit Section</h2>
        <div class='group'>
            <label for='name'>Name</label>
            <input name="name" id="name" onKeyDown={(e) => on_name_key_down(e.key, e.currentTarget)} onChange={(e) => on_name_changed(e.currentTarget)} type="text" placeholder="Section Name" minLength={3} value={props.section.name}></input>
        </div>



        <div class='tabs'>
            <div class={'tab ' + (tab() === 'empty' ? 'active' : '')} onClick={() => set_tab('empty')}>Empty</div>
            <div class={'tab ' + (tab() === 'lichess' ? 'active' : '')} onClick={() => set_tab('lichess')}>Import Lichess Study</div>
        </div>
        <div class='content'>
            <Show when={tab() === 'lichess'}>
                <div class='group'>
                <label for='name'>Import a Study from Lichess</label>
                <input class={import_lichess_disabled() ? 'error': 'success'} onKeyUp={(e) => set_import_study_text(e.currentTarget.value)} onChange={(e) => set_import_study_text(e.target.value)} name="name" id="name" type="text" placeholder="Lichess Study URL"></input>
                </div>
            </Show>
            <Show when={tab() === 'empty'}>
        
                <div class='group'>
                <label for='order'>Set Order</label>
                <select onChange={e => on_order_changed(e.currentTarget.value)} name="order" id="order">
                    <For each={SECTION_LETTERS.slice(0, props.nb_sections)}>{(letter, i) => 
                        <option value={letter} selected={props.i_section === i()}>{letter}</option>
                    }</For>
                </select>
                </div>
            </Show>
        </div>

        <div class='filler'></div>

        <div class='group buttons'>
            <span class='split'></span>

            <Show when={tab() === 'lichess'}>
                <Suspense fallback={
                    <button class='loading' disabled={true}>Loading ...</button>
                }>
                <button onClick={on_import_lichess} class='import' disabled={lichess_pgns() === undefined}>Import<i data-icon=''></i></button>
                </Suspense>
            </Show>
            <button onClick={on_delete_section} class='delete'>Delete <i data-icon=''></i></button>
        </div>
    </>)
}
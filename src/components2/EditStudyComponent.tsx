import { createMemo, createResource, createSelector, createSignal, For, Show, Suspense } from "solid-js"
import { EntityChapterInsert, EntitySectionInsert, EntityStudyInsert, ModelChapter, ModelSection, ModelStudy } from "../store/sync_idb_study"
import { SECTION_LETTERS } from "./hard_limits"
import { parse_PGNS, PGN } from "./parse_pgn"
import { BoardEditor } from "./BoardEditor"
import { Color } from "chessops"
import { FEN } from "chessground/types"

export function EditStudyComponent(props: { study: ModelStudy, on_update_study: (data: Partial<EntityStudyInsert>) => void, on_delete_study: () => void }) {

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
        props.on_update_study({ id: props.study.id, name })
    }

    const on_delete_study = () => {
        props.on_delete_study()
    }


    const on_orientation_changed = (orientation: Color) => {
        props.on_update_study({ id: props.study.id, orientation })
    }

    const orientation = createMemo(() => props.study.orientation)



    return (<>
        <h2>Edit Opening</h2>

        <div class='group'>
        <label for='name'>Name</label>
        <input name="name" id="name" onKeyDown={e => on_name_key_down(e.key, e.currentTarget)} onChange={(e) => on_name_changed(e.currentTarget)} type="text" placeholder="Opening Name" minLength={3} value={props.study.name}></input>
        </div>


        <div class='section'>
            <div class='group'>
                <label for='orientation'>Set Orientation</label>
                <select onChange={e => on_orientation_changed(e.currentTarget.value as Color)} name="orientation" id="orientation">
                    <option value="white" selected={orientation() === "white"}>White</option>
                    <option value="black" selected={orientation() === "black"}>Black</option>
                </select>
            </div>
        </div>


        <div class='filler'></div>

        <div class='group buttons'>
            <span class='split'></span>
            <button onClick={on_delete_study} class='delete'>Delete <i data-icon=''></i></button>
        </div>
    </>)
}

export function EditChapterComponent(props: { fen: FEN, chapter: ModelChapter, nb_chapters: number, i_chapter: number, on_edit_chapter: (_: Partial<EntityChapterInsert>) => void, on_delete_chapter: () => void, on_order_chapter: (order: number) => void, on_change_root_fen: (fen: FEN) => void }) {

    const on_name_key_down = (key: string, e: HTMLInputElement) => {
        if (key === 'Escape') {
            e.value = props.chapter.name
        }
    }

    const on_name_changed = (e: HTMLInputElement) => {
        let name = e.value
        if (name.length < 3) {
            name = "New Chapter"
            e.value = name
        }
        props.on_edit_chapter({ id: props.chapter.id, name })
    }

    const on_order_changed = (value: string) => {
        let order = parseInt(value)
        props.on_order_chapter(order)
    }

    const on_delete_chapter = () => {
        props.on_delete_chapter()
    }

    const on_save_changes = () => {
        let fen = edited_fen()
        if (fen && props.fen !== fen) {
            props.on_change_root_fen(fen)
        }
    }

    const on_orientation_changed = (orientation: Color) => {
        props.on_edit_chapter({ id: props.chapter.id, orientation })
    }

    const orientation = createMemo(() => props.chapter.orientation)

    const [edited_fen, set_edited_fen] = createSignal<FEN | undefined>()

    const [tab, set_tab] = createSignal('editor')

    const isTab = createSelector(tab)

    const fen = createMemo(() => edited_fen() ?? props.fen)

    return (<>
        <h2>Edit Chapter</h2>

        <div class='group'>
        <label for='name'>Name</label>
        <input name="name" id="name" onKeyDown={e => on_name_key_down(e.key, e.currentTarget)} onChange={(e) => on_name_changed(e.currentTarget)} type="text" placeholder="Section Name" minLength={3} value={props.chapter.name}></input>
        </div>

        <div class='tabs-wrap'>
        <div class='tabs'>
            <div class='tab' classList={{active: isTab('empty') }} onClick={() => set_tab('empty')}>Empty</div>
            <div class='tab' classList={{ active: isTab('editor')} } onClick={() => set_tab('editor')}>Editor</div>
        </div>
        <div class='content'>
            <Show when={tab() === 'editor'}>
                <div class='group'>
                    <div class='editor-wrap'>
                        <BoardEditor initial_fen={fen()} on_change_fen={set_edited_fen} orientation={props.chapter.orientation ?? 'white'} />
                    </div>
                </div>
            </Show>
            <Show when={tab() === 'empty'}>
                <>
                </>
            </Show>
        </div>
        </div>

        <div class='section'>
            <div class='group'>
                <label for='order'>Set Order</label>
                <select onChange={e => on_order_changed(e.currentTarget.value)} name="order" id="order">
                    <For each={[...Array(props.nb_chapters).keys()]}>{(_, i) =>
                        <option value={i()} selected={props.i_chapter === i()}>{i() + 1}</option>
                    }</For>
                </select>
            </div>
            <div class='group'>
                <label for='orientation'>Set Orientation</label>
                <select onChange={e => on_orientation_changed(e.currentTarget.value as Color)} name="orientation" id="orientation">
                    <option value="white" selected={orientation() === "white"}>White</option>
                    <option value="black" selected={orientation() === "black"}>Black</option>
                </select>
            </div>
        </div>


        <div class='filler'></div>
        <div class='group buttons'>
            <button onClick={on_delete_chapter} class='delete'>Delete <i data-icon=''></i></button>
            <span class='split'></span>
            <button onClick={on_save_changes} class='create' disabled={fen() === undefined}>Save Changes</button>
        </div>
    </>)
}

export function EditSectionComponent(props: { section: ModelSection, i_section: number, nb_sections: number, on_delete_section: () => void, on_edit_section: (data: Partial<EntitySectionInsert>) => void, on_import_pgns: (pgns: PGN[], section_name: string) => void , on_order_section: (order: number) => void}) {

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
        props.on_edit_section({ id: props.section.id, name })
    }

    const on_order_changed = (value: string) => {
        let order = SECTION_LETTERS.indexOf(value)
        props.on_order_section(order)
    }

    const on_delete_section = () => {
        props.on_delete_section()
    }

    const [tab, set_tab] = createSignal('lichess')

    const [import_pgn_text, set_import_pgn_text] = createSignal('')

    const import_pgns = createMemo(() => parse_PGNS(import_pgn_text()))

    const on_import_pgn = async () => {
        let pgns = import_pgns()
        if (!pgns) {
            return
        }
        props.on_import_pgns(pgns, props.section.name)
    }

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

    const on_orientation_changed = (orientation: Color) => {
        props.on_edit_section({ id: props.section.id, orientation })
    }

    const orientation = createMemo(() => props.section.orientation)

    const isActiveTab = createSelector(tab)

    return (<>
        <h2>Edit Section</h2>
        <div class='group'>
            <label for='name'>Name</label>
            <input name="name" id="name" onKeyDown={(e) => on_name_key_down(e.key, e.currentTarget)} onChange={(e) => on_name_changed(e.currentTarget)} type="text" placeholder="Section Name" minLength={3} value={props.section.name}></input>
        </div>



        <div class='tabs'>
            <div class={'tab'} classList={{ active: isActiveTab('empty') }} onClick={() => set_tab('empty')}>Empty</div>
            <div class={'tab'} classList={{ active: isActiveTab('lichess') }} onClick={() => set_tab('lichess')}>Import Lichess Study</div>
            <div class={'tab'} classList={{ active: isActiveTab('pgn') }}  onClick={() => set_tab('pgn')}>Import PGN</div>
        </div>
        <div class='content'>
            <Show when={isActiveTab('lichess')}>
                <div class='group'>
                <label for='name'>Import a Study from Lichess</label>
                <input class={import_lichess_disabled() ? 'error': 'success'} onKeyUp={(e) => set_import_study_text(e.currentTarget.value)} onChange={(e) => set_import_study_text(e.target.value)} name="name" id="name" type="text" placeholder="Lichess Study URL"></input>
                </div>
            </Show>
            <Show when={isActiveTab('pgn')}>
                <div class='group'>
                <label for='name'>Import from PGN</label>
                <textarea rows={10} onChange={(e) => set_import_pgn_text(e.target.value)} name="name" id="name" placeholder="Paste PGN here."></textarea>
                </div>
            </Show>
            <Show when={isActiveTab('empty')}>
                <>
                </>
            </Show>
        </div>


        <div class='section'>
            <div class='group'>
                <label for='order'>Set Order</label>
                <select onChange={e => on_order_changed(e.currentTarget.value)} name="order" id="order">
                    <For each={SECTION_LETTERS.slice(0, props.nb_sections)}>{(letter, i) => 
                        <option value={letter} selected={props.i_section === i()}>{letter}</option>
                    }</For>
                </select>
            </div>
            <div class='group'>
                <label for='orientation'>Set Orientation</label>
                <select onChange={e => on_orientation_changed(e.currentTarget.value as Color)} name="orientation" id="orientation">
                    <option value="white" selected={orientation() === "white"}>White</option>
                    <option value="black" selected={orientation() === "black"}>Black</option>
                </select>
            </div>
        </div>




        <div class='filler'></div>

        <div class='group buttons'>
            <span class='split'></span>
            <Show when={tab() === 'pgn'}>
                <Suspense fallback={
                    <button class='loading' disabled={true}>Loading ...</button>
                }>
                <button onClick={on_import_pgn} class='import' disabled={import_pgns() === undefined}>Import<i data-icon=''></i></button>
                </Suspense>
            </Show>

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
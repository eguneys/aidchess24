import { createMemo, For, on, Show, useContext } from "solid-js"
import { EntityPGNStudy, RepertoireDBProvider, RepertoiresDBContext } from "../components/idb_repository"
import { createDexieArrayQuery } from "./solid-dexie"
import { A, useNavigate } from "@solidjs/router"
import "./Show2.scss"
import { fen_turn } from "../chess_pgn_logic"
import { makePersistedNamespaced } from "../storage"
import { DueFilterKey } from "./types"

export default () => {
    return (<>
        <RepertoireDBProvider>
            <WithRepDb />
        </RepertoireDBProvider>
    </>)
}


const WithRepDb = () => {

    const rdb = useContext(RepertoiresDBContext)!

    const studies = createDexieArrayQuery(() => rdb.studies.toArray())

    const [i_selected_study, set_i_selected_study] = makePersistedNamespaced(0, 'dues.show')

    const selected_study = createMemo(() => studies[i_selected_study()])

    return (<>
    <main class='repeat-show'>
        <div class='studies'>
            <h3>Repertoires</h3>
                <div class='list-wrap'>
            <div class='list'>
                <For each={studies} fallback={
                    <A href="/repertoires">Import some studies first</A>
                }>{(study, i) =>
                    <div onClick={() => set_i_selected_study(i())} class={'study' + (i_selected_study() === i() ? ' active': '')}>{study.name}</div>
                }</For>
                </div>
                </div>
        </div>
            <Show when={selected_study()}>{study =>
                <StudySideView study={study()}></StudySideView>
            }</Show>

    </main>
    </>)
}

export const Due_Component = (section_ids: number[]) => {
    const rdb = useContext(RepertoiresDBContext)!
    let dues_with_moves = createDexieArrayQuery(async () => {
        let due_cards = await rdb.due_cards.where('section_id').anyOf(section_ids).toArray()

        return await Promise.all(due_cards.map(async due_card => {
            let ms = await rdb.moves.where('id').anyOf(due_card.move_ids).toArray()
            let section = (await rdb.sections.where('id').equals(due_card.section_id).first())!

            let moves = await Promise.all(ms.map(async _ => ({
                data: _.data,
                chapter: (await rdb.chapters.where('id').equals(_.chapter_id).first())!
            })))


            return {
                id: due_card.id,
                before_fen: due_card.before_fen,
                due: due_card.card.due.getTime(),
                section,
                moves
            }
        }))
    })
    
    return {
        get due() {
            return dues_with_moves.filter(_ => _.due <= new Date().getTime())
        },
        get due_white() {
            return this.due.filter(_ => fen_turn(_.before_fen) === 'white')
        },

        get due_black() {
            return this.due.filter(_ => fen_turn(_.before_fen) === 'black')
        },

        get due_10() {
            return this.due.filter(_ => _.moves[0]?.data.path.length <= 20)
        },

        get due_10_20() {
            return this.due.filter(_ => _.moves[0]?.data.path.length >= 20 && _.moves[0].data.path.length <= 40)
        },

        get due_20plus() {
            return this.due.filter(_ => _.moves[0]?.data.path.length >= 40)
        }

    }
}

export const PersistedSelectionComponent = (id: number) => {
    return makePersistedNamespaced<number[]>([], 'repeat.selected_sections.' + id)
}


const StudySideView = (props: { study: EntityPGNStudy }) => {

    const rdb = useContext(RepertoiresDBContext)!
    const sections = createDexieArrayQuery(() => 
        rdb.sections.where('study_id').equals(props.study.id).toArray())

    const selection_component = createMemo(() => PersistedSelectionComponent(props.study.id))
    const selected_sections = createMemo(() => selection_component()[0]())
    const set_selected_sections = (ids: number[]) => selection_component()[1](ids)

    const nb_selected_sections = createMemo(() => selected_sections().length)
    
    const add_section = (id: number) => {
        if (selected_sections().includes(id)) {
            set_selected_sections(selected_sections().filter(_ => _ !== id))
        } else {
            set_selected_sections([...selected_sections(), id])
        }
    }


    let ddc = createMemo(on(selected_sections, sections => Due_Component(sections)))

    const navigate = useNavigate()
    const on_play_due = (filter?: DueFilterKey) => {
        let id = props.study.id

        navigate('/repeat/' + id + (filter ? `?filter=${filter}` : ''))
    }



    return (<>
        <div class='study-side'>
            <div class='sections'>
            <h3>Sections</h3>
                <div class='list-wrap'>
                    <div class='list'>
                    <For each={sections}>{section =>
                        <div onClick={() => add_section(section.id)} class={'section' + (selected_sections().includes(section.id) ? ' selected' : '')}>{section.name}</div>
                    }</For>
                    </div>
                </div>
            </div>
            <div class='dues'>
                <Show when={nb_selected_sections() > 0} fallback={
                    <p> Please Select Some Sections </p>
                }>
                    <p>Selected {nb_selected_sections()} sections</p>
                    <div class='buttons'>
                    <button onClick={() => on_play_due('first-ten')}>First 10 moves <span>{ddc().due_10.length}</span></button>
                    <div class='small'>
                        <button onClick={() => on_play_due('ten-twenty')}>10-20 moves   <span>{ddc().due_10_20.length}</span></button>
                        <button onClick={() => on_play_due('twenty-plus')}>20+ moves <span>{ddc().due_20plus.length}</span></button>
                    </div>
                    <div class='small'>
                        <button onClick={() => on_play_due('white')}>White moves <span>{ddc().due_white.length}</span></button>
                        <button onClick={() => on_play_due('black')}>Black moves <span>{ddc().due_black.length}</span></button>
                    </div>
                    </div>
                </Show>
            </div>
        </div>
    </>)

}
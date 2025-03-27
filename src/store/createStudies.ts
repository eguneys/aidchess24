import { SetStoreFunction } from "solid-js/store";
import type { Agent } from "./createAgent";
import { type StoreActions, type StoreState } from './'
import { EntitySectionId, EntitySectionInsert, EntityStudyId, EntityStudyInsert, ModelChapter, ModelSection, ModelStudy, StudiesPredicate } from "./sync_idb_study";
import { batch, createSignal } from "solid-js";
import { _mergeSearchString, createAsync } from "@solidjs/router";
import { parse_PGNS, PGN } from "../components2/parse_pgn";
import { Color } from "chessops";

export function createStudies(agent: Agent, actions: Partial<StoreActions>, state: StoreState, setState: SetStoreFunction<StoreState>) {
    type Source = ["studies", StudiesPredicate] | ["study", EntityStudyId]
    const [source, set_source] = createSignal<Source>()


    let get_studies = async (value: Record<EntityStudyId, ModelStudy>) => {
        let s = source()

        if (s === undefined) {
            return {}
        }

        if (s[0] === "studies") {
            let res = await $req(s[1])
            return res.reduce<Record<EntityStudyId, ModelStudy>>((acc, study) => {
                acc[study.id] = study
                return acc
            }, {})

        }

        let study_id = s[1]
        let study = value[study_id]
        if (study) return value
        study = await agent.Studies.get(study_id)
        return {...value, [study_id]: study }
    }


    const studies = createAsync<Record<EntityStudyId, ModelStudy>>(get_studies, { initialValue: {} })

    function $req(pred: StudiesPredicate) {
        if (pred === 'mine') {
            return agent.Studies.mine()
        }
        if (pred === 'auto') {
            return agent.Studies.auto()
        }
        if (pred === 'featured') {
            return agent.Studies.featured()
        }
        return agent.Studies.all()
    }

    Object.assign(actions, {
        load_studies(predicate: StudiesPredicate) {
            set_source(['studies', predicate])
        },
        load_study(id: EntityStudyId) {
            set_source(['study', id])
        },
        async create_featured_once(id: EntityStudyId, version: number) {
            let study = await agent.Studies.create_featured_once(id, version)
            if (!study) {
                return undefined
            }
            setState("studies", { [study.id]: study })
            return study
        },
        async create_study() {
            let study = await agent.Studies.create()
            setState("studies", { [study.id]: study })
            return study
        },
        async delete_study(id: EntityStudyId) {
            const study = state.studies[id]
            setState("studies", { [id]: undefined })
            try {
                await agent.Studies.delete(id)
            } catch (err) {
                setState('studies', {[id]: study})
                throw err
            }
        },
        async update_study(data: Partial<EntityStudyInsert>) {
            await agent.Studies.update(data)
            setState("studies", data.id!, data)
        },
        async update_section(study_id: EntityStudyId, data: Partial<EntitySectionInsert>) {
            await agent.Studies.update_section(data)
            batch(() => {
                setState("studies", study_id, "sections", _ => _.id === data.id, data)
            })
        },
        async create_section(study_id: EntityStudyId, name?: string) {
            const section = await agent.Studies.create_section(study_id, name)

            batch(() => {
                setState("studies", study_id, (study) => ({
                    sections: [...study.sections, section]
                }))

                setState("studies", study_id, "section_ids", _ => [..._, section.id])
            })
            return section
        },
        async delete_section(study_id: EntityStudyId, id: EntitySectionId) {
            await agent.Studies.delete_section(study_id, id)

            batch(() => {

                setState("studies", study_id, "section_ids", _ => _.filter(_ => _ !== id))

                setState("studies", study_id, (study) => ({
                    sections: study.sections.filter(_ => _.id !== id)
                }))
            })
        },
        async order_sections(study_id: EntityStudyId, section_id: EntitySectionId, new_order: number) {
            await agent.Studies.order_sections(study_id, section_id, new_order)

            setState("studies", study_id, "section_ids", section_ids => {
                let old_order = section_ids.indexOf(section_id)
                section_ids.splice(old_order, 1)
                section_ids.splice(new_order, 0, section_id)

                return [...section_ids]
            })
        },
        async study_as_export_pgn(study_id: EntityStudyId) {
            let res = ''
            let study = await agent.Studies.get(study_id)

            for (let section_id of study.section_ids) {
                let section = study.sections.find(_ => _.id === section_id)!

                for (let chapter_id of section.chapter_ids) {
                    let chapter = section.chapters.find(_ => _.id === chapter_id)!

                    res += await actions.chapter_as_export_pgn!(study.name, section.name, chapter)
                    res += '\n\n'
                }
                
                res += '\n\n\n'
            }

            return res
        },
        async import_from_pgn(study: ModelStudy, default_section_name: string, pgns: PGN[], section?: ModelSection) {

            let study_name = study.name
            let sections: Record<string, [string, PGN][]> = {}
            actions.update_study!({ id: study.id, is_edits_disabled: true })

            for (let pgn of pgns) {
                let event = pgn.event!
                let [default_study_name, section_name, chapter_name] = event.split(':')

                if (!chapter_name) {
                    chapter_name = section_name
                    section_name = default_section_name
                }


                if (sections[section_name] === undefined) {
                    sections[section_name] = []
                }

                sections[section_name].push([chapter_name, pgn])
                study_name = default_study_name
            }

            await actions.update_study!({ id: study.id, name: study_name })

            let section_name = Object.keys(sections)[0]
            if (section) {
                await actions.update_section!(study.id, { id: section.id, name: section_name })
            }

            let s_chapter: ModelChapter | undefined = undefined
            let s_section: ModelSection | undefined = section

            for (section_name of Object.keys(sections)) {
                if (!section) {
                    section = await actions.create_section!(study.id, section_name)
                }

                let chapters = sections[section_name]
                console.log(sections, chapters)
                for (let [chapter_name, pgn] of chapters) {
                    s_chapter = await actions.create_chapter!(study.id, section!.id, chapter_name, pgn)
                }
                s_section = section
                section = undefined
            }

            if (s_section && s_chapter) {
                actions.update_study!({ id: study.id, selected_section_id: s_section.id })
                actions.update_section!(study.id, { id: s_section.id, selected_chapter_id: s_chapter.id })
            }
        },
        async populate_featured_studies_once() {
            await populate_featured_studies_once(agent, actions as StoreActions)
            actions.load_studies!('featured')
        }
    })

    return studies
}

type FeaturedStudyTemplate = {
    id: EntityStudyId,
    link: string,
    version: number,
    orientation?: Color
}

async function populate_featured_studies_once(agent: Agent, actions: StoreActions) {

    let featured_templates: FeaturedStudyTemplate[] = [
        {
            id: 'e4e5blackheroku',
            link: '/featured_pgns/lichess_study_1e4-e5-black-repertoire-introduction_by_heroku_2025.03.26.pgn',
            version: 1,
            orientation: 'black'
        },
        {
            id: 'e4e5whiteheroku',
            link: '/featured_pgns/lichess_study_1e4-white-repertoire-introduction_by_heroku_2025.03.26.pgn',
            version: 1,
            orientation: 'white'
        }
    ]

    let featured_existing = await agent.Studies.featured()

    await Promise.all(featured_existing.map(async existing => {
        let e_template = featured_templates.find(_ => _.id === existing.id)
        if (!e_template || e_template.version !== existing.version) {
            await actions.delete_study(existing.id)
        }
    }))

    await Promise.all(featured_templates.map(async e_template => {
        let existing = featured_existing.find(_ => _.id === e_template.id || _.version === e_template.version)
        if (!existing) {
            await create_featured_study_from_template(e_template)
        }
    }))

    async function create_featured_study_from_template(template: FeaturedStudyTemplate) {
        let study = await actions.create_featured_once(template.id, 0)
        if (study === undefined) {
            return
        }

        let { link, orientation, version } = template
        let pgns = await fetch(link).then(_ => _.text()).then(parse_PGNS)

        await actions.import_from_pgn(study, "New Section", pgns)

        if (orientation) {
            await actions.update_study({ id: study.id, orientation })
        }
        await actions.update_study({id: study.id, version})
    }

}
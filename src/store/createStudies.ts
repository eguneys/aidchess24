import { SetStoreFunction } from "solid-js/store";
import type { Agent } from "./createAgent";
import { type StoreActions, type StoreState } from './'
import { EntitySectionId, EntitySectionInsert, EntityStudyId, EntityStudyInsert, ModelStudy, section_sort_by_order, StudiesPredicate } from "../components/sync_idb_study";
import { batch, createSignal } from "solid-js";
import { createAsync } from "@solidjs/router";

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
        async update_study(data: EntityStudyInsert) {
            await agent.Studies.update(data)
            setState("studies", data.id!, data)
        },
        async update_section(study_id: EntityStudyId, data: EntitySectionInsert) {
            await agent.Studies.update_section(data)
            batch(() => {
                setState("studies", study_id, "sections", _ => _.id === data.id, data)
                setState("studies", study_id, "sections", _ => [..._.sort(section_sort_by_order)])
            })
        },
        async create_section(study_id: EntityStudyId) {
            const section = await agent.Studies.create_section(study_id)

            let study = state.studies[study_id]
            if (study) {
                setState("studies", study_id, (study) => ({
                    sections: [...study.sections, section].sort(section_sort_by_order)
                }))
            }
            return section
        },
        async delete_section(study_id: EntityStudyId, id: EntitySectionId) {
            await agent.Studies.delete_section(study_id, id)

            let study = state.studies[study_id]
            if (study) {
                setState("studies", study_id, (study) => ({
                    sections: study.sections.filter(_ => _.id !== id).sort(section_sort_by_order)
                }))
            }
        },
    })

    return studies
}

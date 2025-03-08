import { SetStoreFunction } from "solid-js/store";
import type { Agent } from "./createAgent";
import type { StoreActions, StoreState } from './'
import { EntityStudyId, ModelStudy, StudiesPredicate } from "../components/sync_idb_study";
import { createSignal } from "solid-js";
import { createAsync } from "@solidjs/router";

export function createStudies(agent: Agent, actions: StoreActions, state: StoreState, setState: SetStoreFunction<StoreState>) {
    type Source = ["studies", StudiesPredicate] | ["study", EntityStudyId]
    const [source, set_source] = createSignal<Source>()



    let get_articles = async (value: Record<EntityStudyId, ModelStudy>) => {
        let s = source()
        if (s === undefined) {
            return value
        }

        if (s[0] === "studies") {
            let res = await $req(s[1])
            return res.reduce<Record<EntityStudyId, ModelStudy>>((acc, study) => {
                acc[study.id] = study
                return acc
            }, {})

        }

        let study_id = s[1]
        let study = state.studies[study_id]
        if (study) return value
        study = await agent.Studies.get(study_id)
        return {...value, [study_id]: study }
    }


    const articles = createAsync<Record<EntityStudyId, ModelStudy>>(get_articles, { initialValue: {} })

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
        }
    })

    return articles
}
import { Accessor, createContext, useContext } from "solid-js";
import { JSX } from "solid-js";
import { createStore } from "solid-js/store";
import { createAgent } from "./createAgent";
import { EntityChapterId, EntitySectionId, EntityStudyId, ModelChapter, ModelStudy } from "../components/sync_idb_study";
import { createStudies } from "./createStudies";
import { createChapters } from "./createChapters";


export type StoreActions = {

}

export type StoreState = {
    studies: Record<EntityStudyId, ModelStudy>
    chapters: ModelChapter[],
    section_id?: EntitySectionId
    chapter_id?: EntityChapterId
}

export type Store = [StoreState, StoreActions]

const StoreContext = createContext<Store>()

export function Provider(props: { children: JSX.Element }) {

    let studies: Accessor<Record<EntityStudyId, ModelStudy>>,
    chapters: Accessor<ModelChapter[]>

    let [state, setState] = createStore<StoreState>({
        get studies() {
            return studies()
        },
        get chapters() {
            return chapters()
        }
    }),
    actions: StoreActions = {},
    store: Store = [state, actions],
    agent = createAgent(store)

    studies = createStudies(agent, actions, state, setState)
    chapters = createChapters(agent, actions, state, setState)

    return (<StoreContext.Provider value={store}>
        {props.children}
    </StoreContext.Provider>)
}

export function useStore() {
    return useContext(StoreContext)
}
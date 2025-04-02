import { createAsync } from "@solidjs/router";
import { Accessor, createContext, createSignal, useContext } from "solid-js";
import { JSX } from "solid-js";
import { createStore, SetStoreFunction } from "solid-js/store";

export type BlogId = string

export type ModelBlog = {
    id: BlogId
    date: number
    title: string
    content: string
}

type StoreActions = {
    load_blogs(): void
    load_blog(id: BlogId): void
}

type StoreState = {
    blogs: Record<BlogId, ModelBlog>
}


type BlogStore = [StoreState, StoreActions]

const BlogStoreContext = createContext<BlogStore>()

export function BlogStoreProvider(props: { children: JSX.Element }) {
    
    let blogs: Accessor<Record<BlogId, ModelBlog>>

    let [state, setState] = createStore<StoreState>({
        get blogs() {
            return blogs()
        }
    }),
    actions: Partial<StoreActions> = {},
    store: BlogStore = [state, actions as StoreActions]

    blogs = createBlogs(actions, state, setState)

    return (<BlogStoreContext.Provider value={store}>
        {props.children}
    </BlogStoreContext.Provider>)
}


export function useBlogStore() {
    return useContext(BlogStoreContext)!
}

function id_date_from_blog_id_date(id_date: BlogIdDate) {
    let [id, dmy] = id_date.split('_')

    let date = Date.parse(dmy)
    id = id.toLowerCase()

    return {id, date}
}

async function fetch_blog_id(id_date: BlogIdDate, title: string): Promise<ModelBlog> {
    let content = await fetch(`/blog/${id_date}.md`).then(_ => _.text())

    let {id, date} = id_date_from_blog_id_date(id_date)

    return {
        id,
        title,
        content,
        date
    }
}

type BlogIdDate = string

function createBlogs(actions: Partial<StoreActions>, _state: StoreState, _setState: SetStoreFunction<StoreState>) {

    const all_blogs = [
        ["60-Games-Tactical_02-04-25", "List of 60 Games by Masters with Tactical Importance"]
    ]

    let [source, set_source] = createSignal<BlogIdDate | "all">()

    let blogs = createAsync<Record<BlogId, ModelBlog>>(async (value?: Record<BlogId, ModelBlog>): Promise<Record<BlogId, ModelBlog>> => {
        let s = source()

        if (s === undefined) {
            return {}
        }
        if (s === "all") {
            let all = await Promise.all(all_blogs.map(([id, title]) => fetch_blog_id(id, title)))
            return all.reduce<Record<BlogId, ModelBlog>>((acc, blog) => {
                acc[blog.id] = blog
                return acc
            }, {})
        }


        let blog = all_blogs.find(_ => 
            id_date_from_blog_id_date(_[0]).id === s
        )!
        return { ...value, [s]: await fetch_blog_id(blog[0], blog[1]) } 

    }, { initialValue: {}})

    Object.assign(actions, {
        load_blogs() {
            set_source("all")
        },
        load_blog(id: BlogId) {
            set_source(id)
        }
    })

    return blogs
}
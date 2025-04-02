import { createMemo, Suspense } from "solid-js"
import { BlogId, useBlogStore } from "./store"
import { useParams } from "@solidjs/router"
import * as showdown from 'showdown'
import { formatDateLongMonth } from "./List"
import './Show.scss'

export default () => {

    let [,{load_blog}] = useBlogStore()

    let params = useParams()
    load_blog(params.id)

    return (<>
    <main class='blog-show'>
        <Suspense fallback={<>Loading...</>}>
            <BlogView id={params.id} />
        </Suspense>
    </main>
    </>)
}

function BlogView(props: { id: BlogId }) {
    let [state] = useBlogStore()

    const blog = () => state.blogs[props.id]

    let converter = new showdown.Converter()

    const date = createMemo(() => formatDateLongMonth(new Date(blog()?.date)))

    const md = createMemo(() => blog()?.content ?? '')

    const html = createMemo(() => converter.makeHtml(md()))

    return (<>
        <div class='blog'>
            <h1>{blog()?.title}</h1>
            <span class='date'>{date()}</span>
            <div class='content' innerHTML={html()}></div>
        </div>
    </>)
}
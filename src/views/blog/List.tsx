import { For, Suspense } from "solid-js"
import { ModelBlog, useBlogStore } from "./store"
import './List.scss'
import { A } from "@solidjs/router"

export default () => {

    let [,{ load_blogs }] = useBlogStore()

    load_blogs()

    return (<>
    <main class='blog-list'>
        <BlogList />
    </main>
    </>)
}

function BlogList() {
    let [state] = useBlogStore()

    return (<>
        <h1>Aidchess Blog</h1>
        <Suspense fallback={<>Loading ...</>}>
            <ul class='list'>
                <For each={Object.values(state.blogs)}>{blog =>
                    <li class='blog-item'><BlogPreview blog={blog} /></li>
                }</For>
            </ul>
        </Suspense>
    </>)
}

export function formatDateLongMonth(date: Date) {
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

function BlogPreview(props: { blog: ModelBlog }) {


    return (<>
    <div class='blog-preview'>

        <A href={`/blog/${props.blog.id}`}> <span class='content'>{props.blog.title}</span> </A>
            <span class='date'>{formatDateLongMonth(new Date(props.blog.date))}</span>
    </div>
    </>)
}
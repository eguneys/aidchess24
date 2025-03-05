import { createEffect, createMemo, createResource, on, Show, Suspense, useContext } from "solid-js"
import { StudiesDBContext, StudiesDBProvider } from "../../components/sync_idb_study"
import { useParams, useSearchParams } from "@solidjs/router"
import { RepeatShowType } from "./List"
import { PlayUciBoard, PlayUciComponent } from "../../components/PlayUciComponent"
import { Color } from "chessops"
import { PlayUciTreeReplayComponent } from "../../components/ReplayTreeComponent"
import { arr_rnd } from "../../random"
import './Show.scss'

export default () => {
    return (<>
    <StudiesDBProvider>
            <ShowComponent />
    </StudiesDBProvider>
    </>)
}

function ShowComponent() {
    let db = useContext(StudiesDBContext)!

    let [searchParams] = useSearchParams()
    let repeat_type: RepeatShowType = (searchParams.filter ?? 'white') as RepeatShowType

    let params = useParams()

    let [study] = createResource(() => db.study_by_id(params.id))
    let [repeat_study] = createResource(async () => {
        let res = await db.get_or_new_repeat_study(params.id)


        return res
    })

    createEffect(on(repeat_study, (r) => {
        if (!r) {
            return
        }
        r.create_effects_listen_load_db(db)
    }))

    const play_uci = PlayUciComponent()

    const filtered_dues = createMemo(() => {
        let r = repeat_study()
        if (!r) {
            return undefined
        }

        switch (repeat_type) {
            case 'first-ten': return r.due_first_ten
            case 'ten-twenty': return r.due_ten_twenty
            case 'twenty-plus': return r.due_twenty_plus
            case 'white': return r.due_white
            case 'black': return r.due_black
        }
    })

    const filter_title = () => {
        switch (repeat_type) {
            case 'first-ten': return 'First Ten'
            case 'ten-twenty': return 'First Ten to Twenty'
            case 'twenty-plus': return 'Twenty Plus'
            case 'white': return 'White'
            case 'black': return 'Black'
        }
    }

    const one_random_due = createMemo(() => {
        let res = filtered_dues()

        if (res === undefined) {
            return undefined
        }
        return arr_rnd(res)
    })

    const [play_replay] = createResource(() => one_random_due()?.node.tree_id, db.play_replay_by_steps_tree_id)

    const color = () => 'white' as Color
    const movable = () => true


    return (<>
    <main class='repeat-show'>
        <Suspense fallback={
            <div class='Loading ...'></div>
        }>

        <div class='header'>
            <div class='title'>{study()?.name}</div>
            <div class='filter'><span class='label'>Filter:</span> 
                <span class='value'>{filter_title()}</span> moves
            </div>
            <div class='due-moves'><span class='label'>Due:</span> 
                <span class='value'>{filtered_dues()?.length}</span> moves left
            </div>
        </div>
        <div class='board-wrap'>
            <PlayUciBoard color={color()} movable={movable()} play_uci={play_uci}/>
        </div>
        <div class='replay-wrap'>
            <Show when={play_replay()} fallback={
                <span>Great; No due moves at this time.</span>
            }>{ play_replay =>
            <>
                <PlayUciTreeReplayComponent play_replay={play_replay()} />
                <div class="controls">
                    <button>Hint: Show Previous Moves</button>
                    <button>Show Answer</button>
                </div>
            </>
            }</Show>
        </div>
        <div class='underboard'>

        </div>
        </Suspense>

    </main>
    </>)

}
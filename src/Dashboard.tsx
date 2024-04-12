import { For, createSignal } from 'solid-js'
import './Dashboard.scss'
import { Dynamic } from 'solid-js/web'
import { RepertoiresFixture } from './studyrepo'
import { DashboardRepertoireStats } from './repertoire_store'
import { useNavigate } from '@solidjs/router'
import SessionStore from './SessionStore'

type ShowType = 'hidden' | '101' | 'keep up' | 'good' | 'done'

class DashboardStatsView {

    stats: DashboardRepertoireStats

    constructor(readonly study_name: string, readonly study_link: string) {
        this.stats = new DashboardRepertoireStats(study_link)

    }

    get progress() {
        return this.stats.progress
    }

    get show_type(): ShowType {
        if (this.progress < 1) {
            return 'hidden'
        }
        if (this.progress < 10) {
            return '101'
        }
        if (this.progress < 60) {
            return 'keep up'
        }
        if (this.progress < 80) {
            return 'good'
        }
        return 'done'
    }

    get sections() {
        return this.stats.sections_progress
            .filter(_ => _[1] > 1)
            .sort((a, b) => b[1] - a[1])
    }
}

const Dashboard = () => {

    let navigate = useNavigate()

    let dashboard_stats_views = RepertoiresFixture.openings
    .filter(_ => _.study_link !== '')
    .map(_ => new DashboardStatsView(_.study_name, _.study_link))
    .filter(_ => _.show_type !== 'hidden')

    const navigate_study = (study: string, i_section?: string) => {
        SessionStore.i_section = i_section
        navigate(`/openings/${study}`)
    }

    return (<>
    <div class='dashboard'>
        <h1> Dashboard </h1>
        <h2> Activities </h2>
        <div class='activities'>
            <For each={dashboard_stats_views}>{stats =>
                <div class='activity'>
                    <h3 onClick={_ => navigate_study(stats.study_link)}> {stats.study_name} <span class='show_type'>- {stats.show_type} -</span> <small>{stats.progress}%</small> </h3>
                    <For each={stats.sections}>{ section => 
                       <p onClick={_ => navigate_study(stats.study_link, section[0])}> {section[0]} <small>{section[1]}%</small></p>
                    }</For>
                </div>
            }</For>
        </div>

    </div>
    </>)
}



type TabType = 'openings' | 'masters' | 'endgames' | 'tactics'

// @ts-ignore
const DashboardOld = () => {

    const [active_tab, set_active_tab] = createSignal<TabType>('openings')

    const active_if = (tab: string) => {
        if (active_tab() === tab) {
            return 'active'
        }
        return ''
    }

    return (<>
    <div class='dashboard'>
        <div class='tabs'>
            <div onClick={() => set_active_tab('openings')} class={active_if('openings')}>Openings</div>
            <div onClick={() => set_active_tab('masters')} class={active_if('masters')}>Masters</div>
            <div onClick={() => set_active_tab('endgames')} class={active_if('endgames')}>Endgames</div>
            <div onClick={() => set_active_tab('tactics')} class={active_if('tactics')}>Tactics</div>
        </div>
        <div class='content'>
            <Dynamic component={contents[active_tab()]}/>
        </div>
    </div>
    </>)
}



const Openings = () => {
    return (<>
    Openings
    </>)
}

const Masters = () => {
    return (<>
    Masters
    </>)
}

const Endgames = () => {
    return (<>
    Endgames
    </>)
}

const Tactics = () => {
    return (<>
    Tactics
    </>)
}


// @ts-ignore
const Progress = (props: { width: number }) => {
    return (
                        <div class='progress'>
                            <div class='bar' style={`width: ${props.width}%;`}></div>
                        </div>
    )
}

// @ts-ignore
const ProgressPassFail = (props: { pass: number, fail: number }) => {
    return (
                        <div class='progress'>
                            <div class='bar pass' style={`width: ${props.pass}%;`}></div>
                            <div class='bar fail' style={`width: ${props.fail}%;`}></div>
                        </div>
    )
}



const contents = {
    openings: Openings,
    masters: Masters,
    endgames: Endgames,
    tactics: Tactics
}




export default Dashboard
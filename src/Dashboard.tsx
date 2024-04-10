import { createSignal } from 'solid-js'
import './Dashboard.scss'
import { Dynamic } from 'solid-js/web'

type TabType = 'openings' | 'masters' | 'endgames' | 'tactics'

const Dashboard = () => {

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
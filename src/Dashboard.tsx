import { For, createMemo, createSignal } from 'solid-js'
import './Dashboard.scss'
import { Dynamic } from 'solid-js/web'
import { OpeningsChapterStatStore } from './repertoire_store'
import { RepertoiresFixture } from './studyrepo'
import SessionStore from './SessionStore'
import { useNavigate } from '@solidjs/router'

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


class OpeningAllChaptersStats {

    chapters: OpeningsChapterStatStore[]

    constructor(readonly study_id: string) {
        let { nb_chapters } = RepertoiresFixture.study_by_id(study_id)
        this.chapters = [...Array(nb_chapters).keys()].map(i_chapter =>
        new OpeningsChapterStatStore(study_id, i_chapter))
    }

    get all_sections() {
        return this.make_openings_section_stats(0, this.chapters.length)
    }

    get sections() {
        let res = []
        let i = 0
        while (true) {
            if (i + 4 >= this.chapters.length) {
                res.push(this.make_openings_section_stats(i, this.chapters.length))
                return res
            } else {
                res.push(this.make_openings_section_stats(i, i+4))
                i += 4
            }
        }
    }

    make_openings_section_stats(s: number, e: number) {
        let section = s / 4
        let nb_chapters = e - s

        let practice: number | undefined
        let quiz_pass = 0
        let quiz_fail = 0
        let deathmatch_pass = 0
        let deathmatch_fail = 0
        let i_minimum_practice = 0

        this.chapters.slice(s, e).forEach((_, i) => {

            if (practice === undefined || _.practice_progress < practice) {
                practice = _.practice_progress
                i_minimum_practice = s + i
            }

            quiz_pass += _.quiz_pass
            quiz_fail += _.quiz_fail
            deathmatch_pass += _.dm_pass
            deathmatch_fail += _.dm_fail

        })

        return new OpeningSectionStats(section,
            practice!,
            quiz_pass,
            quiz_fail,
            deathmatch_pass,
            deathmatch_fail,
            i_minimum_practice,
            nb_chapters)
    }
}


class OpeningSectionStats {

    constructor(readonly section: number,
        readonly practice: number,
        readonly quiz_pass: number,
        readonly quiz_fail: number,
        readonly deathmatch_pass: number,
        readonly deathmatch_fail: number,
        readonly i_minimum_practice: number,
        readonly nb_chapters: number = 4) {

    }

    get practice_threshold() {
        if (this.practice === 100) {
            return 100
        } else if (this.practice > 90) {
            return 90
        } else if (this.practice > 60) {
            return 60
        } else if (this.practice > 30) {
            return 30
        }
        return 0
    }

    get low_chapter() {
        return this.section * 4 + 1
    }

    get high_chapter() {
        return this.low_chapter + this.nb_chapters - 1
    }

    get quiz_attempted() {
        return this.quiz_pass + this.quiz_fail
    }

    get deathmatch_attempted() {
        return this.deathmatch_pass + this.deathmatch_fail
    }
}

const Openings = () => {

    const navigate = useNavigate()
    const studies = RepertoiresFixture.openings.filter(_ => _.study_link !== '')
    const [active_study_id, set_active_study_id] = createSignal(RepertoiresFixture.all[0].study_link)

    const active_study = createMemo(() => RepertoiresFixture.study_by_id(active_study_id()))

    const chapters_stats = createMemo(() => new OpeningAllChaptersStats(active_study_id()))

    const all_sections = createMemo(() => chapters_stats().all_sections)
    const sections = createMemo(() => chapters_stats().sections)

    const active_study_if = (id: string) => {
        if (active_study_id() === id) {
            return 'active'
        }
        return ''
    }

    const navigate_to_chapter = (i_chapter: number) => {
        SessionStore.i_chapter = i_chapter
        navigate(`/openings/${active_study_id()}`)
    }

    return (<>
    <div class='openings'>
        <div class='list'>
            <For each={studies}>{study => 
                    <div class={active_study_if(study.study_link)} onClick={() => set_active_study_id(study.study_link)}>{study.study_name}</div>
            }</For>
        </div>

        <div class='one'>
                <h2>{active_study().study_name}</h2>
                <div class='challenges'>

                    <div class='challenge-wrap'>
                    <div class='title'>
                      <h3 onClick={() => navigate_to_chapter(0) } >All Chapters</h3>
                      <span>{all_sections().practice_threshold}%</span>
                    </div>
                    <div onClick={() => navigate_to_chapter(all_sections().i_minimum_practice)} class='practice'>
                        <h4>Practice
                        <small> (The minimum progress of all chapters) </small>
                        </h4>
                        <ul>
                            <li style="width: 30%">30%</li>
                            <li style="width: 30%">60%</li>
                            <li style="width: 30%">90%</li>
                            <li style="width: 10%">100%</li>
                        </ul>
                        <Progress width={all_sections().practice}/>

                    </div>
                    <div class='quiz-wrap'>

                    <div class='deathmatch'>
                        <h4>Deathmatch</h4>
                        <button>Play Deathmatch on All Chapters</button>
                        <div class='stats'>
                        <span>Attempted: {all_sections().deathmatch_attempted}/100</span>
                        <div>
                        <span class='passed'>Passed: {all_sections().deathmatch_pass}/{all_sections().deathmatch_attempted}</span>
                        <span class='failed'>Failed: {all_sections().deathmatch_fail}/{all_sections().deathmatch_attempted}</span>
                        </div>
                        </div>

                        <ProgressPassFail pass={all_sections().deathmatch_pass} fail={all_sections().deathmatch_fail}/>
                    </div>
                    <div class='quiz'>
                        <h4>Quiz</h4>
                        <button>Take Quiz on All Chapters</button>
                        <div class='stats'>
                        <span>Attempted: {all_sections().quiz_attempted}/100</span>
                        <div>
                        <span class='passed'>Passed: {all_sections().quiz_pass}/{all_sections().quiz_attempted}</span>
                        <span class='failed'>Failed: {all_sections().quiz_fail}/{all_sections().quiz_attempted}</span>
                        </div>
                        </div>

                        <ProgressPassFail pass={all_sections().quiz_pass} fail={all_sections().quiz_fail}/>
                    </div>
                    </div>
                    </div>

                    <For each={sections()}>{ section => 
                    <div class='challenge-wrap'>
                        <div class='title'>
                           <h3  onClick={() => navigate_to_chapter(section.low_chapter - 1) }>Chapters {section.low_chapter}-{section.high_chapter}</h3>
                           <span>{all_sections().practice_threshold}%</span>
                        </div>
                    <div onClick={() => navigate_to_chapter(section.i_minimum_practice) } class='practice'>
                        <h4>Practice</h4>
                        <ul>
                            <li style="width: 30%">30%</li>
                            <li style="width: 30%">60%</li>
                            <li style="width: 30%">90%</li>
                            <li style="width: 10%">100%</li>
                        </ul>
                        <Progress width={section.practice}/>

                    </div>
                    <div class='quiz-wrap'>

                    <div class='deathmatch'>
                        <h4>Deathmatch</h4>
                        <button>Play Deathmatch on Chapters {section.low_chapter}-{section.high_chapter}</button>
                        <div class='stats'>
                        <span>Attempted: {section.deathmatch_attempted}/100</span>
                        <div>
                        <span class='passed'>Passed: {section.deathmatch_pass}/{section.deathmatch_attempted}</span>
                        <span class='failed'>Failed: {section.deathmatch_fail}/{section.deathmatch_attempted}</span>
                        </div>
                        </div>

                        <ProgressPassFail pass={section.deathmatch_pass} fail={section.deathmatch_fail}/>
                    </div>
                    <div class='quiz'>
                        <h4>Quiz</h4>
                        <button>Take Quiz on Chapters {section.low_chapter}-{section.high_chapter}</button>
                        <div class='stats'>
                        <span>Attempted: {section.quiz_attempted}/100</span>
                        <div>
                        <span class='passed'>Passed: {section.quiz_pass}/{section.quiz_attempted}</span>
                        <span class='failed'>Failed: {section.quiz_fail}/{section.quiz_attempted}</span>
                        </div>
                        </div>

                        <ProgressPassFail pass={section.quiz_pass} fail={section.quiz_fail}/>
                    </div>
                    </div>
                    </div>
                    }</For>
                </div>
        </div>
    </div>
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


const Progress = (props: { width: number }) => {
    return (
                        <div class='progress'>
                            <div class='bar' style={`width: ${props.width}%;`}></div>
                        </div>
    )
}

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
import './Challenges.scss'
import { Accessor, createEffect, createMemo, createResource, createSignal, For, mapArray, on, Show, Signal } from "solid-js"
import { makePersistedNamespaced } from './storage';

const str_hash = (str: string) => {
    var hash = 0, i = 0, len = str.length;
    while (i < len) {
        hash = ((hash << 5) - hash + str.charCodeAt(i++)) << 0;
    }
    return hash + 2147483647 + 1;
}


const getOpenings = (): Promise<Opening[]> => 
    Promise.all([
        fetch('openings/a.tsv').then(_ => _.text()),
        fetch('openings/b.tsv').then(_ => _.text()),
        fetch('openings/c.tsv').then(_ => _.text()),
        fetch('openings/d.tsv').then(_ => _.text()),
        fetch('openings/e.tsv').then(_ => _.text())])
        .then(_ => _.flatMap(_ => _.trim().split('\n').slice(1).map(_ => {
            let [eco, name, pgn] = _.split('\t')
            let id = str_hash(name + pgn)
            return { id, eco, name, pgn }
        })))

type Opening = {
    id: number,
    eco: string,
    name: string,
    pgn: string
}

export default () => {

    const [openings] = createResource(getOpenings)


    return (<>
    <Show when={openings.loading || !openings()} fallback={
        <>
        <Challenges openings={openings()!}/>
        </>
    }>
        <span>Loading...</span>
    </Show>
    </>)
}

class _OpeningsStore {

    _filter_tab: Signal<string>
    _favorites: Signal<number[]>
    
    get filter_tab() {
        return this._filter_tab[0]()
    }

    set filter_tab(_: string) {
        this._filter_tab[1](_)
    }

    get favorites() {
        return this._favorites[0]()
    }

    is_favorite(_: Opening) {
        return this.favorites.includes(_.id)
    }

    add_favorite(_: Opening) {
        let favs = this.favorites

        favs = favs.filter(f => f !== _.id)
        favs.push(_.id)

        this._favorites[1](favs)
    }

    remove_favorite(_: Opening) {
        let favs = this.favorites

        favs = favs.filter(f => f !== _.id)

        this._favorites[1](favs)
    }

    constructor() {

        this._filter_tab = makePersistedNamespaced('all', 'challenges.filter_tab')

        let favs: number[] = []
        this._favorites = makePersistedNamespaced(favs, 'challenges.favorites')
    }
}

const OpeningsStore = new _OpeningsStore()

type Achievement = {
    opening_id: number,
    level: string,
    time: string,
    color: string,
    unprepared?: boolean,
    nb_blunder: number,
    nb_mistake: number,
    nb_moves: number
}

class OpeningExtra {

    achievements!: Accessor<Achievement[]>
    is_favorite!: Accessor<boolean>

    clear_stats() {

    }

    add_to_favorites() {
        OpeningsStore.add_favorite(this.opening)
    }

    remove_from_favorites() {
        OpeningsStore.remove_favorite(this.opening)
    }

    get eco() {
        return this.opening.eco
    }

    get name() {
        return this.opening.name
    }

    get pgn() {
        return this.opening.pgn
    }

    get id() {
        return this.opening.id
    }

    constructor(readonly opening: Opening) {
        this.achievements = createMemo(() => [])
        this.is_favorite = createMemo(() => OpeningsStore.is_favorite(opening))
    }
}

const Challenges = (props: { openings: Opening[] }) => {

    const filter = createMemo(() => OpeningsStore.filter_tab)
    const set_filter = (_: string) => OpeningsStore.filter_tab = _

    const [sort, set_sort] = createSignal()

    const openings_extra = createMemo(mapArray(() => props.openings, _ => new OpeningExtra(_)))

    const list = createMemo(() => {
        let res = openings_extra()
        
        if (filter() === 'fav') {
            res = res.filter(_ => _.is_favorite())
        }

        if (sort() === 'achievements') {
            res.sort((a, b) => b.achievements().length - a.achievements().length)
        }

        return res
    })



    const [selected_id, set_selected_id] = createSignal(list()[0]?.id)

    const selected_opening = createMemo(() => list().find(_ => _.id === selected_id()))

    createEffect(on(filter, () => {
        set_selected_id(list()[0]?.id)
    }))

    return (<>
    <div class='challenges'>
        <div class='list'>
            <div class='filter'>
                <span>Filter:</span>
                <span class='all'>
                    <span class={filter() ==='all' ? 'active': ''} onClick={() => set_filter('all')}>All</span>
                    <span class={filter() ==='fav' ? 'active': ''} onClick={() => set_filter('fav')}>Favorites</span>
                </span>
            </div>
            <div class='table-wrap'>
                <div class='head'>
                    <span>ECO</span>
                    <span>NAME</span>
                    <span>PGN</span>
                    <span onClick={() => sort() === undefined ? set_sort('achievements'): set_sort()}>ACHIEVEMENTS</span>
                </div>
                <div class='body'>
                    <Show when={list().length === 0} fallback={
                        <For each={list()}>{opening => 
                            <div onClick={() => set_selected_id(opening.id)} class={'row' + (selected_id()=== opening.id ? ' active': '')}>
                                <span>{opening.eco}</span>
                                <span>{opening.name}</span>
                                <span>{opening.pgn}</span>
                                <span>0</span>
                            </div>
                        }</For>
                    }>
                        <h3>There are no favorite openings.</h3>
                        </Show>
                </div>
            </div>
        </div>
        <div class='details'>
                <Show when={selected_opening()}>{opening =>
                    <DetailsView opening={opening().opening} />
                }</Show>
            </div>
    </div>
    </>)
}


const DetailsView = (props: { opening: Opening }) => {

    let opening = createMemo(() => new OpeningExtra(props.opening))

    createEffect(() => {
        console.log(opening().is_favorite())
    })

    return (<>
      <div class='opening'>
        <div class='header'>
            <h3>{opening().eco}</h3>
            <h3 class='name'>{opening().name}</h3>
            <Show when={opening().is_favorite()} fallback={
                <button onClick={() => opening().add_to_favorites()}>Add to Favorites</button>
            }>
                <button onClick={() => opening().remove_from_favorites()}>Remove from Favorites</button>
            </Show>
        </div>
        <div class='pgn'>
            <span>{opening().pgn}</span>
        </div>
        <div class='achievements'>
            <h3>Achievements (<span>{opening().achievements().length}</span>)</h3>
            <div class='ul-wrap'>
            <ul>
                <For each={opening().achievements()}>{ achievement => 
                    <li><AchievementView achievement={achievement}/></li>
                }</For>
            </ul>
            </div>
        </div>
        <div class='settings'>
            <small class='clear' onClick={() => opening().clear_stats()}>Clear Achievements</small>
        </div>
        <div class='challenge'>
            <h3>Challenge Stockfish</h3>
                <div class='controls'>
                    <div class='labels'>
                        <label for='level'>Level:</label>
                        <label for='time'>Time Control:</label>
                        <label for='color'>Color:</label>
                    </div>
                    <div class='selects'>
                        <select id='level' name='level'>
                            <option value='5'>Level 5</option>
                            <option value='6'>Level 6</option>
                            <option value='7'>Level 7</option>
                            <option value='8'>Level 8</option>
                        </select>
                        <select id='time' name='time'>
                            <option value='blitz'>Blitz</option>
                            <option value='rapid'>Rapid</option>
                            <option value='classical'>Classical</option>
                        </select>
                        <select id='color' name='color'>
                            <option value='white'>White</option>
                            <option value='black'>Black</option>
                        </select>
                    </div>
                </div>
                <div class='buttons'>
                  <button>Challenge This Opening</button>
                  <button>Challenge an Unprepared Opening</button>
                </div>
        </div>
      </div>
    </>)
}


const AchievementView = (_props: { achievement: Achievement }) => {
    return (<>
    hello
    </>)
}
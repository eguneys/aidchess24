import { Route, A, useLocation, HashRouter, useBeforeLeave } from "@solidjs/router";
import { createMemo, createSignal, lazy } from 'solid-js'
import { MetaProvider } from '@solidjs/meta'
import './App.scss'
import { PlayerProvider } from "./sound";

const Home = lazy(() => import('./Home'))
const Repertoires = lazy(() => import('./Repertoires'))
const Contact = lazy(() => import('./Contact'))

const Repertoire = lazy(() => import('./Repertoire'))
const Masters = lazy(() => import('./Masters'))
const Tactics = lazy(() => import('./Tactics'))
const Endgames = lazy(() => import('./Endgames'))
const Dashboard = lazy(() => import('./Dashboard'))
const Explorer = lazy(() => import('./Explorer'))

const Shalala = lazy(() => import('./Shalala'))
const SixthDraw = lazy(() => import('./SixthDraw'))

const Beta = lazy(() => import('./Beta'))


export const MyApp = () => {
    return (<>
    
        <MetaProvider>
        <PlayerProvider>
            <HashRouter root={AppInRouter}>
              <Route path='/' component={Home}/>
              <Route path='/shalala' component={Shalala}/>
              <Route path='/sixth' component={SixthDraw}/>

              <Route path='/beta' component={Beta}/>
              <Route path='/explorer' component={Explorer}/>
              <Route path='/repertoires' component={Repertoires}/>
              <Route path='/openings/:id' component={Repertoire}/>
              <Route path='/masters/:id' component={Masters}/>
              <Route path='/tactics/:id' component={Tactics}/>
              <Route path='/endgames/:id' component={Endgames}/>
              <Route path='/contact' component={Contact}/>
              <Route path='/terms' component={Contact}/>
              <Route path='/privacy' component={Contact}/>
              <Route path='/about' component={Contact}/>
              <Route path='/donate' component={Contact}/>
              <Route path='/thanks' component={Contact}/>
              <Route path='/dashboard' component={Dashboard}/>
            </HashRouter>
        </PlayerProvider>
        </MetaProvider>
    </>)
}


const AppInRouter = (props: any) => {

  let location = useLocation()
  let pathname = createMemo(() => location.pathname.split('/')[1])

  const path_klass = () => {
    let p = pathname()
    return `on-${p === '' ? 'home' : p}`
  }

  const [is_checked, set_checked] = createSignal(false, { equals: false })
  useBeforeLeave(() => {
    set_checked(false)
  })

    return (<>
      <header id='top'>
          <div class='site-title-nav'>

          <input checked={is_checked()} type='checkbox' id='tn-tg' class='topnav-toggle fullscreen-toggle'></input>
          <label for='tn-tg' class='fullscreen-mask'></label>
          <label for='tn-tg' class='hbg'>
            <span class='hbg__in'></span>
          </label>
          <h1 class='site-title'><A href='/'>aidchess.com</A> <small><A class='beta' href='/beta'>beta</A></small> </h1>

          <nav id='topnav'>
            <section><A class='home' href='/'>aidchess.com</A></section>
            <section><A href='/explorer'>Explorer</A></section>
            <section><A href='/repertoires'>Repertoires</A></section>
            <section><A class="site-title-nav__donate" href='/donate'>Donate</A></section>
          </nav>
          </div>

          <div class='site-buttons'>
            <div class='dasher'>
            <A href='/dashboard'>Dashboard</A>
            </div>
          </div>
      </header>
      <div class={'main-wrap ' + path_klass()}>
        <div class='main'>
          {props.children}
        </div>
      </div>
    </>)
}

export default MyApp
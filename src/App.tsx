import { hashIntegration, Router, Routes, Route, A, useLocation } from "@solidjs/router";
import { createMemo, lazy } from 'solid-js'
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
const Shalala = lazy(() => import('./Shalala'))
const SixthDraw = lazy(() => import('./SixthDraw'))
const Dashboard = lazy(() => import('./Dashboard'))


export const MyApp = () => {
    return (<>
    
    <Router source={hashIntegration()}>
        <MetaProvider>
        <PlayerProvider>
          <AppInRouter/>
        </PlayerProvider>
        </MetaProvider>
    </Router>
    </>)
}


const AppInRouter = () => {

  let location = useLocation()
  let pathname = createMemo(() => location.pathname.split('/')[1])

  const path_klass = () => {
    let p = pathname()
    return `on-${p === '' ? 'home' : p}`
  }

    return (<>
      <header id='top'>
          <div class='site-title-nav'>

          <input type='checkbox' id='tn-tg' class='topnav-toggle fullscreen-toggle'></input>
          <label for='tn-tg' class='fullscreen-mask'></label>
          <label for='tn-tg' class='hbg'>
            <span class='hbg__in'></span>
          </label>
          <h1 class='site-title'><A href='/'>aidchess.com</A></h1>

          <nav id='topnav'>
            <section><A class='home' href='/'>aidchess.com</A></section>
            <section><A href='/shalala'>Shalala</A></section>
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

          <Routes>
              <Route path='/' component={Home}/>
              <Route path='/shalala' component={Shalala}/>
              <Route path='/sixth' component={SixthDraw}/>
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
          </Routes>
        </div>
      </div>
    </>)
}

export default MyApp
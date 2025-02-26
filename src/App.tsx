import { Route, A, useLocation, useBeforeLeave, Router } from "@solidjs/router";
import { ErrorBoundary, Show, createMemo, createSignal, lazy } from 'solid-js'
import {  MetaProvider } from '@solidjs/meta'
import './App.scss'

const Home = lazy(() => import('./Home'))
const Repertoires = lazy(() => import('./Repertoires'))
const Contact = lazy(() => import('./Contact'))

const Repertoire = lazy(() => import('./Repertoire'))
const Masters = lazy(() => import('./Masters'))
const Tactics = lazy(() => import('./Tactics'))
const Endgames = lazy(() => import('./Endgames'))
const Dashboard = lazy(() => import('./Dashboard'))
const Explorer = lazy(() => import('./Explorer'))
const Challenges = lazy(() => import('./Challenges'))


const Widen = lazy(() => import('./Widen'))

const SixthDraw = lazy(() => import('./SixthDraw'))
const Builder = lazy(() => import('./Builder'))

const Beta = lazy(() => import('./Beta'))
const RepeatShow = lazy(() => import('./repeat/Show2'))
const RepeatDues = lazy(() => import('./repeat/PlayDues'))


export const MyApp = () => {
    return (<>
    
        <MetaProvider>
          <Router root={AppInRouter}>
            <Route path='/' component={Home}/>
            <Route path='/sixth' component={SixthDraw}/>

            <Route path='/builder' component={Builder}/>

            <Route path='/repeat' component={RepeatShow}/>
            <Route path='/repeat/:id' component={RepeatDues}/>
            <Route path='/widen' component={Widen}/>
            <Route path='/beta' component={Beta}/>
            <Route path='/explorer' component={Explorer}/>
            <Route path='/challenges' component={Challenges}/>
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
          </Router>
        </MetaProvider>
    </>)
}


const AppInRouter = (props: any) => {

  let location = useLocation()
  let pathname = createMemo(() => location.pathname.split('/')[1])

  const path_klass = () => {
    let p = pathname()
    return p === '' ? 'home' : p
  }

  const on_path_klass = () => {
    return `on-${path_klass()}`
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
            <section><A href='/builder' target="_self">Builder</A></section>
            <section><A href='/widen'>Widen</A></section>
            <section><A href='/repertoires'>Repertoires</A></section>
            <section><A href='/repeat'>Repeat</A></section>
            <section><A class="donate" href='/donate' target="_self">Donate</A></section>
          </nav>
          </div>

          <div class='site-buttons'>
            <div class='dasher'>
            <A href='/dashboard'>Dashboard</A>
            </div>
          </div>
      </header>
      <div class={'main-wrap ' + on_path_klass()}>
          <Show when={import.meta.env.DEV} fallback= {
            <ErrorBoundary fallback={_ => Beta()}>
              {props.children}
            </ErrorBoundary>
          }>
            {props.children}
          </Show>
      </div>
    </>)
}

export default MyApp

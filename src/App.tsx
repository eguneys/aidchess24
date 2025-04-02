import { Route, A, useLocation, useBeforeLeave, Router } from "@solidjs/router";
import { ErrorBoundary, Show, createMemo, createSignal, lazy } from 'solid-js'
import {  MetaProvider } from '@solidjs/meta'
import './App.scss'
import { PersistedStoreProvider, StoreProvider } from "./store";
import { StudiesDBProvider } from "./store/sync_idb_study";
import { BlogStoreProvider } from "./views/blog/store";
const Home = lazy(() => import('./Home'))
const Contact = lazy(() => import('./Contact'))
const Builder = lazy(() => import('./views/builder/Placeholder'))
const Beta = lazy(() => import('./Beta'))

const OpeningsList = lazy(() => import('./views/openings/List'))
const OpeningsShow = lazy(() => import('./views/openings/Show'))

const RepetitionList = lazy(() => import('./views/repetition/List'))
const RepetitionShow = lazy(() => import('./views/repetition/Show'))

const BlogList = lazy(() => import('./views/blog/List'))
const BlogShow = lazy(() => import('./views/blog/Show'))

export const MyApp = () => {
    return (<>
        <MetaProvider>
          <Router root={AppInRouterWithStore}>
            <Route path='/' component={Home}/>
            <Route path='/builder' component={Builder}/>
            {/*
            <Route path='/repetition' component={RepetitionList}/>
            <Route path='/repetition/:id' component={RepeatitionShow}/>
            */ }
            <Route path='/beta' component={Beta}/>
            <Route path='/openings' component={OpeningsList}/>
            <Route path='/openings/:id' component={OpeningsShow}/>
            <Route path='/repetition' component={RepetitionList}/>
            <Route path='/repetition/:id' component={RepetitionShow}/>
            <Route path='/blog' component={BlogList}/>
            <Route path='/blog/:id' component={BlogShow}/>
            <Route path='/contact' component={Contact}/>
            <Route path='/terms' component={Contact}/>
            <Route path='/privacy' component={Contact}/>
            <Route path='/about' component={Contact}/>
            <Route path='/donate' component={Contact}/>
            <Route path='/thanks' component={Contact}/>
            <Route path="*" component={NotFound}/>
          </Router>
        </MetaProvider>
    </>)
}

const NotFound = () => {
  return (<>
    <main class='not-found'>
      <h3>404 Not Found</h3>
      <A href="/">Go back home.</A>
    </main>
  </>)
}

const AppInRouterWithStore = (props: any) => {

  return (<>
    <StudiesDBProvider>
      <PersistedStoreProvider>
      <StoreProvider>
        <BlogStoreProvider>
          <AppInRouter {...props} />
        </BlogStoreProvider>
      </StoreProvider>
      </PersistedStoreProvider>
    </StudiesDBProvider>
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
            {/*<section><A href='/widen'>Widen</A></section>*/}
            <section><A href='/openings'>Openings</A></section>
            <section><A href='/repetition'>Repetition</A></section>
            <section><A href='/blog'>Blog</A></section>
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

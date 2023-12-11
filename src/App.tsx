import { hashIntegration, Router, Routes, Route, A } from "@solidjs/router";
import { lazy } from 'solid-js'
import { MetaProvider } from '@solidjs/meta'
import './App.css'

const Home = lazy(() => import('./Home'))
const Repertoires = lazy(() => import('./Repertoires'))
const Contact = lazy(() => import('./Contact'))

const Repertoire = lazy(() => import('./Repertoire'))
const Masters = lazy(() => import('./Masters'))
const Tactics = lazy(() => import('./Tactics'))
const Endgames = lazy(() => import('./Endgames'))
const Shalala = lazy(() => import('./Shalala'))

export const MyApp = () => {
    return (<>
    
    <Router source={hashIntegration()}>
        <MetaProvider>
          <AppInRouter/>
        </MetaProvider>
    </Router>
    </>)
}


const AppInRouter = () => {
    return (<>
      <div class='navbar'>
          <A href='/'>aidchess.com</A>

          <div class='links'>
            <A href='/shalala'>Shalala</A>
            <A href='/repertoires'>Repertoires</A>
            <A href='/donate'>Donate</A>
          </div>

          <A href='/'>Dashboard</A>
      </div>
      <div class='main'>
          <Routes>
              <Route path='/' component={Home}/>
              <Route path='/shalala' component={Shalala}/>
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
          </Routes>
      </div>
    </>)
}

export default MyApp
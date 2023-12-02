import { hashIntegration, Router, Routes, Route, A } from "@solidjs/router";
import { lazy } from 'solid-js'
import { MetaProvider } from '@solidjs/meta'

const Repertoires = lazy(() => import('./Repertoires'))


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
    
      <div>
        <div class='navbar'>
            <A href='/'>aidchess.com</A>

            <div class='links'>
              <A href='/'>Repertoires</A>
              <A href='/'>Donate</A>
            </div>

            <A href='/'>Dashboard</A>
        </div>
        <div class='main'>
            <Routes>
                <Route path='/' component={Repertoires}/>
            </Routes>
        </div>
      </div>
    </>)
}

export default MyApp
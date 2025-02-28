import { useNavigate } from '@solidjs/router'
import './List.scss'
import { StudiesDBContext, StudiesDBProvider } from '../../components/sync_idb_study'
import { useContext } from 'solid-js'

export default () => {
    return (<>
    <StudiesDBProvider>
            <ListComponent />
    </StudiesDBProvider>
    </>)
}


const ListComponent = () => {

    let db = useContext(StudiesDBContext)!

    let navigate = useNavigate()

    const on_new_opening = async () => {
        let study_id = await db.new_study()

        navigate('/openings/' + study_id)
    }

    return (<>
    <main class="openings-list">
        <div class='tools'>
            <button onClick={() => on_new_opening()} class='new'><i data-icon=""></i> New Opening Repertoire</button>
        </div>
        <div class='tabs'>
        </div>
        <div class='list'>
        </div>
    </main>
    </>)
}
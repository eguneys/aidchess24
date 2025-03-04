import { createResource, useContext } from "solid-js"
import { StudiesDBContext, StudiesDBProvider } from "../../components/sync_idb_study"
import { useParams } from "@solidjs/router"

export default () => {
    return (<>
    <StudiesDBProvider>
            <ShowComponent />
    </StudiesDBProvider>
    </>)
}

function ShowComponent() {
    //let db = useContext(StudiesDBContext)!

    //let params = useParams()

    //let [study] = createResource(() => db.study_by_id(params.id))


    return (<>
    
    </>)

}
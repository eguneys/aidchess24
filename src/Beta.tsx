import './Beta.scss'

const Beta = () => {

    const clear_local_storage = () => {
        window.localStorage.clear()
        window.alert('Done.')
    }

    return (<>
    <div class='beta'>
        <h3> aidchess.com is in beta </h3>
        <p>
            You may experience crashes or unexpected behavior over the site. Your data may get lost at any time.
        </p>
        <p>
            It is likely you encountered an error, you are seeing this page.
            If something doesn't work try clearing your local storage. All your progress will be lost, (except in your head).
        </p>
        <button onClick={() => clear_local_storage()}> Clear Local Storage </button>
    </div>
    </>)
}


export default Beta
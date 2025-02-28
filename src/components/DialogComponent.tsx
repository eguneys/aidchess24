import { JSX } from "solid-js";
import './Dialog.scss';

export function DialogComponent(props: { children: JSX.Element, klass: string, on_close: () => void }) {

    return (<>
    <div onClick={() => props.on_close()} class='modal-mask'>
        <dialog onClick={(e) => { e.stopPropagation()}} open={true}>
        <div class='close-button-anchor'><button onClick={() => props.on_close()} class='close-button' data-icon=""></button></div>
        <div class={'dialog-content ' + props.klass}>
            {props.children}
        </div>
        </dialog>
    </div>
    </>)
}
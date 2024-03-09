import { makePersisted } from "@solid-primitives/storage";
import { Signal, createSignal } from "solid-js";

export const makePersistedNamespaced = <T>(def: T, name: string, version?: number): Signal<T> => makePersisted(createSignal(def), { name: `.aidchess.v${version??1}.${name}` })
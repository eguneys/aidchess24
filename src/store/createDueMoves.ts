import { SetStoreFunction } from "solid-js/store"
import { StoreActions, StoreState } from "."
import { Agent } from "./createAgent"
import { EntitySectionId, EntityStudyId, ModelRepeatDueMove } from "./sync_idb_study"
import { createAsync } from "@solidjs/router"
import { createSignal } from "solid-js"
import { createEmptyCard, FSRS, Grade, Rating } from "ts-fsrs"
import { RepeatAttemptResult } from "./repeat_types"

export function createDueMoves(agent: Agent, actions: Partial<StoreActions>, _state: StoreState, setState: SetStoreFunction<StoreState>) {

    type Source = [EntityStudyId, EntitySectionId[]]
    const [source, set_source] = createSignal<Source>()

    const due_moves = createAsync<{ list: ModelRepeatDueMove[]}>(async () => {
        let s = source()

        if (s === undefined) {
            return { list: [] }
        }

        return { list: await agent.DueMoves.by_study_id(...s) }
    }, { initialValue: { list: [] }})

    Object.assign(actions, {
        load_due_moves(study_id: EntityStudyId, section_ids: EntitySectionId[]) {
            set_source([study_id, section_ids])
        },

        async save_due_move_if_not(due_move: ModelRepeatDueMove) {
            if (due_move.is_saved) {
                return
            }

            await agent.DueMoves.save_due_move(due_move)

            setState("due_moves", "list", _ => _.id === due_move.id, "is_saved", true)
        },
        async add_attempt_with_spaced_repetition(fs: FSRS, due_move: ModelRepeatDueMove, attempt_result: RepeatAttemptResult) {
            let new_card = createEmptyCard()

            let old_card = due_move.attempts[0]?.card

            if (old_card) {
                let r: Grade
                switch (attempt_result) {
                    case 'failed':
                        r = Rating.Hard
                        break
                    case 'failed-with-hint':
                        r = Rating.Again
                        break
                    case 'failed-with-skip':
                        r = Rating.Again
                        break
                    case 'solved':
                        r = Rating.Easy
                        break
                    case 'solved-with-hint':
                        r = Rating.Good
                        break
                }

                new_card = fs.repeat(old_card, new Date())[r].card
            }

            let attempt = await agent.DueMoves.new_attempt(due_move.id, attempt_result, new_card)

            setState("due_moves", "list", _ => _.id === due_move.id, "attempts", _ => [attempt, ..._])
        }
    })

    return () => due_moves.latest
}
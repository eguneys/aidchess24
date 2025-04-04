import { createEffect, createSignal } from "solid-js"
import { EntityRepeatDueMoveId, EntityRepeatDueMoveInsert, EntityRepeatMoveAttemptId, EntityRepeatMoveAttemptInsert, EntityRepeatStudyId, EntitySectionId, EntityStudyId, EntityTreeStepNodeId, gen_id8, StudiesDBReturn } from "../../components/sync_idb_study"
import { Chapter, Section } from "../../components/StudyComponent"
import { TreeStepNode } from "../../components/ReplayTreeComponent"
import { fen_turn } from "../../components/step_types"
import { Card, createEmptyCard, FSRS, Grade, Rating } from "ts-fsrs"
import { RepeatAttemptResult } from "../../components/repeat_types"

export type RepeatMoveAttempt = {
    id: EntityRepeatMoveAttemptId,
    repeat_due_move_id: EntityRepeatDueMoveId,
    created_at: number,
    created_at_date: Date,
    card: Card,
    attempt_result: RepeatAttemptResult,
    entity: EntityRepeatMoveAttemptInsert
}


export function RepeatMoveAttempt(
    id: EntityRepeatMoveAttemptId, 
    repeat_due_move_id: EntityRepeatDueMoveId,
    attempt_result: RepeatAttemptResult,
    card: Card,
    created_at = Date.now()): RepeatMoveAttempt {

    const entity = () => ({
        id,
        repeat_due_move_id,
        attempt_result,
        card,
        created_at
    })

    return {
        id,
        repeat_due_move_id,
        created_at,
        get created_at_date() {
            return new Date(created_at)
        },
        card,
        attempt_result,
        get entity() {
            return entity()
        }
    }
}

export type RepeatDueMove = {
    id: EntityRepeatDueMoveId,
    entity: EntityRepeatDueMoveInsert,
    repeat_study_id: EntityRepeatStudyId,
    tree_step_node_id: EntityTreeStepNodeId,
    node: TreeStepNode,
    attempts: RepeatMoveAttempt[],
    is_unsaved: boolean,
    is_first_ten: boolean,
    is_ten_twenty: boolean,
    is_twenty_plus: boolean,
    is_white: boolean,
    is_black: boolean,
    set_attempts(attempts: RepeatMoveAttempt[]): void,
    add_attempt_with_spaced_repetition(fs: FSRS, attempt_result: RepeatAttemptResult): RepeatMoveAttempt,
    last_attempt: RepeatMoveAttempt | undefined,
    is_due: boolean,
    once_listen_load_db(db: StudiesDBReturn): Promise<void>
}

export function RepeatDueMove(id: EntityRepeatDueMoveId, repeat_study_id: EntityRepeatStudyId, node: TreeStepNode, is_unsaved: boolean) {

    let [attempts, set_attempts] = createSignal<RepeatMoveAttempt[]>([])

    const entity = () => ({
        id,
        repeat_study_id,
        tree_step_node_id: node.id
    })

    return {
        id,
        repeat_study_id,
        get tree_step_node_id() { 
            return node.id
        },
        get entity() { return entity() },
        node,
        get attempts() { return attempts() },
        set_attempts(attempts: RepeatMoveAttempt[]) { set_attempts(attempts.sort((a, b) => a.created_at - b.created_at)) },
        add_attempt_with_spaced_repetition(f: FSRS, attempt_result: RepeatAttemptResult) {
            let new_card = createEmptyCard()

            let old_card = attempts()[attempts().length - 1]?.card

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

                new_card = f.repeat(old_card, new Date())[r].card
            }

            let attempt = RepeatMoveAttempt(gen_id8(), id, attempt_result, new_card)
            set_attempts([...attempts(), attempt])
            return attempt
        },
        is_unsaved,
        get last_attempt() {
            return attempts()[attempts().length - 1]
        },
        get is_due() {
            if (!this.last_attempt) {
                return true
            }
            return this.last_attempt.card.due.getTime() < new Date().getTime()
        },
        get is_first_ten() {
            return node.path.split(' ').length <= 10
        },
        get is_ten_twenty() {
            let l = node.path.split(' ').length
            return l > 10 && l <= 20
        },
        get is_twenty_plus() {
            return node.path.split(' ').length > 20
        },
        get is_white() {
            return fen_turn(node.fen) === 'black'
        },
        get is_black() {
            return fen_turn(node.fen) === 'black'
        },
        async once_listen_load_db(db: StudiesDBReturn) {
            let res = await db.load_repeat_move_attempts(id)
            this.set_attempts(res)
        },
    }
}



export type RepeatStudy = {
    id: EntityRepeatStudyId,
    study_id: EntityStudyId,
    section_ids: EntitySectionId[],
    sections: Section[],
    all_chapters: Chapter[],
    set_sections(section: Section[]): void,
    toggle_section(section: Section): void,
    create_effects_listen_and_save_db(db: StudiesDBReturn):  void,
    create_effects_listen_load_db(db: StudiesDBReturn): void,
    set_due_all(all: RepeatDueMove[]): void,
    due_all: RepeatDueMove[],
    due_first_ten: RepeatDueMove[],
    due_ten_twenty: RepeatDueMove[],
    due_twenty_plus: RepeatDueMove[],
    due_white: RepeatDueMove[],
    due_black: RepeatDueMove[],
}


export function RepeatStudy(id: EntityRepeatStudyId, study_id: EntityStudyId): RepeatStudy {

    const [sections, set_sections] = createSignal<Section[]>([])

    const entity = () => {
        return {
            id,
            study_id,
            sections: sections().map(_ => _.id)
        }
    }

    const [due_all, set_due_all] = createSignal<RepeatDueMove[]>([])

    return {
        id,
        study_id,
        set_due_all(all: RepeatDueMove[]) { set_due_all(all) },
        get due_all() { return due_all() },
        get due_first_ten() { return due_all().filter(_ => _.is_first_ten) },
        get due_ten_twenty() { return due_all().filter(_ => _.is_ten_twenty) },
        get due_twenty_plus() { return due_all().filter(_ => _.is_twenty_plus) },
        get due_white() { return due_all().filter(_ => _.is_white) },
        get due_black() { return due_all().filter(_ => _.is_black) },
        get section_ids() { return sections().map(_ => _.id) },
        get sections() { return sections() },
        get all_chapters() { return sections().flatMap(_ => _.chapters) },
        set_sections(sections: Section[]) { set_sections(sections) },
        toggle_section(section: Section) {
            let ss = sections()
            let i = ss.findIndex(_ => _.id === section.id)
            if (i === -1) {
                ss.push(section)
            } else {
                ss.splice(i, 1)
            }
            set_sections([...ss])
        },
        create_effects_listen_load_db(db: StudiesDBReturn) {
            createEffect(async () => {
                let res = await db.load_repeat_due_moves(id, sections().map(_ => _.id))
                this.set_due_all(res)
            })
        },
        create_effects_listen_and_save_db(db: StudiesDBReturn) {
            createEffect(() => {
                db.put_repeat_study_sections(entity())
            })
        }
    }
}
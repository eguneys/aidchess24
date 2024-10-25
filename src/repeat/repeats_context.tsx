import { JSX, createContext } from "solid-js";
import Dexie, { Entity, EntityTable } from 'dexie'
import { NewRepeat, NewRepeatWithMoves, RepeatMoveItem } from "./types";
import StudyRepo from '../studyrepo'
import { Card, createEmptyCard, FSRS, Rating, State } from 'ts-fsrs'

export const RepeatsDbContext = createContext<RepeatsDB>()

class RepeatsDB extends Dexie {

    sections!: EntityTable<RepeatsSection, 'id'>
    repeats!: EntityTable<RepeatsRepeat, 'id'>
    moves!: EntityTable<RepeatsMoveItem, 'id'>
    move_cards!: EntityTable<RepeatsMoveCard, 'id'>

    remove_database() {
        this.delete()
    }

    constructor() {
        super('RepeatsDB')
    
        this.version(1).stores({
            sections: '++id, study_id, section_name',
            repeats: '++id, name, sections*',
            moves: '++id, repeat_id',
            move_cards: '++id, move_id'
        })

        this.sections.mapToClass(RepeatsSection)
        this.repeats.mapToClass(RepeatsRepeat)
        this.moves.mapToClass(RepeatsMoveItem)
        this.move_cards.mapToClass(RepeatsMoveCard)
    }

    async add_repeat(repeat: NewRepeat) {

        let sections = await Promise.all(repeat.sections.map(_ => this.sections.add(_)))

        let repeat_id = await this.repeats.add({
            name: repeat.name,
            sections
        })


        let item_by_fen: Record<string, RepeatMoveItem> = {}

        await Promise.all(repeat.sections.map(async _ => {
            let ss = await StudyRepo.read_section_study(_.study_id)
            let section = ss.sections.find(s => _.section_name === s.name)!

            section.chapters.forEach(_ => _.pgn.tree.all_moves.forEach(m => {
                let fen = m.before_fen
                let uci = m.uci

                if (!item_by_fen[fen]) {
                    item_by_fen[fen] = {
                        repeat_id,
                        fen,
                        ucis: [uci]
                    }
                } else {
                    item_by_fen[fen].ucis.push(uci)
                }
            }))
        }))


        let move_ids = await this.moves.bulkAdd<true>(Object.values(item_by_fen), { allKeys: true })
        await this.move_cards.bulkAdd(move_ids.map(move_id => ({ ...createEmptyCard(), move_id })))

    }

    async remove_repeat(name: string) {
        let r = await this.repeats
        .where('name').equals(name).first()
        if (!r) {
            return
        }

        await r.delete()
    }

    async repeat_by_id(repeat_id: number): Promise<NewRepeatWithMoves | undefined> {
        let repeat = await this.repeats.where('id').equals(repeat_id).first()

        if (!repeat) {
            return undefined
        }

        return await this.get_repeat_with_moves(repeat)
    }

    async get_repeats(): Promise<NewRepeatWithMoves[]> {
        return await Promise.all((await this.repeats.toArray()).map(async repeat => 
            this.get_repeat_with_moves(repeat)
        ))
    }

    async get_repeat_with_moves(repeat: RepeatsRepeat) {
        return {
            id: repeat.id,
            name: repeat.name,
            sections: await repeat.get_sections(),
            moves: await this.get_moves_for_repeat(repeat.id)
        }
    }


    async get_moves_for_repeat(repeat_id: number): Promise<(RepeatMoveItem & Card)[]> {

        let moves = await this.moves.where('repeat_id').equals(repeat_id).toArray()
        let move_ids = moves.map(_ => _.id)
        let cards = await this.move_cards.where('move_id').anyOf(move_ids).toArray()

        return moves.map(move => ({
            ...move,
            ...cards.find(_ => _.move_id === move.id)!
        }))
    }


    async play_due_move(repeat_id: number, fen: string, uci: string) {
        let repeat_moves = await this.moves.where('repeat_id').equals(repeat_id).toArray()

        let move = repeat_moves.find(_ => _.fen === fen)

        if (!move) {
            return
        }

        let correct = move.ucis.includes(uci)

        let card = await this.move_cards.where('move_id').equals(move.id).first()

        if (!card) {
            return
        }

        const f = new FSRS({})


        let new_card = f.repeat(card.get_card(), new Date())[correct ? Rating.Good : Rating.Again].card

        console.log(card, new_card)
        this.move_cards.update(card.id, new_card)
    }
}

class RepeatsRepeat extends Entity<RepeatsDB> {
    id!: number
    name!: string
    sections!: number[]

    async get_sections(): Promise<{ study_id: string, section_name: string }[]> {
        let res = await Promise.all(this.sections
            .map(async id => (await this.db.sections.get(id))!)
            )

        return res.filter(Boolean)
    }

    async delete() {

        let section_ids = (await this.db.sections.where('id').anyOf(this.sections).toArray()).map(_ => _.id)
        await this.db.sections.bulkDelete(section_ids)

        let move_ids = (await this.db.moves.where('repeat_id').equals(this.id).toArray()).map(_ => _.id)
        await this.db.moves.bulkDelete(move_ids)

        let move_card_ids = (await this.db.move_cards.where('move_id').anyOf(move_ids).toArray()).map(_ => _.id)
        await this.db.move_cards.bulkDelete(move_card_ids)

        await this.db.repeats.where('id').equals(this.id).delete()
    }
}

class RepeatsSection extends Entity<RepeatsDB> {
    id!: number
    study_id!: string
    section_name!: string
}

class RepeatsMoveItem extends Entity<RepeatsDB> {
    id!: number
    repeat_id!: number
    fen!: string
    ucis!: string[]
}

class RepeatsMoveCard extends Entity<RepeatsDB> {
    id!: number
    move_id!: number

    due!: Date
    stability!: number
    difficulty!: number
    elapsed_days!: number
    scheduled_days!: number
    reps!: number
    lapses!: number
    state!: State
    last_review?: Date

    get_card() {
        let {
            due,
            stability,
            difficulty,
            elapsed_days,
            scheduled_days,
            reps,
            lapses,
            state,
            last_review
        } = this

        return {
            due,
            stability,
            difficulty,
            elapsed_days,
            scheduled_days,
            reps,
            lapses,
            state,
            last_review
        }
    }
}

export const RepeatsContextProvider = (props: { children: JSX.Element }) => {

    return <RepeatsDbContext.Provider value={new RepeatsDB()}>
        {props.children}
    </RepeatsDbContext.Provider>
}
import Dexie, { Entity, EntityTable } from "dexie";
import { Card, FSRS, Rating } from "ts-fsrs";
import { MoveData, Pgn } from "../chess_pgn_logic";
import { PGNSection } from "../studyrepo";
import { createEmptyCard } from "ts-fsrs";
import { createContext, JSX } from "solid-js";
import { FSRSRating } from "../repeat/types";

export type Study = {
    name: string,
    sections: PGNSection[]
}

export function import_pgn_study(pgn: string): Study {
    let study_name: string = ''
    let sections: PGNSection[] = []
    Pgn.make_many(pgn).map(pgn => {
        let section_name: string, chapter_name: string

        let event = pgn.event!

        {
            ;[study_name, section_name, chapter_name] = event.split(':').map(_ => _.trim())
        }

        if (chapter_name === undefined) {
            chapter_name = section_name
        }

        let section = sections.find(_ => _.name === section_name)

        if (!section) {
            sections.push(section = {
                name: section_name,
                chapters: []
            })
        }

        section.chapters.push({
            name: chapter_name,
            pgn
        })
    })

    return {
        name: study_name,
        sections
    }

}


class RepertoiresDB extends Dexie {

    studies!: EntityTable<EntityPGNStudy, 'id'>
    sections!: EntityTable<EntityPGNSection, 'id'>
    chapters!: EntityTable<EntityPGNChapter, 'id'>
    moves!: EntityTable<EntityPGNMove, 'id'>
    due_cards!: EntityTable<EntityPositionDueCard, 'id'>

    get all_tables () {
        return [this.studies, this.sections, this.chapters, this.moves, this.due_cards]
    }

    remove_database() {
        this.delete()
    }

    constructor() {
        super('RepertoiresDB')


        this.version(1).stores({
            studies: '++id, name, import_lichess_id',
            sections: '++id, study_id, name',
            chapters: '++id, section_id, name',
            moves: '++id, chapter_id, before_fen, path',
            due_cards: '++id, before_fen, section_id, move_ids*',
        })

        this.studies.mapToClass(EntityPGNStudy)
        this.sections.mapToClass(EntityPGNSection)
        this.chapters.mapToClass(EntityPGNChapter)
        this.moves.mapToClass(EntityPGNMove)
        this.due_cards.mapToClass(EntityPositionDueCard)
    }

    async get_study_by_id(id: number) {
        return await this.studies.where('id').equals(id).first()
    }

    async get_study_imported_by_id(id: number) {
        let study = await this.get_study_by_id(id)
        if (!study) {
            return undefined
        }
        return import_pgn_study(study.pgn_text)
    }

    async get_study_by_lichess_id(lichess_id: string) {
        return await this.studies.where('import_lichess_id').equals(lichess_id).first()
    }

    async remove_study_by_lichess_id(lichess_id: string) {
        let old_study = await(this.studies.where('import_lichess_id').equals(lichess_id).first())
        if (old_study) {
            this.remove_study_by_id(old_study.id)
        }
    }

    async remove_study_by_id(id: number) {
        await this.transaction('rw', this.all_tables, async () => {
            await this.studies.delete(id)
            let section_ids = (await this.sections.where('study_id').equals(id).toArray()).map(_ => _.id)

            await this.sections.bulkDelete(section_ids)

            let chapter_ids = (await this.chapters.where('section_id').anyOf(section_ids).toArray()).map(_ => _.id)

            await this.chapters.bulkDelete(chapter_ids)

            await this.moves.where('chapter_id').anyOf(chapter_ids).delete()

            await this.due_cards.where("section_id").anyOf(section_ids).delete()
        })
    }


    async import_study_from_lichess_id(id: string, pgn: string) {
        let study = import_pgn_study(pgn)

        await this.transaction('rw', this.all_tables, async () => {

            await this.remove_study_by_lichess_id(id)

            let study_id = await this.studies.add({
                name: study.name,
                import_lichess_id: id,
                imported_as_pgn_text: false,
                pgn_text: pgn,
            })

            await this.insert_study_rest(study, study_id)
        })
    }

    async import_study_from_pgn_text(text: string) {
        let pgn = text

        let study = import_pgn_study(pgn)

        await this.transaction('rw', this.all_tables, async () => {
            let study_id = await this.studies.add({
                name: study.name,
                imported_as_pgn_text: true,
                pgn_text: pgn
            })

            await this.insert_study_rest(study, study_id)
        })
    }

    async insert_study_rest(study: Study, study_id: number) {

        let section_ids = await this.sections.bulkAdd(study.sections.map(_ => ({
            name: _.name,
            study_id,
        })), { allKeys: true })

        let chapters = study.sections.flatMap((section, i) =>
            section.chapters.map(chapter => ({
                section_id: section_ids[i],
                name: chapter.name
            }))
        )

        let chapter_ids = await this.chapters.bulkAdd(chapters, { allKeys: true })

        let chapter_pgns = study.sections.flatMap(section => section.chapters.map(_ => _.pgn))

        let moves = chapter_pgns.flatMap((pgn, i) => pgn.tree.all_moves.map(_ => ({
            chapter_id: chapter_ids[i],
            before_fen: _.before_fen,
            path: _.path.join(' '),
            data: _
        })))

        let move_ids = await this.moves.bulkAdd(moves, { allKeys: true })

        const section_id_by_chapter_id = (id: number) => 
            chapters[chapter_ids.indexOf(id)].section_id

        let all_fens: Record<string, { section_id: number, move_ids: number[]}> = {}

        moves.forEach((_, i) => {
            if (!all_fens[_.before_fen]) {
                let section_id = section_id_by_chapter_id(_.chapter_id)
                all_fens[_.before_fen] = {
                    section_id,
                    move_ids: []
                }
            }
            all_fens[_.before_fen].move_ids.push(move_ids[i])
        })

        let due_cards = Object.keys(all_fens).map(before_fen => ({
            before_fen,
            ...all_fens[before_fen],
            card: createEmptyCard()
        }))

        await this.due_cards.bulkAdd(due_cards)
    }


    async play_due_move(fen: string, rating: FSRSRating) {
        let cards = await this.due_cards.where('before_fen').equals(fen).toArray()

        const f = new FSRS({})

        let r = Rating.Easy
        switch (rating) {
            case 'again': r = Rating.Again
            break
            case 'easy': r = Rating.Easy
            break
            case 'hard': r = Rating.Hard
            break
        }

        cards.forEach(card => {
            let new_card = f.repeat(card.card, new Date())[r].card

            this.due_cards.update(card.id, { card: new_card })
        })
    }
}


export class EntityPGNStudy extends Entity<RepertoiresDB> {
    id!: number
    name!: string
    import_lichess_id?: string
    imported_as_pgn_text?: boolean
    pgn_text!: string
}


export class EntityPGNSection extends Entity<RepertoiresDB> {
    id!: number
    study_id!: number
    name!: string
}


export class EntityPGNChapter extends Entity<RepertoiresDB> {
    id!: number
    section_id!: number
    name!: string
}


export class EntityPGNMove extends Entity<RepertoiresDB> {
    id!: number
    chapter_id!: number
    before_fen!: string
    path!: string
    data!: MoveData
}


export class EntityPositionDueCard extends Entity<RepertoiresDB> {
    id!: number
    section_id!: number
    before_fen!: string
    move_ids!: number[]
    card!: Card
}

export const RepertoiresDBContext = createContext<RepertoiresDB>()


export const RepertoireDBProvider = (props: { children: JSX.Element }) => {
    return (<>
        <RepertoiresDBContext.Provider value={new RepertoiresDB()}>
            {props.children}
        </RepertoiresDBContext.Provider></>)
}

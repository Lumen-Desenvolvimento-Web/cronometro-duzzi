import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
    try {
        const body = await req.json()

        const {
            number,
            item_count,
            volume_count,
            order_date,
            status = 'pendente',
            separator_id = null,
            separation_started_at = null,
            separation_finished_at = null,
        } = body

        const { data, error } = await supabase.from('notes').insert({
            number,
            item_count,
            volume_count,
            order_date,
            status,
            separator_id,
            separation_started_at,
            separation_finished_at,
        }).select().single()

        if (error) {
            console.error('Erro ao inserir nota:', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data }, { status: 201 })

    } catch (err) {
        console.error('Erro geral:', err)
        return NextResponse.json({ error: 'Erro ao processar a requisição' }, { status: 400 })
    }
}

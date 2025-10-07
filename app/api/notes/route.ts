import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'

export async function POST(req: Request) {
    try {
        // 🔐 Verifica chave secreta no header
        const apiKey = req.headers.get('x-api-key')
        if (apiKey !== process.env.API_SECRET_KEY) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }


        const body = await req.json()

        let {
            number,
            item_count,
            volume_count,
            order_date,
            status = 'pendente',
            separator_id = null,
            separation_started_at = null,
            separation_finished_at = null,
            destination,
            products
        } = body

        if (!Array.isArray(products)) {
            products = [products]
        }

        const { data, error } = await supabase.from('notes').insert({
            number,
            item_count,
            volume_count,
            order_date,
            status,
            separator_id,
            separation_started_at,
            separation_finished_at,
            destination,
        }).select().single()

        if (error) {
            console.error('Erro ao inserir nota:', error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const { data: productsData, error: productsError } = await supabase.from('products').insert(
            products.map((product: Product) => ({
                note_number: number,
                product_code: product.code,
                product_description: product.description,
                product_amount: product.amount,
                product_location: product.location,
            }))
        ).select()

        if (productsError) {
            console.error('Erro ao inserir produtos:', productsError.message)
            return NextResponse.json({ error: productsError.message }, { status: 500 })
        }

        return NextResponse.json({ data, products: productsData }, { status: 201 })

    } catch (err) {
        console.error('Erro geral:', err)
        return NextResponse.json({ error: 'Erro ao processar a requisição' }, { status: 400 })
    }
}


export async function PUT(req: Request) {
    try {
        // 🔐 Verifica chave secreta no header
        const apiKey = req.headers.get('x-api-key')
        if (apiKey !== process.env.API_SECRET_KEY) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const body = await req.json()

        let {
            number,
            item_count,
            volume_count,
            // status = "pendente",
            products
        } = body

        if (!number) {
            return NextResponse.json({ error: 'O campo "number" é obrigatório' }, { status: 400 })
        }

        if (!Array.isArray(products)) {
            products = [products]
        }

        // existe
        const { data: existingNote, error: checkError } = await supabase
            .from('notes')
            .select('id')
            .eq('number', number)
            .single()

        if (checkError || !existingNote) {
            return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 })
        }

        const { data: updatedNote, error: updateError } = await supabase
            .from('notes')
            .update({
                item_count,
                volume_count,
                // status
            })
            .eq('number', number)
            .select()
            .single()

        if (updateError) {
            console.error('Erro ao atualizar nota:', updateError.message)
            return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('note_number', number)

        if (deleteError) {
            console.error('Erro ao excluir produtos:', deleteError.message)
            return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        const { data: newProducts, error: insertError } = await supabase
            .from('products')
            .insert(
                products.map((product: Product) => ({
                    note_number: number,
                    product_code: product.code,
                    product_description: product.description,
                    product_amount: product.amount,
                    product_location: product.location,
                }))
            )
            .select()

        if (insertError) {
            console.error('Erro ao inserir produtos:', insertError.message)
            return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        return NextResponse.json({
            data: updatedNote,
            products: newProducts
        }, { status: 200 })

    } catch (err) {
        console.error('Erro geral:', err)
        return NextResponse.json({ error: 'Erro ao processar a requisição' }, { status: 400 })
    }
}
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
      destination = '',
      products = []
    } = body

    if (!number) {
      return NextResponse.json({ error: 'Número da nota é obrigatório' }, { status: 400 })
    }

    // Cria a nota diretamente no Supabase
    const { data, error } = await supabase
      .from('notes')
      .insert({
        number,
        item_count,
        volume_count,
        order_date,
        status,
        destination,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao inserir nota:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Se tiver produtos, insere também
    if (products.length > 0) {
      const { error: productsError } = await supabase
        .from('products')
        .insert(
          products.map((product: any) => ({
            note_number: number,
            product_code: product.code,
            product_description: product.description,
            product_amount: product.amount,
            product_location: product.location,
          }))
        )

      if (productsError) {
        console.error('Erro ao inserir produtos:', productsError.message)
        return NextResponse.json({ error: productsError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    console.error('Erro geral:', err)
    return NextResponse.json({ error: 'Erro ao processar a requisição' }, { status: 400 })
  }
}
// app/api/notes/[numero]/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ||  'http://72.60.14.191:22222',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  try {
    const { numero } = await params

    console.log('Buscando nota numero:', numero)

    const { data: nota, error: notaError } = await supabase
      .from('notes')
      .select('*')
      .eq('number', numero)
      .single()

    console.log('Resultado nota:', nota)
    console.log('Erro nota:', notaError)

    if (!nota) {
      return NextResponse.json({ success: true, data: null })
    }

    const { data: produtos, error: produtosError } = await supabase
      .from('products')
      .select('*')
      .eq('note_number', numero)

    console.log('Resultado produtos:', produtos)
    console.log('Erro produtos:', produtosError)

    return NextResponse.json({
      success: true,
      data: {
        nota,
        produtos: produtos || []
      }
    })
  } catch (error) {
    console.error('Erro ao buscar nota:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar nota' },
      { status: 500 }
    )
  }
}
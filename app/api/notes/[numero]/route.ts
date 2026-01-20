// app/api/notas/[numero]/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  'http://localhost:8000', // API local
  process.env.SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { numero: string } }
) {
  try {
    const { numero } = params

    const { data: nota } = await supabase
      .from('notes')
      .select('*')
      .eq('number', numero)
      .single()

    if (!nota) {
      return NextResponse.json({ success: true, data: null })
    }

    const { data: produtos } = await supabase
      .from('products')
      .select('*')
      .eq('note_number', numero)

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
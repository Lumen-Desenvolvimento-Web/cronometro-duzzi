import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const number = searchParams.get('number')

    if (!number) {
      return NextResponse.json({ error: 'Número da nota é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('notes')
      .select('id')
      .eq('number', number)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ exists: !!data })
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao verificar nota' }, { status: 500 })
  }
}
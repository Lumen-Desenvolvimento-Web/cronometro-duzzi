import { supabase } from './supabase'
import { Person, TimeRecord, TimerData } from './types'

// ======== People (Separators) ========
export async function fetchPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('separators')
    .select('user_id, name, registry_number')
    .order('name', { ascending: true })

  if (error) throw error

  return data.map((row) => ({
    id: row.user_id,
    name: row.name,
    registry_number: row.registry_number,
  }))
}

export async function addPerson(name: string): Promise<Person> {
  const { data, error } = await supabase
    .from('separators')
    .insert([{ name, registry_number: 'TEMP' }])
    .select('user_id, name, registry_number')
    .single()

  if (error) throw error

  return {
    id: data.user_id,
    name: data.name,
    registry_number: data.registry_number,
  }
}

export async function removePerson(id: string): Promise<void> {
  const { error } = await supabase
    .from('separators')
    .delete()
    .eq('user_id', id)

  if (error) throw error
}

// ======== Timers ========
export async function fetchActiveTimers(): Promise<TimerData[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, number, separator_id, separation_started_at')
    .is('separation_finished_at', null)
    .not('separation_started_at', 'is', null)

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    orderNumber: row.number,
    personId: row.separator_id,
    startTime: row.separation_started_at,
  }))
}

export async function fetchAvailableTimers(): Promise<TimerData[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, number, item_count, volume_count')
    .is('separation_finished_at', null)
    .is('separation_started_at', null)

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    orderNumber: row.number,
    itemCount: row.item_count,
    volumeCount: row.volume_count,
  }))
}

export async function fetchFinishedTimers(): Promise<TimeRecord[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, number, separator_id, separation_started_at, separation_finished_at') //separation_time
    .not('separation_finished_at', 'is', null)

  if (error) throw error

  return data.map((row) => {
    const start = new Date(row.separation_started_at).getTime()
    const end   = new Date(row.separation_finished_at).getTime()
    return {
      id: row.id,
      orderNumber: row.number,
      personId: row.separator_id,
      startTime: row.separation_started_at,
      endTime: row.separation_finished_at,
      duration: Math.floor((end - start) / 1000),
      // duration: row.separation_time,
    }
  })
}

export async function startTimer(personId: string, orderNumber: string): Promise<TimerData> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('notes')
    .update({ separation_started_at: now, status: 'separando', separator_id: personId })
    .eq('number', orderNumber)
    .select('id, number, separator_id, separation_started_at')
    .single()

  if (error) throw error

  return {
    id: data.id,
    orderNumber: data.number,
    personId: data.separator_id,
    startTime: data.separation_started_at,
  }
}

export async function stopTimer(timerId: string): Promise<TimeRecord> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('notes')
    .update({ separation_finished_at: now, status: 'concluída' })
    .eq('id', timerId)
    .select('id, number, separator_id, separation_started_at, separation_finished_at')
    .single()

  if (error || !data) throw error || new Error('No data')

  const start = new Date(data.separation_started_at).getTime()
  const end   = new Date(data.separation_finished_at).getTime()
  return {
    id: data.id,
    orderNumber: data.number,
    personId: data.separator_id,
    startTime: data.separation_started_at,
    endTime: data.separation_finished_at,
    duration: Math.floor((end - start) / 1000),
  }
}

import { supabase } from './supabase'
import { Person, TimeRecord, TimerData } from './types'
import { decryptPassword, encryptPassword } from './crypto'

// ======== People (users) ========
export async function fetchPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, username, type, is_break')
    .order('name', { ascending: true })

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    username: row.username,
    type: row.type,
    isBreak: row.is_break
  }))
}

export async function registerUser(name: string, username: string, password: string, type: number): Promise<Person> {
  const password_hash = encryptPassword(password)

  const { data, error } = await supabase
    .from('users')
    .insert({
      name,
      username,
      password_hash,
      type,
    })
    .select('id, name, username, type')
    .single()

  if (error) throw error

  return {
    id: data.id,
    name: data.name,
    username: data.username,
    type: data.type,
    isBreak: false
  }
}

export async function removePerson(id: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function takeBreak(personId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_break: true })
    .eq('id', personId)

  if (error) throw error
}

export async function finishBreak(personId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_break: false })
    .eq('id', personId)

  if (error) throw error
}

export async function isBreakActive(): Promise<{ is_break: boolean; id: string }> {
  const { data, error } = await supabase
    .from('users')
    .select('is_break, id')
    .is('is_break', true)
    .single()

  if (error) throw error

  return { is_break: data.is_break || false, id: data.id || '' }
}

export async function verifyCredentials(username: string, password: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !data) return { success: false, message: 'Usuário não encontrado' }

  const decrypted = decryptPassword(data.password_hash)
  if (decrypted !== password) return { success: false, message: 'Senha incorreta' }

  return { success: true, user: data }
}

// ======== Timers ========

// Separation
export async function fetchActiveTimers(): Promise<TimerData[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, number, separator_id, separation_started_at, item_count, destination, volume_count, products(*)')
    .is('separation_finished_at', null)
    .not('separation_started_at', 'is', null)

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    orderNumber: row.number,
    personId: row.separator_id,
    startTime: row.separation_started_at,
    itemCount: row.item_count,
    volumeCount: row.volume_count,
    destination: row.destination,
    products: row.products.map((product) => ({
      id: product.id,
      noteNumber: product.note_number,
      description: product.product_description,
      code: product.product_code,
      amount: product.product_amount,
      location: product.product_location
    })),
  }))
}

export async function fetchAvailableTimers(): Promise<TimerData[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, number, item_count, volume_count')
    .is('separation_finished_at', null)
    .is('separation_started_at', null)
    .order('order_date', { ascending: true })

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
    .select('id, number, separator_id, separation_started_at, separation_finished_at, item_count, volume_count, products(*)') //separation_time
    .not('separation_finished_at', 'is', null)
    .eq('approved', false)

  if (error) throw error

  return data.map((row) => {
    const start = new Date(row.separation_started_at).getTime()
    const end = new Date(row.separation_finished_at).getTime()
    return {
      id: row.id,
      orderNumber: row.number,
      personId: row.separator_id,
      startTime: row.separation_started_at,
      endTime: row.separation_finished_at,
      duration: Math.floor((end - start) / 1000),
      itemCount: row.item_count,
      volumeCount: row.volume_count,
      products: row.products.map((product) => ({
        id: product.id,
        noteNumber: product.note_number,
        description: product.product_description,
        code: product.product_code,
        amount: product.product_amount,
        location: product.product_location
      }))
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
    .update({ separation_finished_at: now, status: 'separada' })
    .eq('id', timerId)
    .select('id, number, separator_id, separation_started_at, separation_finished_at')
    .single()

  if (error || !data) throw error || new Error('No data')

  const start = new Date(data.separation_started_at).getTime()
  const end = new Date(data.separation_finished_at).getTime()
  return {
    id: data.id,
    orderNumber: data.number,
    personId: data.separator_id,
    startTime: data.separation_started_at,
    endTime: data.separation_finished_at,
    duration: Math.floor((end - start) / 1000),
  }
}

// Confirmation
export async function fetchConfirmationTimers(): Promise<TimerData[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, number, item_count, volume_count, destination, products(*)')
    .is('confirmation_finished_at', null)
    .is('confirmation_started_at', null)
    .order('order_date', { ascending: true })

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    orderNumber: row.number,
    itemCount: row.item_count,
    volumeCount: row.volume_count,
  }))
}

export async function updateConfirmationTimer(timer: TimeRecord): Promise<TimeRecord> {
  const { data: timerData, error: timerError } = await supabase
    .from('notes')
    .update({ item_count: timer.itemCount, volume_count: timer.volumeCount })
    .eq('id', timer.id)
    .select('*')
    .single()

  if (timerError || !timerData) throw timerError || new Error('No data')

  timer.products?.map(async (product) => {
    const { error: productError } = await supabase
      .from('products')
      .update({ product_amount: product.amount })
      .eq('id', product.id)

    if (productError) throw productError
  })

  return {
    id: timerData.id,
    orderNumber: timerData.number,
    itemCount: timerData.item_count,
    volumeCount: timerData.volume_count,
    products: timer.products || []
  }
}

export async function approveTimer(timerId: string): Promise<TimeRecord> {
  const { data, error } = await supabase
    .from('notes')
    .update({ 'status': 'aprovada', 'approved': true })
    .eq('id', timerId)
    .select('id, number')
    .single()

  if (error || !data) throw error || new Error('No data')

  return {
    id: data.id,
    orderNumber: data.number,
  }
}

// Conference
export async function fetchActiveConferenceTimers(): Promise<TimerData[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, number, conference_person_id, conference_started_at, item_count, volume_count, destination, products(*)')
    .is('conference_finished_at', null)
    .not('conference_started_at', 'is', null)

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    orderNumber: row.number,
    personId: row.conference_person_id,
    startTime: row.conference_started_at,
    itemCount: row.item_count,
    volumeCount: row.volume_count,
    destination: row.destination,
    products: row.products.map((product) => ({
      id: product.id,
      noteNumber: product.note_number,
      description: product.product_description,
      code: product.product_code,
      amount: product.product_amount,
      location: product.product_location
    })),
  }))
}

export async function fetchAvailableConferenceTimers(): Promise<TimerData[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, number, item_count, volume_count')
    .not('separation_time', 'is', null)
    .is('conference_finished_at', null)
    .is('conference_started_at', null)
    .is('approved', true)
    .order('order_date', { ascending: true })

  if (error) throw error

  return data.map((row) => ({
    id: row.id,
    orderNumber: row.number,
    itemCount: row.item_count,
    volumeCount: row.volume_count,
  }))
}

export async function fetchFinishedConferenceTimers(): Promise<TimeRecord[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('id, number, conference_person_id, conference_started_at, conference_finished_at')
    .not('conference_finished_at', 'is', null)

  if (error) throw error

  return data.map((row) => {
    const start = new Date(row.conference_started_at).getTime()
    const end = new Date(row.conference_finished_at).getTime()
    return {
      id: row.id,
      orderNumber: row.number,
      personId: row.conference_person_id,
      startTime: row.conference_started_at,
      endTime: row.conference_finished_at,
      duration: Math.floor((end - start) / 1000),
    }
  })
}

export async function startConferenceTimer(personId: string, orderNumber: string): Promise<TimerData> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('notes')
    .update({ conference_started_at: now, status: 'conferindo', conference_person_id: personId })
    .eq('number', orderNumber)
    .select('id, number, conference_person_id, conference_started_at')
    .single()

  if (error) throw error

  return {
    id: data.id,
    orderNumber: data.number,
    personId: data.conference_person_id,
    startTime: data.conference_started_at,
  }
}

export async function stopConferenceTimer(timerId: string): Promise<TimeRecord> {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('notes')
    .update({ conference_finished_at: now, status: 'conferida' })
    .eq('id', timerId)
    .select('id, number, conference_person_id, conference_started_at, conference_finished_at')
    .single()

  if (error || !data) throw error || new Error('No data')

  const start = new Date(data.conference_started_at).getTime()
  const end = new Date(data.conference_finished_at).getTime()
  return {
    id: data.id,
    orderNumber: data.number,
    personId: data.conference_person_id,
    startTime: data.conference_started_at,
    endTime: data.conference_finished_at,
    duration: Math.floor((end - start) / 1000),
  }
}

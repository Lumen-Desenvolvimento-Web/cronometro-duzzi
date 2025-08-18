export type Person = {
  id: string
  name: string
  username: string
}

export type TimerData = {
  id: string
  personId?: string
  orderNumber: string
  startTime?: string
  itemCount?: number | 0
  volumeCount?: number | 0
}

export type TimeRecord = {
  id: string
  personId?: string
  orderNumber: string
  startTime?: string
  endTime?: string
  duration?: number
  itemCount?: number | 0
  volumeCount?: number | 0
}

export type Product = {
  id: string
  noteNumber: string
  description: string
  code: string
  amount: number
  location: string
}
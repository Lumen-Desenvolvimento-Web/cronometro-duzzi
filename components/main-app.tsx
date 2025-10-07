'use client'

import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PeopleManager } from '@/components/people-manager'
import { TimerDashboard } from '@/components/timer-dashboard'
import { Reports } from '@/components/reports'
import type { Person, TimerData, TimeRecord } from '@/lib/types'
import { fetchPeople, registerUser, fetchActiveTimers, fetchAvailableTimers, fetchFinishedTimers, startTimer, stopTimer, removePerson, fetchActiveConferenceTimers, fetchAvailableConferenceTimers, fetchFinishedConferenceTimers, startConferenceTimer, stopConferenceTimer } from "@/lib/data-service"
import { Confirmation } from './confirmation'

export function MainApp() {
  const [people, setPeople] = useState<Person[]>([])

  //Separação
  const [activeTimers, setActiveTimers] = useState<TimerData[]>([])
  const [availableTimers, setAvailableTimers] = useState<TimerData[]>([])
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([])

  //Conferência
  const [activeConferenceTimers, setActiveConferenceTimers] = useState<TimerData[]>([])
  const [availableConferenceTimers, setAvailableConferenceTimers] = useState<TimerData[]>([])
  const [conferenceTimeRecords, setConferenceTimeRecords] = useState<TimeRecord[]>([])

  const [isTimerWindow, setIsTimerWindow] = useState(false)

  // Verificar se estamos na janela de timers
  useEffect(() => {
    if (typeof window !== "undefined" && "electron" in window) {
      setIsTimerWindow(window.electron.isTimerWindow && window.electron.isTimerWindow())
    }
  }, [])

  // Carrega tudo ao montar
  useEffect(() => {
    async function loadAll() {
      const [people, activeTimers, availableTimers, finishedTimers, activeConferenceTimers, availableConferenceTimers, finishedConferenceTimers] = await Promise.all([
        fetchPeople(),

        fetchActiveTimers(),
        fetchAvailableTimers(),
        fetchFinishedTimers(),

        fetchActiveConferenceTimers(),
        fetchAvailableConferenceTimers(),
        fetchFinishedConferenceTimers(),
      ])
      setPeople(people)

      setActiveTimers(activeTimers)
      setAvailableTimers(availableTimers)
      setTimeRecords(finishedTimers)

      setActiveConferenceTimers(activeConferenceTimers)
      setAvailableConferenceTimers(availableConferenceTimers)
      setConferenceTimeRecords(finishedConferenceTimers)
    }
    loadAll()
  }, [people, activeTimers, availableTimers, timeRecords, activeConferenceTimers, availableConferenceTimers, conferenceTimeRecords])

  const handleRegisterUser = async (name: string, username: string, password: string, type: number) => {
    const newPerson = await registerUser(name, username, password, type)
    setPeople((prev) => [...prev, newPerson])
  }

  const handleRemovePerson = async (id: string) => {
    await removePerson(id)
    setPeople((prev) => prev.filter((person) => person.id !== id))
  }

  const handleStart = async (personId: string, orderNumber: string) => {
    const timer = await startTimer(personId, orderNumber)
    setActiveTimers((prev) => [...prev, timer])
  }

  const handleStop = async (timerId: string) => {
    const finished = await stopTimer(timerId)
    setActiveTimers((prev) => prev.filter((t) => t.id !== timerId))
    setTimeRecords((prev) => [...prev, finished])
  }

  const handleStartConference = async (personId: string, orderNumber: string) => {
    const timer = await startConferenceTimer(personId, orderNumber)
    setActiveConferenceTimers((prev) => [...prev, timer])
  }

  const handleStopConference = async (timerId: string) => {
    const finished = await stopConferenceTimer(timerId)
    setActiveConferenceTimers((prev) => prev.filter((t) => t.id !== timerId))
    setConferenceTimeRecords((prev) => [...prev, finished])
  }

  // Se estamos na janela de timers, mostrar apenas o logo e os timers
  if (isTimerWindow) {
    return (
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-44 h-44 mb-2">
            <img src="./duzzi.png" alt="Duzzi Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <TimerDashboard
          people={people}
          activeTimers={activeTimers}
          availableTimers={availableTimers}
          onStartTimer={startTimer}
          onStopTimer={stopTimer}
          activeConferenceTimers={activeConferenceTimers}
          availableConferenceTimers={availableConferenceTimers}
          onStartConferenceTimer={startConferenceTimer}
          onStopConferenceTimer={stopConferenceTimer}
        />
      </div>
    )
  }

  // Interface normal para a janela principal
  return (
    <div className="container mx-auto max-w-6xl">
      <div className="flex flex-col items-center mb-6">
        <div className="w-44 h-44 mb-2">
          <img src="./duzzi.png" alt="Duzzi Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl font-bold text-center">Monitoramento de Tempo para Montagem de Pedidos</h1>
      </div>

      <Tabs defaultValue="timers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timers">Cronômetros</TabsTrigger>
          <TabsTrigger value="confirmation">Aprovação</TabsTrigger>
          <TabsTrigger value="people">Equipe</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="timers">
          <TimerDashboard
            people={people}
            activeTimers={activeTimers}
            availableTimers={availableTimers}
            onStartTimer={startTimer}
            onStopTimer={stopTimer}
            activeConferenceTimers={activeConferenceTimers}
            availableConferenceTimers={availableConferenceTimers}
            onStartConferenceTimer={startConferenceTimer}
            onStopConferenceTimer={stopConferenceTimer}
          />
        </TabsContent>

        <TabsContent value="confirmation">
          <Confirmation finishedTimers={timeRecords} people={people} />
        </TabsContent>

        <TabsContent value="people">
          <PeopleManager people={people} onRegisterUser={handleRegisterUser} onRemovePerson={handleRemovePerson} />
        </TabsContent>

        <TabsContent value="reports">
          <Reports people={people} timeRecords={timeRecords} />
        </TabsContent>
      </Tabs>
    </div>
  )
}


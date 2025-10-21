"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PainelTimer } from "@/components/painel-timer"
import type { TimeRecord, Person } from "@/lib/types"
import { fetchActiveTimers, fetchActiveConferenceTimers, fetchPeople } from "@/lib/data-service"

export default function PainelPage() {
  const [activeTimers, setActiveTimers] = useState<TimeRecord[]>([])
  const [activeConferenceTimers, setActiveConferenceTimers] = useState<TimeRecord[]>([])
  const [people, setPeople] = useState<Person[]>([])

  const fetchData = async () => {
    try {
      const [timers, conferenceTimers, peopleData] = await Promise.all([
        fetchActiveTimers(),
        fetchActiveConferenceTimers(),
        fetchPeople(),
      ])

      setActiveTimers(timers)
      setActiveConferenceTimers(conferenceTimers)
      setPeople(peopleData)
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    }
  }

  useEffect(() => {
    fetchData()

    // Atualiza a cada 5 segundos
    const interval = setInterval(fetchData, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background p-6 bg-white">
      <div className="flex flex-col items-center mb-6">
        <div className="w-44 h-44 mb-2">
          <img src="/duzzi.png" alt="Duzzi Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-3xl font-bold text-center text-black">Painel de Cronômetros</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cronômetros Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          {activeTimers.length === 0 && activeConferenceTimers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum cronômetro ativo.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTimers.map((timer) => {
                const person = people.find((p) => p.id === timer.personId)
                return (
                  <PainelTimer
                    key={timer.id}
                    timer={timer}
                    personName={person?.name || "Desconhecido"}
                    tag="Separação"
                  />
                )
              })}
              {activeConferenceTimers.map((timer) => {
                const person = people.find((p) => p.id === timer.personId)
                return (
                  <PainelTimer
                    key={timer.id}
                    timer={timer}
                    personName={person?.name || "Desconhecido"}
                    tag="Conferência"
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Timer } from "@/components/timer"
import type { Person, TimerData, TimeRecord } from "@/lib/types"
import { Maximize2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { verifyCredentials } from "@/lib/data-service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"

interface TimerDashboardProps {
  people: Person[]
  activeTimers: TimerData[]
  availableTimers: TimerData[]
  onStartTimer: (personId: string, orderNumber: string) => Promise<TimerData | void>
  onStopTimer: (timerId: string) => Promise<TimeRecord | void>
  activeConferenceTimers: TimerData[]
  availableConferenceTimers: TimerData[]
  onStartConferenceTimer: (personId: string, orderNumber: string) => Promise<TimerData | void>
  onStopConferenceTimer: (timerId: string) => Promise<TimeRecord | void>
}

export function TimerDashboard({ people, activeTimers, availableTimers, onStartTimer, onStopTimer, activeConferenceTimers, availableConferenceTimers, onStartConferenceTimer, onStopConferenceTimer }: TimerDashboardProps) {
  const [orderNumber, setOrderNumber] = useState("")
  const [isDetached, setIsDetached] = useState(false)
  const [isElectron, setIsElectron] = useState(false)
  const [isTimerWindow, setIsTimerWindow] = useState(false)
  const [localTimers, setLocalTimers] = useState<TimeRecord[]>([])

  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")


  const [typeTimer, setTypeTimer] = useState<"separation" | "conference" | null>()

  // Verificar se estamos no Electron e se é uma janela de timer
  // Isso é executado apenas no cliente, evitando erros de hidratação
  // useEffect(() => {
  //   setIsElectron(typeof window !== "undefined" && "electron" in window)

  //   if (typeof window !== "undefined" && "electron" in window) {
  //     const isTimer = window.electron.isTimerWindow()
  //     setIsTimerWindow(isTimer)

  //     // Registrar listener para atualização de timers
  //     const removeListener = window.electron.onTimerUpdate((updatedTimers: TimeRecord[]) => {
  //       if (window.electron.isTimerWindow()) {
  //         console.log("Timers atualizados na janela destacada", updatedTimers)
  //         // Atualizar os timers locais na janela destacada
  //         setLocalTimers(updatedTimers)
  //       }
  //     })

  //     // Registrar listener para inicialização da janela de timers
  //     const removeInitListener = window.electron.onInitTimerWindow((data) => {
  //       if (window.electron.isTimerWindow() && data.timers) {
  //         console.log("Inicializando janela de timers com dados", data)
  //         // Inicializar os timers locais na janela destacada
  //         setLocalTimers(data.timers)
  //       }
  //     })

  //     // Registrar listener para quando a janela de timers é fechada
  //     const removeClosedListener = window.electron.onTimerWindowClosed(() => {
  //       setIsDetached(false)
  //     })

  //     return () => {
  //       if (removeListener) removeListener()
  //       if (removeInitListener) removeInitListener()
  //       if (removeClosedListener) removeClosedListener()
  //     }
  //   }
  // }, [])

  // Atualizar a janela de timers destacada sempre que os timers ativos mudarem
  useEffect(() => {
    if (isElectron && window.electron && isDetached) {
      console.log("Enviando timers atualizados para a janela destacada:", activeTimers)
      window.electron.updateTimers(activeTimers)
    }
  }, [activeTimers, isElectron, isDetached])

  // Add this function inside the TimerDashboard component
  const personHasActiveTimer = (personId: string) => {
    return activeTimers.some((timer) => timer.personId === personId)
  }

  const personHasActiveConferenceTimer = (personId: string) => {
    return activeConferenceTimers.some((timer) => timer.personId === personId)
  }

  const personOnBreak = (personId: string) => {
    return people.find((person) => person.id === personId)?.isBreak
  }

  const handleStartTimer = async () => {
    const authenticated = await verifyCredentials(username, password)
    if (!authenticated.success) {
      setLoginError(authenticated.message || "Usuário ou senha incorretos")
      return
    }

    const personId = people.find((person) => person.username === username)?.id
    if (personId) {
      if (personHasActiveTimer(personId)) {
        setLoginError("Usuário ja possui um cronômetro ativo")
        return
      }

      if (personOnBreak(personId)) {
        setLoginError("Usuário em intervalo")
        return
      }

      onStartTimer(personId, orderNumber.trim())
      setOrderNumber("")
      setLoginModalOpen(false)
      setUsername("")
      setPassword("")
      setTypeTimer(null)
      setLoginError("")
    } else {
      setLoginError("Usuário nao encontrado")
    }
  }

  const handleStartConferenceTimer = async () => {
    const authenticated = await verifyCredentials(username, password)
    if (!authenticated.success) {
      setLoginError(authenticated.message || "Usuário ou senha incorretos")
      return
    }

    const personId = people.find((person) => person.username === username)?.id
    if (personId) {
      if (personHasActiveConferenceTimer(personId)) {
        setLoginError("Usuário ja possui um cronômetro ativo")
        return
      }

      if (personOnBreak(personId)) {
        setLoginError("Usuário em intervalo")
        return
      }

      onStartConferenceTimer(personId, orderNumber.trim())
      setOrderNumber("")
      setLoginModalOpen(false)
      setUsername("")
      setPassword("")
      setTypeTimer(null)
      setLoginError("")
    } else {
      setLoginError("Usuário nao encontrado")
    }
  }

  // Add this function inside the TimerDashboard component
  const getPeopleWithoutActiveTimers = () => {
    return people.filter((person) => !personHasActiveTimer(person.id) && !person.isBreak)
  }

  const handleDetachTimers = () => {
    if (isElectron && window.electron) {
      window.electron.detachTimers(activeTimers)
      setIsDetached(true)
    }
  }

  // console.log(availableTimers)

  // Se estamos na janela de timers, mostrar apenas os timers e o logo
  if (isTimerWindow) {
    // Usar localTimers em vez de activeTimers na janela destacada
    const timersToDisplay = localTimers.length > 0 ? localTimers : activeTimers

    return (
      <div className="p-6 space-y-6">
        {/* Apenas os cronômetros ativos */}
        <Card>
          <CardHeader>
            <CardTitle>Cronômetros Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            {timersToDisplay.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum cronômetro ativo.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timersToDisplay.map((timer) => {
                  const person = people.find((p) => p.id === timer.personId)
                  return (
                    <Timer
                      tag="Separação"
                      key={timer.id}
                      timer={timer}
                      personName={person?.name || "Desconhecido"}
                      onStop={() => onStopTimer(timer.id)}
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

  return (
    <>
      <div className="w-full flex flex-row items-center justify-between mb-6">
        <div className="flex flex-col gap-1 align-middle">
          <div>
            <p className="font-bold text-xl">Separadores disponíveis:</p>
          </div>
          <div className="flex gap-2">
            {getPeopleWithoutActiveTimers().map((person) => (
              <Card className="items-center px-5 py-2 w-fit">
                <p>{person.name}</p>
              </Card>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div>
            <p className="font-bold text-xl pr-20">Separador em Intervalo:</p>
          </div>
          <div>
            {people.find((person) => person.isBreak) && (
              <Card className="items-center px-5 py-2 w-fit">
                <p>
                  {people.find((person) => person.isBreak)?.name || "Desconhecido"}
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="space-y-6 mb-3 w-fit">
          <Card className="min-h-96">
            {/* <CardHeader className="flex flex-row items-center justify-between"> */}
            {/*<CardTitle className="text-nowrap w-full">Fila de Separação: {availableTimers.length}</CardTitle> */}
            {/*</CardHeader> */}
            <CardContent>
              <div>
                <p className="font-bold text-xl text-nowrap py-3">Fila de Separação: {availableTimers.length}</p>
                {availableTimers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum cronômetro disponível.
                  </p>
                ) : (
                  <div className="w-fit">
                    <p className="text-sm mb-2">Próxima nota:</p>
                    <Card key={availableTimers[0].id} className="flex w-fit">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-nowrap">Nota: {availableTimers[0].orderNumber}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          size="sm"
                          className="mt-5"
                          onClick={() => {
                            setTypeTimer("separation")
                            setLoginModalOpen(true)
                            setOrderNumber(availableTimers[0].orderNumber)
                          }}>
                          Iniciar Timer
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
              <div className="mt-7">
                <p className="font-bold text-xl text-nowrap py-3">Fila de Conferência: {availableConferenceTimers.length}</p>
                {availableConferenceTimers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum cronômetro disponível.
                  </p>
                ) : (
                  <div className="w-fit">
                    <p className="text-sm mb-2">Próxima nota:</p>
                    <Card key={availableConferenceTimers[0].id} className="flex w-fit">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-nowrap">Nota: {availableConferenceTimers[0].orderNumber}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button
                          size="sm"
                          className="mt-5"
                          onClick={() => {
                            setTypeTimer("conference")
                            setLoginModalOpen(true)
                            setOrderNumber(availableConferenceTimers[0].orderNumber)
                          }}>
                          Iniciar Timer
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
            {isDetached && (
              <CardFooter>
                <p className="text-sm text-muted-foreground">Os cronômetros estão sendo exibidos em uma janela separada.</p>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="space-y-6 w-full">
          <Card className="min-h-96">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cronômetros Ativos</CardTitle>
              {isElectron && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDetachTimers}
                  disabled={isDetached} // Removida a condição activeTimers.length === 0
                  title="Destacar cronômetros em uma nova janela"
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Destacar Timers
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {activeTimers.length === 0 && activeConferenceTimers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum cronômetro ativo.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeTimers.map((timer) => {
                    const person = people.find((p) => p.id === timer.personId)
                    return (
                      <Timer
                        tag="Separação"
                        key={timer.id}
                        timer={timer}
                        personName={person?.name || "Desconhecido"}
                        onStop={() => onStopTimer(timer.id)}
                      />
                    )
                  })}
                  {activeConferenceTimers.map((timer) => {
                    const person = people.find((p) => p.id === timer.personId)
                    return (
                      <Timer
                        tag="Conferência"
                        key={timer.id}
                        timer={timer}
                        personName={person?.name || "Desconhecido"}
                        onStop={() => onStopConferenceTimer(timer.id)}
                      />
                    )
                  })}
                </div>
              )}
            </CardContent>
            {isDetached && (
              <CardFooter>
                <p className="text-sm text-muted-foreground">Os cronômetros estão sendo exibidos em uma janela separada.</p>
              </CardFooter>
            )}
          </Card>
          {/* </div> */}
        </div>
      </div>

      <Dialog open={loginModalOpen} onOpenChange={(open) => {
        setLoginModalOpen(open)
        if (!open) {
          setUsername("")
          setPassword("")
          setLoginError("")
          setTypeTimer(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login para Iniciar</DialogTitle>
          </DialogHeader>

          {/* Campos de username e senha */}
          <DropdownMenu>
            <div className="mb-4 w-full">
              <p className="mb-2">Usuário:</p>

              <DropdownMenuTrigger asChild>
                <button className="w-full px-3 py-2 border rounded-md text-left">
                  {username || "Selecionar usuário"}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-full" align="start">
                {people.map((person) => (
                  <DropdownMenuItem
                    key={person.id}
                    onClick={() => setUsername(person.username)}
                    className="w-full"
                  >
                    {person.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </div>
          </DropdownMenu>


          {/* <Input
          placeholder="Nome de usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        /> */}
          <p>Senha: </p>
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button onClick={typeTimer === "separation" ? handleStartTimer : handleStartConferenceTimer}>
            Iniciar Cronômetro
          </Button>

          {loginError && <p className="text-red-500 mt-2 text-sm">{loginError}</p>}
        </DialogContent>
      </Dialog>
    </>
  )
}
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Timer } from "@/components/timer"
import type { Person, TimerData, TimeRecord } from "@/lib/types"
import { Maximize2, ExternalLink, ArrowUpDown, X, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { verifyCredentials, reorderSeparationNotes, reorderConferenceNotes, cancelSeparationNote, cancelConferenceNote } from "@/lib/data-service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { ReorderModal } from "./reorder-modal"
import { CancelNoteModal } from "./cancel-note-modal"
import { AddNoteModal } from "./add-note-modal"

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

  // Modais de reordenar
  const [reorderSeparationModalOpen, setReorderSeparationModalOpen] = useState(false)
  const [reorderConferenceModalOpen, setReorderConferenceModalOpen] = useState(false)

  // Modais de cancelar
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [noteToCancelId, setNoteToCancelId] = useState<string>("")
  const [noteToCancelNumber, setNoteToCancelNumber] = useState<string>("")
  const [cancelType, setCancelType] = useState<"separation" | "conference">("separation")

  // Modal de adicionar nota
  const [addNoteModalOpen, setAddNoteModalOpen] = useState(false)

  // Atualizar a janela de timers destacada sempre que os timers ativos mudarem
  useEffect(() => {
    if (isElectron && window.electron && isDetached) {
      console.log("Enviando timers atualizados para a janela destacada:", activeTimers)
      window.electron.updateTimers(activeTimers)
    }
  }, [activeTimers, isElectron, isDetached])

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

 const getPeopleWithoutActiveTimers = () => {
  return people.filter((person) => 
    !personHasActiveTimer(person.id) && 
    !person.isBreak &&
    person.type !== 3
  )
}

  const handleDetachTimers = () => {
    if (isElectron && window.electron) {
      window.electron.detachTimers(activeTimers)
      setIsDetached(true)
    }
  }

  const handleOpenPainel = () => {
    window.open('/painel', '_blank')
  }

  const handleReorderSeparation = async (reorderedTimers: TimerData[]) => {
    await reorderSeparationNotes(reorderedTimers)
    window.location.reload() // Recarrega para atualizar a ordem
  }

  const handleReorderConference = async (reorderedTimers: TimerData[]) => {
    await reorderConferenceNotes(reorderedTimers)
    window.location.reload()
  }

  const handleCancelNote = async () => {
    if (cancelType === "separation") {
      await cancelSeparationNote(noteToCancelId)
    } else {
      await cancelConferenceNote(noteToCancelId)
    }
    window.location.reload()
  }

  // Nova função para cancelar múltiplas notas
  const handleCancelMultipleNotes = async (timerIds: string[]) => {
    // Cancela cada nota selecionada
    for (const timerId of timerIds) {
      if (reorderSeparationModalOpen) {
        await cancelSeparationNote(timerId)
      } else if (reorderConferenceModalOpen) {
        await cancelConferenceNote(timerId)
      }
    }
    window.location.reload()
  }

  const handleAddNoteSuccess = () => {
    window.location.reload()
  }

  const openCancelModal = (noteId: string, orderNumber: string, type: "separation" | "conference") => {
    setNoteToCancelId(noteId)
    setNoteToCancelNumber(orderNumber)
    setCancelType(type)
    setCancelModalOpen(true)
  }

  // Se estamos na janela de timers, mostrar apenas os timers e o logo
  if (isTimerWindow) {
    const timersToDisplay = localTimers.length > 0 ? localTimers : activeTimers

    return (
      <div className="p-6 space-y-6">
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
          <div className="flex flex-wrap gap-2">
            {getPeopleWithoutActiveTimers().map((person) => (
              <Card key={person.id} className="items-center px-5 py-2 w-fit">
                <p className="text-sm">{person.name}</p>
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
            <CardContent>
              <div>
                <div className="flex items-center justify-between py-3 gap-2">
                  <p className="font-bold text-xl text-nowrap">Fila de Separação: {availableTimers.length}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReorderSeparationModalOpen(true)}
                    disabled={availableTimers.length === 0}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Reordenar
                  </Button>
                </div>
                {availableTimers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum cronômetro disponível.
                  </p>
                ) : (
                  <div className="w-fit">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm">Próxima nota:</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAddNoteModalOpen(true)}
                        className="h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <Card key={availableTimers[0].id} className="w-fit">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-nowrap">Nota: {availableTimers[0].orderNumber}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setTypeTimer("separation")
                            setLoginModalOpen(true)
                            setOrderNumber(availableTimers[0].orderNumber)
                          }}>
                          Iniciar Timer
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full"
                          onClick={() => openCancelModal(availableTimers[0].id, availableTimers[0].orderNumber, "separation")}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar Nota
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
              <div className="mt-7">
                <div className="flex items-center justify-between py-3 gap-2">
                  <p className="font-bold text-xl text-nowrap">Fila de Conferência: {availableConferenceTimers.length}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReorderConferenceModalOpen(true)}
                    disabled={availableConferenceTimers.length === 0}
                  >
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Reordenar
                  </Button>
                </div>
                {availableConferenceTimers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum cronômetro disponível.
                  </p>
                ) : (
                  <div className="w-fit">
                    <p className="text-sm mb-2">Próxima nota:</p>
                    <Card key={availableConferenceTimers[0].id} className="w-fit">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-semibold text-nowrap">Nota: {availableConferenceTimers[0].orderNumber}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setTypeTimer("conference")
                            setLoginModalOpen(true)
                            setOrderNumber(availableConferenceTimers[0].orderNumber)
                          }}>
                          Iniciar Timer
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full"
                          onClick={() => openCancelModal(availableConferenceTimers[0].id, availableConferenceTimers[0].orderNumber, "conference")}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar Nota
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
              <div className="flex gap-2">
                {isElectron && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDetachTimers}
                    disabled={isDetached}
                    title="Destacar cronômetros em uma nova janela"
                  >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Destacar Timers
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenPainel}
                  title="Abrir painel em nova aba"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir Painel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTimers.length === 0 && activeConferenceTimers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum cronômetro ativo.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Modal de Login */}
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

          <DropdownMenu>
            <div className="mb-4 w-full">
              <p className="mb-2">Usuário:</p>

              <DropdownMenuTrigger asChild>
                <button className="w-full px-3 py-2 border rounded-md text-left">
                  {username || "Selecionar usuário"}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-full" align="start">
                {people.filter((person) => person.type !== 3).map((person) => (
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

      {/* Modal de Reordenar Separação */}
      <ReorderModal
        open={reorderSeparationModalOpen}
        onOpenChange={setReorderSeparationModalOpen}
        availableTimers={availableTimers}
        onReorder={handleReorderSeparation}
        onCancelNotes={handleCancelMultipleNotes}
        type="separation"
      />

      {/* Modal de Reordenar Conferência */}
      <ReorderModal
        open={reorderConferenceModalOpen}
        onOpenChange={setReorderConferenceModalOpen}
        availableTimers={availableConferenceTimers}
        onReorder={handleReorderConference}
        onCancelNotes={handleCancelMultipleNotes}
        type="conference"
      />

      {/* Modal de Cancelar Nota */}
      <CancelNoteModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        orderNumber={noteToCancelNumber}
        onConfirm={handleCancelNote}
      />

      {/* Modal de Adicionar Nota */}
      <AddNoteModal
        open={addNoteModalOpen}
        onOpenChange={setAddNoteModalOpen}
        people={people}
        availableTimers={availableTimers}
        activeTimers={activeTimers}
        onSuccess={handleAddNoteSuccess}
      />
    </>
  )
}
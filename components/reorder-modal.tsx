"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { GripVertical } from "lucide-react"
import type { TimerData } from "@/lib/types"

interface ReorderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableTimers: TimerData[]
  onReorder: (reorderedTimers: TimerData[]) => Promise<void>
  onCancelNotes?: (timerIds: string[]) => Promise<void>
  type: "separation" | "conference"
}

export function ReorderModal({ open, onOpenChange, availableTimers, onReorder, onCancelNotes, type }: ReorderModalProps) {
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [timers, setTimers] = useState<TimerData[]>(availableTimers)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [selectedTimers, setSelectedTimers] = useState<Set<string>>(new Set())
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const handlePasswordSubmit = () => {
    if (password === "987321") {
      setAuthenticated(true)
      setError("")
      setTimers([...availableTimers])
      setSelectedTimers(new Set())
    } else {
      setError("Senha incorreta!")
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newTimers = [...timers]
    const draggedItem = newTimers[draggedIndex]
    newTimers.splice(draggedIndex, 1)
    newTimers.splice(index, 0, draggedItem)

    setTimers(newTimers)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const newTimers = [...timers]
    const temp = newTimers[index]
    newTimers[index] = newTimers[index - 1]
    newTimers[index - 1] = temp
    setTimers(newTimers)
  }

  const moveDown = (index: number) => {
    if (index === timers.length - 1) return
    const newTimers = [...timers]
    const temp = newTimers[index]
    newTimers[index] = newTimers[index + 1]
    newTimers[index + 1] = temp
    setTimers(newTimers)
  }

  const toggleTimerSelection = (timerId: string) => {
    const newSelected = new Set(selectedTimers)
    if (newSelected.has(timerId)) {
      newSelected.delete(timerId)
    } else {
      newSelected.add(timerId)
    }
    setSelectedTimers(newSelected)
  }

  const handleCancelSelected = () => {
    if (selectedTimers.size === 0) return
    setShowCancelConfirm(true)
  }

  const confirmCancelNotes = async () => {
    if (onCancelNotes && selectedTimers.size > 0) {
      await onCancelNotes(Array.from(selectedTimers))
      setShowCancelConfirm(false)
      setAuthenticated(false)
      setPassword("")
      setSelectedTimers(new Set())
      onOpenChange(false)
    }
  }

  const handleSave = async () => {
    await onReorder(timers)
    setAuthenticated(false)
    setPassword("")
    setSelectedTimers(new Set())
    onOpenChange(false)
  }

  const handleClose = () => {
    setAuthenticated(false)
    setPassword("")
    setError("")
    setSelectedTimers(new Set())
    setShowCancelConfirm(false)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Reordenar Fila de {type === "separation" ? "Separação" : "Conferência"}
            </DialogTitle>
          </DialogHeader>

          {!authenticated ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Digite a senha para reordenar a fila:</p>
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button onClick={handlePasswordSubmit} className="w-full">
                Autenticar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Arraste as notas para reordenar ou use os botões ↑ ↓. Selecione notas para cancelar.
              </p>

              <div className="space-y-2">
                {timers.map((timer, index) => {
                  const isSelected = selectedTimers.has(timer.id)
                  return (
                    <Card
                      key={timer.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`p-3 cursor-move flex items-center justify-between transition-colors ${
                        draggedIndex === index ? "opacity-50" : ""
                      } ${isSelected ? "bg-red-50 border-red-300" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleTimerSelection(timer.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-semibold">Nota #{timer.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            Itens: {timer.itemCount} | Volumes: {timer.volumeCount}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveDown(index)}
                          disabled={index === timers.length - 1}
                        >
                          ↓
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                {onCancelNotes && (
                  <Button
                    variant="destructive"
                    onClick={handleCancelSelected}
                    disabled={selectedTimers.size === 0}
                  >
                    Cancelar Notas ({selectedTimers.size})
                  </Button>
                )}
                <Button onClick={handleSave}>Salvar Ordem</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Cancelamento */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cancelamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm">
              Tem certeza que deseja <span className="font-bold text-red-500">cancelar</span>{" "}
              <span className="font-bold">{selectedTimers.size}</span>{" "}
              {selectedTimers.size === 1 ? "nota" : "notas"}?
            </p>
            <p className="text-sm text-muted-foreground">
              Esta ação irá remover as notas da fila e marcá-las como canceladas no sistema.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>
              Não, voltar
            </Button>
            <Button variant="destructive" onClick={confirmCancelNotes}>
              Sim, cancelar {selectedTimers.size} {selectedTimers.size === 1 ? "nota" : "notas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
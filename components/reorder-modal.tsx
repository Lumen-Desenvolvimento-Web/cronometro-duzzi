"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { GripVertical } from "lucide-react"
import type { TimerData } from "@/lib/types"

interface ReorderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableTimers: TimerData[]
  onReorder: (reorderedTimers: TimerData[]) => Promise<void>
  type: "separation" | "conference"
}

export function ReorderModal({ open, onOpenChange, availableTimers, onReorder, type }: ReorderModalProps) {
  const [password, setPassword] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [timers, setTimers] = useState<TimerData[]>(availableTimers)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handlePasswordSubmit = () => {
    if (password === "987321") {
      setAuthenticated(true)
      setError("")
      setTimers([...availableTimers])
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

  const handleSave = async () => {
    await onReorder(timers)
    setAuthenticated(false)
    setPassword("")
    onOpenChange(false)
  }

  const handleClose = () => {
    setAuthenticated(false)
    setPassword("")
    setError("")
    onOpenChange(false)
  }

  return (
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
              Arraste as notas para reordenar ou use os botões ↑ ↓
            </p>

            <div className="space-y-2">
              {timers.map((timer, index) => (
                <Card
                  key={timer.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`p-3 cursor-move flex items-center justify-between ${
                    draggedIndex === index ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
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
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar Ordem</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
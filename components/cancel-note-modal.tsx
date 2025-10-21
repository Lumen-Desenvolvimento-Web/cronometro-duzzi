"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CancelNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderNumber: string
  onConfirm: () => Promise<void>
}

export function CancelNoteModal({ open, onOpenChange, orderNumber, onConfirm }: CancelNoteModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleConfirm = async () => {
    if (password !== "987321") {
      setError("Senha incorreta!")
      return
    }

    await onConfirm()
    setPassword("")
    setError("")
    onOpenChange(false)
  }

  const handleClose = () => {
    setPassword("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Nota</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm">
            Tem certeza que deseja <span className="font-bold text-red-500">cancelar</span> a nota <span className="font-bold">#{orderNumber}</span>?
          </p>
          <p className="text-sm text-muted-foreground">
            Esta ação irá remover a nota da fila e marcá-la como cancelada no sistema.
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium">Digite a senha para confirmar:</p>
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Sim, cancelar nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
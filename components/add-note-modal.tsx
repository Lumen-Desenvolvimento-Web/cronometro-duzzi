"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Person, TimerData } from "@/lib/types"
import { verifyCredentials, startTimer } from "@/lib/data-service"

interface AddNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  people: Person[]
  availableTimers: TimerData[]
  activeTimers: TimerData[]
  onSuccess: () => void
}

export function AddNoteModal({ open, onOpenChange, people, availableTimers, activeTimers, onSuccess }: AddNoteModalProps) {
  const [step, setStep] = useState<"login" | "noteNumber">("login")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [noteNumber, setNoteNumber] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [authenticatedPersonId, setAuthenticatedPersonId] = useState("")

  const handleLogin = async () => {
    setError("")
    
    const authenticated = await verifyCredentials(username, password)
    if (!authenticated.success) {
      setError(authenticated.message || "Usuário ou senha incorretos")
      return
    }

    const personId = people.find((person) => person.username === username)?.id
    if (!personId) {
      setError("Usuário não encontrado")
      return
    }

    setAuthenticatedPersonId(personId)
    setStep("noteNumber")
  }

  const validateNoteNumber = async (number: string): Promise<boolean> => {
    // Valida nas filas locais (disponíveis e ativas)
    const existsInAvailable = availableTimers.some((timer) => timer.orderNumber === number)
    const existsInActive = activeTimers.some((timer) => timer.orderNumber === number)
    
    if (existsInAvailable || existsInActive) {
      setError(`A nota #${number} já está na lista!`)
      return false
    }

    // Valida no banco de dados (todas as notas)
    try {
      const response = await fetch(`/api/notes/check?number=${number}`)
      const data = await response.json()
      
      if (data.exists) {
        setError(`A nota #${number} já existe no sistema!`)
        return false
      }
    } catch (err) {
      setError("Erro ao validar nota no sistema")
      return false
    }

    return true
  }

  const handleCreateNote = async () => {
    setError("")
    
    if (!noteNumber.trim()) {
      setError("Digite o número da nota")
      return
    }

    setLoading(true)

    // Valida se a nota já existe
    const isValid = await validateNoteNumber(noteNumber.trim())
    if (!isValid) {
      setLoading(false)
      return
    }

    try {
      // Cria a nota usando a API interna (sem autenticação)
      const createResponse = await fetch('/api/notes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: noteNumber.trim(),
          item_count: 1,
          volume_count: 1,
          order_date: new Date().toISOString(),
          status: 'pendente',
          destination: '',
          products: []
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        console.error('Erro da API:', errorData)
        throw new Error(errorData.error || 'Erro ao criar nota')
      }

      const responseData = await createResponse.json()
      console.log('Nota criada com sucesso:', responseData)

      // Inicia o timer automaticamente usando a função do data-service
      await startTimer(authenticatedPersonId, noteNumber.trim())

      // Sucesso! Fecha o modal e recarrega
      handleClose()
      onSuccess()
    } catch (err) {
      console.error('Erro completo:', err)
      setError(err instanceof Error ? err.message : "Erro ao criar nota")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep("login")
    setUsername("")
    setPassword("")
    setNoteNumber("")
    setError("")
    setAuthenticatedPersonId("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Nota</DialogTitle>
        </DialogHeader>

        {step === "login" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Faça login para adicionar uma nota:</p>
            
            <DropdownMenu>
              <div className="w-full">
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

            <div>
              <p className="mb-2">Senha:</p>
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button onClick={handleLogin} className="w-full">
              Autenticar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Digite o número da nota:</p>
            
            <Input
              placeholder="Número da nota"
              value={noteNumber}
              onChange={(e) => setNoteNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateNote()}
              autoFocus
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleCreateNote} disabled={loading}>
                {loading ? "Criando..." : "Criar e Iniciar"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
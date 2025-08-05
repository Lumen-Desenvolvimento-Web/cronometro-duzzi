"use client"

import type React from "react"

import { use, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2 } from "lucide-react"
import type { Person } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"

interface PeopleManagerProps {
  people: Person[]
  onRegisterUser: (name: string, username: string, password: string) => Promise<void>
  onRemovePerson: (id: string) => Promise<void>
}

export function PeopleManager({ people, onRegisterUser, onRemovePerson }: PeopleManagerProps) {
  const [newUserModalOpen, setNewUserModalOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: "", username: "", password: "" })

  const [removeUserModalOpen, setRemoveUserModalOpen] = useState(false)
  const [removeUserId, setRemoveUserId] = useState("")

  const handleNewUser = async () => {
    await onRegisterUser(newUser.name, newUser.username, newUser.password)
    setNewUserModalOpen(false)
  }

  const handleRemoveUser = async (id: string) => {
    await onRemovePerson(id)
    setRemoveUserModalOpen(false)
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Membros da Equipe</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Button onClick={() => setNewUserModalOpen(true)}>Adicionar Usuário</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Nome de Usuário</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">
                  Nenhum membro da equipe adicionado ainda
                </TableCell>
              </TableRow>
            ) : (
              people.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>{person.name}</TableCell>
                  <TableCell>{person.username}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => {setRemoveUserId(person.id); setRemoveUserModalOpen(true)}}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog open={newUserModalOpen} onOpenChange={setNewUserModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar Usuário</DialogTitle>
        </DialogHeader>

        {/* Campos de username e senha */}
        <Input
          placeholder="Nome"
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />
        <Input
          placeholder="Nome de usuário"
          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
        />
        <Input
          type="password"
          placeholder="Senha"
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
        />

        {/* {error && <p className="text-red-500">{error}</p>} */}

        <Button onClick={() => handleNewUser()}>
          Cadastrar
        </Button>
      </DialogContent>
    </Dialog>

    <Dialog open={removeUserModalOpen} onOpenChange={setRemoveUserModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover Usuário</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja remover esse usuário?
        </p>

        <Button onClick={() => handleRemoveUser(removeUserId)}>
          Remover
        </Button>
      </DialogContent>
    </Dialog>
    </>
  )
}


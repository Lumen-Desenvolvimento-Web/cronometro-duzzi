'use client'
import { Person, TimeRecord } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { approveTimer, verifyCredentials } from "@/lib/data-service";
import { EditNoteModal } from "./editNoteModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";


interface ConfirmationProps {
    people: Person[],
    finishedTimers: TimeRecord[]
}

export function Confirmation({ finishedTimers: initialTimers, people }: ConfirmationProps) {
    const [finishedTimers, setFinishedTimers] = useState<TimeRecord[]>(initialTimers)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [timerDetails, setTimerDetails] = useState<TimeRecord | null>()

    const [loginModalOpen, setLoginModalOpen] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loginError, setLoginError] = useState("")

    useEffect(() => {
        setFinishedTimers(initialTimers)
    }, [initialTimers])

    const handleUpdateTimers = (updatedTimer: TimeRecord) => {
        setFinishedTimers((prev) => prev.map((timer) => timer.id === updatedTimer.id ? updatedTimer : timer))
        setTimerDetails(updatedTimer)
    }

    const handleSave = async () => {
        const authenticated = await verifyCredentials(username, password)
        if (!authenticated.success) {
            setLoginError(authenticated.message || "Usuário ou senha incorretos")
            return
        }
        approveTimer(timerDetails?.id || '')
        setTimerDetails(null)
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Notas para conferir: {finishedTimers.length}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {finishedTimers.map((timer) => (
                            <Card>
                                <CardContent>
                                    <div className="flex flex-col gap-2">
                                        <p className="text-lg font-bold py-2">Nota: {timer.orderNumber}</p>
                                        <p className="text-md text-muted-foreground">Separador: {people.find((person) => person.id === timer.personId)?.name}</p>
                                        <p>Quantidade de itens: {timer.itemCount}</p>
                                        <p>Quantidade de volumes: {timer.volumeCount}</p>
                                        <Button onClick={() => { setDetailsModalOpen(true); setTimerDetails(timer) }}>Detalhes</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                <DialogContent className="w-fit">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Nota</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1 text-xl">
                        <Label>Nota: <b>{timerDetails?.orderNumber}</b></Label>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <Label>Itens: {timerDetails?.itemCount}</Label>
                        </div>
                        <div>
                            <Label>Volumes: {timerDetails?.volumeCount}</Label>
                        </div>
                        <div>
                            <Label>Produtos: </Label>
                            <Table className="mt-2 w-full">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Código</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Quantidade</TableHead>
                                        <TableHead>Localização</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {timerDetails?.products?.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.code}</TableCell>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell>{item.amount}</TableCell>
                                            <TableCell>{item.location}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <DialogFooter>
                        <div className="flex w-full justify-end gap-4">
                            <Button onClick={() => {
                                setEditModalOpen(true)
                            }}>
                                Editar
                            </Button>

                            <Button onClick={() => {
                                setLoginModalOpen(true)
                                setDetailsModalOpen(false)
                            }}>
                                Aprovar
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <EditNoteModal open={editModalOpen} onOpenChange={setEditModalOpen} timer={timerDetails || null} separator={people.find((person) => person.id === timerDetails?.personId)?.name} onUpdate={handleUpdateTimers} people={people} />

            <Dialog open={loginModalOpen} onOpenChange={(open) => {
                setLoginModalOpen(open)
                if (!open) {
                    setUsername("")
                    setPassword("")
                    setLoginError("")
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Login para Aprovar</DialogTitle>
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

                    <p>Senha: </p>
                    <Input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button onClick={() => handleSave()}>
                        Aprovar Nota
                    </Button>

                    {loginError && <p className="text-red-500 mt-2 text-sm">{loginError}</p>}
                </DialogContent>
            </Dialog>
        </>
    )
}

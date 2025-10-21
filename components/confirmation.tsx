'use client'
import { Person, TimeRecord } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { EditNoteModal } from "./editNoteModal";

interface ConfirmationProps {
    people: Person[],
    finishedTimers: TimeRecord[]
}

export function Confirmation({ finishedTimers: initialTimers, people }: ConfirmationProps) {
    const [finishedTimers, setFinishedTimers] = useState<TimeRecord[]>(initialTimers)
    const [detailsModalOpen, setDetailsModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [timerDetails, setTimerDetails] = useState<TimeRecord | null>()

    useEffect(() => {
        setFinishedTimers(initialTimers)
    }, [initialTimers])

    const handleUpdateTimers = (updatedTimer: TimeRecord) => {
        setFinishedTimers((prev) => prev.map((timer) => timer.id === updatedTimer.id ? updatedTimer : timer))
        setTimerDetails(updatedTimer)
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
                            <Card key={timer.id}>
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
                                        <TableHead className="w-[100px]">Código</TableHead>
                                        <TableHead>Descrição</TableHead>
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
                                setDetailsModalOpen(false)
                                setEditModalOpen(true)
                            }}>
                                Editar e Aprovar
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <EditNoteModal 
                open={editModalOpen} 
                onOpenChange={setEditModalOpen} 
                timer={timerDetails || null} 
                separator={people.find((person) => person.id === timerDetails?.personId)?.name} 
                onUpdate={handleUpdateTimers} 
                people={people} 
            />
        </>
    )
}
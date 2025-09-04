import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { TimeRecord } from "@/lib/types"

type EditTimerModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    timer: TimeRecord | null
}

export const EditTimerModal = ({ open, onOpenChange, timer }: EditTimerModalProps) => {


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <div className="flex flex-col gap-2">
                    <p className="text-lg font-bold py-2">Nota: {timer?.orderNumber}</p>
                    {/* <p className="text-md text-muted-foreground">Separador: {people.find((person) => person.id === timer?.personId)?.name}</p> */}
                    <p>Quantidade de itens: {timer?.itemCount}</p>
                    <p>Quantidade de volumes: {timer?.volumeCount}</p>
                    {/* <Button onClick={() => { setDetailsModalOpen(true); setTimerDetails(timer) }}>Detalhes</Button> */}
                </div>
            </DialogContent>
        </Dialog>
        )
}

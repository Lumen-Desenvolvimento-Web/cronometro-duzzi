import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { TimeRecord } from "@/lib/types"
import { Input } from "./ui/input"
import { updateConfirmationTimer } from "@/lib/data-service"

type EditTimerModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    timer: TimeRecord | null
    separator?: string
    onUpdate?: (updatedTimer: TimeRecord) => void
}

export const EditNoteModal = ({ open, onOpenChange, timer, separator, onUpdate }: EditTimerModalProps) => {
    const [formData, setFormData] = useState<{ [key: string]: number }>({})

    useEffect(() => {
        if (timer) {
            setFormData(timer.products ? timer.products.reduce((acc, product) => ({ ...acc, [product.id]: product.amount }), {}) : {})
        }
    }, [timer])

    // console.log(formData)

    const handleSave = async () => {
        if (formData && timer) {
            const updatedProducts = timer.products?.map((product) => ({
                ...product,
                amount: formData[product.id] || product.amount
            }))

            const updatedItemCount = Object.entries(formData).length
            const updatedVolumeCount = Object.values(formData).reduce((sum, val) => sum + val, 0)

            const updatedTimer: TimeRecord = {
                ...timer,
                itemCount: updatedItemCount,
                volumeCount: updatedVolumeCount,
                products: updatedProducts
            }
            
            await updateConfirmationTimer(updatedTimer)

            if (onUpdate) {
                onUpdate(updatedTimer)
            }
        }

        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <div className="flex flex-col gap-2">
                    <p className="text-lg font-bold py-2">Nota: {timer?.orderNumber}</p>
                    <p className="text-md text-muted-foreground">Separador: {separator}</p>

                    {timer?.products && timer.products.map((product, index) => (
                        <div key={index}>
                            <p className="font-semibold">Produto: {product.description}</p>
                            <Input defaultValue={product.amount} onChange={(e) => {setFormData((prev) => ({ ...prev, [product.id]: Number(e.target.value) }))}} />
                        </div>
                    ))}

                    <Button onClick={() => handleSave()}>Salvar</Button>
                </div>
            </DialogContent>
        </Dialog>
        )
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Person, TimeRecord } from "@/lib/types"
import { Input } from "./ui/input"
import { updateConfirmationTimer, verifyCredentials } from "@/lib/data-service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"

type EditTimerModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    timer: TimeRecord | null
    separator?: string
    onUpdate?: (updatedTimer: TimeRecord) => void
    people: Person[]
}

export const EditNoteModal = ({ open, onOpenChange, timer, separator, onUpdate, people }: EditTimerModalProps) => {
    const [formData, setFormData] = useState<{ [key: string]: number }>({})

    const [loginModalOpen, setLoginModalOpen] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loginError, setLoginError] = useState("")

    useEffect(() => {
        if (timer) {
            setFormData(timer.products ? timer.products.reduce((acc, product) => ({ ...acc, [product.id]: product.amount }), {}) : {})
        }
    }, [timer])

    // console.log(formData)

    const handleSave = async () => {
        const authenticated = await verifyCredentials(username, password)
        if (!authenticated.success) {
            setLoginError(authenticated.message || "Usuário ou senha incorretos")
            return
        }

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

        setLoginModalOpen(false)
        onOpenChange(false)
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <div className="flex flex-col gap-2">
                        <p className="text-lg font-bold py-2">Nota: {timer?.orderNumber}</p>
                        <p className="text-md text-muted-foreground">Separador: {separator}</p>

                        {timer?.products && timer.products.map((product, index) => (
                            <div key={index}>
                                <p className="font-semibold">Produto: {product.description}</p>
                                <Input defaultValue={product.amount} onChange={(e) => { setFormData((prev) => ({ ...prev, [product.id]: Number(e.target.value) })) }} />
                            </div>
                        ))}

                        <Button onClick={() => setLoginModalOpen(true)}>Salvar</Button>
                    </div>
                </DialogContent>
            </Dialog>

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

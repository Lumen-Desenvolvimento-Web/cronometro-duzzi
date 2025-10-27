import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Person, TimeRecord } from "@/lib/types"
import { Input } from "./ui/input"
import { updateConfirmationTimer, verifyCredentials, approveTimer } from "@/lib/data-service"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Card } from "./ui/card"
import { AlertCircle, Search } from "lucide-react"

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
    const [originalData, setOriginalData] = useState<{ [key: string]: number }>({})
    const [hasChanges, setHasChanges] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    const [loginModalOpen, setLoginModalOpen] = useState(false)
    const [confirmCloseModalOpen, setConfirmCloseModalOpen] = useState(false)
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loginError, setLoginError] = useState("")

    useEffect(() => {
        if (timer && timer.products) {
            const data = timer.products.reduce((acc, product) => ({ 
                ...acc, 
                [product.id]: product.amount 
            }), {})
            setFormData(data)
            setOriginalData(data)
            setHasChanges(false)
        }
    }, [timer])

    const handleValueChange = (productId: string, newValue: number) => {
        setFormData((prev) => ({ ...prev, [productId]: newValue }))
        setHasChanges(true)
    }

    const getChangedProducts = () => {
        if (!timer?.products) return { added: [], removed: [], unchanged: [] }

        const changes = timer.products.map((product) => {
            const originalAmount = originalData[product.id] || 0
            const newAmount = formData[product.id] || 0
            const diff = newAmount - originalAmount

            return {
                ...product,
                originalAmount,
                newAmount,
                diff,
                changed: diff !== 0
            }
        })

        return {
            added: changes.filter(p => p.diff > 0),
            removed: changes.filter(p => p.diff < 0),
            unchanged: changes.filter(p => p.diff === 0)
        }
    }

    const filteredProducts = timer?.products?.filter((product) => {
        const search = searchTerm.toLowerCase()
        return (
            String(product.id).toLowerCase().includes(search) ||
            product.description.toLowerCase().includes(search)
        )
    })

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
            await approveTimer(timer.id)

            if (onUpdate) {
                onUpdate(updatedTimer)
            }
        }

        setLoginModalOpen(false)
        setUsername("")
        setPassword("")
        setLoginError("")
        setHasChanges(false)
        onOpenChange(false)
        window.location.reload()
    }

    const handleClose = () => {
        if (hasChanges) {
            setConfirmCloseModalOpen(true)
        } else {
            onOpenChange(false)
        }
    }

    const confirmClose = () => {
        setConfirmCloseModalOpen(false)
        setHasChanges(false)
        setSearchTerm("")
        onOpenChange(false)
    }

    const changes = getChangedProducts()

    return (
        <>
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle>Editar Nota #{timer?.orderNumber}</DialogTitle>
                        <p className="text-sm text-muted-foreground">Separador: {separator}</p>
                    </DialogHeader>

                    {/* Container com scroll */}
                    <div className="flex-1 overflow-y-auto pr-2">
                        <div className="space-y-4">
                            {/* Campo de busca */}
                            <div className="sticky top-0 bg-background z-10 pb-3 border-b">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Buscar por código ou descrição..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                {searchTerm && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Mostrando {filteredProducts?.length || 0} de {timer?.products?.length || 0} produtos
                                    </p>
                                )}
                            </div>

                            {/* Produtos */}
                            <div>
                                <h3 className="font-semibold mb-3">Produtos:</h3>
                                {filteredProducts && filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => {
                                        const originalAmount = originalData[product.id] || 0
                                        const currentAmount = formData[product.id] || 0
                                        const diff = currentAmount - originalAmount
                                        const hasChanged = diff !== 0

                                        return (
                                            <div key={product.id} className={`mb-3 p-3 rounded-lg border ${
                                                hasChanged 
                                                    ? diff > 0 
                                                        ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                                                        : 'border-red-500 bg-red-50 dark:bg-red-950'
                                                    : 'border-gray-200'
                                            }`}>
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <p className="font-semibold text-sm">{product.description}</p>
                                                        <p className="text-xs text-muted-foreground">Código: {product.id}</p>
                                                    </div>
                                                    {hasChanged && (
                                                        <span className={`text-xs font-bold ${
                                                            diff > 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                            {diff > 0 ? `+${diff}` : diff}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input 
                                                        type="number"
                                                        value={currentAmount}
                                                        onChange={(e) => handleValueChange(product.id, Number(e.target.value))}
                                                        className="w-24"
                                                    />
                                                    {hasChanged && (
                                                        <span className="text-xs text-muted-foreground">
                                                            (Original: {originalAmount})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <p>Nenhum produto encontrado</p>
                                        {searchTerm && (
                                            <p className="text-sm mt-2">
                                                Tente ajustar sua busca
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Resumo das alterações */}
                            {hasChanges && (
                                <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200">
                                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        Resumo das Alterações
                                    </h4>
                                    
                                    {changes.added.length > 0 && (
                                        <div className="mb-2">
                                            <p className="text-sm font-semibold text-green-600">Adicionados:</p>
                                            <ul className="text-sm ml-4">
                                                {changes.added.map(p => (
                                                    <li key={p.id}>
                                                        {p.description}: +{p.diff} unidades
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {changes.removed.length > 0 && (
                                        <div>
                                            <p className="text-sm font-semibold text-red-600">Removidos:</p>
                                            <ul className="text-sm ml-4">
                                                {changes.removed.map(p => (
                                                    <li key={p.id}>
                                                        {p.description}: {p.diff} unidades
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Botão fixo no final */}
                    <div className="flex-shrink-0 pt-4 border-t">
                        <Button 
                            onClick={() => setLoginModalOpen(true)} 
                            className="w-full"
                        >
                            Aprovar Alterações
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Login para Aprovar */}
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
                        <DialogTitle>Autenticação Necessária</DialogTitle>
                    </DialogHeader>

                    <DropdownMenu>
                        <div className="mb-4 w-full">
                            <p className="mb-2">Usuário Aprovador:</p>

                            <DropdownMenuTrigger asChild>
                                <button className="w-full px-3 py-2 border rounded-md text-left">
                                    {username || "Selecionar aprovador"}
                                </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent className="w-full" align="start">
                                {people.filter((person) => person.type === 3).map((person) => (
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
                        onKeyDown={(e) => e.key === "Enter" && handleSave()}
                    />

                    <Button onClick={() => handleSave()}>
                        Confirmar e Aprovar
                    </Button>

                    {loginError && <p className="text-red-500 mt-2 text-sm">{loginError}</p>}
                </DialogContent>
            </Dialog>

            {/* Modal de Confirmação ao Fechar */}
            <Dialog open={confirmCloseModalOpen} onOpenChange={setConfirmCloseModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Descartar Alterações?</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <p className="text-sm">
                            Você possui alterações não salvas. Tem certeza que deseja fechar sem aprovar?
                        </p>
                        <p className="text-sm text-red-500 font-semibold">
                            Todas as alterações serão perdidas.
                        </p>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setConfirmCloseModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={confirmClose}>
                            Sim, descartar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
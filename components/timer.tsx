"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { TimeRecord } from "@/lib/types"
import { formatTime } from "@/lib/utils"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

interface TimerProps {
  timer: TimeRecord
  personName: string
  tag: string
  onStop: () => void
}

export function Timer({ timer, personName, tag, onStop }: TimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [buttonStyle, setButtonStyle] = useState({
    backgroundColor: "rgb(22, 163, 74)", // Verde inicial
    color: "white",
  })
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  useEffect(() => {
    // const startTime = new Date(timer.startTime).getTime()
    const startTime = timer.startTime ? new Date(timer.startTime).getTime() : 0;

    // Atualiza o tempo decorrido imediatamente
    const updateElapsedTime = () => {
      const seconds = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(seconds)

      // Calcula a cor com base no tempo decorrido (1 hora = 3600 segundos)
      const hourProgress = Math.min(seconds / 3600, 1) // Valor entre 0 e 1

      // Transição de cores: verde -> amarelo -> vermelho -> preto
      let backgroundColor
      let textColor = "white"

      if (hourProgress < 0.33) {
        // Verde para amarelo
        const greenValue = 163 - (163 - 202) * (hourProgress / 0.33)
        const redValue = 22 + (234 - 22) * (hourProgress / 0.33)
        backgroundColor = `rgb(${redValue}, ${greenValue}, 74)`
      } else if (hourProgress < 0.66) {
        // Amarelo para vermelho
        const normalizedProgress = (hourProgress - 0.33) / 0.33
        const greenValue = 202 - 202 * normalizedProgress
        backgroundColor = `rgb(234, ${greenValue}, 74)`
      } else {
        // Vermelho para preto
        const normalizedProgress = (hourProgress - 0.66) / 0.34
        const redValue = 234 - 234 * normalizedProgress
        const greenValue = 74 * (1 - normalizedProgress)
        backgroundColor = `rgb(${redValue}, ${greenValue}, ${greenValue})`

        // Ajusta a cor do texto para melhor contraste quando o fundo escurece
        if (normalizedProgress > 0.7) {
          textColor = "white"
        }
      }

      setButtonStyle({
        backgroundColor,
        color: textColor,
      })
    }

    updateElapsedTime()

    // Em seguida, atualiza a cada segundo
    const interval = setInterval(updateElapsedTime, 1000)

    return () => clearInterval(interval)
  }, [timer.startTime])

  return (
    <>
    <Card className="overflow-hidden min-w-80 w-fit">
      <CardContent className="p-4 cursor-pointer" onClick={() => setDetailsModalOpen(true)}>
        <div className="space-y-2">
          <div className="flex flex-col justify-between items-center">
            <span className="text-md text-muted-foreground">{tag}</span>
            <span className="font-bold text-5xl">{personName}</span>
            <span className="text-xl text-muted-foreground">Nota #{timer.orderNumber}</span>
            <span className="text-xl text-muted-foreground">Itens: {timer.itemCount}  /  Volumes: {timer.volumeCount}</span>
          </div>
          <div className="text-6xl font-bold text-center py-4">{formatTime(elapsedTime)}</div>
          <div className="text-xs text-muted-foreground">
            Iniciado: {timer.startTime && new Date(timer.startTime).toLocaleString("pt-BR")}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted p-2">
        <Button onClick={onStop} className="w-full transition-colors duration-300" style={buttonStyle}>
          Finalizar
        </Button>
      </CardFooter>
    </Card>

    <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
      <DialogContent className="w-fit">
        <DialogHeader>
          <DialogTitle>Detalhes da Nota</DialogTitle>
        </DialogHeader>
          <div className="space-y-1 text-xl">
              <Label>Nota: <b>{timer.orderNumber}</b></Label>
          </div>
          <div className="space-y-1">
            <div>
              <Label>Itens: {timer.itemCount}</Label>
            </div>
            <div>
              <Label>Volumes: {timer.volumeCount}</Label>
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
                  {timer?.products?.map((item) => (
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
          <Button onClick={() => setDetailsModalOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
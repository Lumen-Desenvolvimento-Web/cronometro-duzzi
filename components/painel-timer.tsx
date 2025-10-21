"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { TimeRecord } from "@/lib/types"
import { formatTime } from "@/lib/utils"

interface PainelTimerProps {
  timer: TimeRecord
  personName: string
  tag: string
}

export function PainelTimer({ timer, personName, tag }: PainelTimerProps) {
  const [elapsedTime, setElapsedTime] = useState(0)
  const [buttonStyle, setButtonStyle] = useState({
    backgroundColor: "rgb(22, 163, 74)",
    color: "white",
  })

  useEffect(() => {
    const startTime = timer.startTime ? new Date(timer.startTime).getTime() : 0

    const updateElapsedTime = () => {
      const seconds = Math.floor((Date.now() - startTime) / 1000)
      setElapsedTime(seconds)

      const hourProgress = Math.min(seconds / 3600, 1)

      let backgroundColor
      let textColor = "white"

      if (hourProgress < 0.33) {
        const greenValue = 163 - (163 - 202) * (hourProgress / 0.33)
        const redValue = 22 + (234 - 22) * (hourProgress / 0.33)
        backgroundColor = `rgb(${redValue}, ${greenValue}, 74)`
      } else if (hourProgress < 0.66) {
        const normalizedProgress = (hourProgress - 0.33) / 0.33
        const greenValue = 202 - 202 * normalizedProgress
        backgroundColor = `rgb(234, ${greenValue}, 74)`
      } else {
        const normalizedProgress = (hourProgress - 0.66) / 0.34
        const redValue = 234 - 234 * normalizedProgress
        const greenValue = 74 * (1 - normalizedProgress)
        backgroundColor = `rgb(${redValue}, ${greenValue}, ${greenValue})`

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
    const interval = setInterval(updateElapsedTime, 1000)

    return () => clearInterval(interval)
  }, [timer.startTime])

  return (
    <Card className="overflow-hidden min-w-80 w-fit bg-white">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex flex-col justify-between items-center">
            <span className="text-2xl font-semibold text-muted-foreground">{tag}</span>
            <span className="font-bold text-5xl text-black">{personName}</span>
            <span className="text-xl text-muted-foreground">Nota #{timer.orderNumber}</span>
            <span className="text-xl text-muted-foreground">
              Itens: {timer.itemCount} / Volumes: {timer.volumeCount}
            </span>
          </div>
          <div className="text-6xl font-bold text-center py-4 text-black">{formatTime(elapsedTime)}</div>
          <div className="text-xs text-muted-foreground">
            Iniciado: {timer.startTime && new Date(timer.startTime).toLocaleString("pt-BR")}
          </div>
        </div>
      </CardContent>
      <div className="bg-muted p-2 bg-gray-100">
        <div
          className="w-full p-2 text-center font-semibold transition-colors duration-300 rounded"
          style={buttonStyle}
        >
          Em andamento...
        </div>
      </div>
    </Card>
  )
}
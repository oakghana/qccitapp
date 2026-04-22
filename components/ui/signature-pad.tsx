"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PenLine, Trash2, Check } from "lucide-react"

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  onClear?: () => void
  initialValue?: string
  className?: string
  height?: number
  disabled?: boolean
}

export function SignaturePad({
  onSave,
  onClear,
  initialValue,
  className,
  height = 160,
  disabled = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(!initialValue)
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null)

  // Load initial value
  useEffect(() => {
    if (initialValue && canvasRef.current) {
      const img = new Image()
      img.onload = () => {
        const ctx = canvasRef.current?.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height)
          ctx.drawImage(img, 0, 0)
          setIsEmpty(false)
        }
      }
      img.src = initialValue
    }
  }, [initialValue])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ("touches" in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled) return
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas) return
      const pos = getPos(e, canvas)
      setIsDrawing(true)
      setLastPos(pos)
      setIsEmpty(false)
    },
    [disabled]
  )

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled) return
      e.preventDefault()
      const canvas = canvasRef.current
      if (!canvas || !lastPos) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const pos = getPos(e, canvas)
      ctx.beginPath()
      ctx.moveTo(lastPos.x, lastPos.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = "#1a1a2e"
      ctx.lineWidth = 2.5
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.stroke()
      setLastPos(pos)
    },
    [isDrawing, lastPos, disabled]
  )

  const endDraw = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)
    setLastPos(null)
    // Auto-save after drawing
    const canvas = canvasRef.current
    if (canvas && !isEmpty) {
      onSave(canvas.toDataURL("image/png"))
    }
  }, [isDrawing, isEmpty, onSave])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onClear?.()
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return
    onSave(canvas.toDataURL("image/png"))
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="relative rounded-md border-2 border-dashed border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-950 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={height}
          className={cn(
            "w-full cursor-crosshair block touch-none",
            disabled && "cursor-not-allowed opacity-60"
          )}
          style={{ height }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-muted-foreground gap-1">
            <PenLine className="h-6 w-6 opacity-40" />
            <span className="text-xs opacity-60">Sign here</span>
          </div>
        )}
        {/* Baseline */}
        <div
          className="absolute bottom-8 left-8 right-8 border-b border-orange-200 dark:border-orange-800 pointer-events-none"
        />
      </div>
      {!disabled && (
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={clearCanvas} className="text-xs h-7">
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={saveSignature}
            disabled={isEmpty}
            className="text-xs h-7 border-orange-300 text-orange-700"
          >
            <Check className="h-3 w-3 mr-1" />
            Confirm Signature
          </Button>
        </div>
      )}
    </div>
  )
}

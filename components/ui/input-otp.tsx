"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface InputOTPProps {
  maxLength?: number
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  containerClassName?: string
  className?: string
  children?: React.ReactNode
  render?: (props: { slots: { char: string; hasFakeCaret: boolean; isActive: boolean }[] }) => React.ReactNode
}

const InputOTPContext = React.createContext<{
  slots: { char: string; hasFakeCaret: boolean; isActive: boolean }[]
  activeIndex: number
}>({
  slots: [],
  activeIndex: -1,
})

const InputOTP = React.forwardRef<HTMLDivElement, InputOTPProps>(
  ({ className, containerClassName, maxLength = 6, value = "", onChange, disabled, children, ...props }, ref) => {
    const [activeIndex, setActiveIndex] = React.useState(-1)
    const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

    const slots = React.useMemo(() => {
      return Array.from({ length: maxLength }, (_, i) => ({
        char: value[i] || "",
        hasFakeCaret: i === value.length && activeIndex === i,
        isActive: i === activeIndex,
      }))
    }, [value, maxLength, activeIndex])

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }

    const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const newChar = e.target.value.slice(-1)
      if (!/^\d*$/.test(newChar)) return

      const newValue = value.slice(0, index) + newChar + value.slice(index + 1)
      onChange?.(newValue.slice(0, maxLength))

      if (newChar && index < maxLength - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault()
      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, maxLength)
      onChange?.(pastedData)
    }

    return (
      <InputOTPContext.Provider value={{ slots, activeIndex }}>
        <div
          ref={ref}
          className={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
          onPaste={handlePaste}
          {...props}
        >
          {children || (
            <div className="flex items-center gap-2">
              {slots.map((slot, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={slot.char}
                  disabled={disabled}
                  className={cn(
                    "h-10 w-10 text-center border rounded-md text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-background",
                    disabled && "cursor-not-allowed opacity-50",
                    className
                  )}
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(-1)}
                />
              ))}
            </div>
          )}
        </div>
      </InputOTPContext.Provider>
    )
  }
)
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const { slots } = React.useContext(InputOTPContext)
  const slot = slots[index] || { char: "", hasFakeCaret: false, isActive: false }
  const { char, hasFakeCaret, isActive } = slot

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border-y border-r border-input text-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-2 ring-ring ring-offset-background",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <span className="mx-1">-</span>
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }

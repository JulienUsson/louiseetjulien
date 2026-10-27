"use client"

import * as React from "react"
import { MinusIcon, PlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function NumberStepper({
  id,
  value,
  onValueChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  className,
}: {
  id?: string
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}) {
  const [draft, setDraft] = React.useState(String(value))
  const [focused, setFocused] = React.useState(false)

  const clamp = (next: number) => Math.min(max, Math.max(min, next))

  const step = (delta: number) => {
    const next = clamp(value + delta)
    onValueChange(next)
    setDraft(String(next))
  }

  return (
    <div data-slot="number-stepper" className={cn("flex gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => step(-1)}
        disabled={value <= min}
        aria-label="Diminuer"
      >
        <MinusIcon />
      </Button>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        className="text-center tabular-nums"
        value={focused ? draft : String(value)}
        onFocus={(event) => {
          setFocused(true)
          setDraft(String(value))
          event.target.select()
        }}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "")
          setDraft(digits)
          if (digits) onValueChange(clamp(Number(digits)))
        }}
        onBlur={() => {
          setFocused(false)
          if (!draft) onValueChange(min)
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => step(1)}
        disabled={value >= max}
        aria-label="Augmenter"
      >
        <PlusIcon />
      </Button>
    </div>
  )
}

export { NumberStepper }

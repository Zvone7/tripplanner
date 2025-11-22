"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import type { Currency } from "../types/models"
import { cn } from "../lib/utils"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { ScrollArea } from "./ui/scroll-area"

interface CurrencyDropdownProps {
  value: number | null
  onChange: (currencyId: number) => void
  currencies: Currency[]
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
}

export function CurrencyDropdown({
  value,
  onChange,
  currencies,
  placeholder = "Select currency",
  disabled = false,
  className,
  triggerClassName,
}: CurrencyDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const sortedCurrencies = useMemo(() => {
    if (!currencies.length) return []
    return [...currencies].sort((a, b) => a.shortName.localeCompare(b.shortName, undefined, { sensitivity: "base" }))
  }, [currencies])

  const filteredCurrencies = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return sortedCurrencies
    return sortedCurrencies.filter((currency) => {
      const shortMatch = currency.shortName.toLowerCase().includes(term)
      const nameMatch = currency.name.toLowerCase().includes(term)
      const symbolMatch = currency.symbol.toLowerCase().includes(term)
      return shortMatch || nameMatch || symbolMatch
    })
  }, [sortedCurrencies, search])

  const selectedCurrency = useMemo(() => {
    if (!value) return null
    return currencies.find((currency) => currency.id === value) ?? null
  }, [currencies, value])

  useEffect(() => {
    if (!open) setSearch("")
  }, [open])

  const selectedShortLabel = selectedCurrency ? `${selectedCurrency.symbol} - ${selectedCurrency.shortName}` : null

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between text-sm", triggerClassName)}
            disabled={disabled || !currencies.length}
          >
            {selectedCurrency ? (
              <span className="truncate font-medium">
                {open ? (
                  <>
                    {selectedShortLabel}
                    <span className="text-muted-foreground"> · {selectedCurrency.name}</span>
                  </>
                ) : (
                  selectedShortLabel
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <div className="border-b p-2">
            <Input
              autoFocus
              placeholder="Search currency..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <ScrollArea className="h-64">
            <div className="py-1">
              {filteredCurrencies.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">No currencies found</div>
              )}
              {filteredCurrencies.map((currency) => {
                const isSelected = currency.id === value
                return (
                  <button
                    type="button"
                    key={currency.id}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted",
                      isSelected ? "bg-muted/60" : "",
                    )}
                    onClick={() => {
                      onChange(currency.id)
                      setOpen(false)
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {currency.symbol} {currency.shortName}
                      </span>
                      <span className="text-xs text-muted-foreground">{currency.name}</span>
                    </div>
                    <Check className={cn("h-4 w-4 text-primary", isSelected ? "opacity-100" : "opacity-0")} />
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  )
}

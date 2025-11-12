import { useMemo } from "react"
import { Label } from "../ui/label"
import { MultiSelect, type OptionType } from "../ui/multiselect"
import type { SegmentType } from "../../types/models"

interface SegmentTypeFilterProps {
  types: SegmentType[]
  value: string[]
  onChange: (next: string[]) => void
  label?: string
  placeholder?: string
}

export function SegmentTypeFilter({
  types,
  value,
  onChange,
  label = "Segment types",
  placeholder = "Select segment types",
}: SegmentTypeFilterProps) {
  const options: OptionType[] = useMemo(() => {
    return types
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((type) => ({
        value: type.id.toString(),
        label: (
          <span className="flex items-center gap-2">
            {type.iconSvg ? <span className="w-4 h-4" dangerouslySetInnerHTML={{ __html: type.iconSvg }} /> : null}
            <span>{type.name}</span>
          </span>
        ),
      }))
  }, [types])

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <MultiSelect options={options} selected={value} onChange={onChange} placeholder={placeholder} />
    </div>
  )
}

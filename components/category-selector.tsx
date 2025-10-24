"use client"

import { useState, useEffect } from "react"
import { Check, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"

interface Category {
  id: string
  name: string
  slug: string
  color: string
  icon: string
}

interface CategorySelectorProps {
  selectedCategories: string[]
  onChange: (categoryIds: string[]) => void
  multiple?: boolean
}

export function CategorySelector({ selectedCategories, onChange, multiple = true }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { getSupabaseClient } = await import('@/lib/supabase-admin')
      const supabase = getSupabaseClient()

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error

      setCategories(data || [])
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    if (multiple) {
      const newSelection = selectedCategories.includes(categoryId)
        ? selectedCategories.filter(id => id !== categoryId)
        : [...selectedCategories, categoryId]
      onChange(newSelection)
    } else {
      onChange([categoryId])
      setOpen(false)
    }
  }

  const selectedCategoryObjects = categories.filter(cat =>
    selectedCategories.includes(cat.id)
  )

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCategories.length === 0 ? (
              <span className="text-muted-foreground">Selecione categorias...</span>
            ) : (
              <span>
                {selectedCategories.length} {selectedCategories.length === 1 ? 'categoria' : 'categorias'} selecionada(s)
              </span>
            )}
            <Tag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar categoria..." />
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={() => toggleCategory(category.id)}
                >
                  <div
                    className="mr-2 h-4 w-4 rounded-sm border border-primary"
                    style={{
                      backgroundColor: selectedCategories.includes(category.id)
                        ? category.color
                        : 'transparent'
                    }}
                  >
                    {selectedCategories.includes(category.id) && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3" style={{ color: category.color }} />
                    <span>{category.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Categories Display */}
      {selectedCategoryObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategoryObjects.map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              style={{ backgroundColor: category.color + '20', color: category.color }}
              className="cursor-pointer hover:opacity-80"
              onClick={() => toggleCategory(category.id)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {category.name}
              <span className="ml-2">×</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useState } from 'react'

interface SearchInputProps {
  placeholder: string
  onSearch: (value: string) => void
}

export function SearchInput({ placeholder, onSearch }: SearchInputProps) {
  const [value, setValue] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    onSearch(newValue)
  }

  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className="pl-10"
      />
    </div>
  )
}

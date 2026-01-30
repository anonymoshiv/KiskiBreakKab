'use client'

import React from "react"

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ReactNode } from 'react'

interface FormInputProps {
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  icon?: ReactNode
}

export function FormInput({
  label,
  type = 'text',
  placeholder,
  required,
  value,
  onChange,
  error,
  icon,
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          type={type}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          className={`${icon ? 'pl-10' : ''} ${error ? 'border-destructive' : ''}`}
        />
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

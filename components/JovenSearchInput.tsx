'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, User } from 'lucide-react'
import type { Joven } from '@/lib/supabase'

interface JovenSearchInputProps {
  value: string
  onChange: (value: string) => void
  onJovenSelect?: (joven: Joven) => void
  placeholder?: string
  required?: boolean
  className?: string
  error?: string
  label?: string
  disabled?: boolean
}

export default function JovenSearchInput({
  value,
  onChange,
  onJovenSelect,
  placeholder = 'Buscar joven por nombre...',
  required = false,
  className = '',
  error,
  label,
  disabled = false
}: JovenSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [jovenes, setJovenes] = useState<Joven[]>([])
  const [filteredJovenes, setFilteredJovenes] = useState<Joven[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedJoven, setSelectedJoven] = useState<Joven | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Cargar todos los jóvenes al montar el componente
  useEffect(() => {
    loadJovenes()
  }, [])

  // Filtrar jóvenes cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredJovenes([])
      setShowDropdown(false)
      return
    }

    const term = searchTerm.toLowerCase().trim()
    const filtered = jovenes.filter(joven => {
      const nombreCompleto = `${joven.nombres || ''} ${joven.apellidos || ''}`.toLowerCase().trim()
      const nombres = joven.nombres?.toLowerCase() || ''
      const apellidos = joven.apellidos?.toLowerCase() || ''
      const identidad = joven.identidad?.toLowerCase() || ''
      const expAdmin = joven.expediente_administrativo?.toLowerCase() || ''
      const expJudicial = joven.expediente_judicial?.toLowerCase() || ''
      
      return (
        nombreCompleto.includes(term) ||
        nombres.includes(term) ||
        apellidos.includes(term) ||
        identidad.includes(term) ||
        expAdmin.includes(term) ||
        expJudicial.includes(term)
      )
    })

    setFilteredJovenes(filtered.slice(0, 10)) // Limitar a 10 resultados
    // Mostrar dropdown si hay resultados y el usuario está escribiendo
    setShowDropdown(filtered.length > 0 && searchTerm.trim().length > 0)
  }, [searchTerm, jovenes])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Si hay un valor inicial, buscar el joven correspondiente
  useEffect(() => {
    if (value && !selectedJoven) {
      const joven = jovenes.find(j => 
        `${j.nombres} ${j.apellidos}` === value
      )
      if (joven) {
        setSelectedJoven(joven)
        setSearchTerm(value)
      }
    }
  }, [value, jovenes, selectedJoven])

  const loadJovenes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/jovenes?limit=1000')
      
      if (!response.ok) {
        throw new Error('Error al cargar los jóvenes')
      }

      const result = await response.json()
      
      if (result.success && result.jovenes) {
        setJovenes(result.jovenes)
      }
    } catch (error) {
      console.error('Error loading jovenes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSearchTerm(newValue)
    
    // Si se borra el texto, limpiar selección
    if (newValue.trim() === '') {
      setSelectedJoven(null)
      onChange('')
      if (onJovenSelect) {
        onJovenSelect({} as Joven)
      }
    }
  }

  const handleJovenSelect = (joven: Joven) => {
    const nombreCompleto = `${joven.nombres} ${joven.apellidos}`
    setSelectedJoven(joven)
    setSearchTerm(nombreCompleto)
    onChange(nombreCompleto)
    setShowDropdown(false)
    
    if (onJovenSelect) {
      onJovenSelect(joven)
    }
  }

  const handleClear = () => {
    setSearchTerm('')
    setSelectedJoven(null)
    onChange('')
    setShowDropdown(false)
    if (onJovenSelect) {
      onJovenSelect({} as Joven)
    }
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => {
            // Mostrar dropdown si hay un término de búsqueda y resultados
            if (searchTerm.trim().length > 0 && filteredJovenes.length > 0) {
              setShowDropdown(true)
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full pl-10 pr-10 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500
            dark:bg-gray-700 dark:text-white dark:border-gray-600
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            ${disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}
          `}
        />
        
        {searchTerm && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Dropdown de resultados */}
      {showDropdown && filteredJovenes.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredJovenes.map((joven) => {
            const nombreCompleto = `${joven.nombres} ${joven.apellidos}`
            return (
              <button
                key={joven.id}
                type="button"
                onClick={() => handleJovenSelect(joven)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
              >
                <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {nombreCompleto}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {joven.edad && `Edad: ${joven.edad} años`}
                    {joven.identidad && ` • ID: ${joven.identidad}`}
                    {joven.expediente_administrativo && ` • Exp. Admin: ${joven.expediente_administrativo}`}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {loading && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  )
}

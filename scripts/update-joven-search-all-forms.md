# Script para Actualizar Todos los Formularios con Buscador de Jóvenes

Este documento describe los cambios necesarios para agregar el buscador de jóvenes a todos los formularios.

## Componente Creado
- `components/JovenSearchInput.tsx` - Componente reutilizable de búsqueda de jóvenes

## Patrón de Actualización

Para cada formulario que tenga un campo de nombre de joven, hacer:

### 1. Agregar import
```typescript
import JovenSearchInput from '@/components/JovenSearchInput'
```

### 2. Reemplazar el input de texto por JovenSearchInput

**Antes:**
```tsx
<label>Nombre completo del NNAJ *</label>
<input
  type="text"
  name="nombre_completo_nnaj"
  value={formData.nombre_completo_nnaj}
  onChange={handleChange}
  className="input-field"
  required
/>
```

**Después:**
```tsx
<JovenSearchInput
  value={formData.nombre_completo_nnaj}
  onChange={(value) => setFormData(prev => ({ ...prev, nombre_completo_nnaj: value }))}
  onJovenSelect={(joven) => {
    if (joven.id) {
      setFormData(prev => ({
        ...prev,
        nombre_completo_nnaj: `${joven.nombres} ${joven.apellidos}`,
        edad: joven.edad?.toString() || prev.edad
      }))
    }
  }}
  label="Nombre completo del NNAJ"
  required
  placeholder="Buscar joven por nombre..."
/>
```

## Campos a Buscar y Reemplazar

- `nombre_completo_nnaj` → "Nombre completo del NNAJ"
- `nombre_nnaj` → "Nombre de NNAJ" o "Nombre completo"
- `nombre_completo` → "Nombre completo"
- `nombre_apellidos` → "Nombre y apellidos"
- `nombre_apellidos_naj` → "Nombre y apellidos del NAJ"
- `nombre_nino` → "Nombre del Niño (a)"

## Formularios Actualizados

### Psicología PMSPL (8/8) ✅
- entrevista-inicial-adolescente
- entrevista-final-adolescente
- entrevista-psicologica-adolescentes-jovenes
- seguimiento-psicologico
- informe-psicodiagnostico
- informe-seguimiento
- informe-final
- remision-instituciones

### Psicología CPI (3/15) ⏳
- entrevista-inicial-adolescente ✅
- entrevista-preeliminar ✅
- informe-psicodiagnostico ✅
- [Pendientes: 12 más]

### Otras Áreas (0/X) ⏳
- Trabajo Social
- Salud/Médicos
- Pedagogía
- Legal
- Seguridad

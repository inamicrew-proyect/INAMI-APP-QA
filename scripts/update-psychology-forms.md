# Script para Actualizar Formularios Psicológicos

Este documento describe los cambios necesarios para hacer funcionales todos los formularios psicológicos.

## Cambios Necesarios en Cada Formulario

Para cada formulario, se deben hacer los siguientes cambios:

### 1. Agregar imports
```typescript
import { 
  getUltimoFormulario, 
  saveOrUpdateFormulario,
  TIPOS_FORMULARIOS 
} from '@/lib/formularios-psicologicos'
```

### 2. Agregar estado para formularioId
```typescript
const [formularioId, setFormularioId] = useState<string | null>(null)
```

### 3. Actualizar función loadJovenData a loadData
Reemplazar la función `loadJovenData` con `loadData` que:
- Carga datos del joven
- Busca formulario existente usando `getUltimoFormulario`
- Si existe, carga sus datos en el estado
- Si no existe, solo carga datos del joven

### 4. Actualizar handleSubmit
Reemplazar el código de `supabase.from('formularios_psicologicos').insert()` con:
```typescript
await saveOrUpdateFormulario(
  jovenId,
  TIPOS_FORMULARIOS.[TIPO_CORRESPONDIENTE],
  formData
)
```

## Mapeo de Tipos de Formularios

- `entrevista_inicial_adolescente` → `TIPOS_FORMULARIOS.ENTREVISTA_INICIAL_ADOLESCENTE_PMSPL`
- `entrevista_final_adolescente` → `TIPOS_FORMULARIOS.ENTREVISTA_FINAL_ADOLESCENTE_PMSPL`
- `entrevista_psicologica_adolescentes_jovenes` → `TIPOS_FORMULARIOS.ENTREVISTA_PSICOLOGICA_ADOLESCENTES_JOVENES`
- `seguimiento_psicologico` → `TIPOS_FORMULARIOS.SEGUIMIENTO_PSICOLOGICO`
- `informe_psicodiagnostico` → `TIPOS_FORMULARIOS.INFORME_PSICODIAGNOSTICO_PMSPL`
- `informe_seguimiento` → `TIPOS_FORMULARIOS.INFORME_SEGUIMIENTO_PMSPL`
- `informe_final` → `TIPOS_FORMULARIOS.INFORME_FINAL_PMSPL`
- `remision_instituciones` → `TIPOS_FORMULARIOS.REMISION_INSTITUCIONES_PMSPL`

# Solución para el Error de Git Pull

## Problema
Tienes cambios locales en `package.json` que no están commiteados, y Git no puede hacer pull porque los sobrescribiría.

## Solución Rápida

### Opción 1: Guardar cambios locales y hacer pull (Recomendado)

```bash
# 1. Guardar tus cambios locales temporalmente
git stash

# 2. Hacer pull de los cambios remotos
git pull

# 3. Ver si hay conflictos o si necesitas tus cambios locales
git stash list

# 4. Si necesitas aplicar tus cambios locales de nuevo:
git stash pop
```

### Opción 2: Commitear tus cambios locales primero

```bash
# 1. Ver qué cambios tienes
git status
git diff package.json

# 2. Si los cambios son correctos, commitearlos
git add package.json
git commit -m "Actualizar script de inicio para standalone"

# 3. Hacer pull (puede haber conflictos si hay cambios remotos)
git pull

# 4. Si hay conflictos, resolverlos y luego:
git add package.json
git commit -m "Resolver conflictos en package.json"
```

### Opción 3: Descartar cambios locales (Solo si no necesitas los cambios)

```bash
# ⚠️ CUIDADO: Esto eliminará tus cambios locales
git checkout -- package.json

# Luego hacer pull
git pull
```

## Verificar el Script de Diagnóstico

Después de hacer pull, verifica si el script existe:

```bash
# Verificar si el script existe
ls -la scripts/diagnostico-vps.sh

# Si no existe, crearlo manualmente o esperar a que se suba al repo
```

## Recomendación

Usa la **Opción 1** (stash) porque:
- Guarda tus cambios sin perderlos
- Te permite hacer pull sin problemas
- Puedes aplicar tus cambios después si los necesitas

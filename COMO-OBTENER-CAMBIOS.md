# Cómo Obtener Cambios de Otros Desarrolladores

## 📥 Proceso para Obtener Cambios Remotos

### 1. **Verificar si hay cambios remotos** (sin modificar tu código local)
```bash
git fetch origin
```

Este comando descarga los cambios del repositorio remoto pero NO modifica tus archivos locales.

### 2. **Ver qué cambios hay disponibles**
```bash
git log HEAD..origin/main --oneline
```

Esto muestra los commits que están en el remoto pero no en tu rama local.

### 3. **Ver el estado actual**
```bash
git status
```

Esto te dirá si tu rama está:
- **"up to date"**: No hay cambios nuevos
- **"behind"**: Hay cambios remotos que no tienes localmente
- **"ahead"**: Tienes commits locales que no están en el remoto
- **"diverged"**: Tienes cambios locales Y hay cambios remotos (necesitas merge)

### 4. **Obtener los cambios** (actualizar tu código local)

#### Opción A: Pull simple (recomendado si no tienes cambios locales)
```bash
git pull origin main
```

#### Opción B: Pull con rebase (mantiene historial más limpio)
```bash
git pull --rebase origin main
```

#### Opción C: Si tienes cambios locales sin commitear
```bash
# Primero guarda tus cambios
git stash

# Luego obtén los cambios remotos
git pull origin main

# Finalmente recupera tus cambios
git stash pop
```

### 5. **Si hay conflictos**

Si Git te dice que hay conflictos:
```bash
# Ver qué archivos tienen conflictos
git status

# Abre los archivos con conflictos y busca las marcas:
# <<<<<<< HEAD
# (tu código)
# =======
# (código del remoto)
# >>>>>>> origin/main

# Resuelve los conflictos manualmente, luego:
git add .
git commit -m "Resuelto conflicto con cambios remotos"
```

## 🔄 Flujo de Trabajo Recomendado

### Antes de empezar a trabajar:
```bash
git pull origin main
```

### Después de hacer tus cambios:
```bash
git add .
git commit -m "Tu mensaje"
git push origin main
```

### Si alguien más hizo push mientras trabajabas:
```bash
# Intenta hacer push
git push origin main

# Si te dice que hay cambios remotos:
git pull origin main
# (resuelve conflictos si los hay)
git push origin main
```

## ⚠️ Comandos Útiles

### Ver diferencias antes de hacer pull:
```bash
git fetch origin
git diff HEAD origin/main
```

### Ver qué archivos cambiaron:
```bash
git fetch origin
git diff --name-only HEAD origin/main
```

### Deshacer un pull (si algo salió mal):
```bash
git reset --hard HEAD@{1}
```

## 📋 Resumen Rápido

**Para obtener cambios de tu amigo:**
1. `git fetch origin` - Ver si hay cambios
2. `git pull origin main` - Obtener y aplicar cambios
3. Si hay conflictos, resuélvelos manualmente
4. `git push origin main` - Subir tus cambios

**¡Importante!** Siempre haz `git pull` antes de empezar a trabajar para tener la versión más reciente.

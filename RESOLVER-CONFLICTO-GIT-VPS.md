# Resolver Conflicto de Git en VPS

Si ves este error al hacer `git pull`:

```
error: Your local changes to the following files would be overwritten by merge:
        scripts/limpiar-archivos-temporales.sh
        scripts/ver-archivos-temporales.sh
```

## Solución Rápida (Recomendada)

Ejecuta este comando en el VPS:

```bash
cd ~/INAMI.APP

# Eliminar los archivos que causan conflicto
rm -f scripts/limpiar-archivos-temporales.sh
rm -f scripts/ver-archivos-temporales.sh

# Descartar cualquier otro cambio local y sincronizar
git reset --hard HEAD
git clean -fd
git pull
```

## Solución Automática

O usa el script automático:

```bash
cd ~/INAMI.APP
chmod +x scripts/resolver-conflicto-git-vps.sh
./scripts/resolver-conflicto-git-vps.sh
```

## Solución Manual Paso a Paso

### Opción 1: Descartar cambios locales (si no necesitas los cambios)

```bash
# 1. Eliminar archivos temporales
rm -f scripts/limpiar-archivos-temporales.sh
rm -f scripts/ver-archivos-temporales.sh

# 2. Descartar todos los cambios locales
git reset --hard HEAD

# 3. Limpiar archivos no rastreados
git clean -fd

# 4. Hacer pull
git pull
```

### Opción 2: Guardar cambios en stash (si quieres conservarlos)

```bash
# 1. Guardar cambios en stash
git stash

# 2. Hacer pull
git pull

# 3. Si quieres recuperar los cambios (opcional)
git stash pop

# 4. Si NO quieres los cambios, eliminar el stash
git stash drop
```

### Opción 3: Eliminar archivos específicos y hacer pull

```bash
# 1. Eliminar solo los archivos que causan conflicto
rm -f scripts/limpiar-archivos-temporales.sh
rm -f scripts/ver-archivos-temporales.sh

# 2. Agregar la eliminación al staging
git add scripts/limpiar-archivos-temporales.sh scripts/ver-archivos-temporales.sh

# 3. Hacer commit
git commit -m "Eliminar archivos temporales"

# 4. Hacer pull
git pull
```

## ¿Por qué ocurre este error?

Esto sucede porque:
1. Los archivos fueron eliminados en el repositorio remoto (desde tu PC)
2. Pero aún existen en el VPS con cambios locales
3. Git no puede hacer merge porque sobrescribiría los cambios locales

## Prevención

Para evitar esto en el futuro, asegúrate de que el `.gitignore` esté actualizado y sincronizado:

```bash
# En el VPS, después de hacer pull
git pull

# Verificar que .gitignore está actualizado
cat .gitignore | grep "limpiar-archivos"
```


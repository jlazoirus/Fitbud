# Procedimiento de rollback — Fitbros

Checklist operativo para revertir un despliegue defectuoso. Ejecutar en el orden indicado.

---

## 1. Rollback de frontend (Vercel)

```bash
# Ver el historial de deployments
vercel list

# Revertir al deployment anterior (copiar el ID de 'vercel list')
vercel rollback <deployment-id>
```

O desde el dashboard de Vercel: **Settings → Deployments → [deployment anterior] → Promote to Production**.

El rollback solo afecta al código estático y las API functions. Los datos de Supabase no se revierten automáticamente.

---

## 2. Rollback de migración SQL (Supabase)

Las migraciones de Fitbros no tienen un script `down` automático. Seguir estos pasos manualmente en el panel SQL de Supabase (o `psql`):

### Rollback de columna nueva
```sql
ALTER TABLE <tabla> DROP COLUMN IF EXISTS <columna>;
```

### Rollback de tabla nueva
```sql
DROP TABLE IF EXISTS <tabla> CASCADE;
```

### Rollback de función nueva
```sql
DROP FUNCTION IF EXISTS <funcion>(<tipos_parametros>);
```

### Rollback de política RLS
```sql
DROP POLICY IF EXISTS "<nombre_politica>" ON <tabla>;
```

> **Nota:** Nunca hacer DROP de tablas con datos de producción sin confirmar backup previo.
> Verificar primero: `SELECT count(*) FROM <tabla>;`

---

## 3. Rollback de service worker (cache PWA)

Si el nuevo SW tiene un bug y los usuarios están en un estado de cache roto:

```bash
# Subir la versión del CACHE_NAME en service-worker.js para forzar purga
# Cambiar: const CACHE_NAME = 'fitbud-pwa-v34';
# Por:     const CACHE_NAME = 'fitbud-pwa-v35';
# Luego git commit + git push → Vercel redespliega

git add service-worker.js
git commit -m "fix: forzar purga de cache PWA tras rollback"
git push origin main
```

Los usuarios con el SW viejo recibirán el nuevo en la próxima visita (network-first para `index.html`).

---

## 4. Rollback de Git

```bash
# Ver los últimos commits
git log --oneline -10

# Revertir el último commit (preserva cambios sin commitear)
git revert HEAD --no-edit
git push origin main

# Si se necesita revertir varios commits, hacer un revert por cada uno
# NUNCA usar git push --force en main
```

---

## 5. Rollback de variables de entorno (Vercel)

Desde el dashboard de Vercel: **Settings → Environment Variables → [variable] → editar o eliminar**.

Si una variable nueva causó el problema, puede cambiarse o eliminarse sin necesidad de redeploy en algunos casos (depende de la función serverless).

---

## 6. Checklist de verificación post-rollback

Después de revertir, ejecutar:

```bash
# 1. Verificar que el release gate pasa con el código revertido
node scripts/release-gate.mjs

# 2. Smoke test contra producción
node scripts/smoke-test.mjs

# 3. Verificar que el endpoint de config responde
curl -s https://fitbud-green.vercel.app/api/config | python3 -m json.tool

# 4. Verificar entitlement y auth no rotos
# (login manual en el browser con una cuenta de prueba)
```

---

## 7. Comunicación

- Avisar al equipo en el canal correspondiente con: fecha/hora, commit revertido, razón del rollback y ETA de fix.
- Si el incidente afecta datos de usuarios (billing, entitlement), revisar `billing_events` y `user_entitlements` en Supabase para detectar inconsistencias.

---

*Última revisión: REQ-30 — Jun 2026.*

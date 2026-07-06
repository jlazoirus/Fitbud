# Diff de catalogo contra DIET_CONTRACT

REQ-144 agrega una medicion offline para decidir si un lote de catalogo sube o baja el canario antes de tocar `supabase/seed.sql` en `main`.

## Uso

Guarda una copia del seed actual y aplica el lote candidato sobre otra copia:

```bash
cp supabase/seed.sql /tmp/fitbud-seed-before.sql
# aplicar el patch candidato sobre /tmp/fitbud-seed-after.sql
node scripts/diff-diet-contract.mjs --before /tmp/fitbud-seed-before.sql --after /tmp/fitbud-seed-after.sql
```

Tambien acepta rutas posicionales:

```bash
node scripts/diff-diet-contract.mjs /tmp/fitbud-seed-before.sql /tmp/fitbud-seed-after.sql --json
```

Para CI o una revision automatica de lotes, `--fail-on-regression` sale con codigo 1 si baja el total agregado de dias OK:

```bash
node scripts/diff-diet-contract.mjs --before /tmp/fitbud-seed-before.sql --after /tmp/fitbud-seed-after.sql --fail-on-regression
```

## Como leer el reporte

- `Total OK`: compara `okDays` sobre la matriz completa de 378 dias.
- `Delta por dimension`: muestra cada combinacion de comidas, patron alimentario, target y disgusto; revisar regresiones aunque el total agregado suba.
- `Catalogo`: confirma cuantos ingredientes, platos y lineas de receta agrega el lote.
- `Causas`: diferencia `catalog_gap` de otras causas estructurales.
- `--json`: entrega `dimensionDeltas`, `bestImprovement` y `worstRegression` para reportes o scripts.

Regla operativa para REQ-143: no aceptar un lote que baje el total agregado o empeore una dimension sana sin documentar una decision explicita. La herramienta no cambia el solver, no activa `DIET_CONTRACT`, no escribe en Supabase y no usa servicios externos.

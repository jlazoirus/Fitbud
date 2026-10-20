# Beta de fundadores — cómo operarla

Tres meses de Evolv completo, gratis, para las primeras personas en Perú, Chile y México que usen la app de verdad y nos digan qué mejorar. Al terminar, pueden seguir con precio de fundador. Este archivo no se publica (`.vercelignore`).

```
Difusión ──► evolvapp.club/beta ──► postulación (Supabase)
                                         │
              review-beta-recruitment ◄──┘
                       │ eliges
              invite-beta-tester <id> ──► código 90 días + mensaje WhatsApp
                                                  │
              evolvapp.club/?codigo=FIT-… ──► registro ──► acceso activo solo
```

## 0. Una sola vez, antes de difundir

1. En Supabase (SQL editor, en este orden si faltan): `supabase/entitlements.sql`, `supabase/coupon_codes.sql`, `supabase/beta_recruitment.sql`. Son idempotentes; no se aplican solos desde el repo.
2. En Vercel: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (las usan `/api/beta-recruitment` y el registro por invitación).
3. **Beta cerrada:** en Supabase → Authentication → Sign In / Providers, desactiva "Allow new users to sign up". Desde ahí solo se crean cuentas con un código de invitación válido (`/api/entitlement`, acción `invite-signup`, con service role). Para reabrir el registro más adelante: vuelve a activarlo y pon `SIGNUP_MODE=open` en Vercel.
4. Prueba real: postula tú mismo en `https://evolvapp.club/beta?source=prueba`, invítate con el paso 3 de abajo y crea una cuenta con el enlace. Después archiva tu postulación.

## 1. Difundir

Enlace: `https://evolvapp.club/beta?source=<canal>`. El `source` queda guardado en cada postulación; usa uno por publicación (`ig-julio`, `tiktok-1`, `wsp-amigos`, `portada`…). La portada ya envía `portada`, `portada-nav` y `portada-final`.

Copy base para historia o post (ajústalo a cada canal):

```text
Estamos abriendo la beta de Evolv: una app que arma lo que comes y entrenas cada día, y lo ajusta cuando el día se tuerce.

Buscamos a las primeras personas en Perú, Chile y México que quieran usarla tres meses gratis y decirnos con honestidad qué funciona y qué no.

Sirve tanto si recién empiezas como si ya entrenas en serio. Cupos limitados.
Postula en 2 minutos: evolvapp.club/beta
```

## 2. Revisar postulaciones

**Desde la app (recomendado):** entra con tu cuenta de admin → Perfil → Administración → **Postulantes beta**. Ves cada postulación con su objetivo, dónde se le rompe el plan, su historia, la prioridad sugerida y un aviso si marcó lesión o indicación médica. Filtros: Por revisar, Aceptados, Descartados, Todos.

Desde la terminal, si lo prefieres:

```bash
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/review-beta-recruitment.mjs          # nuevas y preseleccionadas
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/review-beta-recruitment.mjs --all    # todas
```

Criterios para el primer grupo (15-20 personas):

- Mitad A (ya entrena o hizo dieta en serio) y mitad B (quiere empezar o retomar).
- Al menos 5 de Chile y 5 de Perú; México si hay postulaciones.
- Prioriza disponibilidad "Llamada y beta de 3 meses" y casos concretos en "Cuéntanos la última vez".
- Quien marcó lesión o indicación médica: llamada primero; la parte de entrenamiento solo si el caso lo permite.

## 3. Aceptar e invitar

**Desde la app (REQ-225):** cuando alguien postula, ves en Hoy "N postulaciones esperan tu revisión" (y en Perfil → Administración). En Postulantes beta, **Aceptar (90 días)** le envía un correo de invitación de Supabase para crear su contraseña; su cuenta nace con 90 días de plan completo y las cuotas diarias del coach. Si ya tenía cuenta, solo recibe el acceso. Si el correo no sale (o la postulación es antigua y no tiene correo), aparece un enlace con código para copiar y enviar por correo o WhatsApp. "Descartar" la saca de la lista sin avisarle; "Volver a revisar" la recupera; a quien ya aceptaste puedes "Generar enlace nuevo". WhatsApp queda solo para la llamada inicial y el feedback.

**Aviso por correo de cada postulación (REQ-226):** usa la misma conexión de Resend que los recordatorios (`RESEND_API_KEY` y `NOTIFY_FROM_EMAIL` en Vercel). Llega a los correos de los admins activos, o a los que pongas en `BETA_NOTIFY_EMAIL` (separados por coma). Trae los datos clave, su historia, el aviso de salud y el botón **Revisar postulaciones**, que abre la pantalla en la app. Responder el correo le escribe directo a la persona. Si Resend no está configurado o falla, la postulación se guarda igual.

**Correo de invitación (una vez, en Supabase):**
- Authentication → Email Templates → **Invite user**: asunto "Tu acceso a la beta de Evolv" y un cuerpo en español ("Entraste a la beta de fundadores. Crea tu contraseña aquí: {{ .ConfirmationURL }}").
- El correo propio de Supabase tiene un límite bajo de envíos por hora y remitente genérico. Para aceptar a varias personas seguidas, configura SMTP propio en Project Settings → Auth → SMTP (por ejemplo Resend o el correo de tu dominio). Si se pasa el límite, la app te da el enlace de respaldo.

Desde la terminal:

```bash
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/invite-beta-tester.mjs <id>
#   --days=90        duración del acceso (por defecto 90)
#   --valid-days=30  plazo para activar el enlace (por defecto 30)
#   --dry-run        muestra el mensaje sin crear código ni tocar la postulación
```

Crea el código, marca la postulación como `beta_invited` (con nota y fecha) e imprime el mensaje y un enlace `wa.me` que abre WhatsApp con el texto listo. La persona abre `evolvapp.club/?codigo=…` y ve el registro con el código ya puesto; al crear la cuenta entra directo, sin confirmar correo, con el acceso activo. Si abre Evolv sin el enlace, escribe el código en el campo "Código de invitación" del registro. Quien ya tenía cuenta lo canjea en Perfil → Mi suscripción.

## 4. Durante la beta

- **Grupo de WhatsApp de fundadores** para avisos y dudas; los problemas puntuales, por privado.
- **Llamada inicial (15 min)** en la primera semana: qué usaba antes, qué espera, dónde se le rompe el plan.
- **Check-in cada dos semanas (5 min)**, por WhatsApp o formulario:
  1. ¿Cuántos días usaste Evolv esta semana?
  2. ¿Qué fue lo más útil?
  3. ¿Qué te frustró o no entendiste?
  4. ¿Hubo un día en que el plan no te sirvió? ¿Qué pasó?
  5. Si Evolv desapareciera mañana, ¿qué tan decepcionado estarías? (muy / algo / nada)
- Registra lo que cambias gracias a ellos y cuéntaselo en el grupo: es parte del trato.

Señales a mirar: quién termina el onboarding, quién usa la app al menos 3 días por semana, cuántos siguen activos en la semana 4 y en la 8, y el porcentaje de "muy decepcionado" (40 % o más es buena señal de ajuste).

## 5. Cierre (semanas 10-12)

- Avisa con al menos 14 días de anticipación: fecha de término y precio de fundador.
- Cuando el acceso de 90 días vence, la app vuelve a pedir un plan; sus datos se conservan.
- El cobro recurrente con tarjeta en Perú, Chile y México queda para la fase de pagos (ver el análisis "Desde dónde cobrar"). Mientras no exista, la página de la beta dice la verdad: no guardamos tarjeta y nada se cobra solo. Si eso cambia, actualiza la FAQ de `beta-reclutamiento.html`.

## Pendiente de decidir

- Precio de fundador por país y por cuánto tiempo se mantiene.
- Tamaño de cada grupo y fecha de apertura del segundo.

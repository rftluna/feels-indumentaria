# Seguridad — 30 medidas aplicadas

Controles alineados con SOC 2 (seguridad, disponibilidad y privacidad), ISO/IEC 27001:2022
(Anexo A) e ISO/IEC 27701 (privacidad). No es una certificación: es la base documentada que
pide una auditoría.

## Credenciales y variables de entorno
1. **Credenciales fuera del código.** La URL y la clave de Supabase se leen de variables de entorno (`.env.local` en local y *Environment Variables* en Vercel). Nunca están escritas en el código.
2. **`.env*` en `.gitignore`.** Solo se sube `.env.example`, con valores de ejemplo.
3. **Solo la clave pública en el navegador.** La app se niega a arrancar si por error se carga la clave `service_role` / secreta en una variable `NEXT_PUBLIC_` (`src/lib/supabase.ts`).

## Base de datos (Supabase / PostgreSQL)
4. **Row Level Security** activado en todas las tablas.
5. **Denegado por defecto:** lo que no tiene una política explícita queda bloqueado. El público solo puede leer productos/categorías y suscribirse al newsletter.
6. **Admin verificado por ID de usuario** (tabla `admins` + función `is_admin()`), no por email.
7. **Checkout seguro por RPC** (`create_order`, `security definer`): precios, descuentos y stock se calculan en la base; al cancelar se devuelve el stock en la misma transacción.
8. **Validación en la base** con `CHECK`: largos máximos, formato de email y teléfono, promos coherentes, stock y precios no negativos.
9. **Anti-spam:** como máximo 5 pedidos por email por hora, 20 productos distintos por pedido y 20 unidades por producto.

## Formularios y navegador
10. **Validación y saneamiento en el cliente:** `maxLength`, sin caracteres de control, regex de email y teléfono y protección contra doble envío.
11. **Parámetros de URL validados** (orden, búsqueda, slug) y **redirecciones solo internas** en Mi cuenta (`?volver=` no acepta otros sitios).
12. **Mensajes de error genéricos:** no se muestran errores internos; el login, la recuperación, el registro y el newsletter no revelan si un email existe.

## Cuentas (panel y clientas)
13. **Contraseña segura obligatoria:** 10 caracteres o más, letra, número, símbolo y sin espacios, con checklist en vivo.
14. **Límite de intentos de login:** 5 fallidos bloquean 15 minutos (se suma al límite de Supabase Auth).
15. **Recuperación de contraseña por mail**, con 60 segundos de espera entre envíos.
16. **Reautenticación:** para cambiar la contraseña hay que ingresar la actual.
17. **Cierre de sesión automático del panel** después de 30 minutos de inactividad.
18. **Cuentas de clientas con email confirmado**; el panel sigue reservado a la tabla `admins`.
19. **Cada clienta ve solo sus pedidos**, por ID de cuenta y no por email (`supabase/cuentas-clientas.sql`): registrar el email de otra persona no da acceso a sus compras.

## Servidor / HTTP
20. **Headers de seguridad:** Content-Security-Policy, X-Frame-Options `DENY`, `nosniff`, Referrer-Policy, Permissions-Policy, HSTS con preload, Cross-Origin-Opener-Policy y X-Permitted-Cross-Domain-Policies. Sin `X-Powered-By`; `/admin` y `/mi-cuenta` con `noindex`.
21. **HTTPS forzado** por Vercel + HSTS.

## Registro y monitoreo (SOC 2 CC7 · ISO 27001 A.8.15)
22. **Registro de actividad inalterable** (`supabase/hardening.sql`, pestaña *Actividad* del panel): quién creó, modificó o borró productos, categorías, portada, administradoras y estados de pedidos y arrepentimientos, incluidos los cambios hechos directo en Supabase. Nadie puede editarlo ni borrarlo desde la web.
23. **Minimización en el registro:** de pedidos y arrepentimientos solo se guarda el cambio de estado, nunca datos personales. Se conserva 1 año.

## Privacidad (ISO 27701 · Ley 25.326)
24. **Política de privacidad completa:** responsable, datos, finalidades, base legal, plazos de conservación, proveedores (Supabase, Vercel) y derechos.
25. **Derecho de acceso:** *Mi cuenta → Descargar mis datos* (archivo con la cuenta y las compras).
26. **Derecho de rectificación y supresión:** *Mi cuenta → Editar* y *Eliminar mi cuenta* (los pedidos se conservan por obligación contable, desvinculados de la cuenta).
27. **Sin cookies de terceros ni seguimiento.**

## Código, cambios y dependencias (SOC 2 CC8 · ISO 27001 A.8.8, A.8.25-A.8.32)
28. **Dependencias auditadas:** `npm audit` sin vulnerabilidades y **Dependabot** semanal con paquetes agrupados.
29. **CI** (`.github/workflows/ci.yml`): lint, tipos, build y `npm audit` en cada PR.
30. **Cambios por Pull Request** con versión de prueba en Vercel antes de publicar.

## Pendientes que se configuran fuera del código
- **2FA** en las cuentas de GitHub, Vercel y Supabase de quienes administran.
- **Supabase:** "Confirm email" activado; SMTP propio para los mails; copias de seguridad periódicas (el plan Free no incluye restauración a un punto en el tiempo); revisar que el proyecto no quede pausado por inactividad (plan Free).
- **Vercel:** proteger las versiones de prueba (*Deployment Protection*), porque usan la base real.
- **GitHub:** proteger `main` (exigir PR y CI en verde) y activar *secret scanning* y *push protection*.
- **Revisión trimestral de accesos:** quitar administradoras que ya no trabajan en la tienda.

---
¿Encontraste un problema de seguridad? Escribinos por privado (WhatsApp de la web o GitHub). No lo publiques hasta que esté resuelto.

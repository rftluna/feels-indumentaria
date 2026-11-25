# Seguridad — 20 medidas aplicadas

## Credenciales y variables de entorno
1. **Credenciales fuera del código.** La URL y la clave de Supabase se leen de variables de entorno (`.env.local` en local y *Environment Variables* en Vercel). Nunca están escritas en el código.
2. **`.env*` en `.gitignore`.** Solo se sube `.env.example`, con valores de ejemplo.
3. **Solo la clave pública en el navegador.** La app se niega a arrancar si por error se carga la clave `service_role` / secreta en una variable `NEXT_PUBLIC_` (`src/lib/supabase.ts`).

## Base de datos (Supabase / PostgreSQL)
4. **Row Level Security** activado en todas las tablas.
5. **Denegado por defecto:** lo que no tiene una política explícita queda bloqueado. El público solo puede leer productos/categorías y suscribirse al newsletter.
6. **Admin verificado por ID de usuario** (tabla `admins` + función `is_admin()`), no por email. Sigue valiendo aunque se cambie el email o la contraseña.
7. **Checkout seguro por RPC** (`create_order`, `security definer`): precios, descuentos, envío y stock se calculan en la base. El navegador no puede cambiar el precio. Al **cancelar** un pedido el stock se devuelve en la misma transacción (o se hace todo o nada), y desde la app solo se puede modificar la columna `status`.
8. **Validación en la base** con `CHECK`: largos máximos, formato de email y teléfono, promos coherentes, stock y precios no negativos.
9. **Anti-spam:** como máximo 5 pedidos por email por hora, 20 productos distintos por pedido y 20 unidades por producto.

## Formularios y navegador
10. **Validación y saneamiento en el cliente:** `maxLength`, se eliminan caracteres de control, regex de email y teléfono y protección contra doble envío.
11. **Parámetros de URL validados:** el número de orden, la búsqueda (sin comodines SQL `%` `_` y con largo máximo) y el slug de la categoría.
12. **Mensajes de error genéricos:** no se muestran errores internos de la base. El login, la recuperación y el newsletter no revelan si un email existe.

## Acceso al panel admin
13. **Contraseña segura obligatoria:** 10 caracteres o más, letra, número, símbolo y sin espacios, con checklist en vivo.
14. **Límite de intentos de login:** 5 intentos fallidos bloquean el acceso 15 minutos. Se suma al rate limit propio de Supabase Auth.
15. **Recuperación de contraseña por mail**, con 60 segundos de espera entre envíos.
16. **Reautenticación:** para cambiar la contraseña hay que ingresar la actual.
17. **Cierre de sesión automático** después de 30 minutos de inactividad.
18. **Registro público desactivado** en Supabase: solo existen las cuentas creadas a mano (ver README).

## Servidor / HTTP
19. **Headers de seguridad:** Content-Security-Policy, X-Frame-Options `DENY` (anti clickjacking), `nosniff`, Referrer-Policy, Permissions-Policy, HSTS y Cross-Origin-Opener-Policy. Además, sin `X-Powered-By`, `/admin` con `noindex` y enlaces externos con `rel="noopener noreferrer"`.
20. **Dependencias auditadas:** `npm audit` sin vulnerabilidades y Dependabot semanal (`.github/dependabot.yml`). HTTPS forzado por Vercel.

---
¿Encontraste un problema de seguridad? Abrí un issue privado o escribime por GitHub.

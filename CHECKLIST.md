# Checklist maestra — seguridad y calidad web (40 puntos)

Lista reutilizable para cualquier app, software o página web. Junta:
- **A.** las 20 medidas de seguridad que aplicamos en Fields Indumentaria (ver [SECURITY.md](SECURITY.md)),
- **B.** los 20 puntos del influencer que analizamos para Perfectanias,
- **C.** los extras legales de Argentina.

Cuando un punto de B ya estaba en A, se indica con **= A#**, así no se cuenta dos veces.

Estado en Fields Indumentaria: ✅ hecho · 🟡 parcial / se verifica después del deploy · ➖ opcional, no aplicado

## A. Seguridad (20)

| # | Punto | Fields Indumentaria |
|---|---|---|
| A1 | Credenciales en variables de entorno, nunca en el código | ✅ |
| A2 | `.env*` en `.gitignore` + `.env.example` con valores falsos | ✅ |
| A3 | Solo claves públicas en el navegador; frenar si se filtra una clave secreta | ✅ |
| A4 | Reglas de acceso en la base (RLS / Firestore rules) en todas las tablas | ✅ |
| A5 | Denegar por defecto (lo que no está permitido, está bloqueado) | ✅ |
| A6 | Admin verificado por ID de usuario, no por email | ✅ |
| A7 | Lógica sensible en el servidor (precios, stock, totales) y operaciones atómicas | ✅ |
| A8 | Validación de datos en la base (largos, formatos, rangos) | ✅ |
| A9 | Límite anti-spam en el servidor (pedidos por email/hora, cantidades máximas) | ✅ |
| A10 | Validación y saneamiento en el formulario + evitar doble envío | ✅ |
| A11 | Validar todo lo que llega por la URL (ids, búsquedas, slugs) | ✅ |
| A12 | Mensajes de error genéricos (no revelar si un email existe ni errores internos) | ✅ |
| A13 | Contraseña fuerte: largo mínimo, letra, número, símbolo, sin espacios | ✅ |
| A14 | Límite de intentos de login con bloqueo temporal | ✅ |
| A15 | Recuperar contraseña por mail, con espera entre envíos | ✅ |
| A16 | Pedir la contraseña actual antes de cambiarla | ✅ |
| A17 | Cierre de sesión automático por inactividad | ✅ |
| A18 | Registro público desactivado (solo cuentas creadas a mano) | ✅ en el README; se configura en Supabase |
| A19 | Headers de seguridad (CSP, anti-clickjacking, HSTS, nosniff…) y admin con noindex | ✅ |
| A20 | Dependencias auditadas (`npm audit`) + Dependabot | ✅ |

## B. Lista del influencer (20) → 17 puntos nuevos

| # | Punto | ¿Ya estaba en A? | Fields Indumentaria |
|---|---|---|---|
| B1 | Política de privacidad | nuevo | ✅ `/info#privacidad` |
| B2 | Términos y condiciones | nuevo | ✅ `/info#terminos` |
| B3 | API y secretos expuestos | **= A1, A2, A3** | ✅ |
| B4 | Forzar HTTPS | parte de A19 (HSTS) | ✅ Vercel + HSTS |
| B5 | Banner de cookies | nuevo | ✅ |
| B6 | Títulos y meta descripciones | nuevo | ✅ cada página |
| B7 | Imagen de vista previa (og:image para WhatsApp/Instagram) | nuevo | ✅ |
| B8 | Favicon | nuevo | ✅ `icon.svg` |
| B9 | Sitemap y robots.txt | nuevo | ✅ `/sitemap.xml`, `/robots.txt` |
| B10 | Textos ALT en imágenes | nuevo | ✅ |
| B11 | Imágenes comprimidas | nuevo | ✅ `next/image` (WebP/AVIF automático) |
| B12 | Velocidad de carga | nuevo | 🟡 medir con PageSpeed Insights después del deploy |
| B13 | Contraste de colores | nuevo | ✅ negro sobre blanco |
| B14 | Funciona en celular y tablet | nuevo | ✅ responsive |
| B15 | Página 404 personalizada | nuevo | ✅ |
| B16 | Enlaces rotos | nuevo | 🟡 revisar después del deploy (Instagram es genérico) |
| B17 | Validar formularios | **= A10** | ✅ |
| B18 | Protección contra spam | amplía A9 | ✅ campo trampa (honeypot) en checkout, newsletter y arrepentimiento |
| B19 | Analytics (GA4) | nuevo | ➖ opcional (necesita el banner de cookies con aceptar/rechazar) |
| B20 | CTA claro | nuevo | ✅ "Shop now" + "Agregar al carrito" |

## C. Legales Argentina (3)

| # | Punto | Fields Indumentaria |
|---|---|---|
| C1 | Botón de arrepentimiento (Res. 424/2020): link desde el inicio, devuelve un código | ✅ `/arrepentimiento` + pestaña en el admin |
| C2 | Link de Defensa de las y los Consumidores | ✅ en el pie de página |
| C3 | Derechos sobre los datos personales (Ley 25.326): acceso, corrección y borrado | ✅ en la política de privacidad |

## Totales

- A (20) + B nuevos (17, porque B3 y B17 repiten A y B4 está incluido en A19) + C (3) = **40 puntos**.
- En Fields Indumentaria: **37 hechos**, 2 se verifican después del deploy (B12, B16) y 1 es opcional (B19).

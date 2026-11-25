# SLOW DAYS — Tienda online de ropa oversize

E-commerce full stack hecho con **Next.js 16 (App Router) + TypeScript + Tailwind CSS**, base de datos y autenticación en **Supabase** y deploy en **Vercel**. 100 % con planes gratuitos.

## Funcionalidades

- Catálogo con categorías, buscador y página de detalle con selección de talle y cantidad
- Promos tipo “X% OFF comprando 2 o más” y envío gratis desde $10.000
- Carrito persistente (localStorage)
- Checkout que crea el pedido mediante una **función SQL (RPC) segura**: recalcula precios en la base, valida talles y stock, aplica descuentos y descuenta stock en una sola transacción
- **Panel de administración** (`/admin`) con login de Supabase Auth: métricas, pedidos con cambio de estado y edición de precio / stock / visibilidad de productos
- Seguridad con **Row Level Security**: el público solo lee productos; solo los usuarios de la tabla `admins` pueden gestionar datos
- Newsletter, botón de WhatsApp, banner de cookies, diseño responsive
- **Modo demo**: si no hay variables de Supabase la tienda funciona con datos locales

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend / DB | Supabase (PostgreSQL, RLS, RPC, Auth) |
| Hosting | Vercel (plan Hobby) |

## Correrlo localmente

```bash
npm install
cp .env.example .env.local   # completá tus claves de Supabase
npm run dev
```

## Configurar Supabase (plan Free)

1. Creá un proyecto en <https://supabase.com>.
2. En **SQL Editor** ejecutá `supabase/schema.sql` y después `supabase/seed.sql`.
3. En **Authentication > Users > Add user** creá tu usuario admin (email + contraseña).
4. En el SQL Editor dale permisos de admin:
   ```sql
   insert into public.admins (user_id)
     select id from auth.users where email = 'tu-email@ejemplo.com';
   ```
5. Recomendado: en **Authentication > Sign In / Providers** desactivá “Allow new users to sign up”.
6. Copiá **Project URL** y **anon public key** (Project Settings > API) a `.env.local`.

## Deploy en Vercel

1. Subí el repo a GitHub.
2. En <https://vercel.com/new> importá el repo.
3. Agregá las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` y hacé deploy.

> Nota: proyecto de portfolio, no procesa pagos reales. Imágenes de [Unsplash](https://unsplash.com).

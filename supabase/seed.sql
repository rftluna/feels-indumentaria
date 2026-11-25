-- Datos de ejemplo. Ejecutar DESPUÉS de schema.sql
insert into public.categories (slug, name, sort_order) values
  ('remeras-oversize',     'Remeras Oversize',     1),
  ('musculosas-oversize',  'Musculosas Oversize',  2),
  ('buzos-oversize',       'Buzos Oversize',       3),
  ('shorts',               'Shorts',               4)
on conflict (slug) do nothing;

insert into public.products
  (slug, name, description, price, image_url, category_id, promo_label, promo_min_qty, promo_percent, stock)
values
  ('buzo-oversize-gris',  'Buzo Oversize Gris',  'Buzo de frisa invisible, calce oversize, capucha doble y bolsillo canguro.', 7500,
   'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
   (select id from categories where slug='buzos-oversize'), '5% OFF', 2, 5, 25),
  ('buzo-oversize-negro',   'Buzo Oversize Negro',   'Buzo negro de frisa premium, calce oversize.', 7500,
   'https://images.unsplash.com/photo-1578681994506-b8f463449011?w=800&q=80',
   (select id from categories where slug='buzos-oversize'), '5% OFF', 2, 5, 25),
  ('buzo-oversize-blanco',  'Buzo Oversize Blanco',  'Buzo blanco sin capucha, frisa premium.', 7500,
   'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
   (select id from categories where slug='buzos-oversize'), '5% OFF', 2, 5, 20),
  ('remera-oversize-logo',  'Remera Oversize Logo',  'Remera negra de algodón peinado con logo bordado.', 3500,
   'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80',
   (select id from categories where slug='remeras-oversize'), '10% OFF', 2, 10, 40),
  ('remera-oversize-blanca', 'Remera Oversize Blanca', 'Remera blanca de algodón peinado 24/1.', 3500,
   'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
   (select id from categories where slug='remeras-oversize'), '10% OFF', 2, 10, 40),
  ('remera-oversize-negra', 'Remera Oversize Negra', 'Remera de algodón peinado, cuello reforzado.', 3500,
   'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
   (select id from categories where slug='remeras-oversize'), '10% OFF', 2, 10, 40),
  ('musculosa-oversize-negra', 'Musculosa Oversize Negra', 'Musculosa sisa ancha, algodón.', 2900,
   'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800&q=80',
   (select id from categories where slug='musculosas-oversize'), null, null, null, 30),
  ('short-de-jean', 'Short de Jean', 'Short de jean celeste con roturas.', 4200,
   'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&q=80',
   (select id from categories where slug='shorts'), null, null, null, 30)
on conflict (slug) do nothing;

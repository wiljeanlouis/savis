insert into public.published_catalog_products (
  id,
  slug,
  name,
  description,
  product_type,
  purchase_modes,
  choice_group,
  ingredient_options,
  unit_label,
  price_cents,
  dozen_price_cents,
  image_url,
  gallery,
  availability_note,
  display_order
)
values
(
  'pate-four',
  'pate-cuit-au-four',
  'Pâté cuit au four',
  'Une pâte brisée croustillante enveloppe généreusement une farce savoureuse faite à partir d''ingrédients frais.',
  'single_choice_bundle',
  '[
    {"id":"unit","label":"À l''unité","quantity":1,"price_cents":300,"allocation_type":"single_choice"},
    {"id":"dozen","label":"Douzaine","quantity":12,"price_cents":3000,"allocation_type":"choice_allocation"}
  ]'::jsonb,
  '{
    "label":"Farce",
    "required":true,
    "options":[
      {"id":"poulet-creole","name":"Poulet Créole"},
      {"id":"boeuf-epice","name":"Boeuf Épicé"},
      {"id":"hareng-saur","name":"Hareng saur"},
      {"id":"thon","name":"Thon"}
    ]
  }'::jsonb,
  '[]'::jsonb,
  'unité',
  300,
  3000,
  './images/pate-au-four-1-530x480.png',
  '[
    "./images/pate-au-four-1-530x480.png",
    "./images/pate-au-four-2-530x480.png",
    "./images/pate-au-four-3-530x480.png"
  ]'::jsonb,
  'Préparé sur commande',
  10
),
(
  'pate-kode',
  'pate-kode',
  'Pâté kòde',
  'Une pâte frite soigneusement dans l''huile, servie avec une sauce piquante haïtienne pour une expérience authentique.',
  'ingredient_customization',
  '[]'::jsonb,
  null,
  '[
    {"id":"poulet-creole","name":"Poulet Créole","default_quantity":1,"min_quantity":0,"max_quantity":3,"extra_price_cents":200},
    {"id":"oeuf-bouilli","name":"Oeuf bouilli","default_quantity":1,"min_quantity":0,"max_quantity":3,"extra_price_cents":100},
    {"id":"hareng-saur","name":"Hareng saur","default_quantity":1,"min_quantity":0,"max_quantity":3,"extra_price_cents":200},
    {"id":"saucisse","name":"Saucisse","default_quantity":1,"min_quantity":0,"max_quantity":3,"extra_price_cents":150}
  ]'::jsonb,
  'unité',
  800,
  null,
  './images/pate-kode-1-530x480.png',
  '[
    "./images/pate-kode-1-530x480.png",
    "./images/pate-kode-2-530x480.png",
    "./images/pate-kode-3-530x480.png"
  ]'::jsonb,
  'Préparé chaque samedi',
  20
)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  purchase_modes = excluded.purchase_modes,
  choice_group = excluded.choice_group,
  ingredient_options = excluded.ingredient_options,
  price_cents = excluded.price_cents,
  dozen_price_cents = excluded.dozen_price_cents,
  gallery = excluded.gallery,
  display_order = excluded.display_order;

insert into public.published_catalog_products (
  id,
  slug,
  name,
  category,
  description,
  commercial_type,
  product_type,
  purchase_modes,
  choice_group,
  ingredient_options,
  image_url,
  gallery,
  availability_note,
  display_order
)
values
(
  '33cfa6ba-0796-4a13-a0ac-00bcfdf75a27',
  'pate-cuit-au-four',
  'Pâté cuit au four',
  'tasting',
  'Une pâte brisée croustillante enveloppe généreusement une farce savoureuse faite à partir d''ingrédients frais.',
  'goods',
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
  'b6ee2082-6b70-4a95-b747-417cb75e5200',
  'pate-kode',
  'Pâté kòde',
  'tasting',
  'Une pâte frite soigneusement dans l''huile, servie avec une sauce piquante haïtienne pour une expérience authentique.',
  'goods',
  'ingredient_customization',
  '[
    {"id":"unit","label":"À l''unité","quantity":1,"price_cents":800,"allocation_type":"none"}
  ]'::jsonb,
  null,
  '[
    {"id":"poulet-creole","name":"Poulet Créole","default_quantity":1,"min_quantity":0,"max_quantity":3,"extra_price_cents":200},
    {"id":"oeuf-bouilli","name":"Oeuf bouilli","default_quantity":1,"min_quantity":0,"max_quantity":3,"extra_price_cents":100},
    {"id":"hareng-saur","name":"Hareng saur","default_quantity":1,"min_quantity":0,"max_quantity":3,"extra_price_cents":200},
    {"id":"saucisse","name":"Saucisse","default_quantity":1,"min_quantity":0,"max_quantity":3,"extra_price_cents":150}
  ]'::jsonb,
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
  slug = excluded.slug,
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  commercial_type = excluded.commercial_type,
  product_type = excluded.product_type,
  purchase_modes = excluded.purchase_modes,
  choice_group = excluded.choice_group,
  ingredient_options = excluded.ingredient_options,
  image_url = excluded.image_url,
  gallery = excluded.gallery,
  availability_note = excluded.availability_note,
  is_available = excluded.is_available,
  display_order = excluded.display_order;

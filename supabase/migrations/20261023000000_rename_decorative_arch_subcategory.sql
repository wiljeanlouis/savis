update public.published_catalog_products
set subcategory = 'decorative-arch',
    updated_at = now()
where subcategory = 'balloon-arch';


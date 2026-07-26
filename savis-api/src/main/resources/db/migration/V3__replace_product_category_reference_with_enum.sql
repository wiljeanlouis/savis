alter table savis_api.catalog_products
    add column category varchar(255);

update savis_api.catalog_products product
set category = case lower(coalesce(category.code, ''))
    when 'decoration' then 'DECORATION'
    else 'TASTING'
end
from savis_api.catalog_product_categories category
where product.category_public_id = category.public_id;

update savis_api.catalog_products
set category = 'TASTING'
where category is null;

alter table savis_api.catalog_products
    alter column category set not null,
    drop column category_public_id;

drop table savis_api.catalog_product_categories;

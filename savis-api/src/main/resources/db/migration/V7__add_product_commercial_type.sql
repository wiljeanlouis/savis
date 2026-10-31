alter table savis_api.catalog_products
    add column commercial_type varchar(255);

update savis_api.catalog_products
set commercial_type = 'GOODS';

alter table savis_api.catalog_products
    alter column commercial_type set not null,
    add constraint ck_catalog_products_commercial_type
        check (commercial_type in ('GOODS', 'SERVICE'));

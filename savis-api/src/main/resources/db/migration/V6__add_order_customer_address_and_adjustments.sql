alter table savis_api.orders
    add column customer_address_line1 varchar(255),
    add column customer_address_line2 varchar(255),
    add column customer_city varchar(255),
    add column customer_province varchar(255),
    add column customer_postal_code varchar(32),
    add column discount_cents integer not null default 0 check (discount_cents >= 0),
    add column delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0);

alter table savis_api.invoices
    add column if not exists payment_status varchar(255) not null default 'UNPAID'
        check (payment_status in ('UNPAID', 'PAID')),
    add column if not exists paid_at timestamp with time zone;

update savis_api.invoices
set payment_status = 'UNPAID'
where payment_status is null;

alter table savis_api.invoices
    add constraint ck_invoices_payment check (
        (payment_status = 'UNPAID' and paid_at is null)
        or (payment_status = 'PAID' and paid_at is not null)
    );

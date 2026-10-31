-- Provider search terms remain acquisition metadata, never a second resource catalog.
alter table savis_api.offers add column resource_id uuid;

create temporary table supply_resource_candidates on commit drop as
select o.id offer_id, r.public_id resource_id,
       case lower(trim(o.package_size_unit))
           when 'g' then 'mass' when 'gram' then 'mass'
           when 'kg' then 'mass' when 'kilogram' then 'mass'
           when 'l' then 'volume' when 'liter' then 'volume'
           when 'ml' then 'volume' when 'milliliter' then 'volume'
           when 'piece' then 'piece' end offer_dimension,
       case r.reference_unit
           when 'GRAM' then 'mass' when 'KILOGRAM' then 'mass'
           when 'LITER' then 'volume' when 'MILLILITER' then 'volume'
           when 'PIECE' then 'piece' end resource_dimension
from savis_api.offers o join savis_api.resources r
on lower(trim(regexp_replace(o.component_name, '[[:space:]]+', ' ', 'g')))
 = lower(trim(regexp_replace(r.name, '[[:space:]]+', ' ', 'g')));

do $$
declare problem record;
begin
    for problem in
        select offer_id, array_agg(resource_id) resources
        from supply_resource_candidates
        where offer_dimension = resource_dimension
        group by offer_id having count(*) > 1
    loop
        raise exception 'Supply/Resource: association ambiguë, offre interne=%, ressources=%. Corriger les noms/unités avant de relancer.',
            problem.offer_id, problem.resources;
    end loop;
end $$;

update savis_api.offers o set resource_id = c.resource_id
from supply_resource_candidates c
where o.id = c.offer_id and c.offer_dimension = c.resource_dimension;

-- Missing/incompatible matches remain NULL and require explicit operator validation.
alter table savis_api.offers add constraint fk_offers_resource
    foreign key (resource_id) references savis_api.resources(public_id);
create index idx_offers_resource_status on savis_api.offers(resource_id, status);

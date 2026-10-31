-- Read only. Run against a restored production snapshot before V13.
with offers as (
    select o.*, lower(trim(regexp_replace(component_name, '[[:space:]]+', ' ', 'g'))) name_key,
           case lower(trim(package_size_unit))
               when 'g' then 'mass' when 'gram' then 'mass' when 'kg' then 'mass' when 'kilogram' then 'mass'
               when 'l' then 'volume' when 'liter' then 'volume' when 'ml' then 'volume' when 'milliliter' then 'volume'
               when 'piece' then 'piece' end dimension
    from savis_api.offers o
), resources as (
    select r.*, lower(trim(regexp_replace(name, '[[:space:]]+', ' ', 'g'))) name_key,
           case reference_unit when 'GRAM' then 'mass' when 'KILOGRAM' then 'mass'
               when 'LITER' then 'volume' when 'MILLILITER' then 'volume' when 'PIECE' then 'piece' end dimension
    from savis_api.resources r
)
select o.public_id offer_id, o.name_key, o.package_size_unit,
       count(r.public_id) filter (where o.dimension = r.dimension) compatible_count,
       array_agg(r.public_id order by r.public_id) filter (where o.dimension = r.dimension) compatible_resources,
       array_agg(r.public_id order by r.public_id) filter (where r.public_id is not null and o.dimension is distinct from r.dimension) incompatible_resources
from offers o left join resources r on o.name_key = r.name_key
group by o.public_id, o.name_key, o.package_size_unit
order by compatible_count desc, o.name_key, o.public_id;

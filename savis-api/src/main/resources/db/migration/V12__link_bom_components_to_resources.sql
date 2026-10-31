-- Link legacy BOM components to one Resource per normalized name, reusing compatible resources.
-- Incompatible units or ambiguous existing resources abort the migration without changing consumption data.
-- Flyway runs this file transactionally; a failed preflight leaves no partial links.
alter table savis_api.bom_components add column resource_id uuid;

lock table savis_api.resources, savis_api.bom_components in share row exclusive mode;

create temporary table bom_resource_groups on commit drop as
select c.id, c.component_name,
       lower(trim(regexp_replace(c.component_name, '[[:space:]]+', ' ', 'g'))) as name_key,
       case lower(trim(c.unit))
           when 'g' then 'mass' when 'gram' then 'mass'
           when 'kg' then 'mass' when 'kilogram' then 'mass'
           when 'l' then 'volume' when 'liter' then 'volume'
           when 'ml' then 'volume' when 'milliliter' then 'volume'
           when 'piece' then 'piece' when 'portion' then 'portion'
       end as dimension
from savis_api.bom_components c;

do $$
declare problem record;
begin
    for problem in
        select name_key, array_agg(id order by id) ids, array_agg(distinct dimension) dimensions
        from bom_resource_groups
        group by name_key
        having name_key is null or name_key = '' or count(dimension) <> count(*)
            or count(distinct dimension) <> 1
    loop
        raise exception 'BOM/Resource: nom/unité incompatible: nom=%, composants=%, dimensions=%',
            problem.name_key, problem.ids, problem.dimensions;
    end loop;
end $$;

create temporary table bom_resource_new on commit drop as
select g.name_key,
       min(trim(regexp_replace(g.component_name, '[[:space:]]+', ' ', 'g'))) resource_name,
       case g.dimension when 'mass' then 'GRAM' when 'volume' then 'MILLILITER'
           when 'piece' then 'PIECE' end resource_unit,
       case when g.dimension = 'portion' or bool_and(b.type = 'MATERIAL')
           then 'DECORATION_MATERIAL' else 'INGREDIENT' end resource_category
from bom_resource_groups g
join savis_api.bom_components c on c.id = g.id
join savis_api.boms b on b.id = c.bom_id
group by g.name_key, g.dimension;

do $$
declare problem record;
begin
    select * into problem from bom_resource_new where length(resource_name) > 160 limit 1;
    if found then
        raise exception 'BOM/Resource: nom trop long: %', problem.name_key;
    end if;
end $$;

insert into savis_api.resources(public_id, name, category, reference_unit, status)
select md5('savis:bom-resource:' || n.name_key)::uuid, n.resource_name,
       n.resource_category, n.resource_unit, 'ACTIVE'
from bom_resource_new n
where not exists (
    select 1 from savis_api.resources r
    where lower(trim(regexp_replace(r.name, '[[:space:]]+', ' ', 'g'))) = n.name_key
);

create temporary table bom_resource_candidates on commit drop as
select distinct g.name_key, r.public_id,
       case r.reference_unit
           when 'GRAM' then 'mass' when 'KILOGRAM' then 'mass'
           when 'LITER' then 'volume' when 'MILLILITER' then 'volume'
           when 'PIECE' then 'piece'
           else case when r.reference_unit is null then 'portion' end
       end as dimension
from bom_resource_groups g
join savis_api.resources r
  on lower(trim(regexp_replace(r.name, '[[:space:]]+', ' ', 'g'))) = g.name_key;
do $$
declare problem record;
begin
    for problem in
        select g.name_key, array_agg(distinct c.public_id) resources
        from bom_resource_groups g
        left join bom_resource_candidates c on c.name_key = g.name_key
        group by g.name_key, g.dimension
        having count(c.public_id) = 0
            or bool_or(c.dimension is distinct from g.dimension)
            or count(distinct c.public_id) > 1
    loop
        raise exception 'BOM/Resource: ressources incompatibles ou ambiguës: nom=%, UUID=%. Corriger explicitement les données avant de relancer.',
            problem.name_key, problem.resources;
    end loop;
end $$;

create temporary table bom_resource_targets on commit drop as
select c.name_key, (array_agg(c.public_id order by c.public_id))[1] resource_id
from bom_resource_candidates c
group by c.name_key;

-- Only this reference changes. Consumption, selected offers and resource rows stay intact.
update savis_api.bom_components c set resource_id = target.resource_id
from bom_resource_groups g join bom_resource_targets target on target.name_key = g.name_key
where c.id = g.id and c.resource_id is distinct from target.resource_id;

alter table savis_api.bom_components alter column resource_id set not null;
alter table savis_api.bom_components add constraint fk_bom_components_resource
    foreign key (resource_id) references savis_api.resources(public_id);
create index idx_bom_components_resource_id on savis_api.bom_components(resource_id);

create or replace view savis_api.bom_component_resource_name_candidates as
select lower(trim(regexp_replace(component.component_name, '[[:space:]]+', ' ', 'g'))) as normalized_component_name,
       count(*) as component_count,
       array_agg(component.id order by component.id) as bom_component_ids,
       array_agg(component.resource_id order by component.id) as resource_ids
from savis_api.bom_components component
group by lower(trim(regexp_replace(component.component_name, '[[:space:]]+', ' ', 'g')))
having count(distinct component.resource_id) > 1;

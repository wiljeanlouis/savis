-- Read only. Run after V13 on the restored test copy before production rollout.
select count(*) total_offers,
       count(resource_id) associated_offers,
       count(*) filter (where resource_id is null) offers_to_associate
from savis_api.offers;

select public_id, component_name, provider_identifier, external_id,
       package_size_value, package_size_unit, price_amount, status
from savis_api.offers where resource_id is null
order by component_name, public_id;

-- These lines require an explicit selection/association correction, not silent fallback.
select c.id component_id, c.bom_id, c.resource_id component_resource_id,
       c.selected_offer_id, o.resource_id offer_resource_id
from savis_api.bom_components c
left join savis_api.offers o on o.public_id = c.selected_offer_id
where c.selected_offer_id is not null and c.resource_id is distinct from o.resource_id
order by c.bom_id, c.id;

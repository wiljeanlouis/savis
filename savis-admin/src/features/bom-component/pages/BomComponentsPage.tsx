import { BomComponentList } from "../components/BomComponentList";

interface BomComponentsPageProps {
  supplierOffers?: boolean;
}

export function BomComponentsPage({
  supplierOffers = false,
}: BomComponentsPageProps) {
  return <BomComponentList supplierOffers={supplierOffers} />;
}

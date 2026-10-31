import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { OrderStatus } from "../types";
import { nextOrderStatuses, orderStatusLabels } from "../types";

export function OrderStatusSelect({
  status,
  disabled,
  onChange,
}: {
  status: OrderStatus;
  disabled?: boolean;
  onChange: (status: OrderStatus) => void;
}) {
  const options = nextOrderStatuses[status];
  if (options.length === 0) {
    return null;
  }

  return (
    <Select
      disabled={disabled}
      value={status}
      onValueChange={(value) => onChange(value as OrderStatus)}
    >
      <SelectTrigger className="min-w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={status}>{orderStatusLabels[status]}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {orderStatusLabels[option]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

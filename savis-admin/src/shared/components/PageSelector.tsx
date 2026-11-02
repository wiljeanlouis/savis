import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const defaultPageSizeOptions = [10, 20, 50];

interface PageSelectorProps {
  pageSize: number;
  onPageChange: (page: number) => void;
  options?: number[];
}

export const PageSelector = ({
  pageSize,
  onPageChange,
  options = defaultPageSizeOptions,
}: PageSelectorProps) => {
  return (
    <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
      <span className="text-xs text-muted-foreground">Par page</span>
      <Select
        value={`${pageSize}`}
        onValueChange={(value) => onPageChange(Number(value))}
      >
        <SelectTrigger
          size="sm"
          className="w-20"
          aria-label="Résultats par page"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="top">
          <SelectGroup>
            {options.map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};

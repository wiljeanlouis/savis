import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

const pageSizeOptions = [10, 20, 30, 50];

interface PageSelectorProps {
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const PageSelector = ({ pageSize, onPageChange }: PageSelectorProps) => {
  return (
    <>
      <span className="text-xs text-muted-foreground">Par page</span>
      <Select
        value={`${pageSize}`}
        onValueChange={(value) => onPageChange(Number(value))}
      >
        <SelectTrigger size="sm" className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="top">
          <SelectGroup>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={`${size}`}>
                {size}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
};

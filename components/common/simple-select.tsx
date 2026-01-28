import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/index";
export interface ISelectOption {
  value: string;
  label: string;
}

interface ISimpleSelect {
  options: ISelectOption[];
  onSelect: (value: string) => void;
  value: string;
}

export const SimpleSelect = ({ options, onSelect, value }: ISimpleSelect) => (
  <Select value={value} onValueChange={onSelect}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem value={option.value} key={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

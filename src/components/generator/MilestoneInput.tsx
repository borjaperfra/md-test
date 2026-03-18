import { Input } from '@/components/ui/Input';

interface MilestoneInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function MilestoneInput({ value, onChange }: MilestoneInputProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        Hito del día (opcional)
      </label>
      <Input
        placeholder="e.g., 500 tech professionals placed this month!"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

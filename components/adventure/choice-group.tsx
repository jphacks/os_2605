type Choice<T extends string | number> = { value: T; label: string };
export function ChoiceGroup<T extends string | number>({
  legend,
  name,
  options,
  value,
  onChange,
  disabled = false,
}: {
  disabled?: boolean;
  legend: string;
  name: string;
  options: readonly Choice<T>[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-3 font-bold">{legend}</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((option) => (
          <label key={option.value} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="flex min-h-14 items-center justify-center rounded-xl border border-[#b8c5ac] bg-white p-3 text-center text-sm peer-checked:border-[#234e3e] peer-checked:bg-[#234e3e] peer-checked:font-bold peer-checked:text-white peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-[#b85a24]">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

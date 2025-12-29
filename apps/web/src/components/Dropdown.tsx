import React, { useEffect, useRef, useState } from "react";

export type DropdownOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type DropdownProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "onChange" | "type"
> & {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  wrapperClassName?: string;
};

const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  className = "",
  wrapperClassName = "",
  name,
  disabled,
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const baseBtn =
    "w-full bg-white border border-gray-200 rounded-2xl shadow-inner px-3 pr-10 py-2 text-left transition focus:border-[#0b2540] focus:ring-2 focus:ring-[#0b2540]/10";
  const menuBase =
    "absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden z-20 max-h-60 overflow-auto overscroll-contain";

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    document.dispatchEvent(new CustomEvent("dropdown:close-all"));
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
      e.preventDefault();
      setOpen((o) => !o);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${wrapperClassName}`}>
      {name && (
        <input type="hidden" name={name} value={value} />
      )}
      <button
        type="button"
        className={`${baseBtn} ${className}`.trim()}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        {...rest}
      >
        <span className="block truncate text-sm text-gray-900">{selected?.label}</span>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.186l3.71-3.955a.75.75 0 111.08 1.04l-4.24 4.52a.75.75 0 01-1.08 0l-4.25-4.52a.75.75 0 01.01-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {open && !disabled && (
        <div role="listbox" className={menuBase}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              disabled={opt.disabled}
              onMouseDown={(e) => {
                // close immediately on press so click on underlying elements works
                e.preventDefault();
                handleSelect(opt.value);
              }}
              onClick={() => handleSelect(opt.value)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                opt.value === value ? "bg-gray-50 text-[#0b2540]" : "text-gray-800"
              } ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""}`.trim()}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;

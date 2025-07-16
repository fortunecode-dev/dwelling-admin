import type React from "react";
import { useState, useEffect } from "react";

interface CheckboxWithNoteProps {
  label?: string;
  checked: boolean;
  note?: {context:string,value:string};
  className?: string;
  id?: string;
  disabled?: boolean;
  onChange: (checked: boolean, note: string) => void;
}

const CheckboxWithNote: React.FC<CheckboxWithNoteProps> = ({
  label,
  checked,
  note ={context:"",value:""},
  id,
  onChange,
  className = "",
  disabled = false,
}) => {
  const [localNote, setLocalNote] = useState(note.value);

  useEffect(() => {
    setLocalNote(note.value); // actualiza si la prop cambia externamente
  }, [note]);

  const handleCheck = (isChecked: boolean) => {
    onChange(isChecked, localNote);
  };

  const handleNoteChange = (val: string) => {
    setLocalNote(val);
    onChange(checked, val);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label
        className={`flex items-center space-x-3 group cursor-pointer ${
          disabled ? "cursor-not-allowed opacity-60" : ""
        }`}
      >
        <div className="relative w-5 h-5">
          <input
            id={id}
            type="checkbox"
            className="w-5 h-5 appearance-none cursor-pointer border border-gray-300 checked:border-transparent rounded-md checked:bg-brand-500"
            checked={checked}
            onChange={(e) => handleCheck(e.target.checked)}
            disabled={disabled}
          />
          {checked && (
            <svg
              className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none top-1/2 left-1/2"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                stroke="white"
                strokeWidth="1.94437"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        {label && (
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {label}
          </span>
        )}
      </label>

      {checked && (
        <input
          type="text"
          className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder={`${label} details...`} 
          value={localNote}
          onChange={(e) => handleNoteChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default CheckboxWithNote;

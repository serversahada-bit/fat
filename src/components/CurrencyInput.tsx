"use client";

import { useState } from "react";

export function CurrencyInput({
  id,
  name,
  required,
  placeholder,
  className,
  defaultValue = "",
}: {
  id?: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (defaultValue && !isNaN(Number(defaultValue))) {
      return new Intl.NumberFormat("id-ID").format(Number(defaultValue));
    }
    return "";
  });
  const [rawValue, setRawValue] = useState(defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Hapus semua karakter yang bukan angka
    val = val.replace(/\D/g, "");
    
    setRawValue(val);
    
    if (val) {
      // Format dengan titik pemisah ribuan ala Indonesia
      const formatted = new Intl.NumberFormat("id-ID").format(parseInt(val, 10));
      setDisplayValue(formatted);
    } else {
      setDisplayValue("");
    }
  };

  return (
    <>
      {/* Input hidden ini yang akan dikirim saat submit form */}
      <input
        type="hidden"
        name={name}
        value={rawValue}
      />
      {/* Input text ini hanya untuk tampilan UI dengan titik */}
      <input
        id={id}
        type="text"
        required={required}
        placeholder={placeholder}
        className={className}
        value={displayValue}
        onChange={handleChange}
        autoComplete="off"
      />
    </>
  );
}

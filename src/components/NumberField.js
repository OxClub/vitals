import React, { useEffect, useState } from 'react';
import { TextInput } from 'react-native';

const toText = (v) => (v === undefined || v === null ? '' : String(v));
const parseText = (s) => parseFloat(String(s).replace(',', '.'));

// Numeric input that saves as you type but never rewrites what you are typing (e.g. "8.").
export default function NumberField({ value, onCommit, placeholder, label, style, t, allowEmpty = true }) {
  const [text, setText] = useState(toText(value));

  useEffect(() => {
    const typed = parseText(text);
    const same = value === undefined || value === null ? text.trim() === '' : typed === value;
    if (!same) setText(toText(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <TextInput
      value={text}
      onChangeText={(s) => {
        setText(s);
        if (s.trim() === '') {
          if (allowEmpty) onCommit(null);
          return;
        }
        const n = parseText(s);
        if (!isNaN(n) && n >= 0) onCommit(n);
      }}
      keyboardType="decimal-pad"
      placeholder={placeholder}
      placeholderTextColor={t.muted}
      accessibilityLabel={label}
      selectTextOnFocus
      style={style}
    />
  );
}

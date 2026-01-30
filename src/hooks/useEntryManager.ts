import { useState } from 'react';

export type Entry = {
  price: number;
  percent: number;
};

export function useEntryManager(initialEntries: Entry[] = [{ price: 0, percent: 0 }]) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);

  const add = () => {
    setEntries([...entries, { price: 0, percent: 0 }]);
  };

  const remove = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const update = (index: number, field: 'price' | 'percent', value: number) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  return { entries, setEntries, add, remove, update };
}

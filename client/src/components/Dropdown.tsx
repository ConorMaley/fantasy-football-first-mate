import { useState } from "react";
import { Button, Menu } from "react-native-paper";

export interface DropdownOption {
  id: string;
  label: string;
}

interface DropdownProps {
  label: string;
  selectedLabel?: string;
  options: DropdownOption[];
  onSelect: (id: string) => void;
  emptyLabel?: string;
}

export function Dropdown({ label, selectedLabel, options, onSelect, emptyLabel = "Nothing to pick" }: DropdownProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button mode="outlined" onPress={() => setVisible(true)}>
          {selectedLabel ?? label}
        </Button>
      }
    >
      {options.length === 0 ? (
        <Menu.Item title={emptyLabel} disabled />
      ) : (
        options.map((option) => (
          <Menu.Item
            key={option.id}
            title={option.label}
            onPress={() => {
              onSelect(option.id);
              setVisible(false);
            }}
          />
        ))
      )}
    </Menu>
  );
}

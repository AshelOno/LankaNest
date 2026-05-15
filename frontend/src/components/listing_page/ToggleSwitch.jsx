import React from "react";
import { Switch } from "antd";

const ToggleSwitch = ({ label, checked, onChange }) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <Switch
        checked={checked}
        onChange={onChange}
        style={{
          backgroundColor: checked ? "#2563eb" : "#d1d5db",
        }}
      />
    </div>
  );
};

export default ToggleSwitch;
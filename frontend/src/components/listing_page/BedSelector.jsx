import React from "react";
import FilterButton from "./FilterButton";

const bedOptions = [
  { value: "1", label: "1 Bed" },
  { value: "2", label: "2 Beds" },
  { value: "3", label: "3 Beds" },
  { value: "4+", label: "4+ Beds" },
];

const BedSelector = ({ selectedBeds, setSelectedBeds }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {bedOptions.map((option) => (
        <FilterButton
          key={option.value}
          label={option.label}
          active={selectedBeds === option.value}
          onClick={() =>
            setSelectedBeds(selectedBeds === option.value ? null : option.value)
          }
        />
      ))}
    </div>
  );
};

export default BedSelector;
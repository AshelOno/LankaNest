import React from "react";
import { MdFilterList } from "react-icons/md";

const ToggleButton = ({ onClick, active = false }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-200 ${
        active
          ? "bg-primaryBgColor text-white border-primaryBgColor shadow-md"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-400"
      }`}
    >
      <MdFilterList size={18} />
      Filters
    </button>
  );
};

export default ToggleButton;
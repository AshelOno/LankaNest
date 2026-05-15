import PropTypes from "prop-types";

const FilterButton = ({ label, active = false, onClick, className = "" }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
        active
          ? "border-blue-700 bg-blue-700 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      } ${className}`}
    >
      {label}
    </button>
  );
};

FilterButton.propTypes = {
  label: PropTypes.node.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default FilterButton;

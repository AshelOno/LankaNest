import PropTypes from "prop-types";
import { Slider } from "antd";

const formatPrice = (value) => {
  if (!value) return "0";
  return new Intl.NumberFormat("en-LK").format(value);
};

const PriceRange = ({
  priceRange = [0, 100000],
  setPriceRange,
  min = 0,
  max = 260000,
}) => {
  return (
    <div className="w-full px-1">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-900">
          Monthly rent
        </span>

        <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
          LKR {formatPrice(priceRange[0])} - LKR {formatPrice(priceRange[1])}
        </span>
      </div>

      <Slider
        range
        min={min}
        max={max}
        value={priceRange}
        onChange={setPriceRange}
        tooltip={{ formatter: (value) => `LKR ${formatPrice(value)}` }}
        trackStyle={[{ backgroundColor: "#2563eb", height: 4 }]}
        handleStyle={[
          { borderColor: "#2563eb" },
          { borderColor: "#2563eb" },
        ]}
        railStyle={{ backgroundColor: "#dbe4f0", height: 4 }}
      />

      <div className="mt-1 flex justify-between text-[11px] font-medium text-slate-400">
        <span>LKR {formatPrice(min)}</span>
        <span>LKR {formatPrice(max)}</span>
      </div>
    </div>
  );
};

PriceRange.propTypes = {
  priceRange: PropTypes.arrayOf(PropTypes.number),
  setPriceRange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
};

export default PriceRange;

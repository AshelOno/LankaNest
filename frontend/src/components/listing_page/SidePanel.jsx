import React from "react";
import { Select, Button } from "antd";
import PriceRange from "./PriceRange";
import BedSelector from "./BedSelector";
import ToggleSwitch from "./ToggleSwitch";

const distanceOptions = [
  { value: "<300m", label: "Below 300m" },
  { value: "300-500m", label: "300m - 500m" },
  { value: "500m-1km", label: "500m - 1km" },
  { value: "1-2km", label: "1km - 2km" },
  { value: "2-5km", label: "2km - 5km" },
  { value: "5-10km", label: "5km - 10km" },
  { value: ">10km", label: "10km and above" },
];

const SidePanel = ({
  isOpen,
  togglePanel,
  universities,
  selectedUniversity,
  setSelectedUniversity,
  priceRange,
  setPriceRange,
  selectedDistance,
  setSelectedDistance,
  selectedBeds,
  setSelectedBeds,
  mapView,
  setMapView,
  onClear,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
      onClick={togglePanel}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col">
          <div className="px-6 py-5 border-b flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              <p className="text-sm text-gray-500">
                Narrow down listings quickly
              </p>
            </div>

            <button
              onClick={togglePanel}
              className="text-3xl leading-none text-gray-400 hover:text-gray-700"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                University
              </h3>
              <Select
                placeholder="Select University"
                value={selectedUniversity}
                onChange={setSelectedUniversity}
                className="w-full"
                allowClear
                options={universities.map((uni) => ({
                  value: uni,
                  label: uni,
                }))}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Price Range
              </h3>
              <PriceRange
                priceRange={priceRange}
                setPriceRange={setPriceRange}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Distance from University
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {distanceOptions.map((option) => (
                  <Button
                    key={option.value}
                    onClick={() =>
                      setSelectedDistance(
                        selectedDistance === option.value ? null : option.value
                      )
                    }
                    type={selectedDistance === option.value ? "primary" : "default"}
                    className="rounded-xl h-10"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Beds</h3>
              <BedSelector
                selectedBeds={selectedBeds}
                setSelectedBeds={setSelectedBeds}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Map View
              </h3>
              <ToggleSwitch
                label="Enable map view"
                checked={mapView}
                onChange={setMapView}
              />
            </div>
          </div>

          <div className="border-t px-6 py-4 flex gap-3">
            <Button onClick={onClear} className="flex-1 h-11 rounded-xl">
              Clear
            </Button>
            <Button
              type="primary"
              onClick={togglePanel}
              className="flex-1 h-11 rounded-xl bg-primaryBgColor"
            >
              Apply
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default SidePanel;
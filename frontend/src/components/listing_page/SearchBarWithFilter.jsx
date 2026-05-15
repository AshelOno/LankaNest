import React from "react";
import { Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import ToggleButton from "./ToggleButton";
import ToggleSwitch from "./ToggleSwitch";

const SearchBarWithFilter = ({
  searchQuery,
  setSearchQuery,
  onFilterClick,
  mapView,
  setMapView,
  resultsCount = 0,
  onClearFilters,
  hasActiveFilters = false,
}) => {
  return (
    <div className="ln-premium-surface w-full px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 min-w-11 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white shadow-sm">
            {resultsCount}
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900 sm:text-base">
              {resultsCount} results found
            </div>
            <p className="text-xs text-gray-500">
              Refine your search to find the best match
            </p>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="ml-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1 min-w-[240px]">
            <Input
              size="large"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by property, city, address, university..."
              prefix={<SearchOutlined className="text-indigo-400" />}
              className="rounded-lg"
              style={{
                borderRadius: "9999px",
                borderColor: "#c7d2fe",
                background: "#ffffff",
                boxShadow: "0 8px 24px rgba(79, 70, 229, 0.08)",
                height: 48,
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ToggleButton onClick={onFilterClick} active={hasActiveFilters} />

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 shadow-sm">
              <ToggleSwitch
                label="Map view"
                checked={mapView}
                onChange={setMapView}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBarWithFilter;

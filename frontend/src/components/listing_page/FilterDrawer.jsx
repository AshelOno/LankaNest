import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Select } from "antd";
import {
  Banknote,
  BedDouble,
  GraduationCap,
  Home,
  MapPinned,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PriceRange from "./PriceRange";
import FilterButton from "./FilterButton";
import BedSelector from "./BedSelector";

const distanceOptions = [
  { value: "<300m", label: "Below 300m" },
  { value: "300-500m", label: "300m - 500m" },
  { value: "500m-1km", label: "500m - 1km" },
  { value: "1-2km", label: "1km - 2km" },
  { value: "2-5km", label: "2km - 5km" },
  { value: "5-10km", label: "5km - 10km" },
  { value: ">10km", label: "10km and above" },
];

const propertyTypeOptions = [
  { value: "Boarding House", label: "Boarding house" },
  { value: "Apartment", label: "Apartment" },
  { value: "Shared Room", label: "Shared room" },
];

const genderOptions = [
  { value: "boys", label: "Boys only" },
  { value: "girls", label: "Girls only" },
  { value: "mixed", label: "Mixed" },
];

const FilterGroup = ({ icon: Icon, title, children }) => (
  <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-blue-700 ring-1 ring-slate-200">
        <Icon className="h-4 w-4" />
      </span>
      <h3 className="text-sm font-bold text-slate-950">{title}</h3>
    </div>
    {children}
  </section>
);

FilterGroup.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const FilterDrawer = ({
  isOpen,
  onClose,
  universities,
  selectedUniversity,
  setSelectedUniversity,
  priceRange,
  setPriceRange,
  selectedDistance,
  setSelectedDistance,
  selectedBeds,
  setSelectedBeds,
  selectedGenderPreference,
  setSelectedGenderPreference,
  selectedPropertyType,
  setSelectedPropertyType,
  onClear,
}) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60]">
          <motion.button
            type="button"
            aria-label="Close filters"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="listing-filter-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 160, damping: 20 }}
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-hidden border-l border-slate-200 bg-white shadow-[0_24px_70px_rgba(2,6,23,0.22)]"
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 bg-white px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-blue-700">
                      <SlidersHorizontal className="h-4 w-4" />
                      Listing filters
                    </div>
                    <h2 id="listing-filter-title" className="text-xl font-bold text-slate-950">
                      Refine your search
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Campus, rent, distance, room setup, and stay type.
                    </p>
                </div>
                <button
                    type="button"
                  onClick={onClose}
                    className="ln-icon-button shrink-0"
                    aria-label="Close filters"
                >
                    <X className="h-5 w-5" />
                </button>
                </div>
              </div>

              <div className="ln-scrollbar flex-1 space-y-4 overflow-y-auto px-5 py-5">
                <FilterGroup icon={GraduationCap} title="University">
                  <Select
                    placeholder="Select University"
                    value={selectedUniversity}
                    onChange={setSelectedUniversity}
                    className="w-full"
                    size="large"
                    allowClear
                    options={universities.map((u) => ({ value: u, label: u }))}
                  />
                </FilterGroup>

                <FilterGroup icon={Banknote} title="Budget">
                  <PriceRange 
                    priceRange={priceRange} 
                    setPriceRange={setPriceRange} 
                    min={0} 
                    max={260000} 
                  />
                </FilterGroup>

                <FilterGroup icon={MapPinned} title="Distance from campus">
                  <div className="flex flex-wrap gap-2">
                    {distanceOptions.map((option) => (
                      <FilterButton
                        key={option.value}
                        label={option.label}
                        active={selectedDistance === option.value}
                        onClick={() =>
                          setSelectedDistance(
                            selectedDistance === option.value ? null : option.value
                          )
                        }
                      />
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup icon={BedDouble} title="Bedrooms">
                  <BedSelector 
                    selectedBeds={selectedBeds} 
                    setSelectedBeds={setSelectedBeds} 
                  />
                </FilterGroup>

                <FilterGroup icon={Users} title="Gender preference">
                  <div className="flex flex-wrap gap-2">
                    {genderOptions.map((option) => (
                      <FilterButton
                        key={option.value}
                        label={option.label}
                        active={selectedGenderPreference === option.value}
                        onClick={() =>
                          setSelectedGenderPreference(
                            selectedGenderPreference === option.value ? null : option.value
                          )
                        }
                      />
                    ))}
                  </div>
                </FilterGroup>

                <FilterGroup icon={Home} title="Property type">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {propertyTypeOptions.map((option) => (
                      <FilterButton
                        key={option.value}
                        label={option.label}
                        active={selectedPropertyType === option.value}
                        onClick={() =>
                          setSelectedPropertyType(
                            selectedPropertyType === option.value ? null : option.value
                          )
                        }
                        className="w-full"
                      />
                    ))}
                  </div>
                </FilterGroup>
              </div>

              <div className="flex gap-3 border-t border-slate-200 bg-white px-5 py-4">
                <Button
                  onClick={onClear}
                  variant="outline"
                  className="h-11 flex-1 rounded-lg border-slate-200 bg-white font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  Clear
                </Button>
                <Button
                  onClick={onClose}
                  className="h-11 flex-1 rounded-lg bg-blue-700 font-semibold text-white hover:bg-blue-800"
                >
                  Apply
                </Button>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

FilterDrawer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  universities: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedUniversity: PropTypes.string,
  setSelectedUniversity: PropTypes.func.isRequired,
  priceRange: PropTypes.arrayOf(PropTypes.number).isRequired,
  setPriceRange: PropTypes.func.isRequired,
  selectedDistance: PropTypes.string,
  setSelectedDistance: PropTypes.func.isRequired,
  selectedBeds: PropTypes.string,
  setSelectedBeds: PropTypes.func.isRequired,
  selectedGenderPreference: PropTypes.string,
  setSelectedGenderPreference: PropTypes.func.isRequired,
  selectedPropertyType: PropTypes.string,
  setSelectedPropertyType: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default FilterDrawer;

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import useListingStore from '@/store/listingStore';

const Filter = ({ onFilterChange }) => {
    // Connect to the listing store
    const { listings } = useListingStore();

    // Filter states
    const [isOpen, setIsOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState("All");
    const [searchText, setSearchText] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [location, setLocation] = useState('');
    const [university, setUniversity] = useState('');
    const [filteredListings, setFilteredListings] = useState([]);

    const propertyOptions = ["All", "Boarding House", "Apartment", "Shared Room"];

    // Apply filters whenever filter criteria or listings change
    useEffect(() => {
        applyFilters();
    }, [listings, selectedProperty, searchText, priceMax, location, university]);

    // Filter logic 
    const applyFilters = () => {
        let results = [...listings];

        // Search text filter (property name, description, address)
        if (searchText) {
            results = results.filter(listing =>
                listing.propertyName?.toLowerCase().includes(searchText.toLowerCase()) ||
                listing.description?.toLowerCase().includes(searchText.toLowerCase()) ||
                listing.address?.toLowerCase().includes(searchText.toLowerCase()) ||
                listing.city?.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        // Property type filter
        if (selectedProperty !== "All") {
            results = results.filter(listing =>
                listing.propertyType === selectedProperty
            );
        }

        // Price filter
        if (priceMax && !isNaN(priceMax)) {
            results = results.filter(listing =>
                listing.monthlyRent <= parseInt(priceMax)
            );
        }

        // Location filter
        if (location) {
            results = results.filter(listing =>
                listing.address?.toLowerCase().includes(location.toLowerCase()) ||
                listing.city?.toLowerCase().includes(location.toLowerCase()) ||
                listing.province?.toLowerCase().includes(location.toLowerCase())
            );
        }

        // University filter
        if (university) {
            results = results.filter(listing =>
                listing.nearestUniversity?.name?.toLowerCase().includes(university.toLowerCase()) ||
                listing.universityDistance?.toString().includes(university)
            );
        }

        setFilteredListings(results);

        // Pass filtered results to parent component
        if (onFilterChange) {
            onFilterChange(results);
        }
    };

    // Handle search text change
    const handleSearchChange = (e) => {
        setSearchText(e.target.value);
    };

    // Handle price change
    const handlePriceChange = (e) => {
        setPriceMax(e.target.value);
    };

    // Handle location change
    const handleLocationChange = (e) => {
        setLocation(e.target.value);
    };

    // Handle university change
    const handleUniversityChange = (e) => {
        setUniversity(e.target.value);
    };

    return (
        <div className='p-4 bg-primaryBgColor rounded-lg flex space-x-1 items-center justify-between'>

            {/* Search Bar */}
            <div>
                <input
                    type='text'
                    name='search'
                    className='p-2 border rounded-lg w-full text-black'
                    placeholder='Search here...'
                    value={searchText}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Property Type */}
            <div className="relative w-48">
                <motion.div
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 border rounded-lg w-full flex items-center justify-between cursor-pointer bg-white"
                >
                    <span className="truncate">{selectedProperty}</span>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown className="w-5 h-5 flex-shrink-0" />
                    </motion.div>
                </motion.div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.ul
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 w-full mt-1 bg-white border rounded-lg shadow-lg z-10"
                        >
                            {propertyOptions.map((option) => (
                                <li
                                    key={option}
                                    onClick={() => {
                                        setSelectedProperty(option);
                                        setIsOpen(false);
                                    }}
                                    className="p-2 hover:bg-gray-100 cursor-pointer truncate"
                                >
                                    {option}
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>

            {/* Price */}
            <div className="">
                <input
                    type="number"
                    name="price"
                    className="p-2 border rounded-lg w-full text-black"
                    placeholder="Max Price"
                    value={priceMax}
                    onChange={handlePriceChange}
                />
            </div>

            {/* Location */}
            <div className="">
                <input
                    type="text"
                    name="location"
                    className="p-2 border rounded-lg w-full"
                    placeholder="Location or Address"
                    value={location}
                    onChange={handleLocationChange}
                />
            </div>

            {/* University */}
            <div className="">
                <input
                    type="text"
                    name="university"
                    className="p-2 border rounded-lg w-full"
                    placeholder="University name"
                    value={university}
                    onChange={handleUniversityChange}
                />
            </div>

        </div>
    )
}

export default Filter;
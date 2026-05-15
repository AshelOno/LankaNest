import React, { useEffect, useState } from "react";
import useListingStore from "@/store/listingStore";
import Card from "@/components/listing_page/Card";
import LoadingSpinner from "@/components/include/LoadingSpinner";
import Filter from "@/components/include/Filter";
import { Switch } from "antd";
import { motion } from "framer-motion";
import ListingsMap from "@/components/include/ListingsMap";

const AllListings = () => {
  const { listings, loading, error, fetchAllListings } = useListingStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredListings, setFilteredListings] = useState([]);
  const itemsPerPage = 9;

  const [isMapView, setIsMapView] = useState(false);

  useEffect(() => {
    document.title = `(${listings.length}) Listings Available`;
    fetchAllListings();
  }, [listings.length]);

  // Set filtered listings to all listings initially
  useEffect(() => {
    setFilteredListings(listings);
  }, [listings]);

  // Handle filter changes
  const handleFilterChange = (filtered) => {
    setFilteredListings(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

  // Calculate pagination based on filtered listings
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentListings = filteredListings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredListings.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-5">
        <Filter onFilterChange={handleFilterChange} />
      </div>

      <div className="flex justify-between items-center mt-2 mb-6">
        <div>
          <span className="text-xl font-bold">
            We have {filteredListings.length} listings available
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-base font-semibold">Map View</span>
          <Switch
            checked={isMapView}
            onChange={(checked) => setIsMapView(checked)}
            size="default"
            style={{
              backgroundColor: isMapView ? "#0A4174" : "#adadad"
            }}
          />
        </div>
      </div>

      {isMapView ? (
        <div className="mt-5 mb-5 w-full" style={{ height: "600px" }}>
          <ListingsMap listings={filteredListings} />
        </div>

      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentListings.map((listing) => (
                <Card key={listing._id} listing={listing} />
              ))}
            </div>
          </motion.div>

          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded ${currentPage === 1
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primaryBgColor text-white hover:bg-primaryBgColor/90'
                }`}
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded ${currentPage === totalPages
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-primaryBgColor text-white hover:bg-primaryBgColor/90'
                }`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AllListings;

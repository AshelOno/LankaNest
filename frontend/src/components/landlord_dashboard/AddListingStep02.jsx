import React, { useEffect, useState, useRef } from "react";
import { Form, Input, Select, notification, Alert } from "antd";
import MapboxMap from "../include/MapboxMap"; // Import the new MapboxMap component

const AddListingStep02 = ({ onFinish }) => {
  const [form] = Form.useForm();
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [universityCoordinates, setUniversityCoordinates] = useState(null);
  const [distance, setDistance] = useState(null);
  const [mapInteractionDisabled, setMapInteractionDisabled] = useState(true);
  const mapRef = useRef(null);

  // Handle university selection
  const handleUniversityChange = (value) => {
    const selected = universities.find((uni) => uni._id === value);
    setSelectedUniversity(selected);

    // Reset previously selected coordinates when changing university
    setSelectedCoordinates(null);
    form.setFieldsValue({ coordinates: null });
    setDistance(null);

    if (selected && selected.latitude && selected.longitude) {
      const uniCoords = {
        latitude: selected.latitude,
        longitude: selected.longitude,
      };

      setUniversityCoordinates(uniCoords);
      
      // Enable map interaction once university is selected
      setMapInteractionDisabled(false);
      
      // Pan map to university location
      if (mapRef.current) {
        mapRef.current.panTo(uniCoords);
      }
    }
  };

  // Update handleLocationSelect to calculate distance when property location is selected
  const handleLocationSelect = (coords) => {
    // No need to check for universityCoordinates here as the overlay will prevent clicks
    // if a university isn't selected first
    setSelectedCoordinates(coords);
    form.setFieldsValue({ coordinates: coords });

    // Calculate distance if university is already selected
    if (universityCoordinates) {
      calculateDistance(universityCoordinates, coords);
    }
  };

  // Function to calculate distance using Mapbox Directions API
  const calculateDistance = async (origin, destination) => {
    try {
      // Format coordinates as lng,lat (Mapbox format) and URL encode them
      const originCoord = `${origin.longitude},${origin.latitude}`;
      const destinationCoord = `${destination.longitude},${destination.latitude}`;
      const encodedCoords = encodeURIComponent(
        `${originCoord};${destinationCoord}`
      );

      // Build the complete URL with required parameters
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${encodedCoords}?alternatives=true&geometries=geojson&language=en&overview=full&steps=true&access_token=${
        import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
      }`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const distanceInKm = (data.routes[0].distance / 1000).toFixed(2);
        setDistance(distanceInKm);

        // Auto-fill the distance field
        form.setFieldsValue({
          "university-distance": distanceInKm,
        });

        // You could also save the route geometry for display if needed
        const routeGeometry = data.routes[0].geometry;

        // Update map with route if your map component supports it
        if (mapRef.current && typeof mapRef.current.showRoute === "function") {
          mapRef.current.showRoute(routeGeometry);
        }
      } else {
        notification.warning({
          message: "Route Not Found",
          description: "Could not calculate distance between these locations",
        });
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      notification.error({
        message: "Error",
        description: "Failed to calculate distance",
      });
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Form submission failed: ", errorInfo);
  };

  const handleSubmit = (values) => {
    if (!selectedCoordinates) {
      notification.error({
        message: "Location Required",
        description: "Please select a location on the map",
      });
      return;
    }

    const formData = {
      ...values,
      coordinates: selectedCoordinates,
      nearestUniversity: values["nearest-university"], // This sends the university ID
      universityDistance: distance // Using camelCase for consistency
    };
    onFinish(formData);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/university/all-universities`
        );
        const data = await response.json();
        setUniversities(data);
      } catch (error) {
        console.error("Error fetching universities:", error);
        notification.error({
          message: "Error",
          description: "Failed to load university data",
        });
      }
    };

    fetchUniversities();
  }, []);

  return (
    <div className="w-full bg-transparent px-4 py-6">
      <Form
        form={form}
        name="add-listing-step-02"
        onFinish={handleSubmit}
        onFinishFailed={onFinishFailed}
        layout="vertical"
        className="max-w-[1400px] mx-auto"
      >
        <div className="w-full">
          <div className="bg-white/95 p-8 rounded-xl shadow-sm backdrop-blur">
            <h2 className="text-2xl font-bold text-slate-950 mb-8 border-b border-slate-200 pb-4">
              Add House Location
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-6">
              {/* First Column */}
              <div className="space-y-4">
                <Form.Item
                  label={<span className="text-base font-medium">Address</span>}
                  name="address"
                  rules={[{ required: true, message: "Please enter address!" }]}
                >
                  <Input
                    className="w-full h-10 focus:border-primaryBgColor hover:border-primaryBgColor"
                    placeholder="Enter boarding house address"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="text-base font-medium">City</span>}
                  name="city"
                  rules={[{ required: true, message: "Please enter city!" }]}
                >
                  <Input
                    className="w-full h-10 focus:border-primaryBgColor hover:border-primaryBgColor"
                    placeholder="Enter belonging city"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="text-base font-medium">
                      State/Province
                    </span>
                  }
                  name="province"
                  rules={[
                    { required: true, message: "Please enter province!" },
                  ]}
                >
                  <Input
                    className="w-full h-10"
                    placeholder="Western Province"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="text-base font-medium">
                      Zip/Postal Code
                    </span>
                  }
                  name="postalCode"
                >
                  <Input
                    className="w-full h-10"
                    placeholder="Boarding house postal code"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="text-base font-medium">
                      Which university is near the dormitory?
                    </span>
                  }
                  name="nearest-university"
                  rules={[
                    {
                      required: true,
                      message: "Please select nearest university!",
                    },
                  ]}
                >
                  <Select
                    className="w-full h-10"
                    placeholder="Select nearest university"
                    onChange={handleUniversityChange}
                    options={universities.map((uni) => ({
                      label: uni.name,
                      value: uni._id,
                    }))}
                  />
                </Form.Item>
                {distance && (
                  <Form.Item
                    label={
                      <span className="text-base font-medium">
                        Distance to University
                      </span>
                    }
                    name="university-distance"
                  >
                    <Input
                      className="w-full h-10"
                      suffix="km"
                      disabled
                      value={distance}
                    />
                  </Form.Item>
                )}
              </div>

              {/* Second Column */}
              <div className="space-y-4 w-full lg:col-span-2">
                {mapInteractionDisabled && (
                  <Alert
                    message="Please select a university first"
                    description="You need to select a university from the dropdown before selecting your property location on the map."
                    type="info"
                    showIcon
                    className="mb-4"
                  />
                )}
                
                {universityCoordinates && !selectedCoordinates && (
                  <Alert
                    message="Now select your property location"
                    description="Click on the map to set your property location. The distance to the university will be calculated automatically."
                    type="success"
                    showIcon
                    className="mb-4"
                  />
                )}
                
                <Form.Item
                  label={
                    <span className="text-base font-medium">
                      Select dormitory location on Map
                    </span>
                  }
                  name="coordinates"
                  rules={[
                    {
                      required: true,
                      validator: (_, value) => {
                        if (!selectedCoordinates) {
                          return Promise.reject(
                            "Please select a location on the map!"
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <div id="add-listing-step-02_coordinates" className="h-[420px] w-full relative">
                    {mapInteractionDisabled && (
                      <div 
                        className="absolute inset-0 bg-gray-200 bg-opacity-50 z-10 flex items-center justify-center"
                        onClick={(e) => {
                          e.preventDefault();
                          notification.info({
                            message: "Select University First",
                            description: "Please select a university from the dropdown above before selecting a location on the map."
                          });
                        }}
                      >
                        <div className="bg-white p-4 rounded-lg shadow-md">
                          <p className="text-gray-800 font-medium">Select a university first</p>
                        </div>
                      </div>
                    )}
                    <MapboxMap
                      onLocationSelect={handleLocationSelect}
                      initialCenter={
                        universityCoordinates
                          ? [
                              universityCoordinates.longitude,
                              universityCoordinates.latitude,
                            ]
                          : [79.8612, 6.9271] // Default center (Colombo)
                      }
                      initialZoom={12}
                      markers={{
                        university: universityCoordinates,
                        property: selectedCoordinates,
                      }}
                      distance={distance} // Pass the calculated distance
                      ref={mapRef} // Add ref to control map from outside
                      disabled={mapInteractionDisabled} // Pass disabled state to MapboxMap
                    />
                    {selectedCoordinates && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">
                          Selected Location:{" "}
                          {selectedCoordinates.latitude.toFixed(6)},{" "}
                          {selectedCoordinates.longitude.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </div>
                </Form.Item>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end mt-8 pt-6 border-t gap-4">
              <button
                type="button"
                className="ln-secondary-btn px-8 py-2.5"
                // onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ln-primary-btn px-8 py-2.5"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default AddListingStep02;

import React, { useEffect, useState } from 'react'
import Sidebar from '@/components/admin_dashboard/Sidebar'
import useListingStore from '@/store/listingStore';
import { FaMapMarkerAlt, FaBuilding, FaHome, FaEye, FaFlag, FaTrash } from 'react-icons/fa';
import { X, Building2 } from 'lucide-react';
import Map from '@/components/include/Map';
import { Button } from '@/components/ui/button';
import { Input, Table, Tag, Modal, notification } from 'antd';
import { SearchOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { api } from "@/services/http";

const ManageListings = () => {
    const { listings, loading, error, fetchAllListings } = useListingStore();
    const [selectedListing, setSelectedListing] = React.useState(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [showMap, setShowMap] = React.useState(false);
    const [searchText, setSearchText] = useState('');
    const modalRef = React.useRef(null);
    const { confirm } = Modal;

    // Close modal when clicking outside
    React.useEffect(() => {
        function handleClickOutside(event) {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setIsModalOpen(false);
            }
        }

        if (isModalOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isModalOpen]);

    // Add ESC key listener
    React.useEffect(() => {
        function handleEsc(event) {
            if (event.keyCode === 27) {
                setIsModalOpen(false);
            }
        }

        if (isModalOpen) {
            document.addEventListener('keydown', handleEsc);
        } else {
            document.removeEventListener('keydown', handleEsc);
        };

        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [isModalOpen]);

    useEffect(() => {
        fetchAllListings();
        document.title = `(${listings.length}) Manage Listings`;
    }, [fetchAllListings])

    const handleRowClick = (listing) => {
        setSelectedListing(listing);
        setIsModalOpen(true);
        // Reset to details view when opening a new listing
        setShowMap(false);
    };

    // Prevent body scroll when modal is open
    React.useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'auto';
        } else {
            document.body.style.overflow = 'auto';
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isModalOpen]);

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const showDeleteConfirm = (record) => {
        confirm({
            title: 'Are you sure you want to delete this listing?',
            icon: <ExclamationCircleOutlined />,
            content: `You are about to delete "${record.propertyName}". This action cannot be undone.`,
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'No, Cancel',
            centered: true,
            onOk() {
                notification.warning({
                    message: 'Permanent deletion is restricted',
                    description: 'Flag the landlord to hide unsafe listings, or handle permanent removal through platform support.'
                });
            },
        });
    };

    const handleFlagLandlord = async (landlordId) => {
        try {
            const response = await api.post(
                `/admin/flag-landlord/${landlordId}`,
                {}
            );

            if (response.status === 200) {
                notification.success({
                    message: "Success",
                    description: "Landlord account has been flagged and their listings are now hidden",
                });
                
                // Refresh the listings list
                fetchAllListings();
            }
        } catch (error) {
            notification.error({
                message: "Error",
                description: error.response?.data?.message || "Error flagging landlord account",
            });
        }
    };

    const showFlagConfirm = (record) => {
        confirm({
            title: 'Flag this listing and landlord account?',
            icon: <ExclamationCircleOutlined />,
            content: `Are you sure you want to flag "${record.propertyName}" and its landlord account? This will hide all listings from this landlord.`,
            okText: 'Yes, Flag',
            okType: 'warning',
            cancelText: 'Cancel',
            centered: true,
            onOk() {
                if (record.landlord && record.landlord._id) {
                    handleFlagLandlord(record.landlord._id);
                } else {
                    notification.error({
                        message: "Error",
                        description: "Landlord information is missing",
                    });
                }
            },
        });
    };

    const getStatusColor = (price) => {
        if (price > 5000) return 'green';
        if (price > 1000) return 'geekblue';
        return 'volcano';
    };

    const columns = [
        {
            title: 'Property Name',
            dataIndex: 'propertyName',
            key: 'propertyName',
            filteredValue: searchText ? [searchText] : null,
            onFilter: (value, record) => {
                return (
                    record.propertyName?.toLowerCase().includes(value.toLowerCase()) ||
                    record.address?.toLowerCase().includes(value.toLowerCase()) ||
                    record.city?.toLowerCase().includes(value.toLowerCase()) ||
                    record.propertyType?.toLowerCase().includes(value.toLowerCase()) ||
                    record.landlordName?.toLowerCase().includes(value.toLowerCase())
                );
            },
            render: (text, record) => (
                <div className="flex items-center space-x-3">
                    <img
                        src={(record.images && record.images[0]) ||
                            record.image ||
                            ""}
                        alt={text}
                        className="w-10 h-10 rounded-md object-cover"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "";
                        }}
                    />
                    <span className="font-medium">{text}</span>
                </div>
            ),
        },
        {
            title: 'Address',
            dataIndex: 'address',
            key: 'address',
            render: (text, record) => (
                <span>
                    {text} {record.city && `, ${record.city}`}
                </span>
            ),
        },
        {
            title: 'Property Type',
            dataIndex: 'propertyType',
            key: 'propertyType',
        },
        {
            title: 'Monthly Rent',
            dataIndex: 'monthlyRent',
            key: 'monthlyRent',
            sorter: (a, b) => a.monthlyRent - b.monthlyRent,
            render: (price) => (
                <Tag color={getStatusColor(price)}>
                    LKR {price?.toLocaleString() || "N/A"}
                </Tag>
            ),
        },
        {
            title: 'Landlord',
            dataIndex: 'landlordName',
            key: 'landlordName',
            render: (text, record) => record.landlordName || (record.landlord && record.landlord.username) || "N/A",
        },
        {
            title: 'Created Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => {
                const isLandlordFlagged = record.landlord?.isFlagged;
                
                return (
                    <Tag color={isLandlordFlagged ? 'red' : 'green'}>
                        {isLandlordFlagged ? 'Hidden (Landlord Flagged)' : 'Active'}
                    </Tag>
                )
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="flex space-x-2">
                    <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/listing/${record._id}`, '_blank');
                        }}
                    >
                        <FaEye className="mr-1" /> View
                    </button>
                    <button
                        className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs flex items-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            showFlagConfirm(record);
                        }}
                    >
                        <FaFlag className="mr-1" /> Flag
                    </button>
                    <button
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center"
                        onClick={(e) => {
                            e.stopPropagation();
                            showDeleteConfirm(record);
                        }}
                    >
                        <FaTrash className="mr-1" /> Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
    <div className="ln-dashboard-bg min-h-screen">
            <Sidebar />

      <div className="ln-dashboard-main">
        <div className="mx-auto max-w-[1500px] space-y-5">
                <div className="ln-admin-page-title">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                            <Building2 className="mr-3 text-emerald-700" />
                            Manage Listings
                        </h1>
                        <p className="text-gray-600">Monitor and manage all property listings</p>
                    </div>
                </div>

                <div className="ln-admin-panel">
                    <div className="mb-4">
                        <Input
                            placeholder="Search by property name, address, landlord or type..."
                            prefix={<SearchOutlined />}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="max-w-full sm:max-w-[350px]"
                        />
                    </div>

                    <Table
                        dataSource={listings}
                        columns={columns}
                        rowKey="_id"
                        loading={loading}
                        onRow={(record) => ({
                            onClick: () => handleRowClick(record),
                            style: { cursor: 'pointer' }
                        })}
                        pagination={{
                            pageSize: 10,
                            showTotal: (total) => `Total ${total} listings`,
                        }}
                        locale={{
                            emptyText: (
                                <div className="py-8 text-center">
                                    <FaBuilding className="text-gray-300 text-4xl mx-auto mb-4" />
                                    <p className="text-gray-500 mb-4">No listings found</p>
                                </div>
                            ),
                        }}
                    />
                </div>

                {/* Custom Modal using divs instead of Dialog */}
                {isModalOpen && selectedListing && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div
                            ref={modalRef}
                            className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b p-4 md:p-6">
                                <h2 className="text-xl md:text-2xl font-bold text-primaryBgColor">
                                    {selectedListing.propertyName}
                                </h2>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        onClick={() => setShowMap(!showMap)}
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1.5"
                                    >
                                        {showMap ? "View Details" : "View Map"}
                                    </Button>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="ln-icon-button h-9 w-9 text-gray-500 hover:text-gray-800"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="overflow-y-auto flex-1">
                                {!showMap ? (
                                    <div className="p-4 md:p-6">
                                        {/* Display property images if available */}
                                        {(selectedListing.images && selectedListing.images.length > 0) ? (
                                            <div className="mb-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                    {selectedListing.images.slice(0, 3).map((image, index) => (
                                                        <img
                                                            key={index}
                                                            src={typeof image === 'string' ? image : image.url || image.src || ''}
                                                            alt={`Property ${index + 1}`}
                                                            className="w-full h-32 sm:h-40 md:h-48 object-cover rounded-md"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = '';
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : selectedListing.image ? (
                                            <div className="mb-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-2">
                                                    <img
                                                        src={typeof selectedListing.image === 'string' ?
                                                            selectedListing.image :
                                                            selectedListing.image.url || selectedListing.image.src || ''}
                                                        alt="Property"
                                                        className="w-full h-32 sm:h-40 md:h-48 object-cover rounded-md"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = '';
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ) : selectedListing.imageUrls && selectedListing.imageUrls.length > 0 ? (
                                            // Alternative image array field that might be used
                                            <div className="mb-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                    {selectedListing.imageUrls.slice(0, 3).map((image, index) => (
                                                        <img
                                                            key={index}
                                                            src={typeof image === 'string' ? image : image.url || image.src || ''}
                                                            alt={`Property ${index + 1}`}
                                                            className="w-full h-32 sm:h-40 md:h-48 object-cover rounded-md"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = '';
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            // Fallback for listings without images
                                            <div className="mb-6">
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div className="w-full h-32 sm:h-40 md:h-48 bg-gray-100 rounded-md flex items-center justify-center">
                                                        <p className="text-gray-500">No images available</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                            <div className="space-y-3 md:space-y-4">
                                                <div className="bg-gray-50 p-3 md:p-4 rounded-md">
                                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Property Type</h3>
                                                    <p className="font-semibold text-gray-900">{selectedListing.propertyType || "Not specified"}</p>
                                                </div>

                                                <div className="bg-gray-50 p-3 md:p-4 rounded-md">
                                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Monthly Rent</h3>
                                                    <p className="font-bold text-lg text-primaryBgColor">
                                                        {selectedListing.monthlyRent ? `Rs. ${selectedListing.monthlyRent.toLocaleString()}` : "Price not specified"}
                                                    </p>
                                                </div>

                                                <div className="bg-gray-50 p-3 md:p-4 rounded-md">
                                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Nearest University</h3>
                                                    <p className="font-semibold text-gray-900">
                                                        {selectedListing.nearestUniversity.name || "Not specified"}
                                                    </p>
                                                </div>

                                                <div className="bg-gray-50 p-3 md:p-4 rounded-md">
                                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Created Date</h3>
                                                    <p className="font-semibold text-gray-900">
                                                        {selectedListing.createdAt
                                                            ? new Date(selectedListing.createdAt).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })
                                                            : "Date not available"
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-3 md:space-y-4">
                                                <div className="bg-gray-50 p-3 md:p-4 rounded-md">
                                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                                                    <p className="font-semibold text-gray-900">
                                                        {selectedListing.address || "Address not provided"}
                                                        {selectedListing.city && `, ${selectedListing.city}`}
                                                    </p>
                                                </div>

                                                <div className="bg-gray-50 p-3 md:p-4 rounded-md">
                                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                                                    <p className="text-gray-700 max-h-24 md:max-h-36 overflow-y-auto text-sm md:text-base">
                                                        {selectedListing.description || "No description available"}
                                                    </p>
                                                </div>

                                                <div className="bg-gray-50 p-3 md:p-4 rounded-md">
                                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Owner Details</h3>
                                                    <p className="font-semibold text-gray-900">
                                                        {selectedListing.landlordName || selectedListing.landlord?.username || 'Name not provided'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {selectedListing.landlord?.phoneNumber || 'Contact not provided'}
                                                    </p>
                                                    {(selectedListing.landlordEmail || selectedListing.landlord?.email) && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {selectedListing.landlordEmail || selectedListing.landlord?.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-[400px] w-full items-center justify-center">
                                        {selectedListing.coordinates && (
                                            <Map
                                                selectedLocations={[selectedListing.coordinates]}
                                                initialCenter={[
                                                    selectedListing.coordinates.latitude,
                                                    selectedListing.coordinates.longitude
                                                ]}
                                                initialZoom={16}
                                                pinColor="red"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 md:p-6 border-t flex flex-wrap items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsModalOpen(false)}
                                    className="mr-2"
                                >
                                    Close
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-orange-500 mr-2"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        showFlagConfirm(selectedListing);
                                    }}
                                >
                                    Flag Listing
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        showDeleteConfirm(selectedListing);
                                    }}
                                >
                                    Delete Listing
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
    )
}

export default ManageListings

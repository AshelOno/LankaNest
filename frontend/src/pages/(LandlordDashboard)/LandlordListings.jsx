import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/landlord_dashboard/Sidebar';
import { useLandlordAuthStore } from '@/store/landlordAuthStore';
import useListingStore from '@/store/listingStore';
import LoadingSpinner from '@/components/include/LoadingSpinner';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaEdit, FaEye, FaTrash, FaPlus, FaBuilding, FaHome, FaChartLine } from 'react-icons/fa';
import { Input, Button, Popconfirm, notification, Tag, Modal, Card, Avatar, Row, Col, Pagination, Empty } from 'antd';
import { SearchOutlined, ExclamationCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { FaCirclePause } from 'react-icons/fa6';
import { DashboardShell } from '@/components/ui/page-shell';

const LandlordListings = () => {
    const { landlordId, email } = useParams();
    const { landlord, isLandlordAuthenticated, checkLandlordAuth, isCheckingLandlordAuth } = useLandlordAuthStore();
    const { fetchLandlordListings, landlordListings, loading } = useListingStore();
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(6);
    const { confirm } = Modal;

    const navigate = useNavigate();

    useEffect(() => {
        if (!isLandlordAuthenticated) {
            checkLandlordAuth();
        }
    }, []);

    useEffect(() => {
        if (landlord && landlord._id) {
            fetchLandlordListings(landlord._id);
        }
    }, [landlord, fetchLandlordListings]);

    useEffect(() => {
        document.title = 'My Listings';
    }, []);

    if (isCheckingLandlordAuth || loading) {
        return <LoadingSpinner />;
    }

    if (!isLandlordAuthenticated || !landlord) {
        return null;
    }

    const getStatusColor = (price) => {
        if (price > 5000) return 'green';
        if (price > 1000) return 'geekblue';
        return 'volcano';
    };

    const handleSearch = (value) => {
        setSearchText(value);
        setCurrentPage(1);
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
                    message: 'Deletion requires support review',
                    description: 'Contact LankaNest support if this listing needs to be removed permanently.'
                });
            },
        });
    };

    // Filter listings based on search text
    const filteredListings = landlordListings.filter(listing =>
        listing.propertyName.toLowerCase().includes(searchText.toLowerCase()) ||
        listing.address.toLowerCase().includes(searchText.toLowerCase()) ||
        listing.city.toLowerCase().includes(searchText.toLowerCase())
    );

    // Pagination calculation
    const paginatedListings = filteredListings.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    return (
        <DashboardShell
            sidebar={<Sidebar />}
            sidebarWidth="230px"
            eyebrow="Owner workspace"
            title="My Listings"
            description="Manage, inspect, and improve all of your property listings."
            actions={
                <Link to={`/landlord/${landlordId}/add-listings`} className="ln-primary-btn">
                    <FaPlus />
                    Add New Listing
                </Link>
            }
        >
                <div className="ln-card">
                    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <Input
                            placeholder="Search by property name, address or city..."
                            prefix={<SearchOutlined />}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="max-w-full sm:max-w-[360px]"
                        />
                        <div>
                            <span className="mr-2 text-sm font-medium text-slate-600">
                                Showing {Math.min(filteredListings.length, 1 + (currentPage - 1) * pageSize)}-
                                {Math.min(currentPage * pageSize, filteredListings.length)} of {filteredListings.length} listings
                            </span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <LoadingSpinner />
                        </div>
                    ) : filteredListings.length === 0 ? (
                        <Empty
                            image={<FaBuilding className="text-gray-300 text-6xl" />}
                            description={
                                <div>
                                    <p className="text-slate-500 mb-4">No listings found</p>
            <Link to={`/landlord/${landlordId}/add-listings`}>
                                        <Button type="primary" icon={<FaPlus />}>
                                            Add Your New Listing
                                        </Button>
                                    </Link>
                                </div>
                            }
                        />
                    ) : (
                        <>
                            <Row gutter={[16, 16]}>
                                {paginatedListings.map(listing => (
                                    <Col xs={24} sm={12} md={8} lg={8} key={listing._id}>
                                        <Card
                                            hoverable
                                             className="h-full flex flex-col overflow-hidden"
                                            cover={
                                                <div className="h-48 overflow-hidden relative">
                                                    <img
                                                        alt={listing.propertyName}
                                                        src={listing.images[0] || ""}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "";
                                                        }}
                                                    />
                                                </div>
                                            }
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-1">
                                                    <h3 className="text-lg font-medium truncate flex-1">{listing.propertyName}</h3>

                                                    <Tag color="blue">
                                                        LKR {listing.monthlyRent.toLocaleString()}
                                                    </Tag>
                                                </div>
                                                <p className="text-slate-500 flex items-center mb-2 text-sm">
                                                    <EnvironmentOutlined className="mr-1" />
                                                    {listing.address}, {listing.city}
                                                </p>
                                                <div className="flex justify-between items-center mb-2">
                                                    <Tag color="blue">{listing.propertyType}</Tag>
                                                    <span className="text-sm text-slate-500">{new Date(listing.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 mb-2">
                                                    <span className="font-semibold">Views:</span> {listing.views}
                                                </p>
                                            </div>

                                            <div className="flex flex-col space-y-2 mt-auto pt-3 border-t">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<FaEye />}
                                                        onClick={() => window.open(`/listing/${listing._id}`, '_blank')}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<FaChartLine />}
                                                        onClick={() =>
                      navigate(`/landlord/${landlordId}/my-listings/${listing._id}`
                                                            )}
                                                    >
                                                        Analytics
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<FaCirclePause />}
                                                        onClick={() =>
                                                            notification.info({
                                                                message: listing.isHeld ? 'Listing is already on hold' : 'Payment holds are automatic',
                                                                description: 'Listings are held or released based on your active subscription status.',
                                                            })
                                                        }
                                                    >
                                                        Hold
                                                    </Button>
                                                    <Button
                                                        type="primary"
                                                        danger
                                                        size="small"
                                                        icon={<FaTrash />}
                                                        onClick={() => showDeleteConfirm(listing)}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            <div className="mt-6 flex justify-center">
                                <Pagination
                                    current={currentPage}
                                    pageSize={pageSize}
                                    total={filteredListings.length}
                                    onChange={(page) => setCurrentPage(page)}
                                    showSizeChanger={false}
                                    showQuickJumper
                                />
                            </div>
                        </>
                    )}
                </div>
        </DashboardShell>
    );
};

export default LandlordListings;

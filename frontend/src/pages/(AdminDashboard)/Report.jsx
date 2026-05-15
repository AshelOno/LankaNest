import Sidebar from '@/components/admin_dashboard/Sidebar'
import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, App as AntdApp, Space, Input, Alert } from 'antd'
import { ExclamationCircleOutlined, SearchOutlined, WarningOutlined } from '@ant-design/icons'
import { FileText } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/services/http";

const Report = () => {
    const { notification, modal } = AntdApp.useApp();
    const { confirm } = modal;

    const [spamReviews, setSpamReviews] = useState([]);
    const [allReviews, setAllReviews] = useState([]);
    const [listingReports, setListingReports] = useState([]);

    const [loading, setLoading] = useState(true)
    const [searchText, setSearchText] = useState('')
    const [currentTab, setCurrentTab] = useState("spam-reviews");

    useEffect(() => {
        fetchSpamReviews();
        fetchAllReviews();
        fetchListingReports();
    }, [])

    // Document Titles
    useEffect(() => {
        if (currentTab === 'spam-reviews') {
            document.title = `(${spamReviews.length}) Spam Reviews`;
        } else if (currentTab === 'all-reviews') {
            document.title = `(${allReviews.length}) All Reviews`;
        } else {
            document.title = `(${listingReports.length}) Listing Reports`;
        }
    }, [spamReviews.length, allReviews.length, listingReports.length, currentTab]);

    const fetchSpamReviews = async () => {
        try {
            setLoading(true)
            const response = await api.get('/review/admin/spam-reviews')

            if (response.data.success) {
                console.log('Spam reviews data:', response.data.reviews);
                setSpamReviews(response.data.reviews)
            }
        } catch (error) {
            console.error('Error fetching spam reviews:', error)
            notification.error({
                message: 'Error',
                description: 'Failed to load spam reviews'
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchAllReviews = async () => {
        try {
            setLoading(true)
            const response = await api.get('/review/admin/all-reviews')

            if (response.data.success) {
                setAllReviews(response.data.reviews)
            }
        } catch (error) {
            console.error('Error fetching all reviews:', error)
            notification.error({
                message: 'Error',
                description: 'Failed to load all reviews'
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchListingReports = async () => {
        try {
            setLoading(true)
            const response = await api.get('/report/admin/get-reports')
            if (response.data.success) {
                console.log('Listing report data:', response.data.reports);
                const transformedReports = response.data.reports.map(report => ({
                    _id: report._id,
                    propertyName: report.listingId?.propertyName || 'Unknown Property',
                    reportReason: report.type,
                    reportedBy: report.reporterId?.name || report.reporterId?.email || 'Anonymous',
                    description: report.description,
                    status: report.status || 'pending',
                    createdAt: report.createdAt
                }));
                setListingReports(transformedReports)
            }
        } catch (error) {
            console.error('Error fetching listing reports:', error)
            notification.error({
                message: 'Error',
                description: 'Failed to load listing reports'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteReview = (reviewId) => {
        confirm({
            title: 'Remove Flagged Review',
            icon: <ExclamationCircleOutlined style={{ color: 'red' }} />,
            content: 'This action will permanently delete this inappropriate review from the system.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const response = await api.delete(`/review/admin/delete/${reviewId}`)
                    if (response.data.success) {
                        notification.success({
                            message: 'Success',
                            description: 'Review deleted successfully'
                        })
                        fetchSpamReviews()
                        fetchAllReviews()
                    }
                } catch (error) {
                    notification.error({
                        message: 'Error',
                        description: 'Failed to delete review'
                    })
                }
            }
        });
    }

    const handleResolveReport = (reportId, action) => {
        const actionText = {
            flag: 'Flag this listing (hides from users)',
            dismiss: 'Dismiss this report',
            investigate: 'Mark as investigating'
        };

        confirm({
            title: `${action.charAt(0).toUpperCase() + action.slice(1)} report?`,
            icon: action === 'flag' ? <ExclamationCircleOutlined style={{ color: 'red' }} /> : <WarningOutlined style={{ color: 'orange' }} />,
            content: action === 'flag'
                ? 'This will flag the listing and hide it from all users immediately.'
                : `Are you sure you want to mark this report as ${action}?`,
            okText: action.charAt(0).toUpperCase() + action.slice(1),
            okType: action === 'flag' ? 'danger' : 'primary',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    const response = await api.post(`/report/resolve/${reportId}`, {
                        action
                    });
                    if (response.data.success) {
                        notification.success({
                            message: 'Success',
                            description: `Report ${action}ed successfully`
                        });
                        fetchListingReports();
                    }
                } catch (error) {
                    notification.error({
                        message: 'Error',
                        description: error.response?.data?.message || `Failed to ${action} report`
                    });
                }
            }
        });
    };

    const columns = [
        {
            title: 'Student',
            dataIndex: 'studentName',
            key: 'studentName',
        },
        {
            title: 'Property',
            dataIndex: 'propertyName',
            key: 'propertyName',
        },
        {
            title: 'Review',
            dataIndex: 'review',
            key: 'review',
            width: '30%',
            render: text => <div className="max-h-24 overflow-y-auto">{text}</div>
        },
        {
            title: 'Spam Reason',
            dataIndex: 'spamReason',
            key: 'spamReason',
            render: reason => (
                <Tag color="red">{reason}</Tag>
            )
        },
        {
            title: 'Sentiment',
            dataIndex: 'sentiment',
            key: 'sentiment',
            render: sentiment => {
                let color = 'blue';
                if (sentiment === 'positive') color = 'green';
                if (sentiment === 'negative') color = 'volcano';
                return <Tag color={color}>{sentiment}</Tag>;
            }
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: date => new Date(date).toLocaleString()
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button
                    danger
                    onClick={() => handleDeleteReview(record._id)}
                >
                    Delete Review
                </Button>
            )
        },
    ];

    const allReviewColumns = [
        {
            title: 'Student',
            dataIndex: 'studentName',
            key: 'studentName',
        },
        {
            title: 'Property',
            dataIndex: 'propertyName',
            key: 'propertyName',
        },
        {
            title: 'Review',
            dataIndex: 'review',
            key: 'review',
            width: '30%',
            render: text => <div className="max-h-24 overflow-y-auto">{text}</div>
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                let color = 'default';
                if (status === 'approved') color = 'green';
                if (status === 'spam') color = 'red';
                if (status === 'hidden') color = 'orange';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Sentiment',
            dataIndex: 'sentiment',
            key: 'sentiment',
            render: sentiment => {
                let color = 'blue';
                if (sentiment === 'positive') color = '';
                if (sentiment === 'negative') color = 'volcano';
                return <Tag color={color}>{sentiment}</Tag>;
            }
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: date => new Date(date).toLocaleString()
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button
                    danger
                    onClick={() => handleDeleteReview(record._id)}
                >
                    Delete Review
                </Button>
            )
        },
    ];

    const listingColumns = [
        {
            title: 'Property Name',
            dataIndex: 'propertyName',
            key: 'propertyName',
        },
        {
            title: 'Report Reason',
            dataIndex: 'reportReason', // Changed from 'type' to 'reportReason' to match the transformed data
            key: 'reportReason',
            render: reason => (
                <Tag color="red">{reason}</Tag>
            )
        },
        {
            title: 'Reported By',
            dataIndex: 'reportedBy',
            key: 'reportedBy',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: '30%',
            render: text => <div className="max-h-24 overflow-y-auto">{text}</div>
        },
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: date => new Date(date).toLocaleString()
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: status => {
                let color = 'gold';
                if (status === 'resolved') color = 'green';
                if (status === 'dismissed') color = 'gray';
                if (status === 'investigating') color = 'blue';
                return <Tag color={color}>{status?.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    {record.status === 'pending' || record.status === 'investigating' ? (
                        <>
                            <Button
                                danger
                                size="small"
                                onClick={() => handleResolveReport(record._id, 'flag')}
                            >
                                Flag
                            </Button>
                            <Button
                                size="small"
                                onClick={() => handleResolveReport(record._id, 'investigate')}
                                disabled={record.status === 'investigating'}
                            >
                                Investigate
                            </Button>
                            <Button
                                size="small"
                                onClick={() => handleResolveReport(record._id, 'dismiss')}
                            >
                                Dismiss
                            </Button>
                        </>
                    ) : (
                        <span className="text-gray-400 italic text-xs">No actions available</span>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div className="ln-dashboard-bg min-h-screen">
            <Sidebar />
            <div className="ln-dashboard-main">
                <div className="mx-auto max-w-[1500px] space-y-5">
                    <div className="ln-admin-page-title">
                        <div>
                            <h1 className="flex items-center text-2xl font-bold text-gray-800">
                                <FileText className="mr-3 text-2xl text-emerald-700" />
                                Reports
                            </h1>
                            <p className="text-sm text-gray-600">Review flagged reviews and listing reports in one moderation workspace.</p>
                        </div>
                    </div>
                    <Tabs defaultValue='spam-reviews' onValueChange={setCurrentTab}>
                        <TabsList>
                            <TabsTrigger
                                value="spam-reviews"
                                className="data-[state=active]:bg-primaryBgColor data-[state=active]:text-white"
                            >
                                Spam Reports
                            </TabsTrigger>
                            <TabsTrigger
                                value="all-reviews"
                                className="data-[state=active]:bg-primaryBgColor data-[state=active]:text-white"
                            >
                                All Reviews
                            </TabsTrigger>
                            <TabsTrigger
                                value="listing-reports"
                                className="data-[state=active]:bg-primaryBgColor data-[state=active]:text-white"
                            >
                                Listing Reports
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="spam-reviews">
                            <Alert
                                message="Strict Content Policy"
                                description="Our platform maintains a zero-tolerance policy for spam, misleading information, and inappropriate content. All flagged reviews are subject to deletion to maintain platform integrity."
                                type="warning"
                                showIcon
                                icon={<WarningOutlined />}
                                className="mb-6 mt-4"
                            />
                            <div className="ln-admin-panel">
                                <div className="mb-4">
                                    <Input
                                        placeholder="Search reviews..."
                                        prefix={<SearchOutlined />}
                                        onChange={e => setSearchText(e.target.value)}
                                        className="w-64"
                                    />
                                </div>
                                <Table
                                    dataSource={spamReviews.filter(review =>
                                        review.review?.toLowerCase().includes(searchText.toLowerCase()) ||
                                        review.studentName?.toLowerCase().includes(searchText.toLowerCase()) ||
                                        review.propertyName?.toLowerCase().includes(searchText.toLowerCase()) ||
                                        review.spamReason?.toLowerCase().includes(searchText.toLowerCase())
                                    )}
                                    columns={columns}
                                    rowKey="_id"
                                    loading={loading}
                                    pagination={{ pageSize: 10 }}
                                    locale={{ emptyText: 'No flagged reviews found' }}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="all-reviews">
                            <div className="ln-admin-panel">
                                <div className="mb-4">
                                    <Input
                                        placeholder="Search reviews..."
                                        prefix={<SearchOutlined />}
                                        onChange={e => setSearchText(e.target.value)}
                                        className="w-64"
                                    />
                                </div>
                                <Table
                                    dataSource={allReviews.filter(review =>
                                        review.review?.toLowerCase().includes(searchText.toLowerCase()) ||
                                        review.studentName?.toLowerCase().includes(searchText.toLowerCase()) ||
                                        review.propertyName?.toLowerCase().includes(searchText.toLowerCase()) ||
                                        review.status?.toLowerCase().includes(searchText.toLowerCase())
                                    )}
                                    columns={allReviewColumns}
                                    rowKey="_id"
                                    loading={loading}
                                    pagination={{ pageSize: 10 }}
                                    locale={{ emptyText: 'No reviews found' }}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="listing-reports">
                            <Alert
                                message="Report of Inappropriate Listings"
                                description="All flagged listings are subject to review and potential removal from the platform."
                                type="warning"
                                showIcon
                                icon={<WarningOutlined />}
                                className="mb-6 mt-4"
                            />
                            <div className="ln-admin-panel">
                                <div className="mb-4">
                                    <Input
                                        placeholder='Search reports...'
                                        prefix={<SearchOutlined />}
                                        onChange={e => setSearchText(e.target.value)}
                                        className='w-64'
                                    />
                                </div>
                                <Table
                                    dataSource={listingReports.filter(report =>
                                        report.propertyName?.toLowerCase().includes(searchText.toLowerCase()) ||
                                        report.reportReason?.toLowerCase().includes(searchText.toLowerCase()) ||
                                        report.reportedBy?.toLowerCase().includes(searchText.toLowerCase()) ||
                                        report.description?.toLowerCase().includes(searchText.toLowerCase())
                                    )}
                                    columns={listingColumns}
                                    rowKey="_id"
                                    loading={loading}
                                    pagination={{ pageSize: 10 }}
                                    locale={{ emptyText: 'No reports found' }}
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

export default Report

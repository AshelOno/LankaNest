import Sidebar from '@/components/landlord_dashboard/Sidebar'
import { Empty, Spin, Card, Button, notification, Tabs, Image } from 'antd';
import React, { useEffect, useState } from 'react'
import { useLandlordAuthStore } from '@/store/landlordAuthStore';
import { useParams } from 'react-router-dom';
import { FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaUser, FaBuilding, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import axios from 'axios';
import { useScheduleStore } from '@/store/scheduleStore';
import { DashboardShell } from '@/components/ui/page-shell';

const { TabPane } = Tabs;

const LandlordSchedules = () => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const { landlord } = useLandlordAuthStore();
    const {
        schedules,
        loading,
        getSchedulesByLandlordId,
        updateScheduleStatus
    } = useScheduleStore();

    useEffect(() => {
        document.title = "Scheduled Visits";
        if (landlord?._id) {
            getSchedulesByLandlordId(landlord._id);
        }
    }, [landlord, getSchedulesByLandlordId]);

    const isUpcoming = (dateStr, timeStr) => {
        try {
            const now = new Date();
            const scheduleDate = new Date(dateStr);
            const [hours, minutes] = timeStr.split(':').map(Number);
            scheduleDate.setHours(hours, minutes, 0, 0);
            return scheduleDate > now;
        } catch (error) {
            console.error("Error parsing date/time:", error);
            return false;
        }
    };

    const upcomingSchedules = schedules.filter(schedule =>
        isUpcoming(schedule.date, schedule.time) &&
        schedule.status !== 'rejected'
    );

    const rejectedSchedules = schedules.filter(schedule =>
        schedule.status === 'rejected'
    );

    const pastSchedules = schedules.filter(schedule =>
        !isUpcoming(schedule.date, schedule.time) && 
        schedule.status !== 'rejected'
    );

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
    };

    const handleAccept = async (scheduleId) => {
        try {
            await updateScheduleStatus(scheduleId, 'confirmed');
        } catch (error) {
            console.error('Error confirming schedule:', error);
        }
    };

    const handleReject = async (scheduleId) => {
        try {
            await updateScheduleStatus(scheduleId, 'rejected');
        } catch (error) {
            console.error('Error rejecting schedule:', error);
        }
    };

    const renderScheduleCard = (schedule) => (
        <Card
            key={schedule._id}
            className={`mb-4 overflow-hidden shadow-sm ${schedule.status === 'confirmed' ? 'border-l-4 border-l-blue-500' :
                    schedule.status === 'rejected' ? 'border-l-4 border-l-orange-500' :
                    'border-l-4 border-l-yellow-500'}`}
            hoverable
        >
            <div className="flex flex-col md:flex-row gap-4">
                {/* Property Image */}
                <div className="w-full md:w-32 h-32">
                    {schedule.listingId?.images && schedule.listingId.images.length > 0 ? (
                        <Image
                            src={schedule.listingId.images[0]}
                            alt={schedule.listingId.propertyName || "Property"}
                            className="w-full h-full object-cover rounded-md"
                            fallback=""
                            preview={false}
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-100 rounded-md flex items-center justify-center">
                            <FaBuilding className="text-slate-400" size={32} />
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{schedule.listingId?.propertyName || 'Property Visit'}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            schedule.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            schedule.status === 'rejected' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {schedule.status === 'confirmed' ? 'Confirmed' :
                            schedule.status === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-primaryBgColor" />
                            <span>{formatDate(schedule.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FaClock className="text-primaryBgColor" />
                            <span>{schedule.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FaUser className="text-primaryBgColor" />
                            <span>{schedule.userId?.username || 'Unknown Student'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <FaBuilding className="text-primaryBgColor" />
                            <span>{schedule.listingId?.propertyType || 'Not specified'}</span>
                        </div>
                        {schedule.listingId?.address && (
                            <div className="flex items-center gap-2 md:col-span-2">
                                <FaMapMarkerAlt className="text-primaryBgColor" />
                                <span>{schedule.listingId.address}, {schedule.listingId.city}</span>
                            </div>
                        )}
                    </div>

                    {/* Only show action buttons for pending visits */}
                    {schedule.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                            <Button
                                type="primary"
                                onClick={() => handleAccept(schedule._id)}
                                className="bg-primaryBgColor hover:bg-blue-700 flex items-center"
                                icon={<FaCheckCircle />}
                            >
                                Accept
                            </Button>
                            <Button
                                danger
                                onClick={() => handleReject(schedule._id)}
                                className="flex items-center"
                                icon={<FaTimesCircle />}
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );

    return (
        <DashboardShell
            sidebar={<Sidebar />}
            sidebarWidth="230px"
            eyebrow="Owner workspace"
            title="Scheduled Visits"
            description="Review upcoming, rejected, and past student visits."
        >
                <div className="ln-card">
                <Tabs activeKey={activeTab} onChange={setActiveTab} className="custom-tabs">
                    <TabPane tab={`Upcoming (${upcomingSchedules.length})`} key="upcoming">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spin size="large" />
                            </div>
                        ) : upcomingSchedules.length === 0 ? (
                            <Empty
                                description="No upcoming scheduled visits"
                                className="my-12"
                            />
                        ) : (
                            <div className="space-y-4">
                                {upcomingSchedules.map(renderScheduleCard)}
                            </div>
                        )}
                    </TabPane>
                    <TabPane tab={`Rejected (${rejectedSchedules.length})`} key="rejected">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spin size="large" />
                            </div>
                        ) : rejectedSchedules.length === 0 ? (
                            <Empty
                                description="No rejected scheduled visits"
                                className="my-12"
                            />
                        ) : (
                            <div className="space-y-4">
                                {rejectedSchedules.map(renderScheduleCard)}
                            </div>
                        )}
                    </TabPane>
                    <TabPane tab={`Past (${pastSchedules.length})`} key="past">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Spin size="large" />
                            </div>
                        ) : pastSchedules.length === 0 ? (
                            <Empty
                                description="No past scheduled visits"
                                className="my-12"
                            />
                        ) : (
                            <div className="space-y-4">
                                {pastSchedules.map(renderScheduleCard)}
                            </div>
                        )}
                    </TabPane>
                </Tabs>
                </div>

                <style>{`
                    .custom-tabs .ant-tabs-tab.ant-tabs-tab-active {
                        background-color: #0F65D8;
                        border-radius: 4px 4px 0 0;
                    }
                    .custom-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
                        color: white !important;
                    }
                    .custom-tabs .ant-tabs-tab {
                        padding: 8px 16px;
                        margin-right: 4px;
                        transition: all 0.3s;
                    }
                    .custom-tabs .ant-tabs-tab:hover {
                        color: #0F65D8;
                    }
                    .custom-tabs .ant-tabs-ink-bar {
                        background-color: #0F65D8;
                    }
                    .custom-tabs .ant-tabs-nav::before {
                        border-bottom: 1px solid #e8e8e8;
                    }
                `}</style>
        </DashboardShell>
    );
};

export default LandlordSchedules;

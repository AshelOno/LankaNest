import { useAdminAuthStore } from "@/store/adminAuthStore";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "@/components/include/LoadingSpinner";
import Sidebar from "@/components/admin_dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardShell, StatCard } from "@/components/ui/page-shell";
import {
  Users,
  Building2,
  AlertTriangle,
  Activity,
  Star,
  Calendar,
} from "lucide-react";
import { useAdminStore } from "@/store/adminStore";
import CountUp from "@/components/admin_dashboard/CountUp";
import useListingStore from "@/store/listingStore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { adminId } = useParams();
  const {
    admin,
    isAdminAuthenticated,
    isCheckingAdminAuth,
    checkAdminAuth,
  } = useAdminAuthStore();

  const {
    allUsers,
    fetchAllUsers,
    userStats,
    listingStats,
    reportStats,
    reviewStats,
    scheduleStats,
    fetchDashboardStats,
    isLoading,
  } = useAdminStore();

  const { listings, fetchAllListings } = useListingStore();
  const [activeTab, setActiveTab] = useState("overview");

  const handlePagesButtonClick = () => {
    navigate(`/admin/${adminId}/handle-pages`);
  };

  useEffect(() => {
    if (!isAdminAuthenticated && !isCheckingAdminAuth) {
      checkAdminAuth();
    }
  }, [isAdminAuthenticated, isCheckingAdminAuth, checkAdminAuth]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAllUsers();
      fetchAllListings();
      fetchDashboardStats();
    }
  }, [
    isAdminAuthenticated,
    fetchAllUsers,
    fetchAllListings,
    fetchDashboardStats,
  ]);

  useEffect(() => {
    if (admin?.username) {
      document.title = `${admin.username}'s Dashboard`;
    }
  }, [admin?.username]);

  if (isCheckingAdminAuth || isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAdminAuthenticated || !admin) {
    navigate("/auth/lankanest-admin");
    return null;
  }

  // Prepare property type data for chart
  const propertyTypeData = Object.entries(
    listingStats.byPropertyType || {}
  ).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  // Prepare user role data for chart
  const userRoleData = [
    { name: "Students", value: userStats.students },
    { name: "Landlords", value: userStats.landlords },
  ];

  // Colors for charts
  const COLORS = ["#071A3D", "#0F8B6F", "#D7B35A", "#DF5267", "#7C4DE3"];

  const statsCards = [
    {
      title: "Total Users",
      value: `${userStats.total}`,
      icon: Users,
      description: `${userStats.students} students, ${userStats.landlords} landlords`,
    },
    {
      title: "Total Listings",
      value: `${listings.length}`,
      icon: Building2,
      description: `Avg. rent: LKR ${
        listingStats.averageRent?.toLocaleString() || 0
      }`,
    },
    {
      title: "Reviews",
      value: `${reviewStats.total || 0}`,
      icon: Star,
      description: `${reviewStats.spam || 0} flagged as spam`,
    },
    {
      title: "Reports",
      value: `${reportStats.total || 0}`,
      icon: AlertTriangle,
      description: `${reportStats.pending || 0} pending resolution`,
    },
  ];

  return (
    <DashboardShell
      sidebar={<Sidebar />}
      sidebarWidth="230px"
      eyebrow="Admin console"
      title={`Welcome back, ${admin.username}`}
      description="Monitor platform health, review user activity, and manage operational queues from one clean workspace."
      actions={
        <Button
          onClick={handlePagesButtonClick}
          className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/50 hover:from-emerald-600 hover:to-teal-700 transition"
        >
          Manage Pages
        </Button>
      }
    >
        <main className="space-y-6">
          {/* Dashboard Tabs */}
          <div className="flex flex-wrap gap-2 rounded-xl border border-emerald-200/30 bg-gradient-to-r from-white to-emerald-50/30 p-2 shadow-sm">
            <button
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                activeTab === "overview"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                  : "text-slate-600 hover:bg-white hover:text-emerald-700"
              }`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                activeTab === "users"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                  : "text-slate-600 hover:bg-white hover:text-emerald-700"
              }`}
              onClick={() => setActiveTab("users")}
            >
              User Analytics
            </button>
            <button
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                activeTab === "listings"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                  : "text-slate-600 hover:bg-white hover:text-emerald-700"
              }`}
              onClick={() => setActiveTab("listings")}
            >
              Listing Analytics
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statsCards.map((card, index) => (
              <StatCard
                key={card.title}
                icon={card.icon}
                label={card.title}
                value={<CountUp end={parseInt(card.value) || 0} />}
                detail={card.description}
                tone={["blue", "emerald", "amber", "rose"][index] || "blue"}
              />
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Stats Card */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Activity className="h-5 w-5 mr-2 text-primaryBgColor" />
                    Platform Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>New Users (Last 7 days)</span>
                      <span className="font-bold">
                        {
                          allUsers.filter(
                            (u) =>
                              new Date(u.createdAt) >
                              new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Scheduled Visits</span>
                      <span className="font-bold">
                        {scheduleStats.total || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pending Approvals</span>
                      <span className="font-bold">
                        {scheduleStats.pending || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>User Verification Rate</span>
                      <span className="font-bold">
                        {userStats.total
                          ? Math.round(
                              (userStats.verified / userStats.total) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Status Card */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-primaryBgColor" />
                    Visit Scheduling Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Pending", value: scheduleStats.pending || 0 },
                        {
                          name: "Confirmed",
                          value: scheduleStats.confirmed || 0,
                        },
                        {
                          name: "Rejected",
                          value: scheduleStats.rejected || 0,
                        },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "users" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Role Distribution */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    User Role Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userRoleData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userRoleData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Stats Card */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    User Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Users</span>
                      <span className="font-bold">{userStats.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Students</span>
                      <span className="font-bold">{userStats.students}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Landlords</span>
                      <span className="font-bold">{userStats.landlords}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Verified Users</span>
                      <span className="font-bold">{userStats.verified}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Flagged Users</span>
                      <span className="font-bold">{userStats.flagged}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "listings" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property Type Distribution */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Property Type Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={propertyTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {propertyTypeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Listing Stats Card */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">
                    Listing Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Total Listings</span>
                      <span className="font-bold">{listings.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Monthly Rent</span>
                      <span className="font-bold">
                        LKR {listingStats.averageRent?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Most Viewed Property</span>
                      <span className="font-bold">
                        {listingStats.highestViewed?.propertyName || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Property with Most Bookmarks</span>
                      <span className="font-bold">
                        {listingStats.mostBookmarked?.propertyName || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average ELO Rating</span>
                      <span className="font-bold">
                        {listingStats.averageElo?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
    </DashboardShell>
  );
}

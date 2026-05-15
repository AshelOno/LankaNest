import React, { useEffect, useState } from "react";
import Sidebar from "@/components/admin_dashboard/Sidebar";
import { useAdminStore } from "@/store/adminStore";
import { getApiUrl } from "@/services/http";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Users,
  Building2,
  FileText,
  Calendar,
  Clock,
  MessageSquare,
  RefreshCw,
  Star,
  AlertTriangle,
  BadgeCheck,
  TrendingUp,
  DollarSign,
  CreditCard,
  BarChart2,
  ShieldAlert,
  Home,
  Eye,
  ShieldCheck,
  Mail,
  Bell,
  MessageCircle,
  CheckCircle,
  Zap,
} from "lucide-react";
import AnalyticsStatCard from "@/components/admin_dashboard/AnalyticsStatCard";
import { IoMdAnalytics } from "react-icons/io";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import CountUp from "@/components/admin_dashboard/CountUp";

const Analytics = () => {
  const {
    userStats,
    listingStats,
    reportStats,
    reviewStats,
    scheduleStats,
    communicationStats,
    financialStats,
    fetchDashboardStats,
    isLoading,
  } = useAdminStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    document.title = "LankaNest Admin Analytics";
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear backend cache first
      await fetch(`${getApiUrl("/api/admin/clear-analytics-cache")}`, {
        method: "POST",
        credentials: "include",
      });
      // Then fetch fresh data
      await fetchDashboardStats();
    } catch (error) {
      console.error("Error refreshing analytics:", error);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  // Define color schemes for charts
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
  ];
  const greenGradient = ["#0F65D8", "#00A86B"];

  // Transform data for charts
  const userRoleData = [
    { name: "Students", value: userStats.students },
    { name: "Landlords", value: userStats.landlords },
    { name: "Admins", value: userStats.admins },
  ];

  const propertyTypeData = Object.entries(
    listingStats.byPropertyType || {}
  ).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  const cityDistribution = Object.entries(
    listingStats.cityDistribution || {}
  ).map(([city, count]) => ({
    name: city,
    value: count,
  }));

  const priceRanges = Object.entries(listingStats.priceRanges || {}).map(
    ([range, count]) => ({
      name: range,
      value: count,
    })
  );

  const reportTypeData = Object.entries(reportStats.byType || {}).map(
    ([type, count]) => ({
      name: type,
      value: count,
    })
  );

  const reviewSentimentData = [
    { name: "Positive", value: reviewStats.sentiments?.positive || 0 },
    { name: "Neutral", value: reviewStats.sentiments?.neutral || 0 },
    { name: "Negative", value: reviewStats.sentiments?.negative || 0 },
  ];

  const ratingDistributionData = Object.entries(
    reviewStats.ratingDistribution || {}
  ).map(([rating, count]) => ({
    name: `${rating} Star${rating === "1" ? "" : "s"}`,
    value: count,
  }));

  const popularDaysData = Object.entries(scheduleStats.popularDays || {}).map(
    ([day, count]) => ({
      name: day,
      value: count,
    })
  );

  const userGrowthData = Object.entries(userStats.monthlyGrowth || {}).map(
    ([month, count]) => ({
      name: month,
      value: count,
    })
  );

  const messageVolumeData = Object.entries(
    communicationStats.messaging?.messageVolumeTrend || {}
  ).map(([date, count]) => ({
    name: new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: count,
  }));

  const notificationTypeData = Object.entries(
    communicationStats.notifications?.byType || {}
  ).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  // Financial data transformations
  const monthlyRevenueData = Object.entries(
    financialStats.revenue?.monthly || {}
  ).map(([month, amount]) => ({
    name: month,
    value: amount,
  }));

  const paymentMethodData = Object.entries(
    financialStats.paymentMethods || {}
  ).map(([method, count]) => ({
    name: method,
    value: count,
  }));

  const subscriptionStatusData = [
    { name: "Active", value: financialStats.subscriptions?.active || 0 },
    { name: "Expired", value: financialStats.subscriptions?.expired || 0 },
    { name: "Cancelled", value: financialStats.subscriptions?.cancelled || 0 },
  ];

  // Chart configurations
  const chartConfig = {
    users: {
      label: "Users",
      color: "hsl(var(--chart-1))",
    },
    listings: {
      label: "Listings",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="ln-dashboard-bg min-h-screen">
      <div>
        <Sidebar />
      </div>

      <div className="ln-dashboard-main">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <IoMdAnalytics className="text-primaryBgColor mr-3" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Comprehensive platform statistics and trends
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            className="bg-primaryBgColor hover:bg-blue-700"
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-primaryBgColor data-[state=active]:text-white"
            >
              <Users className="mr-2 h-4 w-4" />
              User Analytics
            </TabsTrigger>
            <TabsTrigger
              value="listings"
              className="data-[state=active]:bg-primaryBgColor data-[state=active]:text-white"
            >
              <Building2 className="mr-2 h-4 w-4" />
              Listing Analytics
            </TabsTrigger>
            <TabsTrigger
              value="engagement"
              className="data-[state=active]:bg-primaryBgColor data-[state=active]:text-white"
            >
              <Activity className="mr-2 h-4 w-4" />
              Engagement Analytics
            </TabsTrigger>
            <TabsTrigger
              value="communications"
              className="data-[state=active]:bg-primaryBgColor data-[state=active]:text-white"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Communication Analytics
            </TabsTrigger>
            <TabsTrigger
              value="financial"
              className="data-[state=active]:bg-primaryBgColor data-[state=active]:text-white"
            >
              <Activity className="mr-2 h-4 w-4" />
              Financial Analytics
            </TabsTrigger>
          </TabsList>

          {/* USER ANALYTICS TAB */}
          <TabsContent value="users" className="space-y-6">
            {/* User Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <AnalyticsStatCard
                icon={Users}
                label="Total Users"
                value={userStats.total || 0}
                detail={`${userStats.verified || 0} verified accounts`}
                tone="blue"
                progress={Number(userStats.total ? (userStats.verified / userStats.total) * 100 : 0)}
                isLoading={isLoading}
              />
              <AnalyticsStatCard
                icon={BadgeCheck}
                label="Students"
                value={userStats.students || 0}
                detail={`${userStats.total ? ((userStats.students / userStats.total) * 100).toFixed(1) : 0}% of all users`}
                tone="indigo"
                isLoading={isLoading}
              />
              <AnalyticsStatCard
                icon={Building2}
                label="Landlords"
                value={userStats.landlords || 0}
                detail={`${userStats.total ? ((userStats.landlords / userStats.total) * 100).toFixed(1) : 0}% of all users`}
                tone="amber"
                isLoading={isLoading}
              />
              <AnalyticsStatCard
                icon={ShieldAlert}
                label="Flagged Users"
                value={userStats.flagged || 0}
                detail={`${userStats.total ? ((userStats.flagged / userStats.total) * 100).toFixed(1) : 0}% of all users`}
                tone="rose"
                isLoading={isLoading}
              />
            </div>

            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>
                  Monthly user registrations over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={userGrowthData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorUsers"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#0F65D8"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#0F65D8"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#0F65D8"
                          fillOpacity={1}
                          fill="url(#colorUsers)"
                          name="New Users"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* User Distribution & Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Role Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
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
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Activity</CardTitle>
                  <CardDescription>
                    Active users in different time periods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              name: "Last 24h",
                              value: userStats.activity?.activeLast24h || 0,
                              rate: userStats.activity?.activeRate24h || 0,
                            },
                            {
                              name: "Last 7d",
                              value: userStats.activity?.activeLast7d || 0,
                              rate: userStats.activity?.activeRate7d || 0,
                            },
                            {
                              name: "Last 30d",
                              value: userStats.activity?.activeLast30d || 0,
                              rate: userStats.activity?.activeRate30d || 0,
                            },
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip
                            formatter={(value, name) =>
                              name === "rate" ? `${value}%` : value
                            }
                          />
                          <Legend />
                          <Bar
                            name="Active Users"
                            dataKey="value"
                            fill="#0F65D8"
                          />
                          <Bar
                            name="Activity Rate (%)"
                            dataKey="rate"
                            fill="#8884d8"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Landlord Verification */}
            <Card>
              <CardHeader>
                <CardTitle>Landlord Verification Status</CardTitle>
                <CardDescription>
                  Overview of landlord verification progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "Pending",
                            value: userStats.landlordVerification?.pending || 0,
                          },
                          {
                            name: "Verified",
                            value:
                              userStats.landlordVerification?.verified || 0,
                          },
                          {
                            name: "Rejected",
                            value:
                              userStats.landlordVerification?.rejected || 0,
                          },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Landlords">
                          <Cell fill="#FFC107" />
                          <Cell fill="#4CAF50" />
                          <Cell fill="#F44336" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LISTING ANALYTICS TAB */}
          <TabsContent value="listings" className="space-y-6">
            {/* Listing Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnalyticsStatCard
                label="Total Listings"
                value={listingStats.total || 0}
                icon={Home}
                trend="up"
                trendLabel="12%"
                tone="blue"
                isLoading={isLoading}
                detail="Total active properties"
              />
              <AnalyticsStatCard
                label="Total Views"
                value={listingStats.totalViews || 0}
                icon={Eye}
                trend="up"
                trendLabel="8%"
                tone="indigo"
                isLoading={isLoading}
                detail="Cumulative property views"
              />
              <AnalyticsStatCard
                label="Highest Viewed"
                value={listingStats.highestViewed?.views || 0}
                icon={TrendingUp}
                tone="purple"
                isLoading={isLoading}
                detail={listingStats.highestViewed?.propertyName || "N/A"}
              />
              <AnalyticsStatCard
                label="Average Visibility"
                value={listingStats.averageElo || 0}
                icon={Activity}
                tone="emerald"
                isLoading={isLoading}
                detail="Mean ELO rating"
                progress={Number(((listingStats.averageElo || 0) / 2000) * 100)}
              />
            </div>

            {/* Property Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Property Type Distribution</CardTitle>
                <CardDescription>
                  Breakdown of listings by property type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
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
                          outerRadius={100}
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
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* City & Price Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>City Distribution</CardTitle>
                  <CardDescription>Listings by location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={cityDistribution}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={80} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#0F65D8" name="Listings" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Price Range Distribution</CardTitle>
                  <CardDescription>
                    Listings by price range (LKR)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={priceRanges}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#FFC107" name="Listings" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ENGAGEMENT ANALYTICS TAB */}
          <TabsContent value="engagement" className="space-y-6">
            {/* Engagement Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnalyticsStatCard
                label="Total Reviews"
                value={reviewStats.total || 0}
                icon={Star}
                tone="amber"
                isLoading={isLoading}
                detail={`${reviewStats.spam || 0} flagged as spam`}
                trend="up"
                trendLabel="5%"
              />
              <AnalyticsStatCard
                label="Average Rating"
                value={reviewStats.averageRating || 0}
                icon={ShieldCheck}
                tone="amber"
                isLoading={isLoading}
                detail="Out of 5 stars"
                progress={Number((reviewStats.averageRating || 0) * 20)}
              />
              <AnalyticsStatCard
                label="Total Reports"
                value={reportStats.total || 0}
                icon={AlertTriangle}
                tone="rose"
                isLoading={isLoading}
                detail={`${reportStats.pending || 0} pending resolution`}
                trend="down"
                trendLabel="2%"
              />
              <AnalyticsStatCard
                label="Total Schedules"
                value={scheduleStats.total || 0}
                icon={Calendar}
                tone="blue"
                isLoading={isLoading}
                detail={`${scheduleStats.weeklyRate || 0} this week`}
                trend="up"
                trendLabel="15%"
              />
            </div>

            {/* Review Sentiment & Rating Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review Sentiment</CardTitle>
                  <CardDescription>
                    Distribution of review sentiment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reviewSentimentData}
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
                            <Cell fill="#4CAF50" />
                            <Cell fill="#FFC107" />
                            <Cell fill="#F44336" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rating Distribution</CardTitle>
                  <CardDescription>Reviews by star rating</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={ratingDistributionData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#FFD700" name="Reviews" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Report & Schedule Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reports by Type</CardTitle>
                  <CardDescription>
                    Distribution of report reasons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={reportTypeData}
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
                            {reportTypeData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Visit Days</CardTitle>
                  <CardDescription>
                    Property viewing schedule by day of week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={popularDaysData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar
                            dataKey="value"
                            fill="#0F65D8"
                            name="Schedules"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Schedule and Report Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Status</CardTitle>
                  <CardDescription>
                    Breakdown of schedule statuses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Pending",
                                value: scheduleStats.pending || 0,
                              },
                              {
                                name: "Confirmed",
                                value: scheduleStats.confirmed || 0,
                              },
                              {
                                name: "Rejected",
                                value: scheduleStats.rejected || 0,
                              },
                            ]}
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
                            <Cell fill="#FFC107" />
                            <Cell fill="#4CAF50" />
                            <Cell fill="#F44336" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Report Status</CardTitle>
                  <CardDescription>
                    Current status of reported listings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Pending",
                                value: reportStats.pending || 0,
                              },
                              {
                                name: "Investigating",
                                value: reportStats.investigating || 0,
                              },
                              {
                                name: "Resolved",
                                value: reportStats.resolved || 0,
                              },
                              {
                                name: "Dismissed",
                                value: reportStats.dismissed || 0,
                              },
                            ]}
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
                            <Cell fill="#FFC107" />
                            <Cell fill="#2196F3" />
                            <Cell fill="#4CAF50" />
                            <Cell fill="#F44336" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* COMMUNICATION ANALYTICS TAB */}
          <TabsContent value="communications" className="space-y-6">
            {/* Communications Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnalyticsStatCard
                label="Conversations"
                value={communicationStats.messaging?.totalConversations || 0}
                icon={MessageSquare}
                tone="blue"
                isLoading={isLoading}
                detail="Total chat threads"
                trend="up"
                trendLabel="8%"
              />
              <AnalyticsStatCard
                label="Total Messages"
                value={communicationStats.messaging?.totalMessages || 0}
                icon={Mail}
                tone="indigo"
                isLoading={isLoading}
                detail={`${communicationStats.messaging?.recentMessages || 0} this week`}
                trend="up"
                trendLabel="12%"
              />
              <AnalyticsStatCard
                label="Notifications"
                value={communicationStats.notifications?.total || 0}
                icon={Bell}
                tone="purple"
                isLoading={isLoading}
                detail={`${communicationStats.notifications?.readRate || 0}% read rate`}
                progress={Number(communicationStats.notifications?.readRate || 0)}
              />
              <AnalyticsStatCard
                label="Avg. Messages"
                value={communicationStats.messaging?.avgMessagesPerConversation || 0}
                icon={MessageCircle}
                tone="amber"
                isLoading={isLoading}
                detail="Per conversation"
              />
            </div>

            {/* Message Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Message Volume</CardTitle>
                <CardDescription>
                  Daily message activity over the past week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={messageVolumeData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorMsg"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#2196F3"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#2196F3"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#2196F3"
                          fillOpacity={1}
                          fill="url(#colorMsg)"
                          name="Messages"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notification Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>
                  Distribution of notifications by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={notificationTypeData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={120} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#9C27B0" name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FINANCIAL ANALYTICS TAB */}
          <TabsContent value="financial" className="space-y-6">
            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <AnalyticsStatCard
                label="Total Revenue"
                value={financialStats.revenue?.total || 0}
                icon={DollarSign}
                tone="emerald"
                isLoading={isLoading}
                detail={`ARPU: LKR ${financialStats.revenue?.arpu || 0}`}
                trend="up"
                trendLabel="20%"
              />
              <AnalyticsStatCard
                label="Success Rate"
                value={financialStats.payments?.successRate || 0}
                icon={CheckCircle}
                tone="blue"
                isLoading={isLoading}
                detail={`${financialStats.payments?.successful || 0} successful payments`}
                progress={Number(financialStats.payments?.successRate || 0)}
              />
              <AnalyticsStatCard
                label="Active Subs"
                value={financialStats.subscriptions?.active || 0}
                icon={Zap}
                tone="purple"
                isLoading={isLoading}
                detail={`${((financialStats.subscriptions?.active / (financialStats.subscriptions?.total || 1)) * 100).toFixed(1)}% of total`}
                trend="up"
                trendLabel="5%"
              />
              <AnalyticsStatCard
                label="Avg. Transaction"
                value={financialStats.revenue?.avgTransaction || 0}
                icon={Activity}
                tone="amber"
                isLoading={isLoading}
                detail="Per payment"
              />
            </div>

            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Trend</CardTitle>
                <CardDescription>
                  Revenue generated over the past 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={monthlyRevenueData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorRevenue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#4CAF50"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#4CAF50"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value) => [`LKR ${value.toLocaleString()}`, "Revenue"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#4CAF50"
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          name="Revenue"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods & Subscription Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Distribution of payment methods used
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentMethodData}
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
                            {paymentMethodData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Status</CardTitle>
                  <CardDescription>
                    Current status of all subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Skeleton className="h-full w-full" />
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={subscriptionStatusData}
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
                            <Cell fill="#4CAF50" />
                            <Cell fill="#FFC107" />
                            <Cell fill="#F44336" />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Popular Plans */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Subscription Plans</CardTitle>
                <CardDescription>
                  Most purchased subscription plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={financialStats.popularPlans || []}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) =>
                            name === "revenue"
                              ? [`LKR ${value.toLocaleString()}`, "Revenue"]
                              : [value, "Purchases"]
                          }
                        />
                        <Legend />
                        <Bar dataKey="count" fill="#2196F3" name="Purchases" />
                        <Bar dataKey="revenue" fill="#4CAF50" name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;

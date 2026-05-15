import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

import Layout from "@/components/Layout";

import {
  ProtectedRoute,
  AdminProtectedRoute,
  LandlordProtectedRoute,
} from "@/components/ProtectedRoute";

import { useAuthStore } from "@/store/authStore";
import LoadingSpinner from "@/components/include/LoadingSpinner";

import {
  AuthenticatedUser,
  AuthenticatedAdmin,
  AuthenticatedLandlord,
} from "@/components/AuthenticatedUser";

import PageStatusWrapper from "@/components/include/PageStatusWrapper";

const Home = lazy(() => import("@/pages/Home"));
const Contact = lazy(() => import("@/pages/Contact"));
const AboutUs = lazy(() => import("@/pages/AboutUs"));
const HowItWorks = lazy(() => import("@/pages/HowItWorks"));
const Search = lazy(() => import("@/pages/Search"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const NotFound = lazy(() => import("@/pages/404Page"));
const ListingPage = lazy(() => import("@/components/listing_page/ListingPage"));
const ListingDetailsPage = lazy(() =>
  import("@/components/listingInfo_page/ListingDetailsPage")
);
const UserSignupPage = lazy(() => import("@/pages/(auth)/UserSignupPage"));
const UserSigninPage = lazy(() => import("@/pages/(auth)/UserSigninPage"));
const HouseownerSigninPage = lazy(() =>
  import("@/pages/(auth)/HouseownerSigninPage")
);
const HouseownerSignupPage = lazy(() =>
  import("@/pages/(auth)/HouseownerSignupPage")
);
const PendingHouseowner = lazy(() => import("@/pages/(auth)/PendingHouseowner"));
const UserPreference = lazy(() => import("@/components/signup_pages/UserPreference"));
const AdminLogin = lazy(() => import("@/pages/(auth)/AdminLogin"));
const EmailVerificationPage = lazy(() =>
  import("@/pages/(auth)/EmailVerificationPage")
);
const AdminDashboard = lazy(() => import("@/pages/(AdminDashboard)/AdminDashboard"));
const ManageUsers = lazy(() => import("@/pages/(AdminDashboard)/ManageUsers"));
const ManageListings = lazy(() =>
  import("@/pages/(AdminDashboard)/ManageListings")
);
const AddUniversity = lazy(() => import("@/pages/(AdminDashboard)/AddUniversity"));
const Report = lazy(() => import("@/pages/(AdminDashboard)/Report"));
const Feedback = lazy(() => import("@/pages/(AdminDashboard)/Feedback"));
const HandlePages = lazy(() => import("@/pages/(AdminDashboard)/HandlePages"));
const Analytics = lazy(() => import("@/pages/(AdminDashboard)/Analytics"));
const Payments = lazy(() => import("@/pages/(AdminDashboard)/Payments"));
const StudentDashboard = lazy(() => import("@/pages/(StdDashboard)/StdDashboard"));
const StdSettings = lazy(() => import("@/pages/(StdDashboard)/StdSettings"));
const StdInbox = lazy(() => import("@/pages/(StdDashboard)/StdInbox"));
const StdSchedule = lazy(() => import("@/pages/(StdDashboard)/StdSchedule"));
const StdNotifications = lazy(() =>
  import("@/pages/(StdDashboard)/StdNotifications")
);
const LandlordDashboard = lazy(() =>
  import("@/pages/(LandlordDashboard)/LandlordDashboard")
);
const AddListings = lazy(() => import("@/pages/(LandlordDashboard)/AddListings"));
const LandlordListings = lazy(() =>
  import("@/pages/(LandlordDashboard)/LandlordListings")
);
const LandlordInbox = lazy(() =>
  import("@/pages/(LandlordDashboard)/LandlordInbox")
);
const Pricing = lazy(() => import("@/pages/(LandlordDashboard)/Pricing"));
const LandlordSchedules = lazy(() =>
  import("@/pages/(LandlordDashboard)/LandlordSchedules")
);
const ListingsAnalytics = lazy(() =>
  import("@/pages/(LandlordDashboard)/ListingsAnalytics")
);
const ForgotPasswordPage = lazy(() =>
  import("@/pages/(auth)/ForgotPasswordPage")
);
const ResetPasswordPage = lazy(() => import("@/pages/(auth)/ResetPasswordPage"));
const LandlordForgotPasswordPage = lazy(() =>
  import("@/pages/(auth)/LandlordForgotPasswordPage")
);
const LandlordResetPasswordPage = lazy(() =>
  import("@/pages/(auth)/LandlordResetPasswordPage")
);

function LegacyDashboardRedirect({ type, idParam }) {
  const params = useParams();
  const location = useLocation();
  const rest = params["*"] ? `/${params["*"]}` : "";
  return (
    <Navigate
      replace
      to={`/${type}/${params[idParam]}${rest}${location.search}`}
    />
  );
}

function StudentRoute({ children }) {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <LoadingSpinner
            label="Opening your dashboard"
            detail="Preparing your saved homes, schedules, and messages."
          />
        }
      >
        {children}
      </Suspense>
    </ProtectedRoute>
  );
}

function App() {
  const { isCheckingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <LoadingSpinner
        label="Securing your session"
        detail="Checking your LankaNest account access."
      />
    );
  }

  return (
    <PageStatusWrapper>
      <Suspense
        fallback={
          <LoadingSpinner
            label="Opening LankaNest"
            detail="Loading the page and preparing the latest housing tools."
          />
        }
      >
      <Routes>
        {/* Main pages */}
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />

        <Route
          path="/search"
          element={
            <Layout>
              <Search />
            </Layout>
          }
        />

        <Route
          path="/contact"
          element={
            <Layout>
              <Contact />
            </Layout>
          }
        />

        <Route
          path="/about-us"
          element={
            <Layout>
              <AboutUs />
            </Layout>
          }
        />

        <Route
          path="/how-it-works"
          element={
            <Layout>
              <HowItWorks />
            </Layout>
          }
        />

        <Route path="*" element={<NotFound />} />

        {/* Student Auth */}
        <Route
          path="/auth/user-signup"
          element={
            <AuthenticatedUser>
              <Layout>
                <UserSignupPage />
              </Layout>
            </AuthenticatedUser>
          }
        />

        <Route
          path="/auth/user-signin"
          element={
            <AuthenticatedUser>
              <Layout>
                <UserSigninPage />
              </Layout>
            </AuthenticatedUser>
          }
        />

        <Route
          path="/auth/google/success"
          element={
            <Layout>
              <UserPreference />
            </Layout>
          }
        />

        <Route
          path="/auth/email-verify"
          element={<EmailVerificationPage />}
        />

        {/* Landlord Auth */}
        <Route
          path="/auth/houseowner-signup"
          element={
            <AuthenticatedLandlord>
              <Layout>
                <HouseownerSignupPage />
              </Layout>
            </AuthenticatedLandlord>
          }
        />

        <Route
          path="/auth/verification-pending"
          element={
            <Layout>
              <PendingHouseowner />
            </Layout>
          }
        />

        <Route
          path="/auth/houseowner-signin"
          element={
            <AuthenticatedLandlord>
              <Layout>
                <HouseownerSigninPage />
              </Layout>
            </AuthenticatedLandlord>
          }
        />

        {/* Listings */}
        <Route
          path="/listings"
          element={
            <Layout>
              <ListingPage />
            </Layout>
          }
        />

        <Route
          path="/listing/:listingId"
          element={
            <Layout>
              <ListingDetailsPage />
            </Layout>
          }
        />

        <Route
          path="/privacy-policy"
          element={
            <Layout>
              <PrivacyPolicy />
            </Layout>
          }
        />

        {/* Student Dashboard */}
        <Route
          path="/student/:userId/:email/*"
          element={<LegacyDashboardRedirect type="student" idParam="userId" />}
        />
        <Route
          path="/student/:userId"
          element={
            <StudentRoute>
              <StudentDashboard />
            </StudentRoute>
          }
        />

        <Route
          path="/student/:userId/settings"
          element={
            <StudentRoute>
              <StdSettings />
            </StudentRoute>
          }
        />

        <Route
          path="/student/:userId/inbox"
          element={
            <StudentRoute>
              <StdInbox />
            </StudentRoute>
          }
        />

        <Route
          path="/student/:userId/schedule"
          element={
            <StudentRoute>
              <StdSchedule />
            </StudentRoute>
          }
        />

        <Route
          path="/student/:userId/notifications"
          element={
            <StudentRoute>
              <StdNotifications />
            </StudentRoute>
          }
        />

        {/* Landlord Dashboard */}
        <Route
          path="/landlord/:landlordId/:email/*"
          element={<LegacyDashboardRedirect type="landlord" idParam="landlordId" />}
        />
        <Route
          path="/landlord/:landlordId"
          element={
            <LandlordProtectedRoute>
              <LandlordDashboard />
            </LandlordProtectedRoute>
          }
        />

        <Route
          path="/landlord/:landlordId/add-listings"
          element={
            <LandlordProtectedRoute>
              <AddListings />
            </LandlordProtectedRoute>
          }
        />

        <Route
          path="/landlord/:landlordId/my-listings"
          element={
            <LandlordProtectedRoute>
              <LandlordListings />
            </LandlordProtectedRoute>
          }
        />

        <Route
          path="/landlord/:landlordId/inbox"
          element={
            <LandlordProtectedRoute>
              <LandlordInbox />
            </LandlordProtectedRoute>
          }
        />

        <Route
          path="/landlord/:landlordId/schedule"
          element={
            <LandlordProtectedRoute>
              <LandlordSchedules />
            </LandlordProtectedRoute>
          }
        />

        <Route
          path="/landlord/:landlordId/pricing"
          element={
            <LandlordProtectedRoute>
              <Pricing />
            </LandlordProtectedRoute>
          }
        />

        <Route
          path="/landlord/:landlordId/my-listings/:listingId"
          element={
            <LandlordProtectedRoute>
              <ListingsAnalytics />
            </LandlordProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/auth/lankanest-admin"
          element={
            <AuthenticatedAdmin>
              <AdminLogin />
            </AuthenticatedAdmin>
          }
        />

        <Route
          path="/admin/:adminId/:email/*"
          element={<LegacyDashboardRedirect type="admin" idParam="adminId" />}
        />
        <Route
          path="/admin/:adminId"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/:adminId/users"
          element={
            <AdminProtectedRoute>
              <ManageUsers />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/:adminId/listings"
          element={
            <AdminProtectedRoute>
              <ManageListings />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/:adminId/add-university"
          element={
            <AdminProtectedRoute>
              <AddUniversity />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/:adminId/analytics"
          element={
            <AdminProtectedRoute>
              <Analytics />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/:adminId/payments"
          element={
            <AdminProtectedRoute>
              <Payments />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/:adminId/reports"
          element={
            <AdminProtectedRoute>
              <Report />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/:adminId/feedbacks"
          element={
            <AdminProtectedRoute>
              <Feedback />
            </AdminProtectedRoute>
          }
        />

        <Route
          path="/admin/:adminId/handle-pages"
          element={
            <AdminProtectedRoute>
              <HandlePages />
            </AdminProtectedRoute>
          }
        />

        {/* Password Reset */}
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/auth/landlord-forgot-password"
          element={<LandlordForgotPasswordPage />}
        />
        <Route
          path="/auth/landlord-reset-password"
          element={<LandlordResetPasswordPage />}
        />
      </Routes>
      </Suspense>
    </PageStatusWrapper>
  );
}

export default App;

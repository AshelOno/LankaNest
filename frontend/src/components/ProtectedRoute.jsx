import { useAdminAuthStore } from '@/store/adminAuthStore';
import { useAuthStore } from '@/store/authStore';
import React, { lazy, Suspense, useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from './include/LoadingSpinner';
import { useLandlordAuthStore } from '@/store/landlordAuthStore';

const NotFound = lazy(() => import('@/pages/404Page'));

const NotFoundFallback = () => (
    <Suspense
        fallback={
            <LoadingSpinner
                label="Opening fallback page"
                detail="Preparing the requested page state."
            />
        }
    >
        <NotFound />
    </Suspense>
);

export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, user } = useAuthStore();
    const { userId, email } = useParams();

    // Validate URL parameters
    const isValidUrl = () => {
        if (!userId) return false;
        if (user && user._id !== userId) return false;

        if (!email) {
            return true;
        }

        if (user && user.email !== email) return false;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    if (!isAuthenticated) {
        return <Navigate to="/auth/user-signin" />;
    }

    if (!isValidUrl()) {
        return <NotFoundFallback />;
    }

    return children;
};

export const LandlordProtectedRoute = ({ children }) => {
    const { isLandlordAuthenticated, landlord, checkLandlordAuth, isCheckingLandlordAuth } = useLandlordAuthStore();
    const { landlordId, email } = useParams();

    useEffect(() => {
        if (!isLandlordAuthenticated) {
            checkLandlordAuth();
        }
    }, [checkLandlordAuth, isLandlordAuthenticated]);

    if (isCheckingLandlordAuth) {
        return (
            <LoadingSpinner
                label="Checking owner access"
                detail="Verifying your property dashboard session."
            />
        );
    }

    if (!isLandlordAuthenticated || !landlord?._id) {
        return <Navigate to="/auth/houseowner-signin" replace />;
    }

    const isValidUrl = () => {
        if (!landlord?._id) return false;
        if (landlord && landlord._id !== landlordId) return false;

        if (!email) {
            return true;
        }

        if (landlord && landlord.email !== email) return false;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    if (!isValidUrl()) {
        return <NotFoundFallback />;
    }

    return children;
};

export const AdminProtectedRoute = ({ children }) => {
    const { isCheckingAdminAuth, isAdminAuthenticated, checkAdminAuth } = useAdminAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const verifyAuth = async () => {
            const isAuthenticated = await checkAdminAuth();
            if (!isAuthenticated) {
                navigate('/auth/lankanest-admin');
            }
        };

        verifyAuth();
    }, [checkAdminAuth, navigate]);

    if (isCheckingAdminAuth) {
        return (
            <LoadingSpinner
                label="Checking admin access"
                detail="Verifying secure LankaNest admin access."
            />
        );
    }

    if (!isAdminAuthenticated) {
        return <Navigate to="/auth/lankanest-admin" replace />;
    }

    return children;
};

import React from 'react';
import { usePageStatus } from '../../hooks/usePageStatus';
import MaintenancePage from './MaintenancePage';
import LoadingSpinner from './LoadingSpinner';
import { useLocation } from 'react-router-dom';

// Routes that should bypass maintenance checks (admin routes and auth routes)
const BYPASS_ROUTES = [
    '/admin',
    '/auth/lankanest-admin'
];

const PageStatusWrapper = ({ children }) => {
    const { isMaintenance, loading } = usePageStatus();
    const location = useLocation();
    const currentPath = location.pathname;

    // Check if current path should bypass maintenance mode
    const shouldBypass = BYPASS_ROUTES.some(route => currentPath.startsWith(route));

    if (loading) {
        return (
            <LoadingSpinner
                label="Checking page availability"
                detail="Making sure this LankaNest page is ready to open."
            />
        );
    }

    if (isMaintenance && !shouldBypass) {
        // Extract page name from path for better display
        const pageName = currentPath === '/'
            ? 'Home'
            : currentPath.split('/').filter(Boolean).pop()?.replace(/-/g, ' ');

        return <MaintenancePage pageName={pageName} />;
    }

    return children;
};

export default PageStatusWrapper;

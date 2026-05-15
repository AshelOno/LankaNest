import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { getApiUrl } from "@/services/http";

const API_URL = getApiUrl("/api/page-status");

export const usePageStatus = () => {
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const checkPageStatus = async () => {
            try {
                setLoading(true);
                const response = await axios.get(API_URL);

                if (response.data.success) {
                    const pages = response.data.data;

                    let currentPage = pages.find(page => page.path === location.pathname);

                    // If no exact match, check for base path match (for dynamic routes)
                    if (!currentPage) {
                        // Extract base paths like /student, /landlord, etc.
                        const pathParts = location.pathname.split('/').filter(Boolean);
                        if (pathParts.length > 0) {
                            const basePath = `/${pathParts[0]}`;
                            currentPage = pages.find(page => page.path === basePath);
                        }
                    }

                    setIsMaintenance(currentPage && !currentPage.isOnline);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error checking page status:', error);
                setError(error);
                setLoading(false);
            }
        };

        checkPageStatus();
    }, [location.pathname]);

    return { isMaintenance, loading, error };
};

import React from 'react';
import { useNavigate } from 'react-router-dom';

const MaintenancePage = ({ pageName }) => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center p-8 max-w-md">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 shadow-lg">
                    <div className="text-6xl text-blue-500 mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-700 mb-4">Page Under Maintenance</h1>
                    <p className="text-gray-600 mb-6">
                        We're sorry, but the {pageName || 'requested'} page is currently under maintenance.
                        Our team is working to bring it back online as soon as possible.
                    </p>
                    <div className="flex flex-col md:flex-row justify-center space-y-2 md:space-y-0 md:space-x-4">
                        <button
                            onClick={() => navigate('/')}
                            className="bg-primaryBgColor hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                        >
                            Return Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenancePage;
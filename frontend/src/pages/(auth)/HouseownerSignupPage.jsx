import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notification } from 'antd';
import HouseownerSignup1 from '@/components/signup_pages/HouseownerSignup1';
import HouseownerSignup2 from '@/components/signup_pages/HouseownerSignup2';
import { useLandlordAuthStore } from '@/store/landlordAuthStore';

const HouseownerSignupPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({});
    
    const { landlordSignupStep1, landlordSignupStep2, isLoading } = useLandlordAuthStore();

    const handleFirstStepSubmit = async (values) => {
        try {
            const response = await landlordSignupStep1(values);
            setFormData((prevData) => ({
                ...prevData,
                ...values,
                userId: response.userId,
                token: response.token
            }));
            notification.success({
                message: 'First step completed',
                description: 'Please complete your profile verification.',
            });
            setStep(2);
        } catch (error) {
            notification.error({
                message: 'Registration Failed',
                description: error.response?.data?.message || 'Something went wrong',
            });
        }
    };

    const handleSecondStepSubmit = async (values) => {
        try {
            if (!formData.userId) {
                notification.error({
                    message: 'Error',
                    description: 'Missing user ID. Please complete step 1 first.',
                });
                return;
            }

            // Ensure values is properly formatted as FormData
            const formDataToSubmit = values instanceof FormData ? values : new FormData();
            if (!(values instanceof FormData)) {
                Object.keys(values).forEach(key => {
                    formDataToSubmit.append(key, values[key]);
                });
            }

            await landlordSignupStep2(formData.userId, formDataToSubmit);
            notification.success({
                message: 'Registration Successful',
                description: 'Your account is pending verification.',
            });
            navigate('/auth/verification-pending');
        } catch (error) {
            notification.error({
                message: 'Profile Completion Failed',
                description: error.message || 'Something went wrong',
            });
        }
    };

    useEffect(() => {
        document.title = "LankaNest | House Owner Signup";
    }, []);

    return (
        <div>
            {step === 1 && (
                <HouseownerSignup1 
                    onFinish={handleFirstStepSubmit} 
                    loading={isLoading} 
                />
            )}
            {step === 2 && (
                <HouseownerSignup2 
                    onFinish={handleSecondStepSubmit} 
                    loading={isLoading} 
                />
            )}
        </div>
    );
};

export default HouseownerSignupPage;
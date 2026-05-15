import { Form, Input, notification, Select, Modal, InputNumber, Space, Tag } from 'antd';
import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button';
import axios from 'axios';
import { API_URL } from "@/services/http";

const { Option } = Select;

const UserPreference = ({ isVisible, onClose, userId }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [areaInput, setAreaInput] = useState('');
    const [preferredAreas, setPreferredAreas] = useState([]);
    const greenThemeColor = "#0F65D8";

    const onFinishFailed = (errorInfo) => {
        console.log("Failed:", errorInfo);
    };

    const openNotification = (type, message, description) => {
        notification[type]({
            message: message,
            description: description,
        });
    };

    const handleAreaInputChange = (e) => {
        setAreaInput(e.target.value);
    };

    const handleAreaInputPressEnter = () => {
        if (areaInput && !preferredAreas.includes(areaInput)) {
            const newAreas = [...preferredAreas, areaInput];
            setPreferredAreas(newAreas);
            form.setFieldsValue({ preferredAreas: newAreas });
            setAreaInput('');
        }
    };

    const handleAreaClose = (removedArea) => {
        const newAreas = preferredAreas.filter(area => area !== removedArea);
        setPreferredAreas(newAreas);
        form.setFieldsValue({ preferredAreas: newAreas });
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const finalUserId = userId || localStorage.getItem("userId");

            // Format price range for backend
            const formattedValues = {
                ...values,
                priceRange: {
                    min: values.minPrice || 0,
                    max: values.maxPrice || 100000
                },
                userId: finalUserId // Include userId in body as fallback
            };

            // Remove temporary form fields that don't match backend schema
            delete formattedValues.minPrice;
            delete formattedValues.maxPrice;

            // Use the new preference endpoint with userId in body as fallback
            await axios.post(`${API_URL}/preferences/save`, formattedValues, {
                withCredentials: true,
            });

            openNotification(
                "success",
                "Preferences Saved",
                "Your preferences have been saved successfully!"
            );

            // Set localStorage to prevent showing the modal again
            localStorage.setItem("hasCompletedPreferences", "true");
            
            if (onClose) onClose(values);
        } catch (error) {
            console.error("Profile completion error:", error);
            openNotification(
                "error",
                "Saving Failed",
                error.response?.data?.message || "Something went wrong"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Complete Your Profile"
            open={isVisible}
            onCancel={() => onClose && onClose()}
            footer={null}
            closable={true}
            maskClosable={true}
            width="90%"
            style={{ maxWidth: '600px' }}
            centered
        >
            <div className="p-2 md:p-4">
                <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">Student Details</h2>
                <Form
                    form={form}
                    name="studentDetails"
                    onFinish={handleSubmit}
                    onFinishFailed={onFinishFailed}
                    layout="vertical"
                    initialValues={{ 
                        preferredPropertyType: 'Any',
                        genderPreference: 'mixed',
                        preferredAreas: []
                    }}
                >
                    <Form.Item
                        label="Which university are you looking for?"
                        name="university"
                        rules={[
                            { required: true, message: "Please enter your university name" },
                        ]}
                    >
                        <Input
                            style={{
                                borderColor: greenThemeColor,
                                borderWidth: "1px",
                            }}
                            placeholder="Enter your university name"
                        />
                    </Form.Item>
                    
                    <Form.Item
                        label="What type of property are you looking for?"
                        name="preferredPropertyType"
                        rules={[
                            { required: true, message: "Please select a property type" },
                        ]}
                    >
                        <Select
                            placeholder="Select property type"
                            style={{ borderColor: greenThemeColor }}
                        >
                            <Option value="Any">Any Property Type</Option>
                            <Option value="Apartment">Apartment</Option>
                            <Option value="Boarding House">Boarding House</Option>
                            <Option value="Shared Room">Shared Room</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Gender Preference (Boarding/Shared)"
                        name="genderPreference"
                        rules={[
                            { required: true, message: "Please select a gender preference" },
                        ]}
                    >
                        <Select
                            placeholder="Select gender preference"
                            style={{ borderColor: greenThemeColor }}
                        >
                            <Option value="mixed">Any / Mixed</Option>
                            <Option value="boys">Boys Only</Option>
                            <Option value="girls">Girls Only</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="What areas are you looking for?"
                        name="preferredAreas"
                        rules={[
                            { 
                                type: 'array', 
                                validator: (_, value) => {
                                    if (value && value.length > 0) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Please add at least one area'));
                                } 
                            },
                        ]}
                    >
                        <div>
                            <div className="flex flex-col md:flex-row mb-2 gap-2">
                                <Input
                                    placeholder="Type an area and press Enter"
                                    value={areaInput}
                                    onChange={handleAreaInputChange}
                                    onPressEnter={handleAreaInputPressEnter}
                                    style={{ borderColor: greenThemeColor }}
                                    className="flex-grow"
                                />
                                <Button 
                                    className="bg-primaryBgColor text-white px-2 py-1 rounded" 
                                    onClick={handleAreaInputPressEnter}
                                    type="button"
                                >
                                    Add
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {preferredAreas.map((area, index) => (
                                    <Tag 
                                        key={index} 
                                        closable 
                                        onClose={() => handleAreaClose(area)}
                                        className="bg-blue-100 text-blue-800 border-blue-300 py-1"
                                    >
                                        {area}
                                    </Tag>
                                ))}
                            </div>
                        </div>
                    </Form.Item>

                    <div className="flex flex-col md:flex-row gap-4">
                        <Form.Item
                            label="Minimum Price (Rs)"
                            name="minPrice"
                            className="w-full md:w-1/2"
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                min={0}
                                step={1000}
                                formatter={value => `Rs ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/[^\d]/g, '')}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Maximum Price (Rs)"
                            name="maxPrice"
                            className="w-full md:w-1/2"
                        >
                            <InputNumber
                                style={{ width: '100%' }}
                                min={0}
                                step={1000}
                                formatter={value => `Rs ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                parser={value => value.replace(/[^\d]/g, '')}
                            />
                        </Form.Item>
                    </div>
                    
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                            type="button"
                            className="w-full rounded-lg border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                            onClick={() => onClose && onClose()}
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            className="w-full rounded-lg bg-primaryBgColor px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save Preferences"}
                        </Button>
                    </div>
                </Form>
            </div>
        </Modal>
    );
}

export default UserPreference

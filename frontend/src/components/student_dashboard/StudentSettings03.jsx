import { useEffect, useState } from "react";
import { Card, Form, Input, Select, InputNumber, notification, Tag } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import { Button } from "../ui/button";
import { api } from "@/services/http";
import { InlineLoader } from "@/components/include/LoadingSpinner";

const { Option } = Select;

const StudentSettings03 = () => {
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [areaInput, setAreaInput] = useState("");
  const [preferredAreas, setPreferredAreas] = useState([]);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await api.get("/preferences");
        if (response.data?.success && response.data?.data) {
          const prefs = response.data.data;
          form.setFieldsValue({
            university: prefs.university,
            preferredPropertyType: prefs.preferredPropertyType || "Any",
            genderPreference: prefs.genderPreference || "mixed",
            minPrice: prefs.priceRange?.min || 0,
            maxPrice: prefs.priceRange?.max || 100000,
            preferredAreas: prefs.preferredAreas || [],
          });
          setPreferredAreas(prefs.preferredAreas || []);
        }
      } catch (error) {
        console.error("Error fetching preferences:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPreferences();
  }, [form]);

  const handleAreaInputChange = (e) => {
    setAreaInput(e.target.value);
  };

  const handleAreaInputPressEnter = () => {
    if (areaInput && !preferredAreas.includes(areaInput)) {
      const newAreas = [...preferredAreas, areaInput];
      setPreferredAreas(newAreas);
      form.setFieldsValue({ preferredAreas: newAreas });
      setAreaInput("");
    }
  };

  const handleAreaClose = (removedArea) => {
    const newAreas = preferredAreas.filter((area) => area !== removedArea);
    setPreferredAreas(newAreas);
    form.setFieldsValue({ preferredAreas: newAreas });
  };

  const handleSubmit = async (values) => {
    try {
      setIsSaving(true);
      
      const formattedValues = {
        university: values.university,
        preferredPropertyType: values.preferredPropertyType,
        genderPreference: values.genderPreference,
        preferredAreas: values.preferredAreas,
        priceRange: {
            min: values.minPrice || 0,
            max: values.maxPrice || 100000
        }
      };

      await api.post("/preferences/save", formattedValues);
      
      notification.success({
        message: "Preferences updated",
        description: "Your student housing preferences were saved successfully.",
      });
    } catch (error) {
      notification.error({
        message: "Update failed",
        description: error?.response?.data?.message || "Could not update your preferences.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <InlineLoader
        label="Loading preferences"
        detail="Getting your saved housing preferences ready."
      />
    );
  }

  return (
    <Card className="rounded-lg border border-slate-200 shadow-sm" styles={{ body: { padding: 24 } }}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          <FilterOutlined className="text-lg" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Student Preferences</h1>
          <p className="text-sm text-slate-500">Update what you are looking for so we can match you better.</p>
        </div>
      </div>

      <Form form={form} name="student_preferences" onFinish={handleSubmit} layout="vertical">
        <div className="grid gap-6 md:grid-cols-2">
            <Form.Item
            label="Which university are you looking for?"
            name="university"
            rules={[{ required: true, message: "Please enter your university name" }]}
            className="mb-0"
            >
            <Input placeholder="University name" className="h-11 rounded-lg border-slate-200 focus:border-blue-500 hover:border-blue-300" />
            </Form.Item>

            <Form.Item
            label="Property Type"
            name="preferredPropertyType"
            className="mb-0"
            >
            <Select className="h-11 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selector]:!h-11 [&_.ant-select-selection-item]:leading-[2.5rem]">
                <Option value="Any">Any Property Type</Option>
                <Option value="Apartment">Apartment</Option>
                <Option value="Boarding House">Boarding House</Option>
                <Option value="Shared Room">Shared Room</Option>
            </Select>
            </Form.Item>

            <Form.Item
            label="Gender Preference"
            name="genderPreference"
            className="mb-0 md:col-span-2"
            >
            <Select className="h-11 [&_.ant-select-selector]:rounded-lg [&_.ant-select-selector]:border-slate-200 [&_.ant-select-selector]:!h-11 [&_.ant-select-selection-item]:leading-[2.5rem]">
                <Option value="mixed">Any / Mixed</Option>
                <Option value="boys">Boys Only</Option>
                <Option value="girls">Girls Only</Option>
            </Select>
            </Form.Item>

            <Form.Item
            label="Areas"
            name="preferredAreas"
            className="mb-0 md:col-span-2"
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
                        className="h-11 rounded-lg border-slate-200 focus:border-blue-500 hover:border-blue-300"
                    />
                    <Button 
                        type="button"
                        onClick={handleAreaInputPressEnter}
                        className="h-11 rounded-lg bg-blue-700 px-6 font-semibold text-white hover:bg-blue-800"
                    >
                        Add
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                    {preferredAreas.map((area, index) => (
                        <Tag 
                            key={index} 
                            closable 
                            onClose={() => handleAreaClose(area)}
                            className="rounded-lg border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700"
                        >
                            {area}
                        </Tag>
                    ))}
                </div>
            </div>
            </Form.Item>

            <Form.Item
            label="Min Price (Rs)"
            name="minPrice"
            className="mb-0"
            >
            <InputNumber
                className="h-11 w-full rounded-lg border-slate-200 focus:border-blue-500 hover:border-blue-300 [&_input]:h-11"
                min={0}
                step={1000}
                formatter={value => `Rs ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/[^\d]/g, '')}
            />
            </Form.Item>

            <Form.Item
            label="Max Price (Rs)"
            name="maxPrice"
            className="mb-0"
            >
            <InputNumber
                className="h-11 w-full rounded-lg border-slate-200 focus:border-blue-500 hover:border-blue-300 [&_input]:h-11"
                min={0}
                step={1000}
                formatter={value => `Rs ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/[^\d]/g, '')}
            />
            </Form.Item>
        </div>

        <div className="mt-8">
            <Button type="submit" disabled={isSaving} className="h-11 rounded-lg bg-blue-700 px-6 font-semibold text-white hover:bg-blue-800">
            {isSaving ? "Saving..." : "Update Preferences"}
            </Button>
        </div>
      </Form>
    </Card>
  );
};

export default StudentSettings03;

import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Form, Input, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import {
  FiHome,
  FiMapPin,
  FiCreditCard,
  FiArrowRight,
} from "react-icons/fi";
import { Loader } from "lucide-react";

const HouseownerSignup2 = ({ onFinish, loading }) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleFinish = async (values) => {
    const formData = new FormData();

    formData.append("residentialAddress", values.residentialAddress);
    formData.append("nationalIdCardNumber", values.nationalIdCardNumber);

    if (fileList[0]?.originFileObj) {
      formData.append("nicDocument", fileList[0].originFileObj);
    }

    onFinish(formData);
  };

  return (
    <div className="ln-page-surface flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/70">
        <div className="grid lg:grid-cols-2">
          <div className="hidden flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium">
                <FiHome className="text-base" />
                Houseowner verification
              </div>

              <h1 className="mt-8 text-3xl font-bold leading-tight">
                Verify your property owner account.
              </h1>

              <p className="mt-4 text-white/75 leading-7">
                Add your address, NIC number, and upload the NIC document to
                continue the registration process securely.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-white/10 p-4">
                Secure document upload
              </div>
              <div className="rounded-lg bg-white/10 p-4">
                Fast verification process
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">
                Please verify yourself
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Complete these details to continue.
              </p>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleFinish}
              requiredMark={false}
            >
              <Form.Item
                label={<span className="text-slate-600 font-medium">Residential Address</span>}
                name="residentialAddress"
                rules={[{ required: true, message: "Enter address!" }]}
              >
                <Input
                  size="large"
                  prefix={<FiMapPin className="text-slate-400" />}
                  placeholder="Enter residential address"
                  className="!rounded-lg !px-4 !py-3 border-slate-200 shadow-sm"
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-600 font-medium">NIC Number</span>}
                name="nationalIdCardNumber"
                rules={[{ required: true, message: "Enter NIC!" }]}
                extra={
                  <span className="text-xs text-slate-400">
                    Enter the NIC exactly as shown on your document.
                  </span>
                }
              >
                <Input
                  size="large"
                  prefix={<FiCreditCard className="text-slate-400" />}
                  placeholder="Enter NIC number"
                  className="!rounded-lg !px-4 !py-3 border-slate-200 shadow-sm"
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-slate-600 font-medium">NIC Document</span>}
                name="nicDocument"
                rules={[{ required: true, message: "Upload NIC document!" }]}
                extra={
                  <span className="text-xs text-slate-400">
                    Upload a clear PDF copy of your NIC document.
                  </span>
                }
              >
                <Upload.Dragger
                  accept=".pdf"
                  beforeUpload={() => false}
                  fileList={fileList}
                  onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                  onRemove={() => setFileList([])}
                  maxCount={1}
                  className="!rounded-lg !border-dashed !border-slate-300 bg-slate-50 transition hover:!border-[#0F65D8]"
                >
                  <p className="ant-upload-drag-icon text-[#0F65D8]">
                    <InboxOutlined />
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    Click or drag PDF file here
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PDF only, one file maximum
                  </p>
                </Upload.Dragger>
              </Form.Item>

              <Form.Item className="!mb-0">
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F65D8] px-4 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[#08365f] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <Loader className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Continue
                      <FiArrowRight className="transition group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

HouseownerSignup2.propTypes = {
  onFinish: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default HouseownerSignup2;

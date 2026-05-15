import React from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { Form, Input } from "antd";
import { Loader } from "lucide-react";
import {
  FiMail,
  FiUser,
  FiPhone,
  FiLock,
  FiArrowRight,
  FiHome,
} from "react-icons/fi";

const HouseownerSignup1 = ({ onFinish, loading }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  return (
    <div className="ln-page-surface relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="hidden" />
      <div className="hidden" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-200/70 lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-slate-950 p-10 text-white lg:flex xl:p-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
              <FiHome className="text-lg" />
              Houseowner signup
            </div>

            <h1 className="mt-8 text-3xl font-bold leading-tight xl:text-4xl">
              Create your property owner account.
            </h1>

            <p className="mt-5 max-w-md text-white/75 text-base leading-7">
              Start managing your listings, connect with tenants, and continue
              the onboarding process in a clean and secure flow.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              Fast account creation
            </div>
            <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
              Built for property owners
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10 xl:p-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Create account
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Sign up as a house owner.
              </p>
            </div>

            <button
              onClick={() => navigate("/auth/houseowner-signin")}
              className="text-sm font-semibold text-[#0F65D8] hover:text-[#06345d] transition"
            >
              Login
            </button>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="mt-8 space-y-1"
          >
            <Form.Item
              label={<span className="text-slate-600 font-medium">Email Address</span>}
              name="email"
              rules={[
                { required: true, message: "Enter your email" },
                { type: "email", message: "Enter a valid email" },
              ]}
            >
              <Input
                size="large"
                placeholder="example@email.com"
                prefix={<FiMail className="text-slate-400" />}
                className="!rounded-lg !px-4 !py-3 border-slate-200 shadow-sm"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-slate-600 font-medium">Username</span>}
              name="username"
              rules={[{ required: true, message: "Enter username" }]}
            >
              <Input
                size="large"
                placeholder="Enter your username"
                prefix={<FiUser className="text-slate-400" />}
                className="!rounded-lg !px-4 !py-3 border-slate-200 shadow-sm"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-slate-600 font-medium">Phone Number</span>}
              name="phone"
              rules={[{ required: true, message: "Enter phone number" }]}
            >
              <Input
                size="large"
                placeholder="+94 77 123 4567"
                prefix={<FiPhone className="text-slate-400" />}
                className="!rounded-lg !px-4 !py-3 border-slate-200 shadow-sm"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-slate-600 font-medium">Password</span>}
              name="password"
              rules={[
                { required: true, message: "Enter password" },
                { min: 8, message: "Minimum 8 characters" },
              ]}
            >
              <Input.Password
                size="large"
                placeholder="Create password"
                prefix={<FiLock className="text-slate-400" />}
                className="!rounded-lg !px-4 !py-3 border-slate-200 shadow-sm"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-slate-600 font-medium">Confirm Password</span>}
              name="confirm"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Confirm password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                size="large"
                placeholder="Re-enter password"
                prefix={<FiLock className="text-slate-400" />}
                className="!rounded-lg !px-4 !py-3 border-slate-200 shadow-sm"
              />
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
                    Create Account
                    <FiArrowRight className="transition group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

HouseownerSignup1.propTypes = {
  onFinish: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

export default HouseownerSignup1;

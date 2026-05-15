import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, notification } from "antd";
import { FiLock, FiMail } from "react-icons/fi";
import { Building2, Loader2, LogIn } from "lucide-react";
import { useLandlordAuthStore } from "@/store/landlordAuthStore";
import { FormShell } from "@/components/ui/page-shell";

const HouseownerSigninPage = () => {
  const navigate = useNavigate();
  const { landlordSignin, isLoading } = useLandlordAuthStore();

  useEffect(() => {
    document.title = "LankaNest | House Owner Login";
  }, []);

  const handleLoginSubmit = async (values) => {
    try {
      const response = await landlordSignin({
        email: values.email,
        password: values.password,
      });

      if (response?.error && response?.isFlagged) {
        notification.error({
          message: "Account suspended",
          description: response.message || "Your account has been suspended. Please contact support.",
          duration: 0,
        });
        return;
      }

      if (!response?.success) {
        notification.error({
          message: "Login failed",
          description: response?.message || "Invalid credentials",
          duration: 3,
        });
        return;
      }

      const landlordData = response.landlord;
      navigate(
        landlordData?.isVerified
          ? `/landlord/${landlordData._id}`
          : "/auth/verification-pending"
      );
    } catch (error) {
      notification.error({
        message: "Login failed",
        description: error?.response?.data?.message || "Invalid credentials",
        duration: 3,
      });
    }
  };

  return (
    <FormShell
      title="Owner login"
      description="Manage listings, booking requests, messages, and pricing from your dashboard."
      footer={
        <>
          Do not have an owner account?{" "}
          <button
            type="button"
            onClick={() => navigate("/auth/houseowner-signup")}
            className="font-semibold text-blue-700 hover:text-blue-900"
          >
            Sign up
          </button>
        </>
      }
    >
      <div className="mb-5 rounded-2xl bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800 ring-1 ring-blue-100">
        <div className="flex items-start gap-3">
          <Building2 className="mt-0.5 h-4 w-4" />
          <span>Use your verified owner account to keep student housing details accurate.</span>
        </div>
      </div>

      <Form layout="vertical" onFinish={handleLoginSubmit} requiredMark={false}>
        <Form.Item
          label={<span className="font-semibold text-slate-700">Email address</span>}
          name="email"
          rules={[
            { required: true, message: "Please enter your email." },
            { type: "email", message: "Enter a valid email." },
          ]}
        >
          <Input prefix={<FiMail className="text-slate-400" />} placeholder="owner@example.com" size="large" className="rounded-2xl" />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-slate-700">Password</span>}
          name="password"
          rules={[
            { required: true, message: "Please enter your password." },
            { min: 6, message: "Password must be at least 6 characters." },
          ]}
        >
          <Input.Password prefix={<FiLock className="text-slate-400" />} placeholder="Enter your password" size="large" className="rounded-2xl" />
        </Form.Item>

        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/auth/landlord-forgot-password")}
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={isLoading} className="ln-primary-btn w-full py-3">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </Form>
    </FormShell>
  );
};

export default HouseownerSigninPage;

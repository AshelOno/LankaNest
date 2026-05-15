import { Form, Input, Checkbox, notification } from "antd";
import { FcGoogle } from "react-icons/fc";
import { FiLock, FiMail, FiUser } from "react-icons/fi";
import { Loader2, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { FormShell } from "@/components/ui/page-shell";
import { API_BASE_URL } from "@/services/http";

const UserSignupPage = () => {
  const [form] = Form.useForm();
  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      await signup(values.email, values.password, values.username);

      notification.success({
        message: "Registration successful",
        description: "Your account has been created successfully.",
      });

      navigate("/auth/email-verify");
    } catch (error) {
      notification.error({
        message: "Registration failed",
        description: error?.response?.data?.message || "Something went wrong",
      });
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <FormShell
      title="Create your account"
      description="Join LankaNest and start building a smarter housing shortlist."
      className="max-w-lg"
      footer={
        <>
          Already have an account?{" "}
          <button
            type="button"
            className="font-semibold text-blue-700 hover:text-blue-900"
            onClick={() => navigate("/auth/user-signin")}
          >
            Sign in
          </button>
        </>
      }
    >
      <button type="button" onClick={handleGoogleSignIn} className="ln-secondary-btn w-full py-3">
        <FcGoogle className="text-xl" />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <Form
        form={form}
        name="register"
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Form.Item
          label={<span className="font-semibold text-slate-700">Email address</span>}
          name="email"
          rules={[
            { required: true, message: "Please input your email." },
            { type: "email", message: "Please enter a valid email." },
          ]}
        >
          <Input size="large" placeholder="name@example.com" prefix={<FiMail className="text-slate-400" />} className="rounded-lg" />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-slate-700">Username</span>}
          name="username"
          rules={[
            { required: true, message: "Please input your username." },
            { min: 3, message: "Username must be at least 3 characters." },
          ]}
        >
          <Input size="large" placeholder="Choose a username" prefix={<FiUser className="text-slate-400" />} className="rounded-lg" />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-slate-700">Password</span>}
          name="password"
          rules={[
            { required: true, message: "Please input your password." },
            { min: 8, message: "Password must be at least 8 characters long." },
          ]}
        >
          <Input.Password size="large" placeholder="Create a password" prefix={<FiLock className="text-slate-400" />} className="rounded-lg" />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-slate-700">Confirm password</span>}
          name="confirmPassword"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Please confirm your password." },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) return Promise.resolve();
                return Promise.reject(new Error("Passwords do not match."));
              },
            }),
          ]}
        >
          <Input.Password size="large" placeholder="Re-enter password" prefix={<FiLock className="text-slate-400" />} className="rounded-lg" />
        </Form.Item>

        <Form.Item
          name="agreement"
          valuePropName="checked"
          rules={[
            {
              validator: (_, value) =>
                value
                  ? Promise.resolve()
                  : Promise.reject(new Error("You must accept the terms and privacy policy.")),
            },
          ]}
        >
          <Checkbox className="text-sm text-slate-600">
            I agree to the{" "}
            <button
              type="button"
              onClick={() => navigate("/privacy-policy")}
              className="font-semibold text-blue-700 hover:text-blue-900"
            >
              Terms & Privacy Policy
            </button>
          </Checkbox>
        </Form.Item>

        <button type="submit" disabled={isLoading} className="ln-primary-btn w-full py-3">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {isLoading ? "Creating account..." : "Create account"}
        </button>
      </Form>
    </FormShell>
  );
};

export default UserSignupPage;

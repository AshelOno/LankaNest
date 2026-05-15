import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { notification } from "antd";
import { useAuthStore } from "@/store/authStore";
import { FormShell } from "@/components/ui/page-shell";
import { API_BASE_URL } from "@/services/http";

function UserSigninPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loginErrors, setLoginErrors] = useState({});
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();

  useEffect(() => {
    document.title = "LankaNest | User Login";
  }, []);

  const validateLogin = () => {
    const errors = {};
    if (!loginData.email || !loginData.email.includes("@")) errors.email = "Enter a valid email";
    if (!loginData.password || loginData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    setLoginErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    try {
      const userResponse = await login(loginData.email, loginData.password);

      if (userResponse?.error || userResponse?.success === false) {
        notification.error({
          message: "Login failed",
          description: userResponse.message || "Invalid credentials",
        });
        return;
      }

      notification.success({ message: "Login successful" });
      const redirectAfterLogin = localStorage.getItem("redirectAfterLogin");
      localStorage.removeItem("redirectAfterLogin");

      navigate(
        redirectAfterLogin ||
          userResponse.redirectPath ||
          `/student/${userResponse?.user?._id}`
      );
    } catch (error) {
      notification.error({
        message: "Login failed",
        description: error?.response?.data?.message || "Something went wrong",
      });
    }
  };

  return (
    <FormShell
      title="Welcome back"
      description="Sign in to continue finding and managing student housing."
      footer={
        <>
          Do not have an account?{" "}
          <button
            type="button"
            className="font-semibold text-blue-700 hover:text-blue-900"
            onClick={() => navigate("/auth/user-signup")}
          >
            Sign up
          </button>
        </>
      }
    >
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="ln-secondary-btn w-full py-3"
      >
        <FcGoogle className="text-xl" />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div>
          <label className="ln-label">Email address</label>
          <input
            type="email"
            placeholder="name@example.com"
            className="ln-input"
            value={loginData.email}
            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
          />
          {loginErrors.email && <p className="mt-1 text-xs text-rose-600">{loginErrors.email}</p>}
        </div>

        <div>
          <label className="ln-label">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="ln-input pr-12"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {loginErrors.password && <p className="mt-1 text-xs text-rose-600">{loginErrors.password}</p>}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            onClick={() => navigate("/auth/forgot-password")}
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={isLoading} className="ln-primary-btn w-full py-3">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </FormShell>
  );
}

export default UserSigninPage;

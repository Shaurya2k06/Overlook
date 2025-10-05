import React, { useState, useEffect, memo } from "react";
import { TextAnimate } from "./ui/text-animate";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const BusinessLogin = memo(({ isOpen, onClose, onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  // Load Advercase font
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: 'Advercase';
        src: url('/Advercase Font.otf') format('opentype');
        font-weight: normal;
        font-style: normal;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        navigate("/dashboard");
        onClose();
      } else {
        setErrorMsg(result.error || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && formData.email && formData.password) {
      handleSubmit(e);
    }
  };

  const isFormComplete = () => {
    return formData.email.trim() !== "" && formData.password.trim() !== "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className="w-full h-full flex flex-col items-center justify-center relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-white hover:text-gray-300 text-2xl font-bold"
          style={{ fontFamily: "Advercase, monospace" }}
        >
          ×
        </button>

        {/* Main content */}
        <div className="flex flex-col items-center justify-center space-y-12 max-w-md mx-auto px-8">
          {/* Title */}
          <div className="text-center">
            <div
              className="text-4xl text-white mb-2"
              style={{ fontFamily: "Advercase, monospace" }}
            >
              <TextAnimate animation="slideUp" by="word" key="login-title">
                Welcome Back
              </TextAnimate>
            </div>
            <p
              className="text-gray-400 text-sm mt-4"
              style={{ fontFamily: "Advercase, monospace" }}
            >
              Sign in to your OverLook account
            </p>
            {errorMsg ? (
              <div
                className="mt-4 text-sm bg-red-600/20 border border-red-500 text-red-300 px-4 py-2 rounded"
                style={{ fontFamily: "Advercase, monospace" }}
                role="alert"
              >
                {errorMsg}
              </div>
            ) : null}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-8">
            {/* Email Input */}
            <div className="w-full">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Email"
                className="w-full px-6 py-4 bg-transparent border-b-2 border-white text-white text-xl text-center placeholder-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
                style={{ fontFamily: "Advercase, monospace" }}
                onKeyPress={handleKeyPress}
                required
              />
            </div>

            {/* Password Input */}
            <div className="w-full">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Password"
                className="w-full px-6 py-4 bg-transparent border-b-2 border-white text-white text-xl text-center placeholder-gray-400 focus:outline-none focus:border-gray-300 transition-colors"
                style={{ fontFamily: "Advercase, monospace" }}
                onKeyPress={handleKeyPress}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormComplete() || isSubmitting}
              className={`w-full px-8 py-4 text-lg uppercase tracking-wider transition-colors ${
                isFormComplete() && !isSubmitting
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
              style={{ fontFamily: "Advercase, monospace" }}
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* Switch to Signup */}
          <div className="text-center">
            <p
              className="text-gray-400 text-sm mb-4"
              style={{ fontFamily: "Advercase, monospace" }}
            >
              Don't have an OverLook account?
            </p>
            <button
              onClick={onSwitchToSignup}
              className="text-white hover:text-gray-300 text-sm uppercase tracking-wider border-b border-white hover:border-gray-300 transition-colors"
              style={{ fontFamily: "Advercase, monospace" }}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

BusinessLogin.displayName = "BusinessLogin";

export default BusinessLogin;

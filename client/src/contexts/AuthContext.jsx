import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("auth_user_id");
        const email = localStorage.getItem("auth_email");
        const isLoggedIn = localStorage.getItem("isLoggedIn");

        if (token && isLoggedIn === "true" && userId && email) {
          const userData = {
            id: userId,
            username: email,
            email: email,
            token: token,
          };
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("auth_user_id");
        localStorage.removeItem("auth_email");
        localStorage.removeItem("isLoggedIn");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:3001/public/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data?.message || "Login failed" };
      }

      if (data?.token) {
        const userData = {
          id: data.userId,
          username: email,
          email: email,
          token: data.token,
        };

        // Save to localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("auth_user_id", data.userId);
        localStorage.setItem("auth_email", email);
        localStorage.setItem("isLoggedIn", "true");

        setUser(userData);
        setIsAuthenticated(true);

        return { success: true, user: userData };
      } else {
        return { success: false, error: "Invalid response from server" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Network error. Please check your connection.",
      };
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (email, password, name) => {
    try {
      setLoading(true);

      const signupResponse = await fetch(
        "http://localhost:3001/public/signup",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
          }),
        }
      );

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        return {
          success: false,
          error: signupData?.message || "Signup failed",
        };
      }

      // Auto-login after successful signup
      const loginResponse = await fetch("http://localhost:3001/public/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        return {
          success: false,
          error:
            "Signup successful, but auto-login failed. Please sign in manually.",
        };
      }

      if (loginData?.token) {
        const userData = {
          id: loginData.userId,
          username: name || email,
          email: email,
          token: loginData.token,
        };

        // Save to localStorage
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("auth_user_id", loginData.userId);
        localStorage.setItem("auth_email", email);
        localStorage.setItem("isLoggedIn", "true");

        setUser(userData);
        setIsAuthenticated(true);

        return { success: true, user: userData };
      } else {
        return { success: false, error: "Invalid response from server" };
      }
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        error: "Network error. Please check your connection.",
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("auth_user_id");
    localStorage.removeItem("auth_email");
    localStorage.removeItem("isLoggedIn");
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update user function
  const updateUser = (updates) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem("auth_email", updatedUser.email);
      if (updatedUser.username !== user.username) {
        localStorage.setItem("auth_email", updatedUser.username);
      }
      setUser(updatedUser);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

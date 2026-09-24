// src/hooks/useAuth.js

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  authStart,
  authSuccess,
  authFailure,
  logout as logoutAction,
  clearAuthError,
} from "../features/auth/authSlice.js";

import {
  loginUserApi,
  registerUserApi,
  getProfileApi,
} from "../features/auth/authApi.js";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";

const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const authState = useAppSelector((state) => state.auth);

  // LOGIN
  const login = async (credentials) => {
    try {
      dispatch(authStart());

      const data = await loginUserApi(credentials);

      dispatch(
        authSuccess({
          user: {
            _id: data._id,
            name: data.name,
            email: data.email,
            profilePic: data.profilePic,
          },
          token: data.token,
        })
      );

      toast.success("Login successful");

      navigate("/dashboard");

      return data;
    } catch (error) {
      const message =
        error?.customMessage || "Login failed";

      dispatch(authFailure(message));

      toast.error(message);

      throw error;
    }
  };

  // REGISTER
  const register = async (userData) => {
    try {
      dispatch(authStart());

      const data = await registerUserApi(userData);

      dispatch(
        authSuccess({
          user: {
            _id: data._id,
            name: data.name,
            email: data.email,
            profilePic: data.profilePic,
          },
          token: data.token,
        })
      );

      toast.success("Registration successful");

      navigate("/dashboard");

      return data;
    } catch (error) {
      const message =
        error?.customMessage || "Registration failed";

      dispatch(authFailure(message));

      toast.error(message);

      throw error;
    }
  };

  // FETCH PROFILE
  const fetchProfile = async () => {
    try {
      dispatch(authStart());

      const data = await getProfileApi();

      dispatch(
        authSuccess({
          user: data,
          token: authState.token,
        })
      );

      return data;
    } catch (error) {
      const message =
        error?.customMessage || "Failed to fetch profile";

      dispatch(authFailure(message));

      throw error;
    }
  };

  // LOGOUT
  const logout = () => {
    dispatch(logoutAction());

    toast.success("Logged out successfully");

    navigate("/login");
  };

  // CLEAR ERROR
  const clearError = () => {
    dispatch(clearAuthError());
  };

  return {
    ...authState,

    login,
    register,
    logout,
    fetchProfile,
    clearError,
  };
};

export default useAuth;

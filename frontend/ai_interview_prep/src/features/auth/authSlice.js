import { createSlice } from "@reduxjs/toolkit";

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("userInfo");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    return null;
  }
};

const storedUser = getStoredUser();

const storedToken = localStorage.getItem("token") || null;

const initialState = {
  userInfo: storedUser,
  token: storedToken,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    authSuccess: (state, action) => {
      state.loading = false;
      state.userInfo = action.payload.user;
      state.token = action.payload.token;
      state.error = null;

      localStorage.setItem(
        "userInfo",
        JSON.stringify(action.payload.user)
      );

      localStorage.setItem("token", action.payload.token);
    },

    authFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    logout: (state) => {
      state.userInfo = null;
      state.token = null;
      state.loading = false;
      state.error = null;

      localStorage.removeItem("userInfo");
      localStorage.removeItem("token");
    },

    clearAuthError: (state) => {
      state.error = null;
    },
  },
});

export const {
  authStart,
  authSuccess,
  authFailure,
  logout,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;

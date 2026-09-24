// src/features/auth/authSelectors.js

export const selectAuth = (state) => state.auth;

export const selectUser = (state) => state.auth.userInfo;

export const selectToken = (state) => state.auth.token;

export const selectAuthLoading = (state) => state.auth.loading;

export const selectAuthError = (state) => state.auth.error;

export const selectIsAuthenticated = (state) =>
  Boolean(state.auth.userInfo && state.auth.token);
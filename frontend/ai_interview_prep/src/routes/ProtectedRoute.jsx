// src/routes/ProtectedRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../store/hooks.js";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();

  const { userInfo } = useAppSelector((state) => state.auth);

  // CHECK AUTH
  if (!userInfo) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;

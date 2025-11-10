import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const AUTH_TOKEN_KEY = "campus_sos_token";
const AUTH_USERTYPE_KEY = "campus_sos_userType";

interface Props {
  children: JSX.Element;
}

/**
 * RequireAdmin - ensures user is logged in AND userType === 'admin'.
 * If not logged in -> redirect to /auth/login.
 * If logged in but not admin -> redirect to /dashboard (or /auth/login depending on preference).
 */
export default function RequireAdmin({ children }: Props) {
  const location = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  const userType = typeof window !== "undefined" ? localStorage.getItem(AUTH_USERTYPE_KEY) : null;

  if (!token) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (userType !== "admin") {
    // redirect non-admin users to their dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

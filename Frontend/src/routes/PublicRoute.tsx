import React from "react";
import { Navigate } from "react-router-dom";

const AUTH_TOKEN_KEY = "campus_sos_token";

interface Props {
  children: JSX.Element;
}

/**
 * PublicRoute - if user is authenticated, redirect them to dashboard/admin,
 * otherwise render the children (e.g. login page).
 */
export default function PublicRoute({ children }: Props) {
  const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
  if (token) {
    // If you stored userType, you can route admins differently:
    const userType = localStorage.getItem("campus_sos_userType");
    return <Navigate to={userType === "admin" ? "/admin" : "/dashboard"} replace />;
  }
  return children;
}

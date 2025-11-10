import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const AUTH_TOKEN_KEY = "campus_sos_token";

interface Props {
  children: JSX.Element;
}

/**
 * RequireAuth - returns children if token exists in localStorage,
 * otherwise redirects to /auth/login preserving attempted URL in state.
 */
export default function RequireAuth({ children }: Props) {
  const location = useLocation();
  const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_TOKEN_KEY) : null;

  if (!token) {
    // redirect to login, carry the intended route in state
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
}

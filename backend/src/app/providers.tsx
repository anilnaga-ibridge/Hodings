"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store, useAppDispatch } from "@/store";
import { fetchProfile, forceLogout, setInitialized } from "@/store/slices/authSlice";

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const initAuth = async () => {
      // LocalStorage is client-only, so this is safe inside useEffect
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          await dispatch(fetchProfile());
        } catch (err) {
          dispatch(setInitialized());
        }
      } else {
        dispatch(setInitialized());
      }
    };

    initAuth();

    const handleAuthExpired = () => {
      dispatch(forceLogout());
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
    };
  }, [dispatch]);

  return <>{children}</>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}

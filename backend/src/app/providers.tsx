"use client";

import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store, useAppDispatch } from "@/store";
import { fetchProfile, forceLogout, setInitialized } from "@/store/slices/authSlice";

import Lenis from "lenis";

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

const LenisInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const lenis = new Lenis({
      lerp: 0.08, // Adds continuous momentum interpolation
      duration: 1.5, 
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.9, // Slightly softer wheel stepping
      touchMultiplier: 2.0, // More responsive touch scrolling
      infinite: false,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    // Handle initial hash on page load
    if (window.location.hash) {
      const targetElement = document.querySelector(window.location.hash);
      if (targetElement && targetElement instanceof HTMLElement) {
        setTimeout(() => {
          lenis.scrollTo(targetElement, { offset: -72, immediate: true });
        }, 100);
      }
    }

    // Intercept click on hash links for Lenis-powered smooth scrolling
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (anchor && anchor.hash && (anchor.pathname === window.location.pathname || anchor.pathname === "")) {
        const targetElement = document.querySelector(anchor.hash);
        if (targetElement && targetElement instanceof HTMLElement) {
          e.preventDefault();
          lenis.scrollTo(targetElement, {
            offset: -72, // offset to account for sticky nav height
          });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  return <>{children}</>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <LenisInitializer>{children}</LenisInitializer>
      </AuthInitializer>
    </Provider>
  );
}

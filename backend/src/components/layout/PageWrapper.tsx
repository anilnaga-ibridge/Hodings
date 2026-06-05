import React from "react";
import { Navbar } from "./Navbar";

interface PageWrapperProps {
  children: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen bg-[#FAF9FE] text-slate-800 selection:bg-purple-600 selection:text-white">
      {/* Premium Ambient Background Elements */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        {/* Ambient Glowing Blobs */}
        <div className="absolute -top-[10%] left-[5%] h-[500px] w-[500px] rounded-full bg-purple-200/20 blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-100/30 blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] h-[600px] w-[600px] rounded-full bg-purple-100/10 blur-[150px]" />
      </div>

      {/* Main Layout Stack */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-10 py-8 animate-fade-in">
          {children}
        </main>
        <footer className="border-t border-purple-100/80 bg-white py-6 text-center text-xs text-slate-500">
          <div className="mx-auto max-w-screen-2xl px-4">
            <p>© {new Date().getFullYear()} Billboardify OOH Marketplace Platform. All rights reserved.</p>
            <p className="mt-1 text-[10px] text-slate-400">
              Designed for enterprise out-of-home advertising management. GDPR compliant. Secure JWT.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

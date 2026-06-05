"use client";

import React, { Suspense } from "react";
import { AuthPage } from "@/views/AuthPage";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function Auth() {
  return (
    <PageWrapper>
      <Suspense fallback={<div className="min-h-screen bg-[#FAF9FE] text-slate-800 flex items-center justify-center">Loading...</div>}>
        <AuthPage />
      </Suspense>
    </PageWrapper>
  );
}

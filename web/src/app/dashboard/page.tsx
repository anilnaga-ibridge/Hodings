"use client";

import React, { Suspense } from "react";
import { DashboardPage } from "@/views/DashboardPage";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function Dashboard() {
  return (
    <PageWrapper>
      <Suspense fallback={<div className="flex justify-center p-20 text-slate-500">Loading dashboard...</div>}>
        <DashboardPage />
      </Suspense>
    </PageWrapper>
  );
}

"use client";

import React, { Suspense } from "react";
import { BillboardsPage } from "@/views/BillboardsPage";
import { PageWrapper } from "@/components/layout/PageWrapper";

export default function Billboards() {
  return (
    <PageWrapper>
      <Suspense fallback={<div className="min-h-screen bg-[#FAF9FE] text-slate-800 flex items-center justify-center">Loading Inventory...</div>}>
        <BillboardsPage />
      </Suspense>
    </PageWrapper>
  );
}

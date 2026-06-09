"use client";

import React, { use, Suspense } from "react";
import { BillboardDetailPage } from "@/views/BillboardDetailPage";
import { PageWrapper } from "@/components/layout/PageWrapper";

type PageParams = {
  id: string;
};

interface PageProps {
  params: Promise<PageParams>;
}

function BillboardDetailContent({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  return <BillboardDetailPage id={resolvedParams.id} />;
}

export default function Billboard({ params }: PageProps) {
  return (
    <PageWrapper>
      <Suspense fallback={<div className="min-h-screen bg-[#FAF9FE] text-slate-800 flex items-center justify-center">Loading specifications...</div>}>
        <BillboardDetailContent params={params} />
      </Suspense>
    </PageWrapper>
  );
}

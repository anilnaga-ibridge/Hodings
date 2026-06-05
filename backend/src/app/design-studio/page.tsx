"use client";

import dynamic from "next/dynamic";
import React from "react";

const DesignStudioPage = dynamic(
  () => import("@/views/DesignStudioPage").then((mod) => mod.DesignStudioPage),
  { ssr: false }
);

export default function DesignStudio() {
  return <DesignStudioPage />;
}

"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/auth";
import Navbar from "@/components/driver/common/navbar";

export default function DriverLayout({ children }) {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
    }
  }, [router]);

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}


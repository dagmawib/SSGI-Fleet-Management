"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/auth";

export default function DriverLayout({ children }) {
  const router = useRouter();
  // useEffect(() => {
  //   if (!isAuthenticated()) {
  //     router.push("/");
  //   }
  // }, [router]);

  return <div className="">{children}</div>;
}


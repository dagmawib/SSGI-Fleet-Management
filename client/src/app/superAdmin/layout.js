"use client";

import React, {useEffect} from "react";
import Navbar from "@/components/superAdmin/common/Navbar";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/auth";

export default function SuperAdminLayout({ children }) {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
    }
  }, [router]);
  
  return (
    <>
      <Navbar />
      <div className="">{children}</div>
    </>
  );
}

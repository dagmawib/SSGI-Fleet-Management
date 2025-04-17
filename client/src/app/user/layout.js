"use client";
import React, {useEffect} from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/user/common/Navbar";
import { isAuthenticated } from "@/utils/auth";

export default function UserLayout({ children }) {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/");
    }
  }, [router]);
  
  return (
    <div className="">
      <Navbar />
      {children}
    </div>
  );
}

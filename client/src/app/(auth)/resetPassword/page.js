"use client";

import { useState } from "react";
import React from "react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import WorldFlag from "react-world-flags";
import { Globe } from "lucide-react";
import { setCookie } from "cookies-next";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const t = useTranslations("forgotPassword");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = (lang) => {
    setCookie("NEXT_LOCALE", lang);
    window.location.reload();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/forgot_password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success(
          "Email sent! Please check your email for further instructions.",
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      } else {
        const data = await response.json();
        toast.error(data.error || "Something went wrong. Please try again.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An unexpected error occurred. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
      <ToastContainer />
      {/* Background Image for mobile view */}
      <div className="absolute inset-0  md:relative w-full md:w-1/2 h-screen md:h-auto">
        <Image
          src="/images/LoginImage2.png"
          alt="Login Illustration"
          fill
          className="object-cover md:static md:object-cover"
          priority
        />
      </div>

      {/* Login Form */}
      <div className="relative z-10 w-full md:w-1/2 flex items-center justify-center px-4 py-10 min-h-screen">
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 md:bg-afWhite  shadow border-[#043755] rounded-xl w-full max-w-md p-6"
        >
          {/* Header with Language Dropdown */}
          <div className="flex flex-row justify-between items-center mb-6">
            <h1 className="font-semibold text-xl text-[#043755]">
              {t("title")}
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full text-[#043755] hover:bg-gray-100 block">
                  <Globe className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
                  <div className="flex items-center space-x-2">
                    <WorldFlag code="GB" className="h-6 w-6" alt="UK Flag" />
                    <span>English</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleLanguageChange("am")}>
                  <div className="flex items-center space-x-2">
                    <WorldFlag
                      code="ET"
                      className="h-6 w-6"
                      alt="Ethiopian Flag"
                    />
                    <span>አማርኛ</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Old Password */}
          <div className="mb-3">
            <label className="block text-[#043755] text-sm leading-6 mb-1 font-inter font-medium">
              {t("email")}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="block w-full px-4 py-3 rounded-lg border text-[#043755] font-normal font-inter text-sm placeholder:text-zinc-500"
                required
              />
            </div>
          </div>

          <hr className="border-gray-300 mt-6" />

          {/* submit Button */}
          <div className="flex justify-center bg-[#043755] mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-[205px] py-2 text-white font-semibold text-md rounded-xl disabled:opacity-50"
            >
              {isLoading ? t("loading") : t("continue")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import WorldFlag from "react-world-flags";
import { Globe } from "lucide-react";
import { setCookie } from "cookies-next"; 

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations("login");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLanguageChange = (lang) => {
    setCookie("NEXT_LOCALE", lang);
    window.location.reload();
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen z-10 text-base md:mx-4 mx-3">
      <div className="flex justify-center lg:w-auto left-0 sm:left-auto py-6 rounded-lg">
        <form className="mx-auto px-6 py-7 bg-afWhite shadow border-[#043755] rounded-xl w-full md:w-[370px]">
          <div className="flex flex-row justify-between items-center mb-6">
            <h1 className="font-semibold text-xl text-[#043755]">
              {t("title")}
            </h1>

            {/* Globe Icon with Language Dropdown */}
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

          {/* Email */}
          <div className="mb-3">
            <div className="flex">
              <label className="block text-[#043755] text-sm leading-6 mb-1 font-inter font-medium">
                {t("email")}
              </label>
            </div>
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              className="block w-full px-4 py-3 rounded-lg border border-lightbodercolor text-[#043755] font-inter outline-none placeholder-darkgrey placeholder:text-sm placeholder:text-zinc-500"
            />
          </div>

          {/* Password */}
          <div className="grid items-center mb-3">
            <div className="grid items-center mb-0.5">
              <label className="block text-[#043755] text-sm leading-6 mb-1 font-inter font-medium">
                {t("password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  className="block w-full px-4 py-3 rounded-lg border placeholder-darkgrey text-[#043755] font-normal font-inter text-[14px] placeholder:text-sm placeholder:text-zinc-500"
                />
                <span
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#043755] cursor-pointer"
                  aria-label={
                    showPassword ? t("hidePassword") : t("showPassword")
                  }
                >
                  {showPassword ? (
                    <VisibilityOffIcon />
                  ) : (
                    <RemoveRedEyeOutlinedIcon />
                  )}
                </span>
              </div>
            </div>

            {/* Remember Me + Forgot */}
            <div className="flex items-center justify-between gap-2 mt-2 md:mt-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="rememberMe" />
                <label className="text-[#043755] font-medium text-sm font-inter">
                  {t("rememberMe")}
                </label>
              </div>
              <Link
                href="/resetPassword"
                className="mt-3 sm:mt-0 text-[#043755] font-medium underline text-sm font-inter"
              >
                {t("forgotPassword")}
              </Link>
            </div>
          </div>

          <hr className="border-gray-300 mt-6" />

          <div className="flex justify-center bg-[#043755]">
            <button
              type="submit"
              className="w-[105px] py-2 text-white font-semibold text-lg rounded-xl"
            >
              {t("loginButton")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

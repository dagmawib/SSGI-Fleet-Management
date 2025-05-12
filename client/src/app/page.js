"use client";

import { useState } from "react";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import CircularProgress from "@mui/material/CircularProgress"; // Import CircularProgress from MUI
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import WorldFlag from "react-world-flags";
import { Globe } from "lucide-react";
import { CircleCheckBig } from "lucide-react";
import { setCookie } from "cookies-next";
import Image from "next/image";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import withAuth from "@/withAuth";

const emailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [message, setMessage] = useState(null);
  const [isLoginSuccessful, setIsLoginSuccessful] = useState(false);
  const t = useTranslations("login");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const { email, password } = data;

      const requestBody = {
        email,
        password,
      };

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        setLoading(false);
        setErrorMessage("Login failed. Please check your credentials.");
        const errorData = await response.json();
        throw new Error(errorData.error || "Login failed");
      }

      const responseData = await response.json();
      if (responseData) {
        setLoading(false);
        setIsLoginSuccessful(true);
        setMessage("Login successful!");
        setCookie("access_token", responseData.token);
        setCookie("refresh", responseData.refresh);
        setCookie("user_ID", responseData.user_id);
        setCookie("role", responseData.role)

        const role = responseData.role;
        if (role === "employee" || role === "director") {
          router.push("/user");
        } else if (role === "admin") {
          router.push("/admin");
        } else if (role === "superadmin") {
          router.push("/superAdmin");
        } else if (role === "driver") {
          router.push("/driver");
        } else {
          setErrorMessage("Invalid role. Access denied.");
        }
       
      }
    } catch (error) {
      console.error("Login error:", error.message);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLanguageChange = (lang) => {
    setCookie("NEXT_LOCALE", lang);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row relative">
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
      {!isLoginSuccessful ? (
        <>
          {/* Login Form */}
          <div className="relative z-10 w-full md:w-1/2 flex items-center justify-center px-4 py-10 min-h-screen">
            <form
              onSubmit={handleSubmit(onSubmit)}
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
                    <DropdownMenuItem
                      onClick={() => handleLanguageChange("en")}
                    >
                      <div className="flex items-center space-x-2">
                        <WorldFlag
                          code="GB"
                          className="h-6 w-6"
                          alt="UK Flag"
                        />
                        <span>English</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleLanguageChange("am")}
                    >
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
                <label className="block text-[#043755] text-sm leading-6 mb-1 font-inter font-medium">
                  {t("email")}
                </label>
                <input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  className="block w-full px-4 py-3 rounded-lg border border-lightbodercolor text-[#043755] font-inter outline-none placeholder:text-sm placeholder:text-zinc-500"
                  {...register("email")}
                />
              </div>

              {/* Password */}
              <div className="mb-3">
                <label className="block text-[#043755] text-sm leading-6 mb-1 font-inter font-medium">
                  {t("password")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    className="block w-full px-4 py-3 rounded-lg border text-[#043755] font-normal font-inter text-sm placeholder:text-zinc-500"
                    {...register("password")}
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
                  className="text-[#043755] font-medium underline text-sm font-inter"
                >
                  {t("forgotPassword")}
                </Link>
              </div>

              <hr className="border-gray-300 mt-6" />

              {/* Login Button */}
              <div className="flex justify-center bg-[#043755] mt-6">
                <button
                  type="submit"
                  disabled={loading} // Disable button when loading
                  className={`w-[105px] py-2 text-white font-semibold text-lg rounded-xl cursor-pointer ${loading ? "" : ""
                    }`}
                >
                  {loading ? (
                    <span className="flex justify-center items-center">
                      <CircularProgress size={24} color="inherit" />
                    </span>
                  ) : (
                    t("loginButton")
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      ) : (
        <div className="relative z-10 w-full md:w-1/2 flex items-center justify-center px-4 py-10 min-h-screen">
          <div className="border bg-white/90 md:bg-afWhite shadow rounded-2xl max-w-[382px] md:max-w-[500px] w-full flex items-center justify-center px-4 py-10">
            <div className="flex flex-col items-center">
              <div className="flex gap-x-5 items-center">
                <CircleCheckBig size={30} className="text-[#043755]" />
                <p className="md:text-2xl text-lg font-semibold text-[#043755]">
                  {t("successfulVerification")}
                </p>
              </div>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#043755]"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(Home);

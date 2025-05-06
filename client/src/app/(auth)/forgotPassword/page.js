"use client";

import { useState, useEffect } from "react";
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
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("forgotPassword");
  const router = useRouter();

  useEffect(() => {
    // Get token and uid from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const uid = urlParams.get('uid');

    if (!token || !uid) {
      toast.error("Invalid reset password link", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      router.push('/login');
    }
  }, [router]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleLanguageChange = (lang) => {
    setCookie("NEXT_LOCALE", lang);
    window.location.reload();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Get token and uid from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const uid = urlParams.get('uid');

    if (!token || !uid) {
      toast.error("Invalid reset password link", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/reset_password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_password: newPassword,
          token,
          uid
        }),
      });

      if (response.ok) {
        toast.success("Password reset successfully! Please login with your new password.", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        router.push('/');
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to reset password. Please try again.", {
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
        <form onSubmit={handleSubmit} className="bg-white/90 md:bg-afWhite  shadow border-[#043755] rounded-xl w-full max-w-md p-6">
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
              {t("oldPassword")}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("oldPasswordPlaceholder")}
                className="block w-full px-4 py-3 rounded-lg border text-[#043755] font-normal font-inter text-sm placeholder:text-zinc-500"
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

          {/* New Password */}
          <div className="mb-3">
            <label className="block text-[#043755] text-sm leading-6 mb-1 font-inter font-medium">
              {t("newPassword")}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("newPasswordPlaceholder")}
                className="block w-full px-4 py-3 rounded-lg border text-[#043755] font-normal font-inter text-sm placeholder:text-zinc-500"
                required
              />
              <span
                onClick={toggleNewPasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#043755] cursor-pointer"
                aria-label={
                  showNewPassword ? t("hidePassword") : t("showPassword")
                }
              >
                {showNewPassword ? (
                  <VisibilityOffIcon />
                ) : (
                  <RemoveRedEyeOutlinedIcon />
                )}
              </span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label className="block text-[#043755] text-sm leading-6 mb-1 font-inter font-medium">
              {t("confirmPassword")}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("confirmPasswordPlaceholder")}
                className="block w-full px-4 py-3 rounded-lg border text-[#043755] font-normal font-inter text-sm placeholder:text-zinc-500"
                required
              />
              <span
                onClick={toggleConfirmPasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#043755] cursor-pointer"
                aria-label={
                  showConfirmPassword ? t("hidePassword") : t("showPassword")
                }
              >
                {showConfirmPassword ? (
                  <VisibilityOffIcon />
                ) : (
                  <RemoveRedEyeOutlinedIcon />
                )}
              </span>
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
              {isLoading ? t("loading") : t("updatePassword")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

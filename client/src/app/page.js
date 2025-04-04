"use client";
import { useState } from "react";
import React from "react";
import Link from "next/link";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export default function Home() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen z-10 text-base md:mx-4 mx-3">
      <div className="flex justify-center lg:w-auto left-0 sm:left-auto py-6 rounded-lg">
        <form className="mx-auto px-6 py-7 bg-afWhite shadow border-[#043755] rounded-xl w-full md:w-[370px]">
          <h1 className="font-semibold text-xl text-center text-[#043755] mb-6">
            Login
          </h1>
          {/* Email or Phone Number Input */}
          <div className="mb-3">
            <div className="flex">
              <label className="block text-[#043755] text-sm leading-6 mb-1 font-inter font-medium">
                Email
              </label>
            </div>
            <div>
              <input
                type="email"
                placeholder="john.doe@mail.com"
                className="block w-full px-4 py-3 rounded-lg border border-lightbodercolor text-[#043755] font-inter outline-none  placeholder-darkgrey placeholder:text-sm placeholder:text-zinc-500"
              />
            </div>
          </div>
          <div className="grid items-center mb-3">
            <div className="grid items-center mb-0.5">
              <label className="block text-[#043755] text-sm leading-6 mb-1 font-inter font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter strong password"
                  className="block w-full px-4 py-3 rounded-lg border placeholder-darkgrey text-[#043755] font-normal font-inter text-[14px] placeholder:text-sm placeholder:text-zinc-500"
                />
                <span
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#043755]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <VisibilityOffIcon />
                  ) : (
                    <RemoveRedEyeOutlinedIcon />
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 mt-2 md:mt-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="rememberMe" />
                <label className="text-[#043755] font-medium text-sm font-inter">
                  Remember Me
                </label>
              </div>
              <Link
                href="/resetPassword"
                className="mt-3 sm:mt-0 text-[#043755] font-medium underline text-sm font-inter"
              >
                Forgot Password?
              </Link>
            </div>
          </div>
          <hr className="border-gray-300 mt-6" />
          <div className="flex justify-center bg-[#043755]">
            <button
              type="submit"
              className="w-[105px] py-2 text-white font-semibold text-lg rounded-xl"
              href="/user"
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

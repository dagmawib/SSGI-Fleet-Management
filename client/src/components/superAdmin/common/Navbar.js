"use client";

import { Globe, MoreVertical } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../ui/sheet";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "../../ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { setCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import WorldFlag from "react-world-flags";
import { usePathname } from "next/navigation";
import { deleteCookie, getCookie } from "cookies-next";

export default function Navbar() {
  const t = useTranslations("superAdminNavbar");
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const refresh = getCookie("refresh") || null;
  // Function to close the sidebar
  const closeSidebar = () => setIsOpen(false);
  const isActive = (path) => pathname === path;

  const handleLanguageChange = (lang) => {
    setCookie("NEXT_LOCALE", lang);
    window.location.reload();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh }),
      });

      // if (res.status) {
        router.push("/");
        deleteCookie("access_token");
      // } else {
      //   const errorData = await res.json();
      //   console.error("Logout failed:", errorData.error || "Unknown error");
      // }
    } catch (error) {
      console.error("Logout error:", error.message);
    }
  };

  return (
    <header className="px-4 sm:px-16 py-4 bg-white w-full">
      <div className="max-w-7xl xxl:max-w-[1600px] w-full flex items-center justify-between mx-auto">
        <div className="flex flex-row text-center items-center gap-x-8">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-6 pr-14">
            <div className="flex-shrink-0">
              <Image
                src="/images/ssgiLogo.png" // Update with your logo path
                alt="AddisFinancial"
                width={70}
                height={31}
              />
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex space-x-10 xl:space-x-14">
            <div className="space-x-6">
              <Link
                href="/superAdmin"
                className={
                  isActive("/superAdmin")
                    ? "text-[#FFAE02] font-medium"
                    : "text-[#043755] hover:text-afPrimary"
                }
              >
                {t("register")}
              </Link>

              {/* <Link
                href="/user/profile"
                className={
                  isActive("/user/profile")
                    ? "text-[#FFAE02] font-medium"
                    : "text-[#043755] hover:text-afPrimary"
                }
              >
                Profile
              </Link> */}
              {/* <Link
                href="/user/contact"
                className={
                  isActive("/user/contact")
                    ? "text-[#FFAE02] font-medium"
                    : "text-[#043755] hover:text-afPrimary"
                }
              >
                Contact Us
              </Link> */}
              <Link
                href="/superAdmin/users"
                className={
                  isActive("/superAdmin/users")
                    ? "text-[#FFAE02] font-medium"
                    : "text-[#043755] hover:text-afPrimary"
                }
              >
                {t("Users")}
              </Link>
            </div>
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="relative flex items-center space-x-3">
          <div className="relative flex items-center" ref={dropdownRef}>
            {/* Profile Image */}
            <div
              className="relative h-10 w-10 rounded-full overflow-hidden cursor-pointer"
              onClick={() => setOpen(!open)}
            >
              <Image
                src="/images/profile2.jpg"
                alt="User profile"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>

            {/* Dropdown Menu */}
            {open && (
              <div className="absolute right-0 top-12 w-40 bg-white border border-gray-200 rounded-md shadow-md z-50">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  {t("logout")}
                </button>
              </div>
            )}
          </div>

          {/* Globe Icon with Language Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full text-[#043755] hover:bg-gray-100 hidden lg:block">
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

          <div className="flex lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 rounded-full text-[#043755] hover:bg-gray-100"
                  onClick={() => setIsOpen(true)}
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </SheetTrigger>

              <SheetContent side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle></SheetTitle>
                </SheetHeader>

                <div className="flex flex-col space-y-4 mt-4">
                  {/* Navigation Links */}
                  <nav className="flex flex-col gap-4">
                    <Link
                      href="/superAdmin"
                      className={
                        isActive("/superAdmin")
                          ? "text-afPrimary underline underline-offset-4"
                          : "text-afPrimary/80 hover:text-afPrimary"
                      }
                      onClick={closeSidebar}
                    >
                      {t("register")}
                    </Link>
                    {/* <Link
                      href="/user/profile"
                      className={
                        isActive("/user/profile")
                          ? "text-afPrimary underline underline-offset-4"
                          : "text-afPrimary/80 hover:text-afPrimary"
                      }
                      onClick={closeSidebar}
                    >
                      Profile
                    </Link> */}
                    {/* <Link
                      href="/user/contact"
                      className={
                        isActive("/user/contact")
                          ? "text-afPrimary underline underline-offset-4"
                          : "text-afPrimary/80 hover:text-afPrimary"
                      }
                      onClick={closeSidebar}
                    >
                      Contact Us
                    </Link> */}
                    <Link
                      href="/superAdmin/users"
                      className={
                        isActive("/superAdmin/users")
                          ? "text-afPrimary underline underline-offset-4"
                          : "text-afPrimary/80 hover:text-afPrimary"
                      }
                      onClick={closeSidebar}
                    >
                      {t("Users")}
                    </Link>
                  </nav>

                  {/* Divider */}
                  <div className="border-t my-2"></div>

                  {/* Language Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center p-2 rounded hover:bg-gray-100 w-full">
                        <Globe className="w-5 h-5" />
                        <span className="ml-2">{t("changeLanguage")}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-36">
                      <DropdownMenuItem
                        onClick={() => {
                          handleLanguageChange("en");
                          closeSidebar();
                        }}
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
                        onClick={() => {
                          handleLanguageChange("am");
                          closeSidebar();
                        }}
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
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

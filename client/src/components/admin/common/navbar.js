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
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { setCookie } from "cookies-next";
// import { isAuthenticated } from "@/utils/auth";
import { useRouter } from "next/navigation";
import WorldFlag from "react-world-flags";
import { usePathname } from "next/navigation";
// import useUser from "@/hooks/dashboard/useUser";
// import { deleteCookie,getCookie } from "cookies-next";

export default function Navbar() {
  const t = useTranslations("AdminNavbar");
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  //   const access_token = getCookie("access_token");
  //   const { data: user } = useUser();
  //   const userAvatar = user?.avatar || "/images/profile/profileAvater.png";
  //   const firstName = user?.firstName || "";
  //   const lastName = user?.lastName || "";
  const [isOpen, setIsOpen] = useState(false);

  // Function to close the sidebar
  const closeSidebar = () => setIsOpen(false);
  //   useEffect(() => {
  //     // Check authentication on client side
  //     if (isAuthenticated()) {
  //       setIsLoggedIn(true);
  //     }
  //   }, [router]);

  const isActive = (path) => pathname === path;

  const handleLanguageChange = (lang) => {
    setCookie("NEXT_LOCALE", lang);
    window.location.reload();
  };

  //   const handleLogout = async () => {
  //       try {
  //         const res = await fetch("/api/auth/logout", {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({ access_token }),
  //         });

  //         if (res.status) {
  //           router.push("/login");
  //           deleteCookie("access_token");
  //           deleteCookie("accessTokenExpiration");
  //           deleteCookie("refresh_token");
  //           deleteCookie("rememberMe");
  //           deleteCookie("userId");
  //           deleteCookie("username");
  //         } else {
  //           const errorData = await res.json();
  //           console.error("Logout failed:", errorData.error || "Unknown error");
  //         }
  //       } catch (error) {
  //         console.error("Logout error:", error.message);
  //       }
  //     };

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
                href="/admin"
                className={
                  isActive("/admin")
                    ? "text-[#FFAE02] font-medium"
                    : "text-[#043755] hover:text-afPrimary"
                }
              >
                {t("request")}
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
              <Link
                href="/admin/car"
                className={
                  isActive("/admin/car")
                    ? "text-[#FFAE02] font-medium"
                    : "text-[#043755] hover:text-afPrimary"
                }
              >
                {t("car")}
              </Link>
              <Link
                href="/admin/history"
                className={
                  isActive("/admin/history")
                    ? "text-[#FFAE02] font-medium"
                    : "text-[#043755] hover:text-afPrimary"
                }
              >
                {t("history")}
              </Link>
            </div>
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="relative flex items-center space-x-3">
          <div className=" flex items-center">
            <div className="relative h-10 w-10 rounded-full overflow-hidden cursor-pointer">
              <Image
                src="/images/profile2.jpg"
                alt="User profile"
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
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
                      href="/admin"
                      className={
                        isActive("/admin")
                          ? "text-afPrimary underline underline-offset-4"
                          : "text-afPrimary/80 hover:text-afPrimary"
                      }
                      onClick={closeSidebar}
                    >
                      {t("request")}
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
                    <Link
                      href="/admin/car"
                      className={
                        isActive("/admin/car")
                          ? "text-afPrimary underline underline-offset-4"
                          : "text-afPrimary/80 hover:text-afPrimary"
                      }
                      onClick={closeSidebar}
                    >
                      {t("car")}
                    </Link>
                    <Link
                      href="/admin/history"
                      className={
                        isActive("/admin/history")
                          ? "text-afPrimary underline underline-offset-4"
                          : "text-afPrimary/80 hover:text-afPrimary"
                      }
                      onClick={closeSidebar}
                    >
                      {t("history")}
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

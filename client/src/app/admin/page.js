import React from "react";
import RequestTable from "@/components/admin/requestTable"; 
import CarsTable from "@/components/admin/carsTable"; 
import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("AdminPage"); 
  return (
    <div className="max-w-7xl xxl:max-w-[1600px] w-full mx-auto py-6 bg-white my-4">
      <h2 className="text-2xl font-semibold text-[#043755] ml-2 sm:ml-0">
        {t("request") }
      </h2>
      <RequestTable />

      <h2 className="text-2xl font-semibold text-[#043755] mt-8 ml-2 sm:ml-0">
        {t("car") }
      </h2>
      <CarsTable />
    </div>
  );
}

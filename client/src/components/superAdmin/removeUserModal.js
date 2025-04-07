"use client";
import React from "react";
import { useTranslations } from "next-intl";

export default function DeleteConfirmModal({ isOpen, onClose, onConfirm }) {
  const t = useTranslations("removeModal");
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4 text-[#043755]">
          {t("confirmDeletion")}
        </h2>
        <p className="mb-6 text-[#043755]">{t("confirmMessage")}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-[#043755]"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

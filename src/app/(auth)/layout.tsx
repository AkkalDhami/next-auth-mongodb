"use client";

import AuthHeader from "@/components/layouts/auth-header";
import { usePathname } from "next/navigation";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();

  const maxWidthPaths = [
    "/recruiter-profile",
    "/applicant-profile",
    "/user-role",
    "/company-profile-complete",
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div
        className={`my-5 w-full ${
          maxWidthPaths.includes(path) ? "max-w-4xl" : "max-w-md"
        }`}>
        <AuthHeader />
        {children}
      </div>
    </div>
  );
}

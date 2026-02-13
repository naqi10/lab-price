"use client";

import Header from "@/components/dashboard/header";
import UserManagement from "@/components/settings/user-management";

export default function SettingsPage() {
  return (
    <>
      <Header title="Paramètres" />
      <div className="mt-6">
        <UserManagement />
      </div>
    </>
  );
}

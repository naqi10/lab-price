"use client";

import Header from "@/components/dashboard/header";
import UserManagement from "@/components/settings/user-management";
import EmailConfigStatus from "@/components/settings/email-config-status";

export default function SettingsPage() {
  return (
    <>
      <Header title="Paramètres" />
      <div className="mt-6 space-y-6">
        <EmailConfigStatus />
        <UserManagement />
      </div>
    </>
  );
}

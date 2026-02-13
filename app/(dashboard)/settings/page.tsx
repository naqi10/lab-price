"use client";

import Header from "@/components/dashboard/header";
import UserManagement from "@/components/settings/user-management";
import EmailConfigForm from "@/components/settings/email-config-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <>
      <Header title="Paramètres" />
      <Tabs defaultValue="users" className="mt-6">
        <TabsList>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="email">Configuration Email</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="email">
          <EmailConfigForm />
        </TabsContent>
      </Tabs>
    </>
  );
}

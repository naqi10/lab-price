"use client";

import { useDashboardTitle } from "@/hooks/use-dashboard-title";
import UserManagement from "@/components/settings/user-management";
import EmailSettings from "@/components/settings/email-settings";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function SettingsPage() {
   useDashboardTitle("Paramètres");
   return (
     <>
       <div className="mt-6">
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="space-y-6">
              <UserManagement />
            </div>
          </TabsContent>

          <TabsContent value="email">
            <EmailSettings />
          </TabsContent>

        </Tabs>
      </div>
    </>
  );
}

import type React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavigationSidebar } from "@/components/navigation-sidebar";
import DashboardHeader from "./dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900/50">
        <NavigationSidebar collapsible={true} />
        <div className="flex flex-col flex-1 min-h-0">
          <DashboardHeader />
          <div className="flex-1 min-h-0 overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}

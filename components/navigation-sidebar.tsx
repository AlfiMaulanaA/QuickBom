"use client";

import { memo, useState } from "react";
import { LogOut, ChevronDown, ChevronRight, BlocksIcon, LayoutDashboard, Settings, Users, Database, Activity, Package, FileText, FolderOpen, BarChart3 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Dynamic imports for better hydration
const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then(mod => ({ default: mod.ThemeToggle })),
  {
    loading: () => (
      <div className="h-8 w-8 bg-muted animate-pulse rounded-md"></div>
    ),
    ssr: false
  }
);

const appName = process.env.NEXT_PUBLIC_APP_NAME || "QuickBom";

// Hardcoded menu structure
const hardcodedMenuGroups = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    items: [
      {
        id: "main-dashboard",
        label: "Main Dashboard",
        path: "/",
        icon: "LayoutDashboard"
      }
    ]
  },
  {
    id: "user-management",
    label: "User Management",
    icon: "Users",
    items: [
      {
        id: "users-list",
        label: "Users",
        path: "/users",
        icon: "Users"
      }
    ]
  },
  {
    id: "client-management",
    label: "Client Management",
    icon: "Users",
    items: [
      {
        id: "clients-list",
        label: "Clients",
        path: "/clients",
        icon: "Users"
      }
    ]
  },
  {
    id: "materials",
    label: "Materials",
    icon: "Package",
    items: [
      {
        id: "materials-list",
        label: "Materials",
        path: "/materials",
        icon: "Package"
      }
    ]
  },
  {
    id: "assemblies",
    label: "Assemblies",
    icon: "Settings",
    items: [
      {
        id: "assemblies-list",
        label: "Assemblies",
        path: "/assemblies",
        icon: "Settings"
      }
    ]
  },
  {
    id: "templates",
    label: "Templates",
    icon: "FileText",
    items: [
      {
        id: "templates-list",
        label: "Templates",
        path: "/templates",
        icon: "FileText"
      }
    ]
  },
  {
    id: "projects",
    label: "Projects",
    icon: "FolderOpen",
    items: [
      {
        id: "projects-list",
        label: "Projects",
        path: "/projects",
        icon: "FolderOpen"
      }
    ]
  },
  {
    id: "gantt",
    label: "Gantt Chart",
    icon: "BarChart3",
    items: [
      {
        id: "gantt-chart",
        label: "Gantt Chart",
        path: "/gantt",
        icon: "BarChart3"
      }
    ]
  }
];

export const NavigationSidebar = memo(function NavigationSidebar({
  collapsible = false
}: { collapsible?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const { logout, user, isAuthenticated, isLoggingOut } = useAuth();

  // Toggle group open/close state
  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Handle logout
  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutDialog(false);
    await logout();
  };

  const handleCancelLogout = () => {
    setShowLogoutDialog(false);
  };

  return (
    <Sidebar className="flex flex-col h-full">
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4 bg-background flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center border-gray-400 justify-center rounded-lg bg-primary text-primary-foreground">
              <BlocksIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                QuickBom
              </h1>
              <p className="text-xs text-sidebar-foreground/70">{appName}</p>
              
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SidebarHeader>

      <SidebarContent
        className="bg-background overflow-auto scrollbar-hide flex-1 min-h-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {hardcodedMenuGroups.map((group) => {
          const groupId = group.id;
          if (collapsible) {
            const isOpen = openGroups.has(groupId);
            return (
              <SidebarGroup key={groupId}>
                <Collapsible open={isOpen} onOpenChange={() => toggleGroup(groupId)}>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors rounded-md px-2 py-1">
                      <div className="flex items-center gap-2">
                        {group.icon === 'LayoutDashboard' && <LayoutDashboard className="h-4 w-4 text-sidebar-foreground/80" />}
                        {group.icon === 'Package' && <Package className="h-4 w-4 text-sidebar-foreground/80" />}
                        {group.icon === 'Settings' && <Settings className="h-4 w-4 text-sidebar-foreground/80" />}
                        {group.icon === 'FileText' && <FileText className="h-4 w-4 text-sidebar-foreground/80" />}
                        {group.icon === 'FolderOpen' && <FolderOpen className="h-4 w-4 text-sidebar-foreground/80" />}
                        {group.icon === 'Activity' && <Activity className="h-4 w-4 text-sidebar-foreground/80" />}
                        {group.icon === 'Users' && <Users className="h-4 w-4 text-sidebar-foreground/80" />}
                        {group.icon === 'BarChart3' && <BarChart3 className="h-4 w-4 text-sidebar-foreground/80" />}
                        <span className="text-sidebar-foreground/80 font-medium text-base">{group.label}</span>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-sidebar-foreground/60 -rotate-90" />
                      )}
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => (
                          <SidebarMenuItem key={item.id} className="relative">
                            <SidebarMenuButton
                              asChild
                              isActive={pathname === item.path}
                              className="group flex items-center gap-2 px-3 py-2 rounded-md w-full transition-colors text-sidebar-foreground hover:bg-muted/50 hover:text-sidebar-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-medium data-[active=true]:shadow-md"
                            >
                              <Link
                                href={item.path}
                                prefetch={false}
                              >
                                <span className="ml-5">{item.label}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroup>
            );
          } else {
            return (
              <SidebarGroup key={groupId}>
                <SidebarGroupLabel className="flex items-center gap-2 text-sidebar-foreground/80">
                  {group.icon === 'LayoutDashboard' && <LayoutDashboard className="h-4 w-4 text-sidebar-foreground/80" />}
                  {group.icon === 'Package' && <Package className="h-4 w-4 text-sidebar-foreground/80" />}
                  {group.icon === 'Settings' && <Settings className="h-4 w-4 text-sidebar-foreground/80" />}
                  {group.icon === 'FileText' && <FileText className="h-4 w-4 text-sidebar-foreground/80" />}
                  {group.icon === 'FolderOpen' && <FolderOpen className="h-4 w-4 text-sidebar-foreground/80" />}
                  {group.icon === 'Activity' && <Activity className="h-4 w-4 text-sidebar-foreground/80" />}
                  {group.icon === 'Users' && <Users className="h-4 w-4 text-sidebar-foreground/80" />}
                  {group.icon === 'BarChart3' && <BarChart3 className="h-4 w-4 text-sidebar-foreground/80" />}
                  {group.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.id} className="relative">
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.path}
                          className="group flex items-center gap-2 px-3 py-2 rounded-md w-full transition-colors text-sidebar-foreground hover:bg-muted/50 hover:text-sidebar-accent-foreground data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium data-[active=true]:border-l-2 data-[active=true]:border-l-primary"
                        >
                          <Link
                            href={item.path}
                            prefetch={false}
                          >
                            {item.icon === 'LayoutDashboard' && <LayoutDashboard className="h-4 w-4 text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground" />}
                            {item.icon === 'Settings' && <Settings className="h-4 w-4 text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground" />}
                            {item.icon === 'Activity' && <Activity className="h-4 w-4 text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground" />}
                            {item.icon === 'Database' && <Database className="h-4 w-4 text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground" />}
                            {item.icon === 'Users' && <Users className="h-4 w-4 text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground" />}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }
        })}
      </SidebarContent>

      <SidebarFooter className="p-4 bg-background border-t border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2 mb-2 cursor-pointer hover:bg-muted/50 rounded-md transition-colors">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-primary font-medium text-sm">
              {user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
          {/* Add a small indicator that it's clickable */}
          <ChevronRight className="h-4 w-4 text-sidebar-foreground/50" />
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              className="flex items-center gap-2 text-destructive bg-destructive/5 hover:bg-destructive/20 hover:text-destructive-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-md w-full border border-transparent hover:border-destructive/40"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />

      <ConfirmationDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        type="warning"
        title="Confirm Logout"
        description="Are you sure you want to log out? You will need to log in again to access the system."
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
        destructive={true}
      />
    </Sidebar>
  );
});

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings, RefreshCw, ZoomIn, ZoomOut, Bell } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const RealtimeClockWithRefresh = dynamic(
  () => import("@/components/realtime-clock"),
  {
    loading: () => (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>Loading time...</span>
      </div>
    ),
    ssr: false
  }
);

function generateTitleFromPathname(pathname: string): string {
  // Handle root dashboard
  if (pathname === "/" || pathname === "/dashboard") return "QuickBom Dashboard";

  // Handle QuickBom specific routes with better coverage
  const quickbomRoutes: Record<string, string> = {
    "/materials": "Materials Management",
    "/assemblies": "Assemblies Management",
    "/templates": "Templates Management",
    "/projects": "Projects Management",
    "/users": "User Management",
    "/clients": "Client Management",
    "/whatsapp": "WhatsApp Integration",
    "/gantt": "Global Gantt Chart",
  };

  // Check if it's a direct QuickBom route
  if (quickbomRoutes[pathname]) {
    return quickbomRoutes[pathname];
  }

  // Handle dynamic routes
  const segments = pathname.split("/").filter(Boolean);

  // Handle project-specific routes
  if (segments[0] === "projects" && segments.length > 1) {
    if (segments.length === 2 && /^\d+$/.test(segments[1])) {
      return `Project #${segments[1]}`;
    }
    if (segments[2] === "timeline") {
      if (segments[3] === "gantt") {
        return `Project #${segments[1]} - Gantt Chart`;
      }
      return `Project #${segments[1]} - Timeline`;
    }
  }

  // Handle dashboard routes
  if (segments[0] === "dashboard") {
    if (segments.length === 1) return "QuickBom Dashboard";
    if (segments[1] === "projects") return "Projects Management";
    if (segments[1] === "materials") return "Materials Management";
    if (segments[1] === "assemblies") return "Assemblies Management";
    if (segments[1] === "templates") return "Templates Management";
    if (segments[1] === "users") return "User Management";
    if (segments[1] === "clients") return "Client Management";
  }

  // Handle remaining QuickBom routes
  const lastSegment = segments[segments.length - 1];
  const quickbomFallbackRoutes: Record<string, string> = {
    "login": "Login",
    "register": "Register",
    "unauthorized": "Access Denied",
    "not-found": "Page Not Found",
    "test-db": "Database Test",
    "timeline": "Project Timeline",
    "gantt": "Gantt Chart",
    "whatsapp": "WhatsApp Integration",
    "auth": "Authentication",
    "api": "API Routes",
  };

  return quickbomFallbackRoutes[lastSegment] ||
         lastSegment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DashboardHeader() {
  const pathname = usePathname();
  const title = generateTitleFromPathname(pathname);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Load zoom level from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedZoom = localStorage.getItem("dashboard-zoom");
      if (savedZoom) {
        const zoom = parseInt(savedZoom, 10);
        setZoomLevel(zoom);
        applyZoom(zoom);
      }
    }
  }, []);

  const applyZoom = (zoom: number) => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      html.style.zoom = `${zoom}%`;
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(200, zoomLevel + 10);
    setZoomLevel(newZoom);
    applyZoom(newZoom);
    if (typeof window !== 'undefined') {
      localStorage.setItem("dashboard-zoom", newZoom.toString());
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(50, zoomLevel - 10);
    setZoomLevel(newZoom);
    applyZoom(newZoom);
    if (typeof window !== 'undefined') {
      localStorage.setItem("dashboard-zoom", newZoom.toString());
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b bg-white dark:bg-gray-950 px-4 md:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="hidden lg:flex" />
        <SidebarTrigger className="lg:hidden" />
        <Separator orientation="vertical" className="h-8" />
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">
          {title}
        </h1>
        <Separator orientation="vertical" className="h-8" />
        <RealtimeClockWithRefresh />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoom In">
          <ZoomIn className="h-4 w-4" />
        </Button>
       
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" title="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

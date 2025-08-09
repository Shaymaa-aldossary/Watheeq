import { Link, useLocation } from "react-router-dom";
import { Shield, Settings, Users, FileText, Search, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
  userRole: "admin" | "user";
}

export default function Layout({ children, userRole }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  const adminNavItems = [
    { path: "/admin", icon: Home, label: "Dashboard" },
    { path: "/admin/tools", icon: Settings, label: "Tool Management" },
    { path: "/admin/requests", icon: Users, label: "User Requests" },
    { path: "/admin/reports", icon: FileText, label: "Usage Reports" },
    { path: "/admin/cve-search", icon: Search, label: "CVE Search" },
  ];

  const userNavItems = [
    { path: "/user", icon: Home, label: "Dashboard" },
    { path: "/user/tools", icon: Settings, label: "Available Tools" },
    { path: "/user/request", icon: FileText, label: "Request Tool" },
    { path: "/user/report", icon: FileText, label: "Usage Report" },
    { path: "/user/previous-reports", icon: FileText, label: "Previous Reports" },
  ];

  const navItems = userRole === "admin" ? adminNavItems : userNavItems;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        "bg-card border-r border-border transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img src="/watheeqlogo.png" alt="Watheeq Logo" className="h-8 w-8 text-primary" />
            {sidebarOpen && (
              <div>
                <h1 className="text-xl font-bold text-foreground">Watheeq</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {userRole} Portal
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    !sidebarOpen && "px-3"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {sidebarOpen && item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full"
          >
            {sidebarOpen ? "Collapse" : "Expand"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Watheeq - Security Tool Management
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Logged in as: <span className="font-medium text-foreground">
                  {user?.name || (userRole === "admin" ? "Administrator" : "Security Analyst")}
                </span>
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

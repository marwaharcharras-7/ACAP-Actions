import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  Shield,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const adminNavItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard Admin" },
  { path: "/admin/users", icon: Users, label: "Gestion des utilisateurs" },
  { path: "/admin/organization", icon: Building2, label: "Organisation" },
  { path: "/admin/files", icon: FileText, label: "Fichiers" },
  { path: "/admin/roles", icon: Shield, label: "Rôles & Permissions" },
  { path: "/admin/settings", icon: Settings, label: "Paramètres" },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn("flex items-center h-16 px-4 border-b border-border/40", collapsed ? "justify-center" : "gap-3")}
      >
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">ACAP</span>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">Admin Panel</span>
            <span className="text-xs text-muted-foreground">Gestion globale</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {adminNavItems.map((item) => {
          const isActive =
            location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                collapsed && "justify-center px-2",
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button - desktop only */}
      <div className="hidden md:block p-3 border-t border-border/40">
        <Button variant="ghost" size="sm" className="w-full justify-center" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 flex w-full">
      {/* Desktop Sidebar - Fixed */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-card border-r border-border/40 shadow-sm transition-all duration-300 h-screen fixed top-0 left-0 z-40",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content - with left margin for fixed sidebar */}
      <div className={cn("flex-1 flex flex-col min-w-0", collapsed ? "md:ml-16" : "md:ml-64")}>
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border/40 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-9 w-64 bg-muted/50 border-0 focus-visible:ring-1" />
            </div>
          </div>

          <div className="flex items-center gap-3">

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">Administrateur</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/profile")}>Mon profil</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;

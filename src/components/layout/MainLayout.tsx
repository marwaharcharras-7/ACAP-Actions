import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  Building2,
  Settings,
  LogOut,
  Shield,
  ChevronRight,
  User,
  Menu,
  X,
  FileText,
  BarChart3,
  UserCog,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
    roles: ["manager", "supervisor", "team_leader", "operator"],
  },
  {
    icon: ClipboardList,
    label: "Actions",
    href: "/actions",
    roles: ["manager", "supervisor", "team_leader", "operator"],
  },
  {
    icon: Calendar,
    label: "Calendrier",
    href: "/calendar",
    roles: ["manager", "supervisor", "team_leader", "operator"],
  },
  {
    icon: BarChart3,
    label: "Suivi",
    href: "/team-tracking",
    roles: ["manager", "supervisor", "team_leader"],
  },
  {
    icon: Archive,
    label: "Archives",
    href: "/archived-actions",
    roles: ["manager", "supervisor", "team_leader", "operator"],
  },
  {
    icon: Users,
    label: "Utilisateurs",
    href: "/admin/users",
    roles: ["admin"],
  },
  {
    icon: Building2,
    label: "Organisation",
    href: "/admin/organization",
    roles: ["admin"],
  },
  {
    icon: FileText,
    label: "Fichiers",
    href: "/admin/files",
    roles: ["admin"],
  },
  {
    icon: UserCog,
    label: "Rôles",
    href: "/admin/roles",
    roles: ["admin"],
  },
  {
    icon: Settings,
    label: "Paramètres",
    href: "/admin/settings",
    roles: ["admin"],
  },
];

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredNavItems = navItems.filter((item) => user && item.roles.includes(user.role));

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen flex bg-background overflow-x-hidden max-w-[100vw]">
      {/* Sidebar - Desktop - Fixed */}
      <aside className="hidden lg:flex w-64 flex-col gradient-sidebar border-r border-sidebar-border h-screen fixed top-0 left-0 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-sidebar-primary" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground">ACAP Platform</h1>
            <p className="text-xs text-sidebar-foreground/60">Qualité & Performance</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive =
              location.pathname === item.href ||
              (item.href !== "/dashboard" && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-sidebar-accent/50">
            <Avatar className="h-10 w-10 border-2 border-sidebar-primary/30">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
                {user && getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sidebar-foreground text-sm truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{user && ROLE_LABELS[user.role]}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col gradient-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-sidebar-primary" />
            </div>
            <span className="font-bold text-sidebar-foreground">ACAP Platform</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={logout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Main content - with left margin for fixed sidebar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden lg:ml-64">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-foreground">
                {filteredNavItems.find((item) => location.pathname.startsWith(item.href))?.label || "Dashboard"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                      {user && getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="font-medium text-sm">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-primary mt-1">{user && ROLE_LABELS[user.role]}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-danger cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;

import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Building2, BadgePercent, Briefcase, HeartHandshake, BarChart3, FileText, LifeBuoy, Settings, Wrench, Target, ShieldCheck, TrendingUp, Activity, Upload } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAdminSession } from "@/hooks/useAdminSession";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<any>;
  roles?: ReadonlyArray<string>;
};

const navItems: ReadonlyArray<NavItem> = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Pending Verifications", url: "/admin/pending-verifications", icon: ShieldCheck, roles: ["SuperAdmin", "SupportAgent"] },
  { title: "Users", url: "/admin/users", icon: Users, roles: ["SuperAdmin", "SupportAgent", "ContentEditor"] },
  { title: "Companies", url: "/admin/companies", icon: Building2, roles: ["SuperAdmin", "SupportAgent", "CompanyAdmin", "ContentEditor"] },
  { title: "Plans & Seats", url: "/admin/plans", icon: BadgePercent, roles: ["SuperAdmin", "CompanyAdmin", "SupportAgent"] },
  { title: "Plan Management", url: "/admin/plans/manage", icon: BadgePercent, roles: ["SuperAdmin"] },
  { title: "Jobs", url: "/admin/jobs", icon: Briefcase, roles: ["SuperAdmin", "SupportAgent"] },
  { title: "Matches", url: "/admin/matches", icon: HeartHandshake, roles: ["SuperAdmin", "SupportAgent"] },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "User Analytics", url: "/admin/user-analytics", icon: Activity, roles: ["SuperAdmin", "SupportAgent"] },
  { title: "Company Analytics", url: "/admin/company-analytics", icon: TrendingUp, roles: ["SuperAdmin", "SupportAgent"] },
  { title: "Content", url: "/admin/content", icon: FileText, roles: ["SuperAdmin", "ContentEditor", "SupportAgent"] },
  { title: "Blog", url: "/admin/blog", icon: FileText, roles: ["SuperAdmin", "ContentEditor", "SupportAgent"] },
  { title: "Blog Bulk Upload", url: "/admin/blog/bulk-upload", icon: Upload, roles: ["SuperAdmin", "ContentEditor"] },
  { title: "Bulk Import", url: "/admin/bulk-import", icon: Upload, roles: ["SuperAdmin"] },
  { title: "Support", url: "/admin/support", icon: LifeBuoy },
  { title: "Tools", url: "/admin/tools", icon: Wrench, roles: ["SuperAdmin", "ContentEditor", "SupportAgent"] },
  { title: "Admin Settings", url: "/admin/settings", icon: Settings, roles: ["SuperAdmin"] },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { role } = useAdminSession();

  const canSee = (item: typeof navItems[number]) => {
    if (!item.roles) return true;
    return !!role && (item.roles as readonly string[]).includes(role);
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.filter(canSee).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={({ isActive }) => isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default AdminSidebar;

import { LayoutDashboard, Rocket, Sparkles, FolderOpen, ShieldCheck, Settings } from "lucide-react";

export const PRIMARY_NAV = [
  { name: "Översikt", href: "/dashboard", icon: LayoutDashboard },
  { name: "Kampanjer", href: "/campaigns", icon: Rocket },
  { name: "Skapa", href: "/create", icon: Sparkles },
  { name: "Bibliotek", href: "/library", icon: FolderOpen },
  { name: "Granskningar", href: "/qa", icon: ShieldCheck },
];
export const SETTINGS_NAV = { name: "Inställningar", href: "/settings", icon: Settings };
export function isNavActive(href: string, pathname: string): boolean {
  if (href === "/library" && ["/templates", "/dam", "/produce", "/create/master"].some(p => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (href === "/campaigns" && ["/create/brief", "/campaign-planner", "/localization"].some(p => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (href === "/settings" && pathname.startsWith("/personas")) return true;
  if (href === "/create" && (pathname.startsWith("/create/brief") || pathname.startsWith("/create/master"))) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

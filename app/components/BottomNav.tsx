"use client";

import { Wallet, Search, Plus, Home } from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BottomNav: React.FC = () => {
  const colors = useThemeColors();
  const pathname = usePathname();

  // Only show BottomNav on main tab pages
  const showOnRoutes = ["/dashboard", "/browse", "/create", "/savings"];
  const shouldShow =
    showOnRoutes.includes(pathname) || pathname.startsWith("/dashboard/");

  if (!shouldShow) return null;

  const navItems = [
    { id: "dashboard", icon: Home, label: "Home", route: "/dashboard" },
    { id: "browse", icon: Search, label: "Browse", route: "/browse" },
    { id: "create", icon: Plus, label: "Create", route: "/create" },
    { id: "savings", icon: Wallet, label: "Savings", route: "/savings" },
  ];

  const isActive = (route: string) => {
    if (route === "/dashboard") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    }
    return pathname === route;
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t z-40 pb-safe"
      style={{
        backgroundColor: `${colors.surface}F2`,
        borderColor: colors.border,
      }}
    >
      <div className="flex justify-around items-center max-w-7xl mx-auto px-1 sm:px-2 py-2 sm:py-3">
        {navItems.map((item) => {
          const active = isActive(item.route);
          return (
            <Link
              href={item.route}
              key={item.id}
              className="flex flex-col items-center gap-0.5 sm:gap-1 p-1 sm:p-2 rounded-xl sm:rounded-2xl transition-all duration-300 flex-1 active:scale-90 min-w-0"
              style={
                active
                  ? {
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }
                  : { color: colors.text, opacity: 0.5 }
              }
            >
              <item.icon
                className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px]"
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={`text-[9px] sm:text-[10px] font-bold truncate w-full text-center ${active ? "opacity-100" : "opacity-70"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;

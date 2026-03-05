"use client";

import { Wallet, Search, Plus, Home } from "lucide-react";
import { useThemeColors } from "@/app/hooks/useThemeColors";
import Link from "next/link";
import { usePathname } from "next/navigation";

const BottomNav: React.FC = () => {
  const colors = useThemeColors();
  const pathname = usePathname();

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
      <div className="flex justify-around items-center max-w-7xl mx-auto px-2 py-3">
        {navItems.map((item) => {
          const active = isActive(item.route);
          return (
            <Link
              href={item.route}
              key={item.id}
              className="flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 flex-1 active:scale-90"
              style={
                active
                  ? {
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }
                  : { color: colors.text, opacity: 0.5 }
              }
            >
              <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span
                className={`text-[10px] font-bold ${active ? "opacity-100" : "opacity-70"}`}
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

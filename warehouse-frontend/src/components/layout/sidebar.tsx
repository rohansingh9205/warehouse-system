"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Boxes,
  PlusCircle,
  Users,
  QrCode,
  ScrollText,
  ShieldCheck,
  UserCircle,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
  { href: "/dashboard/products/add", label: "Add Product", icon: PlusCircle, superAdminOnly: true },
  { href: "/dashboard/admin-users", label: "Admin Users", icon: Users, superAdminOnly: true },
  { href: "/dashboard/payment-qr", label: "Payment QR", icon: QrCode },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: ScrollText, superAdminOnly: true },
  { href: "/dashboard/security", label: "Security", icon: ShieldCheck, superAdminOnly: true },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Server-side authorization is what actually matters (see product.routes.ts
  // etc.) — hiding nav items here is only a UX convenience.
  const visibleItems = NAV_ITEMS.filter((item) => !item.superAdminOnly || user?.role === "SUPER_ADMIN");

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-neutral-200 bg-white">
      <div className="px-6 py-5">
        <p className="text-lg font-semibold text-brand-700">Silk Warehouse</p>
        <p className="text-xs text-neutral-400">Inventory Management</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {visibleItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-200 p-4">
        <p className="truncate text-sm font-medium text-neutral-800">{user?.name}</p>
        <p className="truncate text-xs text-neutral-400">{user?.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</p>
        <button
          onClick={() => logout()}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </aside>
  );
}

"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathName = usePathname();

  const routes = [
    {
      href: `/dashboard/settings`,
      label: "Настройки",
      active: pathName === `/dashboard/settings`,
    },
    {
      href: `/dashboard/events`,
      label: "События",
      active: pathName === `/dashboard/events`,
    },
    {
      href: `/dashboard/categories`,
      label: "Категории",
      active: pathName === `/dashboard/events`,
    },
  ];

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)}>
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            route.active
              ? "text-black dark:text-white"
              : "text-muted-foreground",
          )}
        >
          {route.label}
        </Link>
      ))}
    </nav>
  );
}

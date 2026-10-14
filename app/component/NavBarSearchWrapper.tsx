"use client";

import { usePathname } from "next/navigation";
import NavbarSearch from "./NavBarSearch";

export default function NavbarSearchWrapper() {
  const pathname = usePathname();

  if (pathname !== "/") {
    return null;
  }

  return (
    <div className="flex-1 max-w-md mx-6">
      <NavbarSearch />
    </div>
  );
}

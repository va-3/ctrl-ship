"use client";

import { usePathname } from "next/navigation";
import NavBar from "./NavBar";

/**
 * Conditionally renders the global NavBar.
 * Hidden on workspace routes (which have their own WorkspaceNav).
 */
export default function NavBarWrapper() {
  const pathname = usePathname();

  // Hide global nav inside workspace
  if (pathname.startsWith("/workspace")) {
    return null;
  }

  return <NavBar />;
}

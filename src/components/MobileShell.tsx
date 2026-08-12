"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function MobileShell({ company, children }: { company?: any, children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="shell">
      <Sidebar 
        company={company} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      <div className="main">
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        {children}
      </div>
    </div>
  );
}

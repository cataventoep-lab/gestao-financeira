"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconLogo, IconDash, IconList, IconBill, IconTag, IconChart, IconCog } from "./Icons";

export function Sidebar({ company, isOpen, onClose }: { company?: any, isOpen?: boolean, onClose?: () => void }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: <IconDash /> },
    { href: "/lancamentos", label: "Lançamentos", icon: <IconList /> },
    { href: "/contas", label: "Contas a pagar", icon: <IconBill /> },
    { href: "/categorias", label: "Categorias", icon: <IconTag /> },
    { href: "/relatorios", label: "Relatórios", icon: <IconChart /> },
    { href: "/config", label: "Configurações", icon: <IconCog /> },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="brand">
        {company?.logo ? (
          <img src={company.logo} alt="Logo" className="brand-mark" style={{ objectFit: "cover" }} />
        ) : (
          <div className="brand-mark"><IconLogo /></div>
        )}
        <div>
          <div className="brand-name">Gestão Financeira</div>
          <div className="brand-sub">{company?.name || "Minha empresa"}</div>
        </div>
      </div>
      <nav className="nav">
        <div className="nav-label">Menu</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              {item.icon} {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        SaaS de Gestão Financeira.<br />Gerencie seus dados com segurança.
      </div>
    </aside>
    </>
  );
}

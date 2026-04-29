'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  Megaphone,
  Package,
  ScrollText,
  Settings,
  Shield,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Incidents', href: '/incidents', icon: AlertTriangle },
  { label: 'Problems', href: '/problems', icon: FlaskConical },
  { label: 'Changes', href: '/changes', icon: GitBranch },
  { label: 'Requests', href: '/requests', icon: Megaphone },
  { label: 'CMDB', href: '/cmdb', icon: Boxes },
  { label: 'SLA', href: '/sla', icon: Zap },
  { label: 'Knowledge', href: '/knowledge', icon: FileText },
  { label: 'Finance', href: '/finance', icon: CreditCard },
  { label: 'Procurement', href: '/procurement', icon: ShoppingCart },
  { label: 'Inventory', href: '/inventory', icon: Warehouse },
  { label: 'Vendors', href: '/vendors', icon: Truck },
  { label: 'Workforce', href: '/workforce', icon: Users },
  { label: 'Billing', href: '/billing', icon: ScrollText },
  { label: 'Admin', href: '/admin', icon: Shield },
  { label: 'Audit', href: '/audit', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-full flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          aria-label="OrionOps Home"
        >
          <Package className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          {!collapsed && (
            <span className="text-lg font-bold text-foreground">OrionOps</span>
          )}
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto p-2" role="list">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href} role="listitem">
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus-visible:outline-none focus-visible:ring-[var(--focus-width)] focus-visible:ring-ring',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge !== undefined && (
                    <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-2xs text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span className="ml-2">Collapse</span>
            </>
          )}
        </Button>
      </div>

      {/* Keyboard shortcuts hint */}
      {!collapsed && (
        <div className="border-t p-3">
          <p className="text-2xs text-muted-foreground">
            Press <kbd className="rounded border bg-muted px-1 text-xs">Ctrl+B</kbd> to toggle sidebar
          </p>
        </div>
      )}
    </aside>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Keyboard,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Eye,
  Menu,
} from 'lucide-react';
import { auth } from '@/lib/api';
import { useNotifications, useMarkAllNotificationsRead } from '@/lib/hooks';
import { useTheme, type Theme } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [_searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shortcutsVisible, setShortcutsVisible] = useState(false);
  const { getTheme, setTheme } = useTheme();
  const currentTheme = getTheme();

  const { data: notifications } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleThemeToggle = useCallback(() => {
    const themes: Theme[] = ['light', 'dark', 'high-contrast'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  }, [currentTheme, setTheme]);

  const handleLogout = useCallback(() => {
    auth.clearTokens();
    window.location.href = auth.getLogoutUrl();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            handleToggleSidebar();
            break;
          case 'k':
            e.preventDefault();
            setSearchOpen(true);
            break;
          case '/':
            e.preventDefault();
            setShortcutsVisible((prev) => !prev);
            break;
        }
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setShortcutsVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleSidebar]);

  return (
    <div className="min-h-screen bg-background">
        <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />

        <div
          className={cn(
            'transition-all duration-300',
            sidebarCollapsed ? 'ml-16' : 'ml-64'
          )}
        >
          <header
            className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            role="banner"
          >
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={handleToggleSidebar}
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex-1">
              <div className="relative max-w-md">
                <Search
                  className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  placeholder="Search anything... (Ctrl+K)"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  aria-label="Global search"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              aria-label={`Current theme: ${currentTheme}. Click to switch.`}
              title={`Theme: ${currentTheme}`}
            >
              {currentTheme === 'dark' ? (
                <Moon className="h-4 w-4" aria-hidden="true" />
              ) : currentTheme === 'high-contrast' ? (
                <Eye className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShortcutsVisible(!shortcutsVisible)}
              aria-label="Show keyboard shortcuts"
            >
              <Keyboard className="h-4 w-4" aria-hidden="true" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label={`Notifications: ${unreadCount} unread`}
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="danger"
                      className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary"
                      onClick={() => markAllRead.mutate()}
                    >
                      Mark all read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem key={notification.id}>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">
                          {notification.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {notification.message}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                  aria-label="User menu"
                >
                  <Avatar fallbackText="User" className="h-8 w-8" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">OrionOps User</p>
                    <p className="text-xs text-muted-foreground">
                      user@orionops.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <User className="mr-2 h-4 w-4" aria-hidden="true" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main
            id="main-content"
            className="p-6"
            role="main"
            aria-label="Main content"
          >
            {children}
          </main>
        </div>

        {shortcutsVisible && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShortcutsVisible(false)}
            role="dialog"
            aria-label="Keyboard shortcuts"
            aria-modal="true"
          >
            <div
              className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-lg font-semibold">Keyboard Shortcuts</h2>
              <div className="space-y-2">
                {[
                  ['Ctrl + B', 'Toggle sidebar'],
                  ['Ctrl + K', 'Open search'],
                  ['Ctrl + /', 'Show shortcuts'],
                  ['Escape', 'Close dialog/overlay'],
                ].map(([key, desc]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-sm text-muted-foreground">{desc}</span>
                    <kbd className="rounded border bg-muted px-2 py-0.5 text-xs font-mono">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setShortcutsVisible(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
  );
}

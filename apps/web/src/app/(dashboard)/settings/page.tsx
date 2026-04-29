'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const [tab, setTab] = useState<'profile' | 'preferences' | 'notifications'>('profile');
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>(
    (typeof window !== 'undefined' && document.documentElement.getAttribute('data-theme') as any) || 'light'
  );

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'high-contrast') => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('orionops-theme', newTheme);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="flex gap-2" role="tablist" aria-label="Settings sections">
        {(['profile', 'preferences', 'notifications'] as const).map((t) => (
          <Button
            key={t}
            variant={tab === t ? 'default' : 'outline'}
            onClick={() => setTab(t)}
            role="tab"
            aria-selected={tab === t}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="first-name" className="text-sm font-medium">First Name</label>
                <Input id="first-name" placeholder="Enter first name" />
              </div>
              <div className="space-y-2">
                <label htmlFor="last-name" className="text-sm font-medium">Last Name</label>
                <Input id="last-name" placeholder="Enter last name" />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input id="email" type="email" placeholder="your@email.com" disabled />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
              </div>
              <div className="space-y-2">
                <label htmlFor="department" className="text-sm font-medium">Department</label>
                <Input id="department" placeholder="Engineering" />
              </div>
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Job Title</label>
                <Input id="title" placeholder="Senior Engineer" />
              </div>
            </div>
            <Button>Save Profile</Button>
          </CardContent>
        </Card>
      )}

      {tab === 'preferences' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {(['light', 'dark', 'high-contrast'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      theme === t
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                    aria-label={`Select ${t} theme`}
                    aria-pressed={theme === t}
                  >
                    <div
                      className={`mb-2 h-8 rounded ${
                        t === 'light' ? 'bg-gray-100 border border-gray-300' :
                        t === 'dark' ? 'bg-gray-800 border border-gray-600' :
                        'bg-black border-2 border-white'
                      }`}
                    />
                    <p className="font-medium capitalize">{t.replace('-', ' ')}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t === 'light' && 'Standard light interface'}
                      {t === 'dark' && 'Reduced eye strain for low light'}
                      {t === 'high-contrast' && 'Maximum visibility, WCAG AAA contrast'}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Display</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="timezone" className="text-sm font-medium">Timezone</label>
                  <Input id="timezone" defaultValue="UTC" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium">Language</label>
                  <select
                    id="language"
                    className="w-full rounded-md border px-3 py-2"
                    aria-label="Select language"
                  >
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { channel: 'in_app', label: 'In-App Notifications', desc: 'Alerts in the notification bell icon' },
                { channel: 'email', label: 'Email Notifications', desc: 'Receive email for important events' },
                { channel: 'push', label: 'Push Notifications', desc: 'Mobile push for escalations and approvals' },
              ].map(({ channel, label, desc }) => (
                <div key={channel} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">{desc}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" aria-label={`Toggle ${label}`} />
                    <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              ))}
              <div className="pt-4 space-y-3">
                <p className="font-medium">Notify me about:</p>
                {[
                  'Incident assigned to me',
                  'SLA breach warnings',
                  'Change approval requests',
                  'New comments on my tickets',
                  'Escalation notifications',
                  'Major incident alerts',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`notify-${item.toLowerCase().replace(/\s+/g, '-')}`}
                      defaultChecked
                      className="h-4 w-4 rounded border-2"
                    />
                    <label htmlFor={`notify-${item.toLowerCase().replace(/\s+/g, '-')}`} className="text-sm">
                      {item}
                    </label>
                  </div>
                ))}
              </div>
              <Button>Save Notification Preferences</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

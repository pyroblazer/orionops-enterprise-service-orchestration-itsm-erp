'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User as UserIcon, Settings as SettingsIcon, Bell, Check } from 'lucide-react';
import { api } from '@/lib/api';
import type { User } from '@/lib/api';

const NOTIFICATION_EVENTS = [
  'incident_assigned', 'sla_breach_warning', 'change_approval',
  'new_comments', 'escalation', 'major_incident',
] as const;

const NOTIFICATION_LABELS: Record<string, string> = {
  incident_assigned: 'Incident assigned to me',
  sla_breach_warning: 'SLA breach warnings',
  change_approval: 'Change approval requests',
  new_comments: 'New comments on my tickets',
  escalation: 'Escalation notifications',
  major_incident: 'Major incident alerts',
};

const CHANNELS = ['in_app', 'email', 'push'] as const;
const CHANNEL_LABELS: Record<string, { label: string; desc: string }> = {
  in_app: { label: 'In-App Notifications', desc: 'Alerts in the notification bell icon' },
  email: { label: 'Email Notifications', desc: 'Receive email for important events' },
  push: { label: 'Push Notifications', desc: 'Mobile push for escalations and approvals' },
};

export default function SettingsPage() {
  const qc = useQueryClient();
  const [theme, setTheme] = useState<'light' | 'dark' | 'high-contrast'>(
    (typeof window !== 'undefined' && document.documentElement.getAttribute('data-theme') as 'light' | 'dark' | 'high-contrast') || 'light'
  );
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '', department: '' });
  const [prefForm, setPrefForm] = useState({ timezone: 'UTC', language: 'en' });
  const [saveMsg, setSaveMsg] = useState('');

  // Notification toggles: channel → enabled
  const [channels, setChannels] = useState<Record<string, boolean>>({
    in_app: true, email: true, push: false,
  });
  // Notification events: event → enabled
  const [events, setEvents] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_EVENTS.map(e => [e, true]))
  );

  const { data: meData } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.getCurrentUser().then(r => r.data.data),
  });

  useEffect(() => {
    if (meData) {
      setProfileForm({
        firstName: meData.firstName ?? '',
        lastName: meData.lastName ?? '',
        phone: meData.phone ?? '',
        department: meData.department ?? '',
      });
      const prefs = meData.preferences;
      if (prefs) {
        if (prefs.timezone) setPrefForm(f => ({ ...f, timezone: prefs.timezone }));
        if (prefs.language) setPrefForm(f => ({ ...f, language: prefs.language }));
      }
    }
  }, [meData]);

  const saveProfile = useMutation({
    mutationFn: () => api.updateUser(meData?.id ?? '', {
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      phone: profileForm.phone,
      department: profileForm.department,
    }),
    onSuccess: () => { setSaveMsg('Profile saved.'); setTimeout(() => setSaveMsg(''), 3000); },
  });

  const savePrefs = useMutation({
    mutationFn: () => api.updateUser(meData?.id ?? '', {
      preferences: { timezone: prefForm.timezone, language: prefForm.language },
    } as Partial<User>),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['me'] }); setSaveMsg('Preferences saved.'); setTimeout(() => setSaveMsg(''), 3000); },
  });

  const saveNotifications = useMutation({
    mutationFn: () => api.updateUser(meData?.id ?? '', {
      preferences: Object.assign(meData?.preferences ?? {}, { channels: Object.keys(channels).filter(k => channels[k]), events: Object.keys(events).filter(k => events[k]) }),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['me'] }); setSaveMsg('Notification preferences saved.'); setTimeout(() => setSaveMsg(''), 3000); },
  });

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'high-contrast') => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('orionops-theme', newTheme);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight gradient-text">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile, preferences, and notifications</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile"><UserIcon className="mr-1 h-4 w-4" /> Profile</TabsTrigger>
          <TabsTrigger value="preferences"><SettingsIcon className="mr-1 h-4 w-4" /> Preferences</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-1 h-4 w-4" /> Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="First Name" placeholder="Enter first name" value={profileForm.firstName} onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))} />
                <Input label="Last Name" placeholder="Enter last name" value={profileForm.lastName} onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))} />
                <Input label="Email" type="email" value={meData?.email ?? ''} disabled />
                <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                <Input label="Department" placeholder="Engineering" value={profileForm.department} onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <Button disabled={saveProfile.isPending || !meData} onClick={() => saveProfile.mutate()}>
                  <Check className="mr-1 h-4 w-4" /> Save Profile
                </Button>
                {saveMsg && <p className="text-sm text-success">{saveMsg}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {(['light', 'dark', 'high-contrast'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => handleThemeChange(t)}
                    className={`rounded-lg border-2 p-4 text-left transition-colors ${
                      theme === t ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'
                    }`}
                    aria-label={`Select ${t} theme`}
                    aria-pressed={theme === t}
                  >
                    <div className={`mb-2 h-8 rounded ${
                      t === 'light' ? 'bg-gray-100 border border-gray-300' :
                      t === 'dark' ? 'bg-gray-800 border border-gray-600' :
                      'bg-black border-2 border-white'
                    }`} />
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
            <CardHeader><CardTitle>Display</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Timezone" value={prefForm.timezone} onChange={e => setPrefForm(f => ({ ...f, timezone: e.target.value }))} placeholder="e.g., UTC, America/New_York" />
                <div className="space-y-1">
                  <label htmlFor="language" className="text-sm font-medium">Language</label>
                  <select id="language" className="w-full rounded-md border px-3 py-2 bg-background" value={prefForm.language} onChange={e => setPrefForm(f => ({ ...f, language: e.target.value }))} aria-label="Select language">
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => savePrefs.mutate()} disabled={savePrefs.isPending}>
                  <Check className="mr-1 h-4 w-4" /> Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {CHANNELS.map((channel) => (
                <div key={channel} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{CHANNEL_LABELS[channel].label}</p>
                    <p className="text-sm text-muted-foreground">{CHANNEL_LABELS[channel].desc}</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={channels[channel] ?? false}
                      onChange={(e) => setChannels(c => ({ ...c, [channel]: e.target.checked }))}
                      className="peer sr-only"
                      aria-label={`Toggle ${CHANNEL_LABELS[channel].label}`}
                    />
                    <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>
              ))}
              <div className="pt-4 space-y-3">
                <p className="font-medium">Notify me about:</p>
                {NOTIFICATION_EVENTS.map((event) => (
                  <div key={event} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`notify-${event}`}
                      checked={events[event] ?? true}
                      onChange={(e) => setEvents(ev => ({ ...ev, [event]: e.target.checked }))}
                      className="h-4 w-4 rounded border-2"
                    />
                    <label htmlFor={`notify-${event}`} className="text-sm">{NOTIFICATION_LABELS[event]}</label>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => saveNotifications.mutate()} disabled={saveNotifications.isPending}>
                  <Check className="mr-1 h-4 w-4" /> Save Notification Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

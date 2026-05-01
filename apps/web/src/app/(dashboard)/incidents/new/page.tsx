'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateIncident } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Paperclip, X } from 'lucide-react';
import Link from 'next/link';

export default function NewIncidentPage() {
  const router = useRouter();
  const createIncident = useCreateIncident();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    serviceId: '',
    configurationItemId: '',
    assignedTo: '',
    tags: '',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const result = await createIncident.mutateAsync({
        ...formData,
        priority: formData.priority as import('@/lib/api').Priority,
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      router.push(`/incidents/${result.id}`);
    } catch {
      setErrors({ submit: 'Failed to create incident. Please try again.' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/incidents">
          <Button variant="ghost" size="icon" aria-label="Back to incidents">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Incident</h1>
          <p className="text-muted-foreground">Report a new incident</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Incident Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Title *"
                  placeholder="Brief summary of the incident"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  error={errors.title}
                  aria-required="true"
                />
                <Textarea
                  label="Description *"
                  placeholder="Detailed description of what happened, including steps to reproduce if applicable"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  error={errors.description}
                  aria-required="true"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    value={formData.category}
                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger label="Category *">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="network">Network</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="access">Access / Permissions</SelectItem>
                      <SelectItem value="email">Email / Communication</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.priority}
                    onValueChange={(v) => setFormData({ ...formData, priority: v })}
                  >
                    <SelectTrigger label="Priority *">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.category && <p className="text-sm text-danger">{errors.category}</p>}
                {errors.priority && <p className="text-sm text-danger">{errors.priority}</p>}
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      <Paperclip className="mr-1 h-4 w-4" />
                      Add Files
                    </Button>
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                      aria-label="Upload file attachments"
                    />
                  </div>
                  {attachments.length > 0 && (
                    <ul className="space-y-2" aria-label="Selected files">
                      {attachments.map((file, index) => (
                        <li key={index} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                          <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                            aria-label={`Remove ${file.name}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service & Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={formData.serviceId}
                  onValueChange={(v) => setFormData({ ...formData, serviceId: v })}
                >
                  <SelectTrigger label="Affected Service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="svc-1">Email Service</SelectItem>
                    <SelectItem value="svc-2">VPN Service</SelectItem>
                    <SelectItem value="svc-3">Web Application</SelectItem>
                    <SelectItem value="svc-4">Database Service</SelectItem>
                    <SelectItem value="svc-5">File Storage</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={formData.configurationItemId}
                  onValueChange={(v) => setFormData({ ...formData, configurationItemId: v })}
                >
                  <SelectTrigger label="Configuration Item">
                    <SelectValue placeholder="Select CI" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ci-1">PROD-WEB-01</SelectItem>
                    <SelectItem value="ci-2">PROD-DB-01</SelectItem>
                    <SelectItem value="ci-3">PROD-APP-01</SelectItem>
                    <SelectItem value="ci-4">NETWORK-SW-01</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(v) => setFormData({ ...formData, assignedTo: v })}
                >
                  <SelectTrigger label="Assign To">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user-1">Jane Smith</SelectItem>
                    <SelectItem value="user-2">John Doe</SelectItem>
                    <SelectItem value="user-3">Alice Johnson</SelectItem>
                    <SelectItem value="user-4">Bob Williams</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  label="Tags"
                  placeholder="Comma-separated tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  helperText="Separate tags with commas"
                />
              </CardContent>
            </Card>

            {/* Submit */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {errors.submit && (
                    <p className="text-sm text-danger" role="alert">
                      {errors.submit}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createIncident.isPending}
                    aria-busy={createIncident.isPending}
                  >
                    {createIncident.isPending ? 'Creating...' : 'Create Incident'}
                  </Button>
                  <Link href="/incidents" className="block">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

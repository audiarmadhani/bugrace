'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getStoreProfileAction, updateStoreProfileAction } from '@/app/actions/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
};

export default function StoreProfilePage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState<string | null>(null);
  const [emailEditable, setEmailEditable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [cachedProfile, setCachedProfile] = useState<ProfileForm | null>(null);
  const [form, setForm] = useState<ProfileForm>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const profile = await getStoreProfileAction(cachedProfile);
      if (!mounted || !profile) {
        setLoading(false);
        return;
      }
      setUsername(profile.username);
      setPassword(profile.password ?? null);
      setEmailEditable(profile.emailEditable === true);
      const next = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      };
      setForm(next);
      if (!cachedProfile) {
        setCachedProfile(next);
      }
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [cachedProfile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await updateStoreProfileAction(form);
    setSubmitting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Profile updated successfully.');
    const refreshed = await getStoreProfileAction(cachedProfile);
    if (refreshed) {
      const next = {
        firstName: refreshed.firstName,
        lastName: refreshed.lastName,
        email: refreshed.email,
      };
      setForm(next);
      setCachedProfile(next);
      setPassword(refreshed.password ?? null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} disabled className="bg-gray-50" />
            </div>
            {password !== null && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" value={password} disabled className="bg-red-50 font-mono" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                disabled={!emailEditable}
                className={!emailEditable ? 'bg-gray-50' : undefined}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              {!emailEditable && (
                <p className="text-xs text-gray-500">Contact support to change your email.</p>
              )}
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

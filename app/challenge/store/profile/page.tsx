'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { getStoreProfileAction, updateStoreProfileAction } from '@/app/actions/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email(),
});

type FormData = z.infer<typeof schema>;

export default function StoreProfilePage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [cachedProfile, setCachedProfile] = useState<FormData | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    let mounted = true;
    async function load() {
      const profile = await getStoreProfileAction(null);
      if (!mounted || !profile) {
        setLoading(false);
        return;
      }
      setUsername(profile.username);
      reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      });
      setCachedProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      });
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [reset]);

  async function onSubmit(data: FormData) {
    const result = await updateStoreProfileAction(data);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Profile updated successfully.');
    setCachedProfile(data);
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} disabled className="bg-gray-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" {...register('firstName')} />
              {errors.firstName && (
                <p className="text-xs text-red-600">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" {...register('lastName')} />
              {errors.lastName && (
                <p className="text-xs text-red-600">{errors.lastName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

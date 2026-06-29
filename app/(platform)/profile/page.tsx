'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createClient } from '@/lib/db/client';
import { updateProfileAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const schema = z.object({
  username: z.string().min(3),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      if (data) reset({ username: data.username });
      setLoading(false);
    }
    load();
  }, [reset]);

  async function onSubmit(data: FormData) {
    const result = await updateProfileAction(data.username);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Profile updated.');
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
          <CardDescription>Manage your BugRace account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" {...register('username')} />
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled className="bg-muted" />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

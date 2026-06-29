'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { submitBugAction } from '@/app/actions/auth';
import {
  BUG_PAGES,
  BUG_CATEGORIES,
  BUG_SEVERITIES,
} from '@/lib/constants';

const schema = z.object({
  pageFound: z.enum(BUG_PAGES),
  category: z.enum(BUG_CATEGORIES),
  severity: z.enum(BUG_SEVERITIES),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

type FormData = z.infer<typeof schema>;

export default function SubmitBugPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    const result = await submitBugAction(data);
    if (!result.success) {
      setError(result.error ?? 'Submission failed.');
      return;
    }
    toast.success(`Submitted! Score: ${result.score}/25 — Rank: #${result.rank ?? '—'}`);
    router.push('/dashboard');
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Submit Bug Report</CardTitle>
          <CardDescription>
            Document the bug you found. You may only submit once per day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</p>
            )}

            <div className="space-y-2">
              <Label>Page Found</Label>
              <Select
                value={watch('pageFound')}
                onValueChange={(v) => v && setValue('pageFound', v as FormData['pageFound'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {BUG_PAGES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.pageFound && (
                <p className="text-xs text-destructive">{errors.pageFound.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={watch('category')}
                onValueChange={(v) => v && setValue('category', v as FormData['category'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BUG_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={watch('severity')}
                onValueChange={(v) => v && setValue('severity', v as FormData['severity'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {BUG_SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.severity && (
                <p className="text-xs text-destructive">{errors.severity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="Describe the bug, steps to reproduce, and expected vs actual behavior..."
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Bug Report'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

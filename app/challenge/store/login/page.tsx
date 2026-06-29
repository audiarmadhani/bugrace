'use client';

import { useState } from 'react';
import { storeLoginAction } from '@/app/actions/store';
import { CHALLENGE_ACCOUNTS } from '@/data/challenge-accounts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const customerAccounts = Object.values(CHALLENGE_ACCOUNTS).filter((a) => a.role === 'customer');
const adminAccount = Object.values(CHALLENGE_ACCOUNTS).find((a) => a.role === 'admin');

export default function StoreLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await storeLoginAction(fd);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-emerald-700">ShopVerse</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="rememberMe" className="font-normal cursor-pointer">
                Remember me
              </Label>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 rounded-lg bg-emerald-50 border border-emerald-100 p-4 space-y-3 text-sm">
            <p className="font-semibold text-emerald-900">Test accounts</p>
            <div>
              <p className="text-emerald-800 mb-1">Customers</p>
              {customerAccounts.map((account) => (
                <p key={account.username} className="font-mono text-emerald-700">
                  {account.username} / {account.password}
                </p>
              ))}
            </div>
            {adminAccount && (
              <div>
                <p className="text-emerald-800 mb-1">Admin</p>
                <p className="font-mono text-emerald-700">
                  {adminAccount.username} / {adminAccount.password}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

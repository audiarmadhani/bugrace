import { QueryProvider } from '@/components/providers/QueryProvider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950 p-4">
        {children}
      </div>
    </QueryProvider>
  );
}

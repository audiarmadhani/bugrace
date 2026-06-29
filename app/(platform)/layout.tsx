import { PlatformNav } from '@/components/platform/PlatformNav';
import { QueryProvider } from '@/components/providers/QueryProvider';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-background">
        <PlatformNav />
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    </QueryProvider>
  );
}

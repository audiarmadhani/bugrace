import { redirect } from 'next/navigation';
import { getAppMode, getStoreLoginPath } from '@/lib/config/app';

export default function HomePage() {
  if (getAppMode() === 'store') {
    redirect(getStoreLoginPath());
  }
  redirect('/dashboard');
}

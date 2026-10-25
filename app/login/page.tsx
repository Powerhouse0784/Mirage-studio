import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import AuthForm from './AuthForm';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in — MIRAGE' };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/');
  return <AuthForm />;
}

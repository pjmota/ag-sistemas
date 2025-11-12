import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type AdminLayoutProps = Readonly<{ children: React.ReactNode }>;

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const h = await headers();
  const cookieHeader = h.get('cookie') ?? '';
  const token = cookieHeader
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('token='))
    ?.split('=')[1];
  if (!token) {
    redirect('/login');
  }
  return <>{children}</>;
}
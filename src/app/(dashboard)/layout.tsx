import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DashboardWrapper from '@/components/DashboardWrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="lg:pl-64">
        <Header user={user} />
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          <DashboardWrapper userName={user.name}>
            {children}
          </DashboardWrapper>
        </main>
      </div>
    </div>
  );
}


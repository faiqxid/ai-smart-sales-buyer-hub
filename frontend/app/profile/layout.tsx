'use client';

import { useEffect, useState } from 'react';
import { getUser } from '@/lib/auth';
import { SalesNav, BuyerNav } from '@/components/ui/shared';
import FcmRegister from '@/components/fcm-register';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (user) setRole(user.role);
  }, []);

  return (
    <>
      <FcmRegister />
      {children}
      {role === 'sales' && <SalesNav />}
      {role === 'buyer' && <BuyerNav />}
    </>
  );
}

import FcmRegister from '@/components/fcm-register';
import { SalesNav } from '@/components/ui/shared';

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FcmRegister />
      {children}
      <SalesNav />
    </>
  );
}

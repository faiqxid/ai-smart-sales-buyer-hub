import FcmRegister from '@/components/fcm-register';
import { BuyerNav } from '@/components/ui/shared';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FcmRegister />
      {children}
      <BuyerNav />
    </>
  );
}

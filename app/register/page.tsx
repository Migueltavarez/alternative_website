import { Navbar } from '@/components/navbar';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-20 px-4">
        <RegisterForm />
      </div>
    </div>
  );
}

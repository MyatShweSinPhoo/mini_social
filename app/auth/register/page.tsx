import RegisterForm from "../../component/auth/RegisterForm";
import { Suspense } from "react";
import Navbar from "@/app/component/navBar/nav";
export default function RegisterPage() {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col">
      {/* Navbar - ထိပ်ဆုံးတွင် အမြဲရှိနေမည် */}
      <Suspense>
        <Navbar />
      </Suspense>

      {/* Main Container - Screen အလယ်တည့်တည့်တွင် အပြည့်အဝ ပေါ်နေစေရန် */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl">
          <RegisterForm />
        </div>
      </main>
    </div>
  );
}

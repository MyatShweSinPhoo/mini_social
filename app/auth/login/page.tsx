import LoginForm from "../../component/auth/LoginForm";
import Navbar from "@/app/component/navBar/nav";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="w-full min-h-screen bg-white text-black flex flex-col">
      <Suspense>
        <Navbar />
      </Suspense>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {/* <div className="w-full max-w-md bg-[#48426D]/60 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl"> */}
        <LoginForm />
        {/* </div> */}
      </main>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoLogout() {
  const router = useRouter();

  useEffect(() => {
    // 5 စက္ကန့် (5000 milliseconds) ပြည့်ပါက အလုပ်လုပ်မည်
    const timer = setTimeout(
      () => {
        // 1. Browser ဘက်မှ token cookie ကို ဖျက်ထုတ်ခြင်း
        document.cookie = "token=; Max-Age=0; path=/;";

        // 2. Login စာမျက်နှာသို့ အလိုအလျောက် ပို့ပေးခြင်း
        router.push("/auth/login");
        router.refresh();
      },
      60 * 60 * 24 * 10,
    );

    // Component unmount ဖြစ်သွားပါက timer ကို ရှင်းလင်းပေးခြင်း
    return () => clearTimeout(timer);
  }, [router]);

  return null; // UI မှာ ဘာမှ ပြစရာမလိုပါ
}

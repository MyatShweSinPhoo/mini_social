import Link from "next/link";
import { connection } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import LogoutButton from "../auth/Logout";
import AutoLogout from "../../component/autoLogout";
import NavbarSearchWrapper from "../../component/NavBarSearchWrapper";

export default async function Navbar() {
  await connection();
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const secretKey = process.env.JWT_SECRET;

  let currentUserId: number | null = null;

  if (token && secretKey) {
    try {
      const decoded = jwt.verify(token, secretKey);
      if (typeof decoded !== "string" && "userId" in decoded) {
        const userId = decoded.userId;
        const parsedUserId =
          typeof userId === "number"
            ? userId
            : typeof userId === "string" && /^\d+$/.test(userId)
              ? Number(userId)
              : null;

        if (
          parsedUserId !== null &&
          Number.isSafeInteger(parsedUserId) &&
          parsedUserId > 0
        ) {
          currentUserId = parsedUserId;
        }
      }
    } catch {
      currentUserId = null;
    }
  }

  return (
    // 🛑 w-full ဖြင့် ဘယ်ညာအစအဆုံး အပြည့်ယူထားပြီး Light Theme border နှင့် shadow ကို သုံးထားသည်
    <nav className="w-full bg-white/95 backdrop-blur-md sticky top-0 shadow-sm border-b border-slate-200 z-[9999] px-6 lg:px-10 py-3">
      <div className="w-full flex items-center justify-between text-slate-800">
        {/* Logo */}
        <Link
          href="/"
          className="block cursor-pointer text-base text-slate-900 font-bold tracking-tight shrink-0"
        >
          Mini Social
        </Link>

        {/* 🔍 Search Bar (Home Page တွင်သာ ပေါ်မည်) */}
        <NavbarSearchWrapper />

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-6 shrink-0">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
          >
            Home
          </Link>

          {currentUserId ? (
            <>
              <AutoLogout />
              <Link
                href={`/profile`}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
              >
                Profile
              </Link>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="relative ml-auto h-8 w-8 select-none rounded-lg text-center text-xs font-medium uppercase text-inherit transition-all hover:bg-slate-100 flex items-center justify-center lg:hidden"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}

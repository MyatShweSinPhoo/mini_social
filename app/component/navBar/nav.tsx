import Link from "next/link";
import { connection } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import LogoutButton from "../auth/Logout";
import AutoLogout from "../../component/autoLogout";
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
    <nav className="block w-full max-w-5xl px-4 py-2 mx-auto bg-white bg-opacity-90 sticky top-3 shadow lg:px-8 lg:py-3 backdrop-blur-lg backdrop-saturate-150 z-[9999]">
      <div className="container flex flex-wrap items-center justify-between mx-auto text-slate-800">
        <Link
          href="/"
          className="mr-4 block cursor-pointer py-1.5 text-base text-slate-800 font-semibold"
        >
          Mini Social
        </Link>
        <div className="hidden lg:block">
          <ul className="flex flex-col gap-2 mt-2 mb-4 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
            <li className="flex items-center p-1 text-sm gap-x-2 text-slate-600">
              <Link href="/" className="flex items-center">
                Home
              </Link>
            </li>

            {currentUserId ? (
              <>
                <AutoLogout />

                <li className="flex items-center p-1 text-sm gap-x-2 text-slate-600">
                  <Link href={`/profile`} className="flex items-center">
                    Profile
                  </Link>
                </li>
                <li className="flex items-center p-1 text-sm gap-x-2 text-slate-600">
                  <LogoutButton />
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center p-1 text-sm gap-x-2 text-slate-600">
                  <Link href="/auth/login" className="flex items-center">
                    Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
        <button
          className="relative ml-auto h-6 max-h-40px w-6 max-w-40px select-none rounded-lg text-center align-middle text-xs font-medium uppercase text-inherit transition-all hover:bg-transparent focus:bg-transparent active:bg-transparent disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none lg:hidden"
          type="button"
        >
          <span className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
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
          </span>
        </button>
      </div>
    </nav>
  );
}

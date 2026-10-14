import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. Request ထဲက cookies တွေထဲက token ကို ယူခြင်း
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // 2. Login မလုပ်ထားဘဲ ဝင်လို့မရမည့် Protected Routes များကို သတ်မှတ်ခြင်း
  // (ဥပမာ - Home ပုံစံ '/', Profile စသည်ဖြင့်)
  const isAuthPage =
    pathname.startsWith("/auth/login") || pathname.startsWith("/auth/register");

  // 3. အကယ်၍ Token မရှိဘဲ Protected Page တွေကို ဝင်လာရင် Login page ဆီ ပို့မည်
  if (!token && !isAuthPage && pathname !== "/") {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 4. အကယ်၍ Token ရှိပြီးသားဖြစ်のに Login page ကို ပြန်သွားရင် Home '/' ဆီ ပို့မည်
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 5. အခြေအနေအားလုံး မှန်ကန်လျှင် ပုံမှန်အတိုင်း ဆက်သွားခွင့်ပြုမည်
  return NextResponse.next();
}

// Config: မည်သည့် Path တွေမှာ Middleware အလုပ်လုပ်ရမယ်ဆိုတာ သတ်မှတ်ခြင်း
export const config = {
  matcher: [
    /*
     * Static files, API routes, favicon များကို ကျော်သွားရန်
     */
    "/((?!api|_next/static|_next/image|images|favicon.ico).*)",
  ],
};

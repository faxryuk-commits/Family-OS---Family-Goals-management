import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Публичные пути - не требуют авторизации
  const publicPaths = ["/login", "/api/auth"];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Разрешаем публичные пути
  if (isPublicPath) {
    // Если авторизован и на странице логина - редирект на главную
    if (isLoggedIn && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Если не авторизован - редирект на логин
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

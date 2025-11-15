import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function proxy(request: NextRequest) {
  const isPublic =
    request.nextUrl.pathname === "/signin" ||
    request.nextUrl.pathname === "/signup";

  if (request.cookies.get("user")) {
    if (isPublic) {
      return NextResponse.redirect(new URL("/profile", request.url));
    }
  } else {
    if (!isPublic) {
      return NextResponse.rewrite(new URL("/signin", request.url));
    }
  }
}

export const config = {
  matcher: ["/", "/signin", "/signup", "/profile"],
};

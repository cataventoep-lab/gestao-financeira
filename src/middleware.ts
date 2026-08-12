import { withAuth } from "next-auth/middleware";

export default withAuth(function middleware(req) {}, {
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};

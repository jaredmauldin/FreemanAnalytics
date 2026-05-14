import { clerkClient, clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { hasFullAppAccess } from "@/lib/auth/access";

/** Public routes: auth pages + Clerk webhooks (verified in route handler). */
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/api/webhooks/clerk(.*)"]);

/** Logged-in users without full app access land here (must not redirect again). */
const isPendingApprovalRoute = createRouteMatcher(["/pending-approval(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  /**
   * Clerk’s default `auth.protect()` returns a synthetic 404 when the request does not look like a
   * “document” navigation (missing `Accept: text/html` or `Sec-Fetch-Dest: document`). That 404 can
   * be cached by CDNs and breaks real users (e.g. /admin/users on Vercel). Always send unauthenticated
   * traffic to sign-in with an explicit return URL instead.
   */
  const signIn = new URL("/sign-in", req.url);
  signIn.searchParams.set("redirect_url", req.nextUrl.href);
  await auth.protect({ unauthenticatedUrl: signIn.toString() });

  if (isPendingApprovalRoute(req)) {
    return NextResponse.next();
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.next();
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if (hasFullAppAccess(user, userId)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/pending-approval", req.url));
  } catch {
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    "/",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};

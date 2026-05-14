import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/** Only auth pages are public; everything else (including / and /api) requires a Clerk session. */
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Root must be listed explicitly — the catch-all below can miss `/` on some Next versions.
    "/",
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    // Clerk proxy — required so session/handshake works; without it, `auth.protect()` may not see the user.
    "/__clerk/(.*)",
  ],
};

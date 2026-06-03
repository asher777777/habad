import NextAuth from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { adminDb } from "./firebase-admin";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: FirestoreAdapter({ firestore: adminDb }),
  providers: [], // Add providers here (e.g., Google, GitHub)
  callbacks: {
    authorized: ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }
      return true;
    },
  },
});

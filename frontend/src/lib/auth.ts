import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // mock auth -- replace with real backend call
        if (
          credentials?.email === "clinician@neurosense.io" &&
          credentials?.password === "neurosense"
        ) {
          return {
            id: "1",
            name: "Dr. Elena Vasquez",
            email: "clinician@neurosense.io",
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = request.nextUrl.pathname === "/login";
      if (isOnLogin) return true;
      return isLoggedIn;
    },
  },
});

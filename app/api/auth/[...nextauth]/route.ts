// app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";


export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        email: { label: "Email", type: "text" }
      },
      async authorize(credentials) {
        const loginInput = credentials?.username || credentials?.email;
        const password = credentials?.password;

        if (!loginInput || !password) return null;

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: loginInput },
              { username: loginInput }
            ]
          }
        });

        if (!user) throw new Error("No user found");

        // ✅ 1. เช็ค Hash อย่างเดียว (ปลอดภัยที่สุด)
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) throw new Error("Wrong password");

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          shopId: user.shopId
        };
      }
    })
  ],

  callbacks: {
    // ✅ 2. แก้ JWT ให้รองรับการอัปเดตข้อมูล (trigger update)
    async jwt({ token, user, trigger, session }: any) {
      // กรณี Login ครั้งแรก
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.shopId = user.shopId;
      }

      // กรณีมีการเรียก update() จากหน้าบ้าน
      if (trigger === "update" && session) {
        // อัปเดตข้อมูลใน Token ตามที่ส่งมา (เช่น shopId: null)
        token.role = session.role ?? token.role;
        token.shopId = session.shopId; // รับค่า null ได้
      }

      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.shopId = token.shopId;
      }
      return session;
    }
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
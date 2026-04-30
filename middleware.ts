// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // ทำงานเพิ่มเติมได้ถ้าต้องการเช็ค Role (อนาคต)
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // ต้องมี Token ถึงจะผ่านได้
    },
    pages: {
      signIn: "/login", // ถ้ายังไม่ล็อกอิน ให้ดีดกลับไปหน้า Landing Page
    },
  }
);

// กำหนดว่าจะป้องกันหน้าไหนบ้าง
export const config = {
  matcher: [
    "/dashboard/:path*",  // กันทุกหน้าใน Dashboard
    "/user-info/:path*",  // กันหน้า User Info
    // เพิ่มหน้าอื่นๆ ที่อยากล็อกได้ที่นี่
  ],
};
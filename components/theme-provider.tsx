"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// แก้ไข type ให้รองรับ children และ props อื่นๆ
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Blue Coast Property Hub", template: "%s | Blue Coast Property Hub" },
  description: "A secure property owner and investor portal for managing property information and insights.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-AU"><body>{children}</body></html>;
}

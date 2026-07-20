import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { PollingStatus } from "@/components/PollingStatus";

export const metadata: Metadata = {
  title: "Fat System",
  description: "Sistem pengajuan karyawan dan approval admin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <Providers>
          {children}
          <PollingStatus />
        </Providers>
      </body>
    </html>
  );
}

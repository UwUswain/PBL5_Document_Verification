import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import QueryProvider from "@/providers/QueryProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { ConfigProvider, App as AntdApp } from 'antd';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PBL5 - Quản lý Văn bản AI",
  description: "Hệ thống phân loại và quản lý văn bản thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className} style={{ margin: 0, backgroundColor: '#f5f5f5' }}>
        <AntdRegistry>
          <ConfigProvider theme={{
            token: {
              colorPrimary: '#1677ff',
              borderRadius: 6,
              fontFamily: inter.style.fontFamily,
            }
          }}>
            <AntdApp>
              <QueryProvider>
                <LanguageProvider>
                  <AuthProvider>
                    {children}
                  </AuthProvider>
                </LanguageProvider>
              </QueryProvider>
            </AntdApp>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

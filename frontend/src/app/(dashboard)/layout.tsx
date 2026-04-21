import { AppLayout } from "@/components/layout/AppLayout";

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

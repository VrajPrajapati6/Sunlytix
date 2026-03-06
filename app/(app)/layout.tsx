import DashboardHeader from "@/components/DashboardHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black text-white">
      <DashboardHeader />
      <main className="flex-1 overflow-y-auto bg-grid-pattern">{children}</main>
    </div>
  );
}

import DashboardHeader from "@/components/DashboardHeader";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black text-white print:h-auto print:overflow-visible print:bg-white print:text-black">
      <div className="print:hidden">
        <DashboardHeader />
      </div>
      <main className="flex-1 overflow-y-auto bg-grid-pattern print:overflow-visible print:bg-none print:bg-white">{children}</main>
    </div>
  );
}

"use client";

const rows = [
  {
    id: "INV-21",
    temp: "72°C",
    eff: "86%",
    risk: "0.82",
    status: "Critical",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-500",
  },
  {
    id: "INV-15",
    temp: "65°C",
    eff: "90%",
    risk: "0.61",
    status: "Warning",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    dot: "bg-yellow-500",
  },
  {
    id: "INV-09",
    temp: "48°C",
    eff: "96%",
    risk: "0.12",
    status: "Normal",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    dot: "bg-green-500",
  },
];

export default function DashboardPreview() {
  return (
    <section className="py-24" id="demo">
      <div className="max-w-[1440px] mx-auto px-8 lg:px-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-4">
          Built for Solar Plant Operators
        </h2>
        <p className="text-gray-500 text-center max-w-xl mx-auto mb-14">
          A clean, intuitive dashboard designed for operators who need
          actionable data at a glance.
        </p>

        {/* Preview container */}
        <div className="max-w-5xl mx-auto rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-2xl shadow-black/50">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-white/[0.01]">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-3 text-xs text-gray-600">
              sunlytix.app/dashboard
            </span>
          </div>

          {/* Table */}
          <div className="p-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                    Inverter ID
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                    Temperature
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                    Efficiency
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                    Risk Score
                  </th>
                  <th className="text-left py-3 px-4 text-[11px] uppercase tracking-wider text-gray-500 font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3.5 px-4 font-medium text-white">
                      {r.id}
                    </td>
                    <td className="py-3.5 px-4 text-gray-400">{r.temp}</td>
                    <td className="py-3.5 px-4 text-gray-400">{r.eff}</td>
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${r.color}`}>
                        {r.risk}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${r.bg} ${r.color} ${r.border} border`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

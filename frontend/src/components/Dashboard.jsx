import Plot from "react-plotly.js";
import "./Dashboard.css";

const CATEGORY_COLORS = ["#ff6a00", "#ee0979", "#00c9ff", "#38ef7d", "#a78bfa", "#ffd200"];

export default function Dashboard({ summary, scatter }) {
  if (!summary) return <div className="loading">Loading dashboard…</div>;

  const cats = [...summary.categories].sort((a, b) => a.return_rate - b.return_rate);
  const catsByProfit = [...summary.categories].sort((a, b) => a.net_profit - b.net_profit);

  return (
    <div className="dashboard">
      <div className="stat-row">
        <StatCard label="TOTAL ORDERS" value={summary.total_orders.toLocaleString()} from="#396afc" to="#2948ff" />
        <StatCard
          label="TOTAL RETURNS"
          value={`${summary.total_returns.toLocaleString()} (${summary.overall_return_rate}%)`}
          from="#ff416c" to="#ff4b2b"
        />
        <StatCard
          label="NET PROFIT"
          value={`₹${summary.total_net_profit.toLocaleString()}`}
          from="#11998e" to="#38ef7d"
        />
      </div>

      <div className="chart-row">
        <div className="chart-card half">
          <Plot
            data={[{
              type: "bar",
              x: cats.map((c) => c.category),
              y: cats.map((c) => c.return_rate),
              text: cats.map((c) => `${c.return_rate}%`),
              textposition: "outside",
              marker: { color: CATEGORY_COLORS },
            }]}
            layout={{
              title: { text: "📦 Category-wise Return Rate (%)", font: { color: "#fff" } },
              paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
              font: { color: "#cfd3e6" },
              xaxis: { gridcolor: "#333" }, yaxis: { gridcolor: "#333" },
              margin: { l: 40, r: 10, t: 40, b: 60 },
              showlegend: false,
            }}
            style={{ width: "100%", height: "380px" }}
            useResizeHandler
            config={{ displayModeBar: false }}
          />
        </div>
        <div className="chart-card half">
          <Plot
            data={[{
              type: "bar",
              x: catsByProfit.map((c) => c.category),
              y: catsByProfit.map((c) => c.net_profit),
              marker: { color: catsByProfit.map((c) => (c.net_profit >= 0 ? "#38ef7d" : "#ff4b2b")) },
            }]}
            layout={{
              title: { text: "💰 Category-wise Net Profit (₹)", font: { color: "#fff" } },
              paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
              font: { color: "#cfd3e6" },
              xaxis: { gridcolor: "#333" }, yaxis: { gridcolor: "#333" },
              margin: { l: 60, r: 10, t: 40, b: 60 },
              showlegend: false,
            }}
            style={{ width: "100%", height: "380px" }}
            useResizeHandler
            config={{ displayModeBar: false }}
          />
        </div>
      </div>

      {scatter && (
        <div className="chart-card" style={{ marginTop: 20 }}>
          <Plot
            data={groupByCategory(scatter.points).map((g, i) => ({
              type: "scatter3d",
              mode: "markers",
              name: g.category,
              x: g.points.map((p) => p.price),
              y: g.points.map((p) => p.rating),
              z: g.points.map((p) => p.order_profit),
              marker: { size: 3, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length], opacity: 0.75 },
            }))}
            layout={{
              title: { text: "🚀 3D Overview: Price vs Rating vs Order Profit", font: { color: "#fff" } },
              paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
              font: { color: "#cfd3e6" },
              scene: {
                xaxis: { title: "Price (₹)", gridcolor: "#333" },
                yaxis: { title: "Rating", gridcolor: "#333" },
                zaxis: { title: "Profit/Loss (₹)", gridcolor: "#333" },
              },
              margin: { l: 0, r: 0, t: 40, b: 0 },
              legend: { font: { color: "#cfd3e6" } },
            }}
            style={{ width: "100%", height: "560px" }}
            useResizeHandler
            config={{ displayModeBar: false }}
          />
        </div>
      )}
    </div>
  );
}

function groupByCategory(points) {
  const map = {};
  for (const p of points) {
    if (!map[p.category]) map[p.category] = [];
    map[p.category].push(p);
  }
  return Object.entries(map).map(([category, points]) => ({ category, points }));
}

function StatCard({ label, value, from, to }) {
  return (
    <div className="stat-card" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

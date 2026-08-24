import Plot from "react-plotly.js";
import "./ProductReport.css";

const CARD_ACCENTS = {
  orders: "#00d4ff",
  returns: "#ff4b2b",
  rate: "#ffd200",
  profit: "#38ef7d",
  loss: "#ff416c",
};

export default function ProductReport({ data, error }) {
  if (error) {
    return (
      <div className="report-error">
        <h3>❌ Product nahi mila: "{error.message?.replace(/^Product "|" not found\.$/g, "")}"</h3>
        {error.suggestions?.length > 0 && (
          <>
            <p>Kya aapka matlab ye tha?</p>
            <ul>
              {error.suggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  if (!data) return null;

  const {
    product_name, category, total_orders, total_returns, return_rate,
    total_profit, total_loss, net_profit, verdict, predicted_return_risk,
    monthly_trend, return_reasons, points,
  } = data;

  const verdictColor = verdict === "PROFITABLE" ? "#38ef7d" : "#ff4b2b";

  const kept = points.filter((p) => !p.is_returned);
  const returned = points.filter((p) => p.is_returned);

  const reasonLabels = Object.keys(return_reasons || {});
  const reasonValues = Object.values(return_reasons || {});

  return (
    <div className="report">
      <div className="report-title">
        <h2>
          📦 {product_name} <span className="cat-badge">{category}</span>
        </h2>
      </div>

      <div className="metric-grid">
        <MetricCard label="TOTAL ORDERS" value={total_orders} color={CARD_ACCENTS.orders} />
        <MetricCard label="TOTAL RETURNS" value={total_returns} color={CARD_ACCENTS.returns} />
        <MetricCard label="RETURN RATE" value={`${return_rate}%`} color={CARD_ACCENTS.rate} />
        <MetricCard label="TOTAL PROFIT" value={`₹${total_profit.toLocaleString()}`} color={CARD_ACCENTS.profit} />
        <MetricCard label="TOTAL LOSS" value={`₹${total_loss.toLocaleString()}`} color={CARD_ACCENTS.loss} />
        <MetricCard
          label="NET RESULT"
          value={
            <>
              {verdict === "PROFITABLE" ? "✅ PROFITABLE" : "⚠️ LOSS-MAKING"}
              <br />₹{net_profit.toLocaleString()}
            </>
          }
          color={verdictColor}
        />
      </div>

      <div className="risk-banner">
        🔮 Predicted Future Return Risk: <b>{predicted_return_risk}%</b>
      </div>

      <div className="chart-card">
        <Plot
          data={[
            {
              type: "scatter3d",
              mode: "markers",
              x: kept.map((p) => p.price),
              y: kept.map((p) => p.rating),
              z: kept.map((p) => p.order_profit),
              marker: { size: 5, color: "#38ef7d", line: { color: "white", width: 0.5 } },
              name: "Kept",
            },
            {
              type: "scatter3d",
              mode: "markers",
              x: returned.map((p) => p.price),
              y: returned.map((p) => p.rating),
              z: returned.map((p) => p.order_profit),
              marker: { size: 5, color: "#ff4b2b", line: { color: "white", width: 0.5 } },
              name: "Returned",
            },
          ]}
          layout={{
            title: { text: `🎯 3D Highlight: ${product_name}`, font: { color: "#fff" } },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            font: { color: "#cfd3e6" },
            scene: {
              xaxis: { title: "Price (₹)", color: "#cfd3e6", gridcolor: "#333" },
              yaxis: { title: "Rating", color: "#cfd3e6", gridcolor: "#333" },
              zaxis: { title: "Profit/Loss (₹)", color: "#cfd3e6", gridcolor: "#333" },
            },
            margin: { l: 0, r: 0, t: 40, b: 0 },
            legend: { font: { color: "#cfd3e6" } },
          }}
          style={{ width: "100%", height: "480px" }}
          useResizeHandler
          config={{ displayModeBar: false }}
        />
      </div>

      <div className="chart-row">
        <div className="chart-card half">
          <Plot
            data={[
              {
                type: "bar", name: "Orders", marker: { color: "#00d4ff" },
                x: monthly_trend.map((m) => m.month), y: monthly_trend.map((m) => m.orders),
              },
              {
                type: "bar", name: "Returns", marker: { color: "#ff4b2b" },
                x: monthly_trend.map((m) => m.month), y: monthly_trend.map((m) => m.returns),
              },
            ]}
            layout={{
              title: { text: "📅 Month-wise Orders vs Returns", font: { color: "#fff" } },
              paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
              font: { color: "#cfd3e6" }, barmode: "group",
              xaxis: { title: "Month", gridcolor: "#333" },
              yaxis: { title: "Count", gridcolor: "#333" },
              margin: { l: 40, r: 10, t: 40, b: 40 },
              legend: { font: { color: "#cfd3e6" } },
            }}
            style={{ width: "100%", height: "360px" }}
            useResizeHandler
            config={{ displayModeBar: false }}
          />
        </div>

        {reasonLabels.length > 0 && (
          <div className="chart-card half">
            <Plot
              data={[
                {
                  type: "pie", labels: reasonLabels, values: reasonValues, hole: 0.4,
                  marker: { colors: ["#ff6a00", "#ee0979", "#00c9ff", "#38ef7d", "#ffd200", "#a78bfa"] },
                  textfont: { color: "#fff" },
                },
              ]}
              layout={{
                title: { text: "📋 Return Reasons", font: { color: "#fff" } },
                paper_bgcolor: "rgba(0,0,0,0)", plot_bgcolor: "rgba(0,0,0,0)",
                font: { color: "#cfd3e6" },
                margin: { l: 10, r: 10, t: 40, b: 10 },
                legend: { font: { color: "#cfd3e6" } },
              }}
              style={{ width: "100%", height: "360px" }}
              useResizeHandler
              config={{ displayModeBar: false }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="metric-card" style={{ borderLeftColor: color }}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
    </div>
  );
}

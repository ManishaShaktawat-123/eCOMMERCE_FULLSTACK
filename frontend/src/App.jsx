import { useState, useEffect } from "react";
import SearchBar from "./components/SearchBar";
import ProductReport from "./components/ProductReport";
import Dashboard from "./components/Dashboard";
import { getSummary, getScatter, searchProduct } from "./api";
import "./App.css";

export default function App() {
  const [summary, setSummary] = useState(null);
  const [scatter, setScatter] = useState(null);
  const [productData, setProductData] = useState(null);
  const [productError, setProductError] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    getSummary().then(setSummary).catch(() => setLoadError(true));
    getScatter(1200).then(setScatter).catch(() => setLoadError(true));
  }, []);

  const handleSearch = async (name) => {
    setLoadingProduct(true);
    setProductError(null);
    setProductData(null);
    try {
      const data = await searchProduct(name);
      setProductData(data);
    } catch (err) {
      setProductError(err.response?.data?.detail || { message: "Something went wrong." });
    } finally {
      setLoadingProduct(false);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <h1>🛍️ E-Commerce Return Rate Minimizer</h1>
        <p className="subtitle">& Profitability Optimization Dashboard</p>
        <SearchBar onSearch={handleSearch} />
      </header>

      <main className="main">
        {loadError && (
          <div className="error-banner">
            ⚠️ Backend se connect nahi ho paya. Kripya check karein ki API server chal raha hai
            (<code>uvicorn main:app --reload</code>) aur phir page reload karein.
          </div>
        )}

        {loadingProduct && <div className="loading">🔎 Searching…</div>}
        {!loadingProduct && (productData || productError) && (
          <ProductReport data={productData} error={productError} />
        )}

        <section className="dashboard-section">
          <h2 className="section-title">📊 Overall Business Snapshot</h2>
          <Dashboard summary={summary} scatter={scatter} />
        </section>
      </main>

      <footer className="footer">
        Built with FastAPI + React + Plotly · E-Commerce Analytics Project
      </footer>
    </div>
  );
}

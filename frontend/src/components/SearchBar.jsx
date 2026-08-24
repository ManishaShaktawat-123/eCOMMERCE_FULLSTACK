import { useState, useEffect, useRef } from "react";
import { getProducts } from "../api";
import "./SearchBar.css";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      getProducts(query).then((products) => setSuggestions(products.slice(0, 8)));
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const doSearch = (value) => {
    const v = (value ?? query).trim();
    if (!v) return;
    setQuery(v);
    setShowSuggestions(false);
    onSearch(v);
  };

  return (
    <div className="search-wrap" ref={boxRef}>
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          value={query}
          placeholder="Product ka naam search karo... (e.g. Nike Running Shoes)"
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
        />
        <button className="search-btn" onClick={() => doSearch()}>
          Search
        </button>
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((s) => (
            <li key={s} onClick={() => doSearch(s)}>
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

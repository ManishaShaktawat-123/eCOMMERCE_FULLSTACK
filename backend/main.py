"""
E-Commerce Return Rate Minimizer & Profitability Optimization — Backend API
FastAPI + pandas + scikit-learn

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Docs available at: http://localhost:8000/docs
"""

import difflib
from typing import Optional

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sklearn.ensemble import RandomForestClassifier

# --------------------------------------------------------------------------
# App setup
# --------------------------------------------------------------------------
app = FastAPI(
    title="E-Commerce Return Rate Minimizer API",
    description="Product-wise return rate, profit/loss analytics and ML return-risk prediction.",
    version="1.0.0",
)

# Allow the React frontend (any origin during development; restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------
# Data generation (same logic as the Jupyter Notebook version)
# --------------------------------------------------------------------------
np.random.seed(42)

PRODUCT_CATALOG = {
    "Electronics": ["iPhone 15 Pro Case", "Samsung Galaxy Buds", "boAt Bluetooth Speaker",
                    "Mi Power Bank 20000mAh", "Sony Headphones WH-1000", "Dell Wireless Mouse",
                    "HP Laptop Bag", "Realme Smartwatch"],
    "Fashion": ["Levis Denim Jacket", "Nike Running Shoes", "Puma T-Shirt", "Zara Formal Shirt",
                "Adidas Track Pants", "H&M Summer Dress", "Woodland Boots", "Raymond Blazer"],
    "Home & Kitchen": ["Prestige Pressure Cooker", "Philips Mixer Grinder", "IKEA Study Table",
                        "Milton Water Bottle", "Bajaj Room Heater", "Cello Dinner Set",
                        "Havells Ceiling Fan", "Wonderchef Cookware Set"],
    "Beauty": ["Lakme Lipstick", "Nykaa Foundation", "Mamaearth Face Wash", "LOreal Shampoo",
               "Maybelline Mascara", "The Body Shop Body Lotion", "Biotique Sunscreen", "WOW Skin Serum"],
    "Sports": ["Yonex Badminton Racket", "Cosco Football", "Nivia Cricket Bat", "Decathlon Yoga Mat",
               "Nike Gym Bag", "Adidas Football Shoes", "Boldfit Dumbbells Set", "SG Cricket Kit"],
    "Toys": ["LEGO Building Blocks", "Hot Wheels Car Set", "Barbie Doll House", "Funskool Puzzle",
             "Nerf Blaster Gun", "Fisher Price Baby Toy", "Remote Control Car", "Chess Board Set"],
}

BASE_PRICE_MAP = {"Electronics": 2500, "Fashion": 1300, "Home & Kitchen": 2200,
                   "Beauty": 600, "Sports": 1600, "Toys": 900}

RETURN_REASONS = ["Size Issue", "Damaged in Transit", "Not as Described", "Changed Mind",
                   "Quality Issue", "Late Delivery"]


def generate_dataset() -> pd.DataFrame:
    rows = []
    order_id = 100000
    for category, products in PRODUCT_CATALOG.items():
        for pname in products:
            n_orders = np.random.randint(40, 150)
            base_return_prob = np.clip(np.random.normal(0.15, 0.08), 0.03, 0.45)
            if category == "Fashion":
                base_return_prob += 0.06
            base_price = BASE_PRICE_MAP[category] * np.random.uniform(0.6, 1.8)
            base_rating = np.clip(np.random.normal(4.0, 0.5), 2.0, 5.0)

            for _ in range(n_orders):
                order_id += 1
                month = np.random.randint(1, 13)
                price = max(99, np.random.normal(base_price, base_price * 0.12))
                discount = np.random.uniform(0, 55)
                rating = np.clip(np.random.normal(base_rating, 0.4), 1, 5)
                delivery_days = np.random.randint(1, 10)

                return_prob = base_return_prob
                if delivery_days > 5:
                    return_prob += 0.10
                if rating < 3:
                    return_prob += 0.15
                if discount > 40:
                    return_prob += 0.05
                is_returned = bool(np.random.rand() < np.clip(return_prob, 0.02, 0.8))

                cost_price = price * np.random.uniform(0.45, 0.7)
                selling_price = price * (1 - discount / 100)

                if is_returned:
                    order_profit = -(selling_price * 0.25 + cost_price * 0.15)
                    weights = [0.35, 0.20, 0.15, 0.15, 0.10, 0.05] if category == "Fashion" \
                        else [0.10, 0.25, 0.15, 0.20, 0.20, 0.10]
                    reason = np.random.choice(RETURN_REASONS, p=weights)
                else:
                    order_profit = selling_price - cost_price
                    reason = None

                rows.append({
                    "order_id": order_id, "product_name": pname, "category": category,
                    "month": month, "price": round(price, 2), "discount": round(discount, 1),
                    "rating": round(rating, 2), "delivery_days": delivery_days,
                    "is_returned": is_returned, "return_reason": reason,
                    "cost_price": round(cost_price, 2), "selling_price": round(selling_price, 2),
                    "order_profit": round(order_profit, 2),
                })
    return pd.DataFrame(rows)


DF = generate_dataset()

# --------------------------------------------------------------------------
# Train return-risk model once at startup
# --------------------------------------------------------------------------
FEATURES_NUM = ["price", "discount", "rating", "delivery_days"]
DF_ML = pd.get_dummies(DF[FEATURES_NUM + ["category"]], columns=["category"])
FEATURE_COLS = DF_ML.columns.tolist()
Y = DF["is_returned"].astype(int)

CLF = RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42)
CLF.fit(DF_ML, Y)

ALL_PRODUCTS = sorted(DF.product_name.unique().tolist())


# --------------------------------------------------------------------------
# Helper functions
# --------------------------------------------------------------------------
def predict_risk(pdata: pd.DataFrame, category: str) -> float:
    row = pd.DataFrame([{
        "price": pdata.price.mean(), "discount": pdata.discount.mean(),
        "rating": pdata.rating.mean(), "delivery_days": pdata.delivery_days.mean(),
        "category": category,
    }])
    row_ml = pd.get_dummies(row, columns=["category"]).reindex(columns=FEATURE_COLS, fill_value=0)
    return float(CLF.predict_proba(row_ml)[0][1] * 100)


def build_report(pdata: pd.DataFrame, matched_name: str) -> dict:
    total_orders = len(pdata)
    total_returns = int(pdata.is_returned.sum())
    return_rate = round(total_returns / total_orders * 100, 1) if total_orders else 0
    total_profit = round(float(pdata.loc[pdata.order_profit > 0, "order_profit"].sum()), 2)
    total_loss = round(float(-pdata.loc[pdata.order_profit < 0, "order_profit"].sum()), 2)
    net_profit = round(float(pdata.order_profit.sum()), 2)
    category = pdata.category.mode()[0]
    predicted_risk = round(predict_risk(pdata, category), 1)

    monthly = (
        pdata.groupby("month")
        .agg(orders=("order_id", "count"), returns=("is_returned", "sum"))
        .reindex(range(1, 13), fill_value=0)
        .reset_index()
        .rename(columns={"index": "month"})
    )

    reasons = pdata[pdata.is_returned].return_reason.value_counts()

    points = pdata[["price", "rating", "order_profit", "is_returned"]].to_dict(orient="records")

    return {
        "product_name": matched_name,
        "category": category,
        "total_orders": total_orders,
        "total_returns": total_returns,
        "return_rate": return_rate,
        "total_profit": total_profit,
        "total_loss": total_loss,
        "net_profit": net_profit,
        "verdict": "PROFITABLE" if net_profit >= 0 else "LOSS-MAKING",
        "predicted_return_risk": predicted_risk,
        "monthly_trend": monthly.to_dict(orient="records"),
        "return_reasons": reasons.to_dict(),
        "points": points,
    }


# --------------------------------------------------------------------------
# API Routes
# --------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok", "total_orders": len(DF), "total_products": len(ALL_PRODUCTS)}


@app.get("/api/products")
def list_products(q: Optional[str] = Query(None, description="Optional filter substring")):
    """Return the list of all product names (optionally filtered) for autocomplete."""
    if q:
        matches = [p for p in ALL_PRODUCTS if q.lower() in p.lower()]
        return {"products": matches}
    return {"products": ALL_PRODUCTS}


@app.get("/api/summary")
def category_summary():
    """Overall business snapshot + category-wise return rate / profit for dashboard charts."""
    summary = DF.groupby("category").agg(
        orders=("order_id", "count"),
        returns=("is_returned", "sum"),
        net_profit=("order_profit", "sum"),
    ).reset_index()
    summary["return_rate"] = (summary.returns / summary.orders * 100).round(1)

    return {
        "total_orders": len(DF),
        "total_returns": int(DF.is_returned.sum()),
        "overall_return_rate": round(DF.is_returned.mean() * 100, 1),
        "total_net_profit": round(float(DF.order_profit.sum()), 2),
        "categories": summary.to_dict(orient="records"),
    }


@app.get("/api/scatter")
def scatter_data(sample_size: int = 1200):
    """Sampled order-level points for the 3D overview scatter plot (price, rating, profit)."""
    sample = DF.sample(min(sample_size, len(DF)), random_state=1)
    cols = ["product_name", "category", "month", "price", "rating", "order_profit", "discount", "is_returned"]
    return {"points": sample[cols].to_dict(orient="records")}


@app.get("/api/product/{name}")
def search_product(name: str):
    """
    Search a product by exact or partial (case-insensitive) name match.
    Returns full report: orders, returns, profit, loss, predicted risk, trends.
    """
    exact = DF[DF.product_name.str.lower() == name.lower()]
    if len(exact) > 0:
        matched_name = exact.product_name.iloc[0]
        return build_report(exact, matched_name)

    contains = DF[DF.product_name.str.lower().str.contains(name.lower(), na=False, regex=False)]
    if len(contains) > 0:
        matched_name = contains.product_name.mode()[0]
        pdata = DF[DF.product_name == matched_name]
        return build_report(pdata, matched_name)

    suggestions = difflib.get_close_matches(name, ALL_PRODUCTS, n=5, cutoff=0.3)
    raise HTTPException(
        status_code=404,
        detail={"message": f'Product "{name}" not found.', "suggestions": suggestions},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

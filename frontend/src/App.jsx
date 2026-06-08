import { useEffect, useState } from "react";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [currentUser, setCurrentUser] = useState(null);

  const [loginData, setLoginData] = useState({
    username: "admin",
    password: "admin123",
  });

  const [activePage, setActivePage] = useState("dashboard");

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [inventoryHealth, setInventoryHealth] = useState(null);
  const [restockRecommendations, setRestockRecommendations] = useState([]);
  const [salesSummary, setSalesSummary] = useState(null);
  const [riskResult, setRiskResult] = useState(null);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    category_id: "",
  });

  const [orderForm, setOrderForm] = useState({
    product_id: "",
    quantity: "",
  });

  const [searchFilters, setSearchFilters] = useState({
    keyword: "",
    min_price: "",
    max_price: "",
    stock_status: "",
  });

  const [searchedProducts, setSearchedProducts] = useState([]);

  const [message, setMessage] = useState("");

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const jsonAuthHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    const formBody = new URLSearchParams();
    formBody.append("username", loginData.username);
    formBody.append("password", loginData.password);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Login failed");
        return;
      }

      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      setMessage("Login successful.");
    } catch (error) {
      setMessage("Backend connection failed. Make sure FastAPI is running.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken("");
    setCurrentUser(null);
    setMessage("Logged out successfully.");
  }

  async function fetchCurrentUser() {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: authHeaders,
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      }
    } catch (error) {
      console.log("Could not fetch current user.");
    }
  }

  async function fetchCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      setMessage("Could not load categories.");
    }
  }

  async function fetchProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products/`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      setMessage("Could not load products.");
    }
  }

  async function fetchOrders() {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/orders/`, {
        headers: authHeaders,
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      setMessage("Could not load orders.");
    }
  }

  async function fetchInventoryHealth() {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/products/inventory/health`,
        {
          headers: authHeaders,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setInventoryHealth(data);
      } else {
        setMessage(data.detail || "Could not load inventory health.");
      }
    } catch (error) {
      setMessage("Could not load inventory health.");
    }
  }

  async function fetchRestockRecommendations() {
    if (!token) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/products/restock-recommendations?low_stock_limit=50&target_stock=100`,
        {
          headers: authHeaders,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setRestockRecommendations(data);
      } else {
        setMessage(data.detail || "Could not load restock recommendations.");
      }
    } catch (error) {
      setMessage("Could not load restock recommendations.");
    }
  }

  async function fetchSalesSummary() {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/orders/sales/summary`, {
        headers: authHeaders,
      });

      const data = await response.json();

      if (response.ok) {
        setSalesSummary(data);
      } else {
        setMessage(data.detail || "Could not load sales summary.");
      }
    } catch (error) {
      setMessage("Could not load sales summary.");
    }
  }

  async function createCategory(event) {
    event.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/categories/`, {
        method: "POST",
        headers: jsonAuthHeaders,
        body: JSON.stringify(categoryForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Could not create category.");
        return;
      }

      setMessage("Category created successfully.");
      setCategoryForm({ name: "", description: "" });
      fetchCategories();
    } catch (error) {
      setMessage("Could not create category.");
    }
  }

  async function createProduct(event) {
    event.preventDefault();

    const payload = {
      name: productForm.name,
      description: productForm.description,
      price: Number(productForm.price),
      stock_quantity: Number(productForm.stock_quantity),
      category_id: Number(productForm.category_id),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/products/`, {
        method: "POST",
        headers: jsonAuthHeaders,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Could not create product.");
        return;
      }

      setMessage("Product created successfully.");
      setProductForm({
        name: "",
        description: "",
        price: "",
        stock_quantity: "",
        category_id: "",
      });
      fetchProducts();
      fetchInventoryHealth();
    } catch (error) {
      setMessage("Could not create product.");
    }
  }

  async function createOrder(event) {
    event.preventDefault();

    const payload = {
      items: [
        {
          product_id: Number(orderForm.product_id),
          quantity: Number(orderForm.quantity),
        },
      ],
    };

    try {
      const response = await fetch(`${API_BASE_URL}/orders/`, {
        method: "POST",
        headers: jsonAuthHeaders,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Could not create order.");
        return;
      }

      setMessage("Order created successfully.");
      setOrderForm({ product_id: "", quantity: "" });
      fetchOrders();
      fetchProducts();
      fetchInventoryHealth();
      fetchSalesSummary();
    } catch (error) {
      setMessage("Could not create order.");
    }
  }

  async function checkOrderRisk(event) {
    event.preventDefault();

    const payload = {
      items: [
        {
          product_id: Number(orderForm.product_id),
          quantity: Number(orderForm.quantity),
        },
      ],
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/orders/check-risk?safe_stock_level=10`,
        {
          method: "POST",
          headers: jsonAuthHeaders,
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Could not check order risk.");
        return;
      }

      setRiskResult(data);
      setMessage("Order risk checked successfully.");
    } catch (error) {
      setMessage("Could not check order risk.");
    }
  }

  async function searchProducts(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (searchFilters.keyword) params.append("keyword", searchFilters.keyword);
    if (searchFilters.min_price)
      params.append("min_price", searchFilters.min_price);
    if (searchFilters.max_price)
      params.append("max_price", searchFilters.max_price);
    if (searchFilters.stock_status)
      params.append("stock_status", searchFilters.stock_status);

    try {
      const response = await fetch(
        `${API_BASE_URL}/products/search?${params.toString()}`
      );

      const data = await response.json();

      if (response.ok) {
        setSearchedProducts(data);
        setMessage("Product search completed.");
      } else {
        setMessage(data.detail || "Search failed.");
      }
    } catch (error) {
      setMessage("Search failed.");
    }
  }

  async function updateOrderStatus(orderId, statusValue) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: jsonAuthHeaders,
          body: JSON.stringify({ status: statusValue }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Could not update order status.");
        return;
      }

      setMessage("Order status updated.");
      fetchOrders();
      fetchSalesSummary();
    } catch (error) {
      setMessage("Could not update order status.");
    }
  }

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentUser();
      fetchOrders();
      fetchInventoryHealth();
      fetchRestockRecommendations();
      fetchSalesSummary();
    }
  }, [token]);

  const totalProducts = products.length;
  const totalCategories = categories.length;
  const totalOrders = orders.length;
  const lowStockCount = products.filter(
    (product) => product.stock_quantity <= 10
  ).length;

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>E-Commerce Inventory API</h1>
          <p>Admin Frontend Dashboard</p>

          <form onSubmit={handleLogin}>
            <label>Username</label>
            <input
              type="text"
              value={loginData.username}
              onChange={(event) =>
                setLoginData({ ...loginData, username: event.target.value })
              }
            />

            <label>Password</label>
            <input
              type="password"
              value={loginData.password}
              onChange={(event) =>
                setLoginData({ ...loginData, password: event.target.value })
              }
            />

            <button type="submit">Login</button>
          </form>

          {message && <div className="message">{message}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>Inventory API</h2>
        <p className="sidebar-subtitle">Frontend Dashboard</p>

        <button onClick={() => setActivePage("dashboard")}>Dashboard</button>
        <button onClick={() => setActivePage("products")}>Products</button>
        <button onClick={() => setActivePage("categories")}>Categories</button>
        <button onClick={() => setActivePage("orders")}>Orders</button>
        <button onClick={() => setActivePage("search")}>Search</button>
        <button onClick={() => setActivePage("risk")}>Risk Checker</button>
        <button onClick={() => setActivePage("analytics")}>Analytics</button>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>
              {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
            </h1>
            <p>
              Logged in as{" "}
              <strong>{currentUser ? currentUser.username : "admin"}</strong>
            </p>
          </div>

          <div className="api-status">
            Backend: <span>Online</span>
          </div>
        </header>

        {message && <div className="message">{message}</div>}

        {activePage === "dashboard" && (
          <section>
            <div className="card-grid">
              <div className="stat-card">
                <h3>Total Products</h3>
                <p>{totalProducts}</p>
              </div>

              <div className="stat-card">
                <h3>Total Categories</h3>
                <p>{totalCategories}</p>
              </div>

              <div className="stat-card">
                <h3>Total Orders</h3>
                <p>{totalOrders}</p>
              </div>

              <div className="stat-card warning">
                <h3>Low Stock Items</h3>
                <p>{lowStockCount}</p>
              </div>
            </div>

            {inventoryHealth && (
              <div className="panel">
                <h2>Inventory Health</h2>
                <div className="detail-grid">
                  <p>Total Inventory Value: ${inventoryHealth.total_inventory_value}</p>
                  <p>Out of Stock: {inventoryHealth.out_of_stock_products}</p>
                  <p>Low Stock: {inventoryHealth.low_stock_products}</p>
                  <p>{inventoryHealth.message}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {activePage === "categories" && (
          <section className="two-column">
            <div className="panel">
              <h2>Create Category</h2>
              <form onSubmit={createCategory}>
                <input
                  placeholder="Category name"
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm({
                      ...categoryForm,
                      name: event.target.value,
                    })
                  }
                />
                <input
                  placeholder="Description"
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: event.target.value,
                    })
                  }
                />
                <button type="submit">Create Category</button>
              </form>
            </div>

            <div className="panel">
              <h2>Categories</h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.id}</td>
                      <td>{category.name}</td>
                      <td>{category.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activePage === "products" && (
          <section className="two-column">
            <div className="panel">
              <h2>Create Product</h2>
              <form onSubmit={createProduct}>
                <input
                  placeholder="Product name"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm({ ...productForm, name: event.target.value })
                  }
                />

                <input
                  placeholder="Description"
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      description: event.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Price"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      price: event.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Stock quantity"
                  value={productForm.stock_quantity}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      stock_quantity: event.target.value,
                    })
                  }
                />

                <select
                  value={productForm.category_id}
                  onChange={(event) =>
                    setProductForm({
                      ...productForm,
                      category_id: event.target.value,
                    })
                  }
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <button type="submit">Create Product</button>
              </form>
            </div>

            <div className="panel">
              <h2>Products</h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.id}</td>
                      <td>{product.name}</td>
                      <td>${product.price}</td>
                      <td>
                        <span
                          className={
                            product.stock_quantity <= 10
                              ? "badge danger"
                              : "badge success"
                          }
                        >
                          {product.stock_quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activePage === "orders" && (
          <section className="two-column">
            <div className="panel">
              <h2>Create Order</h2>
              <form onSubmit={createOrder}>
                <select
                  value={orderForm.product_id}
                  onChange={(event) =>
                    setOrderForm({
                      ...orderForm,
                      product_id: event.target.value,
                    })
                  }
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Stock: {product.stock_quantity}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Quantity"
                  value={orderForm.quantity}
                  onChange={(event) =>
                    setOrderForm({
                      ...orderForm,
                      quantity: event.target.value,
                    })
                  }
                />

                <button type="submit">Create Order</button>
              </form>
            </div>

            <div className="panel">
              <h2>Orders</h2>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Update</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>${order.total_amount}</td>
                      <td>{order.status}</td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(event) =>
                            updateOrderStatus(order.id, event.target.value)
                          }
                        >
                          <option value="pending">pending</option>
                          <option value="completed">completed</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activePage === "search" && (
          <section className="panel">
            <h2>Product Search and Filter</h2>
            <form className="search-form" onSubmit={searchProducts}>
              <input
                placeholder="Keyword"
                value={searchFilters.keyword}
                onChange={(event) =>
                  setSearchFilters({
                    ...searchFilters,
                    keyword: event.target.value,
                  })
                }
              />

              <input
                type="number"
                placeholder="Min price"
                value={searchFilters.min_price}
                onChange={(event) =>
                  setSearchFilters({
                    ...searchFilters,
                    min_price: event.target.value,
                  })
                }
              />

              <input
                type="number"
                placeholder="Max price"
                value={searchFilters.max_price}
                onChange={(event) =>
                  setSearchFilters({
                    ...searchFilters,
                    max_price: event.target.value,
                  })
                }
              />

              <select
                value={searchFilters.stock_status}
                onChange={(event) =>
                  setSearchFilters({
                    ...searchFilters,
                    stock_status: event.target.value,
                  })
                }
              >
                <option value="">Any stock status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>

              <button type="submit">Search</button>
            </form>

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {searchedProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.id}</td>
                    <td>{product.name}</td>
                    <td>${product.price}</td>
                    <td>{product.stock_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activePage === "risk" && (
          <section className="two-column">
            <div className="panel">
              <h2>Order Risk Checker</h2>
              <form onSubmit={checkOrderRisk}>
                <select
                  value={orderForm.product_id}
                  onChange={(event) =>
                    setOrderForm({
                      ...orderForm,
                      product_id: event.target.value,
                    })
                  }
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - Stock: {product.stock_quantity}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Quantity to test"
                  value={orderForm.quantity}
                  onChange={(event) =>
                    setOrderForm({
                      ...orderForm,
                      quantity: event.target.value,
                    })
                  }
                />

                <button type="submit">Check Risk</button>
              </form>
            </div>

            <div className="panel">
              <h2>Risk Result</h2>
              {riskResult ? (
                <div>
                  <p>
                    Risky:{" "}
                    <strong>{riskResult.is_risky ? "Yes" : "No"}</strong>
                  </p>
                  <p>Total Estimate: ${riskResult.total_estimated_amount}</p>
                  <p>{riskResult.message}</p>

                  {riskResult.risk_items.map((item) => (
                    <div className="risk-box" key={item.product_id}>
                      <h3>{item.product_name}</h3>
                      <p>Current Stock: {item.current_stock}</p>
                      <p>Requested: {item.requested_quantity}</p>
                      <p>After Order: {item.stock_after_order}</p>
                      <p>Risk Level: {item.risk_level}</p>
                      <p>{item.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No risk check yet.</p>
              )}
            </div>
          </section>
        )}

        {activePage === "analytics" && (
          <section className="two-column">
            <div className="panel">
              <h2>Sales Summary</h2>
              {salesSummary && (
                <div className="detail-grid">
                  <p>Total Orders: {salesSummary.total_orders}</p>
                  <p>Pending: {salesSummary.pending_orders}</p>
                  <p>Completed: {salesSummary.completed_orders}</p>
                  <p>Cancelled: {salesSummary.cancelled_orders}</p>
                  <p>Total Revenue: ${salesSummary.total_revenue}</p>
                  <p>{salesSummary.message}</p>
                </div>
              )}
            </div>

            <div className="panel">
              <h2>Restock Recommendations</h2>
              {restockRecommendations.length === 0 ? (
                <p>No restock recommendations.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Current</th>
                      <th>Restock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restockRecommendations.map((item) => (
                      <tr key={item.product_id}>
                        <td>{item.product_name}</td>
                        <td>{item.current_stock}</td>
                        <td>{item.recommended_restock_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
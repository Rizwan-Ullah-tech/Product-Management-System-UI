// Centralized app.js for Product Management System

// Local storage helpers
function getProducts() {
  return JSON.parse(localStorage.getItem("products")) || [];
}

function saveProducts(products) {
  localStorage.setItem("products", JSON.stringify(products));
}

// DOM references
const productsTableBody = document.getElementById("products-table-body");
const pagination = document.getElementById("pagination");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
const totalProductsEl = document.getElementById("total-products");
const totalValueEl = document.getElementById("total-value");
const avgPriceEl = document.getElementById("avg-price");
const currentYearEl = document.getElementById("current-year");
const exportBtn = document.getElementById("export-btn");
const importForm = document.getElementById("importForm");
const importSuccess = document.getElementById("importSuccess");
const importFileInput = document.getElementById("import_file");
const fileSizeError = document.getElementById("fileSizeError");

const editForm = document.getElementById("edit-product-form");
const addForm = document.getElementById("add-product-form");

let products = getProducts();
let filteredProducts = [...products];
let currentPage = 1;
const productsPerPage = 10;

// DOM Ready
window.addEventListener("DOMContentLoaded", () => {
  if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();
  updateStats();
  renderProducts();
  renderPagination();

  if (searchForm) searchForm.addEventListener("submit", handleSearch);
  if (clearSearchBtn) clearSearchBtn.addEventListener("click", clearSearch);
  if (exportBtn) exportBtn.addEventListener("click", exportToExcel);

  if (editForm) editForm.addEventListener("submit", handleEdit);
  if (addForm) addForm.addEventListener("submit", handleAdd);
  if (importForm) importForm.addEventListener("submit", handleImport);
});

function renderProducts() {
  productsTableBody.innerHTML = "";

  const start = (currentPage - 1) * productsPerPage;
  const pageProducts = filteredProducts.slice(start, start + productsPerPage);

  if (pageProducts.length === 0) {
    productsTableBody.innerHTML = `
            <tr><td colspan="6" class="empty-state">
                <i class="fas fa-box-open"></i>
                <h4>No products found</h4>
                <p>Try adjusting your search or add a new product</p>
            </td></tr>`;
    return;
  }

  for (let p of pageProducts) {
    productsTableBody.innerHTML += `
        <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>$${p.price.toFixed(2)}</td>
            <td><span class="badge badge-custom">${p.quantity} units</span></td>
            <td>$${(p.price * p.quantity).toFixed(2)}</td>
            <td>
                <button class="btn btn-sm btn-warning action-btn edit-btn"
                    data-id="${p.id}" data-name="${p.name}"
                    data-price="${p.price}" data-quantity="${p.quantity}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger action-btn delete-btn" data-id="${
                  p.id
                }">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>`;
  }

  document
    .querySelectorAll(".edit-btn")
    .forEach((btn) => btn.addEventListener("click", openEditModal));
  document
    .querySelectorAll(".delete-btn")
    .forEach((btn) => btn.addEventListener("click", deleteProduct));
}

function renderPagination() {
  pagination.innerHTML = "";
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  if (totalPages <= 1) return;

  const addPageItem = (i, text, active = false, disabled = false) => {
    const li = document.createElement("li");
    li.className = `page-item ${active ? "active" : ""} ${
      disabled ? "disabled" : ""
    }`;
    li.innerHTML = `<a class="page-link" href="#">${text}</a>`;
    li.addEventListener("click", (e) => {
      e.preventDefault();
      if (!disabled) {
        currentPage = i;
        renderProducts();
        renderPagination();
        window.scrollTo(0, 0);
      }
    });
    pagination.appendChild(li);
  };

  addPageItem(
    currentPage - 1,
    '<i class="fas fa-chevron-left"></i>',
    false,
    currentPage === 1
  );

  for (let i = 1; i <= totalPages; i++) {
    addPageItem(i, i, i === currentPage);
  }

  addPageItem(
    currentPage + 1,
    '<i class="fas fa-chevron-right"></i>',
    false,
    currentPage === totalPages
  );
}

function handleSearch(e) {
  e.preventDefault();
  const term = searchInput.value.trim().toLowerCase();
  filteredProducts = term
    ? products.filter((p) => p.name.toLowerCase().includes(term))
    : [...products];
  currentPage = 1;
  updateStats();
  renderProducts();
  renderPagination();
  clearSearchBtn.style.display = term ? "block" : "none";
}

function clearSearch() {
  searchInput.value = "";
  filteredProducts = [...products];
  currentPage = 1;
  updateStats();
  renderProducts();
  renderPagination();
  clearSearchBtn.style.display = "none";
}

function updateStats() {
  const total = filteredProducts.length;
  const value = filteredProducts.reduce(
    (sum, p) => sum + p.price * p.quantity,
    0
  );
  const avg =
    filteredProducts.reduce((sum, p) => sum + p.price, 0) / total || 0;

  if (totalProductsEl) totalProductsEl.textContent = total;
  if (totalValueEl) totalValueEl.textContent = `$${value.toFixed(2)}`;
  if (avgPriceEl) avgPriceEl.textContent = `$${avg.toFixed(2)}`;
}

function openEditModal(e) {
  const btn = e.currentTarget;
  document.getElementById("edit-id").value = btn.dataset.id;
  document.getElementById("edit-name").value = btn.dataset.name;
  document.getElementById("edit-price").value = btn.dataset.price;
  document.getElementById("edit-quantity").value = btn.dataset.quantity;
  new bootstrap.Modal(document.getElementById("editProductModal")).show();
}

function deleteProduct(e) {
  if (confirm("Are you sure you want to delete this product?")) {
    const id = parseInt(e.currentTarget.dataset.id);
    products = products.filter((p) => p.id !== id);
    saveProducts(products);
    filteredProducts = [...products];
    renderProducts();
    renderPagination();
    updateStats();
    alert("Product deleted successfully!");
  }
}

function handleEdit(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById("edit-id").value);
  const name = document.getElementById("edit-name").value.trim();
  const price = parseFloat(document.getElementById("edit-price").value);
  const quantity = parseInt(document.getElementById("edit-quantity").value);

  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) {
    products[index] = { id, name, price, quantity };
    saveProducts(products);
    filteredProducts = [...products];
    const modalEl = document.getElementById("editProductModal");
    const modal = bootstrap.Modal.getInstance(modalEl);
    modal.hide();

    renderProducts();
    renderPagination();
    updateStats();
    alert("Product updated successfully!");
  }
}

function handleAdd(e) {
  e.preventDefault();
  const name = document.getElementById("add-name").value.trim();
  const price = parseFloat(document.getElementById("add-price").value);
  const quantity = parseInt(document.getElementById("add-quantity").value);

  const id = products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1;
  const newProduct = { id, name, price, quantity };
  products.push(newProduct);
  saveProducts(products);
  filteredProducts = [...products];
  new bootstrap.Modal(document.getElementById("addProductModal")).hide();
  addForm.reset();
  renderProducts();
  renderPagination();
  updateStats();
  alert("Product added successfully!");
}

function exportToExcel() {
  const headers = ["ID", "Name", "Price", "Quantity"];
  const csvRows = [headers.join(",")];

  filteredProducts.forEach((p) => {
    csvRows.push(`${p.id},"${p.name}",${p.price},${p.quantity}`);
  });

  const blob = new Blob([csvRows.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  const today = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `products_export_${today}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleImport(e) {
  e.preventDefault();

  const file = importFileInput.files[0];
  fileSizeError.style.display = "none";
  importSuccess.style.display = "none";

  if (file && file.size <= 2 * 1024 * 1024) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const lines = event.target.result.split("\n");
      const imported = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].trim();
        if (row) {
          const [name, price, quantity] = row.split(",");
          if (name && !isNaN(price) && !isNaN(quantity)) {
            const id = products.length
              ? Math.max(...products.map((p) => p.id)) + 1
              : 1;
            imported.push({
              id,
              name: name.replace(/\"/g, "").trim(),
              price: parseFloat(price),
              quantity: parseInt(quantity),
            });
          }
        }
      }

      products = products.concat(imported);
      saveProducts(products);
      filteredProducts = [...products];
      currentPage = 1;
      renderProducts();
      renderPagination();
      updateStats();
      importFileInput.value = "";
      importSuccess.style.display = "block";
    };

    reader.readAsText(file);
  } else {
    fileSizeError.style.display = "block";
  }
}

const DATA = [
  { item: "milk", store: "FreshMart", price: 2.49, unit: "1L" },
  { item: "milk", store: "BudgetGrocer", price: 2.19, unit: "1L" },
  { item: "milk", store: "DailyShop", price: 2.39, unit: "1L" },
  { item: "eggs", store: "FreshMart", price: 3.29, unit: "12-pack" },
  { item: "eggs", store: "BudgetGrocer", price: 2.99, unit: "12-pack" },
  { item: "eggs", store: "DailyShop", price: 3.09, unit: "12-pack" },
  { item: "bread", store: "FreshMart", price: 1.99, unit: "loaf" },
  { item: "bread", store: "BudgetGrocer", price: 1.59, unit: "loaf" },
  { item: "bread", store: "DailyShop", price: 1.79, unit: "loaf" },
  { item: "bananas", store: "FreshMart", price: 0.69, unit: "lb" },
  { item: "bananas", store: "BudgetGrocer", price: 0.59, unit: "lb" },
  { item: "bananas", store: "DailyShop", price: 0.64, unit: "lb" },
  { item: "rice", store: "FreshMart", price: 6.99, unit: "5lb" },
  { item: "rice", store: "BudgetGrocer", price: 6.49, unit: "5lb" },
  { item: "rice", store: "DailyShop", price: 6.79, unit: "5lb" },
  { item: "chicken", store: "FreshMart", price: 4.29, unit: "lb" },
  { item: "chicken", store: "BudgetGrocer", price: 3.99, unit: "lb" },
  { item: "chicken", store: "DailyShop", price: 4.19, unit: "lb" },
];

function normalizeText(text) {
  return (text || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function filterOffers(query) {
  const q = normalizeText(query);
  if (!q) return [];
  return DATA.filter((row) => normalizeText(row.item).includes(q));
}

function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

function byPriceAsc(a, b) { return a.price - b.price; }

function groupByItem(offers) {
  const map = new Map();
  for (const o of offers) {
    if (!map.has(o.item)) map.set(o.item, []);
    map.get(o.item).push(o);
  }
  return map;
}

function onSearch(query) {
  const statusEl = document.getElementById("status");
  const cheapestSection = document.getElementById("cheapestSection");
  const offersSection = document.getElementById("offersSection");
  const cheapestList = document.getElementById("cheapestList");
  const offersBody = document.getElementById("offersBody");

  const offers = filterOffers(query).sort(byPriceAsc);

  // Status
  if (!query) {
    statusEl.textContent = "";
  } else if (offers.length === 0) {
    statusEl.textContent = `No results for "${query}"`;
  } else {
    statusEl.textContent = `${offers.length} offer${offers.length === 1 ? "" : "s"} found for "${query}"`;
  }

  // Offers table
  offersBody.innerHTML = offers
    .map((o) => `
      <tr>
        <td>${o.item}</td>
        <td>${o.store}</td>
        <td class="num">${formatCurrency(o.price)}</td>
        <td>${o.unit}</td>
      </tr>
    `)
    .join("");

  // Cheapest per item
  const grouped = groupByItem(offers);
  const cheapestCards = [];
  for (const [item, list] of grouped.entries()) {
    const cheapest = [...list].sort(byPriceAsc)[0];
    cheapestCards.push(`
      <div class="card">
        <p class="title">${item}</p>
        <p class="meta">Best price at <strong>${cheapest.store}</strong></p>
        <p class="price">${formatCurrency(cheapest.price)} <span class="meta">/ ${cheapest.unit}</span></p>
      </div>
    `);
  }
  cheapestList.innerHTML = cheapestCards.join("");

  // Toggle sections
  const hasResults = offers.length > 0;
  cheapestSection.classList.toggle("hidden", !hasResults);
  offersSection.classList.toggle("hidden", !hasResults);
}

function wireUp() {
  const input = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearBtn");
  const suggestions = document.getElementById("suggestions");

  input.addEventListener("input", (e) => onSearch(e.target.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      onSearch(input.value);
    }
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    onSearch("");
    input.focus();
  });

  suggestions.addEventListener("click", (e) => {
    const target = e.target;
    if (target.matches(".chip")) {
      const q = target.getAttribute("data-q");
      input.value = q;
      onSearch(q);
      input.focus();
    }
  });
}

window.addEventListener("DOMContentLoaded", wireUp);
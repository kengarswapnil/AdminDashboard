"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  getProducts,
  searchProducts,
  getCategories,
  deleteProduct,
} from "@/lib/products";

import { Product } from "@/types/product";

// ============================================
// DESIGN TOKENS (styling only)
// ============================================

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

const field =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15";

const btnAdd = `inline-flex items-center justify-center rounded-full bg-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400 ${focus}`;

const btnHeaderGhost = `inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20 ${focus}`;

const btnView = `inline-flex items-center justify-center rounded-lg bg-[#12143a] px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 ${focus}`;

const btnGhost = `inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${focus}`;

const btnDanger = `inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 ${focus}`;

const pageBtn = `min-w-9 shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white ${focus}`;

// Fetch the whole list once, then filter / sort / paginate on the client.
const FETCH_ALL = 1000;

function ProductsPageContent()  {
  const router = useRouter();
  const searchParams = useSearchParams();

  // SEARCH
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const searchQuery = searchParams.get("search") || "";

  // CATEGORY
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState(
    searchParams.get("category") || ""
  );

  // SORT
  const [sort, setSort] = useState(searchParams.get("sort") || "");

  // PRODUCTS
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);

  // Cache of the API result for the current search term
  const apiCache = useRef<{ query: string; products: Product[] } | null>(null);

  // UI STATES
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // USER
  const [username, setUsername] = useState("Admin");

  // PAGINATION
  const pageParam = Number(searchParams.get("page"));
  const limitParam = Number(searchParams.get("limit"));

  const page =
    Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const limit = [10, 20, 50].includes(limitParam) ? limitParam : 10;

  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  // ============================================
  // AUTHENTICATION
  // ============================================

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login");
      return;
    }

    const storedUsername = localStorage.getItem("username");

    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, [router]);

  // ============================================
  // LOAD CATEGORIES
  // ============================================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };

    loadCategories();
  }, []);

  // ============================================
  // DEBOUNCED SEARCH
  // ============================================

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get("search") || "";

      if (searchInput.trim() === currentSearch) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());

      if (searchInput.trim()) {
        params.set("search", searchInput.trim());
      } else {
        params.delete("search");
      }

      // New search starts from page 1
      params.set("page", "1");
      params.set("limit", String(limit));

      router.push(`/products?${params.toString()}`);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput, searchParams, router, limit]);

  // ============================================
  // CATEGORY + SORT URL SYNC
  // ============================================

  useEffect(() => {
    const currentCategory = searchParams.get("category") || "";
    const currentSort = searchParams.get("sort") || "";

    if (category === currentCategory && sort === currentSort) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    // Category
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }

    // Sort
    if (sort) {
      params.set("sort", sort);
    } else {
      params.delete("sort");
    }

    // Reset page when filter changes
    params.set("page", "1");
    params.set("limit", String(limit));

    router.push(`/products?${params.toString()}`);
  }, [category, sort, searchParams, router, limit]);

  // ============================================
  // LOAD PRODUCTS
  // ============================================

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();

    const query = searchQuery.trim();

    const loadProducts = async () => {
      try {
        setError("");

        // API PRODUCTS (fetched once per search term, then reused)
        let apiProducts: Product[];

        if (apiCache.current && apiCache.current.query === query) {
          apiProducts = apiCache.current.products;
        } else {
          setLoading(true);

          const data = query
            ? await searchProducts(query, FETCH_ALL, 0, controller.signal)
            : await getProducts(FETCH_ALL, 0);

          if (controller.signal.aborted) {
            return;
          }

          apiProducts = data.products;

          apiCache.current = { query, products: apiProducts };
        }

        // LOCAL PRODUCTS
        const storedProducts = localStorage.getItem("localProducts");

        const localProducts: Product[] = storedProducts
          ? JSON.parse(storedProducts)
          : [];

        // DELETED API PRODUCT IDS
        const storedDeletedIds = localStorage.getItem("deletedProductIds");

        const deletedProductIds: number[] = storedDeletedIds
          ? JSON.parse(storedDeletedIds)
          : [];

        // COMBINE API + LOCAL PRODUCTS
        let allProducts = [...localProducts, ...apiProducts];

        // REMOVE DUPLICATES
        allProducts = allProducts.filter(
          (product, index, array) =>
            array.findIndex((item) => item.id === product.id) === index
        );

        // REMOVE DELETED API PRODUCTS
        allProducts = allProducts.filter(
          (product) => !deletedProductIds.includes(product.id)
        );

        let filteredProducts = allProducts;

        // SEARCH FILTER FOR LOCAL PRODUCTS
        if (query) {
          const lower = query.toLowerCase();

          filteredProducts = filteredProducts.filter(
            (product) =>
              product.title.toLowerCase().includes(lower) ||
              product.description.toLowerCase().includes(lower) ||
              product.category.toLowerCase().includes(lower)
          );
        }

        // CATEGORY FILTER
        if (category) {
          filteredProducts = filteredProducts.filter(
            (product) => product.category === category
          );
        }

        // SORTING
        switch (sort) {
          case "price-asc":
            filteredProducts = [...filteredProducts].sort(
              (a, b) => a.price - b.price
            );
            break;

          case "price-desc":
            filteredProducts = [...filteredProducts].sort(
              (a, b) => b.price - a.price
            );
            break;

          case "rating-desc":
            filteredProducts = [...filteredProducts].sort(
              (a, b) => b.rating - a.rating
            );
            break;

          case "title-asc":
            filteredProducts = [...filteredProducts].sort((a, b) =>
              a.title.localeCompare(b.title)
            );
            break;

          case "title-desc":
            filteredProducts = [...filteredProducts].sort((a, b) =>
              b.title.localeCompare(a.title)
            );
            break;

          default:
            break;
        }

        // PAGINATION (done once, on the full filtered list)
        setProducts(filteredProducts.slice(skip, skip + limit));

        // TOTAL
        setTotal(filteredProducts.length);
      } catch (error: any) {
        // Ignore cancelled requests
        if (error?.code === "ERR_CANCELED") {
          return;
        }

        console.error("Product loading error:", error);

        setError("Failed to load products.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      controller.abort();
    };
  }, [router, searchQuery, category, sort, limit, skip]);

  // ============================================
  // CHANGE PAGE
  // ============================================

  const changePage = (newPage: number) => {
    if (newPage < 1) {
      return;
    }

    if (totalPages > 0 && newPage > totalPages) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    params.set("page", String(newPage));
    params.set("limit", String(limit));

    router.push(`/products?${params.toString()}`);
  };

  // ============================================
  // CHANGE PAGE SIZE
  // ============================================

  const changeLimit = (newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", "1");
    params.set("limit", String(newLimit));

    router.push(`/products?${params.toString()}`);
  };

  // ============================================
  // LOGOUT
  // ============================================

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");

    router.replace("/login");
  };

  // ============================================
  // DELETE PRODUCT
  // ============================================

  const handleDeleteProduct = async (id: number) => {
    // Prevent duplicate delete requests
    if (deletingId !== null) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      // GET LOCAL PRODUCTS
      const storedProducts = localStorage.getItem("localProducts");

      const localProducts: Product[] = storedProducts
        ? JSON.parse(storedProducts)
        : [];

      // CHECK LOCAL PRODUCT
      const localProductIndex = localProducts.findIndex(
        (product) => product.id === id
      );

      // DELETE LOCAL PRODUCT
      if (localProductIndex !== -1) {
        const updatedLocalProducts = localProducts.filter(
          (product) => product.id !== id
        );

        localStorage.setItem(
          "localProducts",
          JSON.stringify(updatedLocalProducts)
        );

        // Remove from current UI
        setProducts((currentProducts) =>
          currentProducts.filter((product) => product.id !== id)
        );

        setTotal((currentTotal) => Math.max(currentTotal - 1, 0));

        return;
      }

      // DELETE API PRODUCT
      await deleteProduct(id);

      // SAVE DELETED API ID
      const storedDeletedIds = localStorage.getItem("deletedProductIds");

      const deletedProductIds: number[] = storedDeletedIds
        ? JSON.parse(storedDeletedIds)
        : [];

      if (!deletedProductIds.includes(id)) {
        deletedProductIds.push(id);
      }

      localStorage.setItem(
        "deletedProductIds",
        JSON.stringify(deletedProductIds)
      );

      // REMOVE FROM CURRENT UI
      setProducts((currentProducts) =>
        currentProducts.filter((product) => product.id !== id)
      );

      setTotal((currentTotal) => Math.max(currentTotal - 1, 0));
    } catch (error) {
      console.error("Failed to delete product:", error);

      setError("Failed to delete product. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#12143a]">
        <div className="flex flex-col items-center gap-4">
          <div
            aria-hidden
            className="size-10 animate-spin rounded-full border-4 border-white/20 border-t-indigo-400 motion-reduce:animate-none"
          />
          <p role="status" className="font-medium text-indigo-100">
            Loading products...
          </p>
        </div>
      </main>
    );
  }

  // ============================================
  // ERROR
  // ============================================

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#12143a] px-4">
        <div
          role="alert"
          className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl"
        >
          <div
            aria-hidden
            className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 text-xl font-bold text-red-600"
          >
            !
          </div>

          <p className="mb-6 font-medium text-slate-800">{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className={`rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white transition hover:bg-indigo-500 ${focus}`}
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  // ============================================
  // MAIN UI
  // Desktop: one-screen layout, only the product list scrolls.
  // Mobile: everything stacks and the page scrolls normally.
  // ============================================

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#f3f4fa] text-slate-900 lg:flex lg:flex-col lg:overflow-hidden">
      {/* HEADER */}
      <header className="shrink-0 bg-[#12143a] px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-lg font-semibold text-white"
            >
              {username.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Product Admin Dashboard
              </h1>

              <p className="text-sm text-indigo-200/80">Welcome, {username}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/products/new")}
              className={btnAdd}
            >
              + Add Product
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className={btnHeaderGhost}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-col p-4 sm:p-6 lg:min-h-0 lg:flex-1">
        {/* PRODUCTS */}
        <section className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-indigo-950/10 lg:min-h-0 lg:flex-1">
          {/* FILTERS (fixed) */}
          <div className="shrink-0 border-b border-slate-100 bg-slate-50/70 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
              {/* Search */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label
                  htmlFor="search"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Search Products
                </label>

                <input
                  id="search"
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search products..."
                  className={field}
                />
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Category
                </label>

                <select
                  id="category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={field}
                >
                  <option value="">All Categories</option>

                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label
                  htmlFor="sort"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Sort By
                </label>

                <select
                  id="sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className={field}
                >
                  <option value="">Default</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Rating: High to Low</option>
                  <option value="title-asc">Name: A to Z</option>
                  <option value="title-desc">Name: Z to A</option>
                </select>
              </div>

              {/* Page Size */}
              <div>
                <label
                  htmlFor="limit"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Page Size:
                </label>

                <select
                  id="limit"
                  value={limit}
                  onChange={(event) => changeLimit(Number(event.target.value))}
                  className={field}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {/* ACTIVE SEARCH + CATEGORY */}
            {(searchQuery || category) && (
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {searchQuery && (
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 ring-1 ring-inset ring-indigo-600/15">
                    Searching for: <strong>{searchQuery}</strong>
                  </span>
                )}

                {category && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 ring-1 ring-inset ring-slate-300/70">
                    Category: <strong>{category}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* PRODUCT LIST (the only scrolling area on desktop) */}
          <div className="overscroll-contain lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {products.length === 0 ? (
              <div className="p-14 text-center">
                <p className="text-slate-500">No products found.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {products.map((product) => (
                  <li
                    key={product.id}
                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-indigo-50/40 lg:flex-row lg:items-center"
                  >
                    {/* Image */}
                    <img
                      src={
                        product.thumbnail ||
                        "https://dummyjson.com/image/100x100"
                      }
                      alt={product.title}
                      className="size-16 shrink-0 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 object-cover ring-1 ring-slate-200"
                    />

                    {/* Information */}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-slate-900">
                        {product.title}
                      </h3>

                      <p className="text-sm capitalize text-slate-500">
                        {product.category}
                      </p>
                    </div>

                    <p className="text-xl font-semibold tabular-nums text-slate-900 lg:w-24 lg:text-right">
                      ${product.price}
                    </p>

                    {/* Rating + Stock */}
                    <div className="flex gap-2 text-sm lg:w-52">
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-800 ring-1 ring-inset ring-amber-600/20">
                        Rating: {product.rating ?? "N/A"}
                      </span>

                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 ring-1 ring-inset ring-slate-300/60">
                        Stock: {product.stock ?? 0}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {/* View */}
                      <button
                        type="button"
                        onClick={() => router.push(`/products/${product.id}`)}
                        className={btnView}
                      >
                        View Details
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/products/${product.id}/edit`)
                        }
                        className={btnGhost}
                      >
                        Edit
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={deletingId !== null}
                        className={btnDanger}
                      >
                        {deletingId === product.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* PAGINATION (fixed) */}
          {products.length > 0 && (
            <nav
              aria-label="Pagination"
              className="flex shrink-0 flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-3 lg:flex-row"
            >
              {/* Page information */}
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages || 1}
              </p>

              <div className="flex min-w-0 max-w-full items-center gap-2">
                {/* Previous */}
                <button
                  type="button"
                  onClick={() => changePage(page - 1)}
                  disabled={page === 1}
                  className={pageBtn}
                >
                  Previous
                </button>

                {/* Page numbers (scroll sideways if there are many) */}
                <div className="flex min-w-0 gap-1 overflow-x-auto p-0.5">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                    (pageNumber) => (
                      <button
                        type="button"
                        key={pageNumber}
                        onClick={() => changePage(pageNumber)}
                        aria-current={pageNumber === page ? "page" : undefined}
                        className={`${pageBtn} ${
                          pageNumber === page
                            ? "!border-[#12143a] !bg-[#12143a] !text-white"
                            : ""
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  )}
                </div>

                {/* Next */}
                <button
                  type="button"
                  onClick={() => changePage(page + 1)}
                  disabled={page === totalPages || totalPages === 0}
                  className={pageBtn}
                >
                  Next
                </button>
              </div>
            </nav>
          )}
        </section>
      </div>
    </main>
  );

}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsPageContent />
    </Suspense>
  );
}


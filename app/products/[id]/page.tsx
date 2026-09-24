"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { getProduct } from "@/lib/products";
import { Product } from "@/types/product";

// ============================================
// DESIGN HELPERS (styling only)
// ============================================

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 20 20"
          className={`size-4 ${
            n <= Math.round(value) ? "text-amber-400" : "text-slate-300"
          }`}
          fill="currentColor"
        >
          <path d="M10 1.5l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L1.4 7.8l6-.8L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

export default function ProductDetailsPage() {
  const router = useRouter();

  const params = useParams();

  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // UI only: selected gallery image
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login");
      return;
    }

    const loadProduct = async () => {
      try {
        setLoading(true);
        setError("");

        // CHECK LOCAL PRODUCTS FIRST
        const storedProducts = localStorage.getItem("localProducts");

        const localProducts: Product[] = storedProducts
          ? JSON.parse(storedProducts)
          : [];

        // CHECK DELETED PRODUCTS
        const storedDeletedIds = localStorage.getItem("deletedProductIds");

        const deletedProductIds: number[] = storedDeletedIds
          ? JSON.parse(storedDeletedIds)
          : [];

        if (deletedProductIds.includes(Number(id))) {
          setProduct(null);
          setError("Product not found.");
          setLoading(false);
          return;
        }

        // FIND LOCAL PRODUCT
        const localProduct = localProducts.find(
          (item) => String(item.id) === String(id)
        );

        if (localProduct) {
          setProduct(localProduct);
          setLoading(false);
          return;
        }

        // IF NOT LOCAL, GET FROM API
        const data = await getProduct(id);

        setProduct(data);
      } catch (error) {
        console.error("Failed to load product:", error);

        setError("Product not found or failed to load.");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, router]);

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
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  // ============================================
  // ERROR / NOT FOUND
  // ============================================

  if (error || !product) {
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

          <p className="mb-6 font-medium text-slate-800">
            {error || "Product not found."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/products")}
            className={`rounded-xl bg-indigo-600 px-6 py-2.5 font-medium text-white transition hover:bg-indigo-500 ${focus}`}
          >
            Back to Products
          </button>
        </div>
      </main>
    );
  }

  // ============================================
  // MAIN UI
  // ============================================

  const stock = product.stock ?? 0;

  const stockDot =
    stock === 0 ? "bg-red-500" : stock < 10 ? "bg-amber-500" : "bg-emerald-500";

  const gallery = Array.from(
    new Set(
      [product.thumbnail, ...(product.images ?? [])].filter(Boolean) as string[]
    )
  ).slice(0, 5);

  const mainImage =
    gallery[activeImage] ||
    product.thumbnail ||
    "https://dummyjson.com/image/500x500";

  return (
    // Desktop: fixed one-screen layout, the page itself does not scroll.
    // Mobile: sections stack and the page scrolls normally.
    <main className="flex min-h-dvh flex-col bg-[#f3f4fa] text-slate-900 lg:h-dvh lg:overflow-hidden">
      {/* HEADER */}
      <header className="shrink-0 bg-[#12143a] px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="rounded-full bg-indigo-400/20 px-3 py-0.5 text-sm font-medium capitalize text-indigo-200 ring-1 ring-inset ring-indigo-300/30">
                {product.category}
              </p>

              {product.brand && (
                <p className="text-sm text-indigo-200/80">
                  Brand:{" "}
                  <span className="font-medium text-white">
                    {product.brand}
                  </span>
                </p>
              )}
            </div>

            <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {product.title}
            </h1>
          </div>

          {/* Back Button */}
          <button
            type="button"
            onClick={() => router.push("/products")}
            className={`w-fit shrink-0 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 ${focus}`}
          >
            ← Back to Products
          </button>
        </div>
      </header>

      {/* TWO SECTIONS */}
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-5 p-4 sm:p-6 lg:flex-row">
        {/* SECTION 1: PRODUCT (fixed) */}
        <section
          aria-label="Product"
          className="flex min-h-0 flex-col gap-4 rounded-3xl bg-white p-5 shadow-xl shadow-indigo-950/10 lg:w-[45%] lg:shrink-0"
        >
          <div className="flex h-72 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 via-slate-50 to-violet-50 p-3 lg:h-auto lg:min-h-0 lg:flex-1">
            <img
              src={mainImage}
              alt={product.title}
              className="h-full w-full object-contain drop-shadow-xl"
            />
          </div>

          {/* Additional Images */}
          {gallery.length > 1 && (
            <div className="grid shrink-0 grid-cols-5 gap-2">
              {gallery.map((image, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-pressed={index === activeImage}
                  className={`overflow-hidden rounded-xl border-2 bg-white transition ${focus} ${
                    index === activeImage
                      ? "border-indigo-500"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="h-12 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="flex shrink-0 items-end justify-between gap-4">
            <p className="text-5xl font-semibold tabular-nums tracking-tight">
              ${product.price}
            </p>

            <div className="flex gap-2">
              {/* Rating */}
              <div className="rounded-xl bg-amber-50 px-3 py-2 ring-1 ring-inset ring-amber-500/20">
                <p className="text-xs text-slate-500">Rating</p>

                <p className="font-semibold">{product.rating ?? "N/A"}</p>
              </div>

              {/* Stock */}
              <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-200">
                <p className="text-xs text-slate-500">Stock</p>

                <p className="flex items-center gap-1.5 font-semibold">
                  <span
                    aria-hidden
                    className={`size-2 rounded-full ${stockDot}`}
                  />
                  {stock}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => router.push(`/products/${product.id}/edit`)}
            className={`shrink-0 rounded-xl bg-[#12143a] px-6 py-3 font-medium text-white shadow-lg shadow-indigo-950/20 transition hover:bg-indigo-700 ${focus}`}
          >
            Edit Product
          </button>
        </section>

        {/* SECTION 2: DESCRIPTION + REVIEWS (scrolls inside itself) */}
        <section
          aria-label="Description and reviews"
          tabIndex={0}
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-3xl bg-white p-6 shadow-xl shadow-indigo-950/10 sm:p-8 ${focus}`}
        >
          {/* Description */}
          <h2 className="mb-3 text-2xl font-semibold tracking-tight">
            Description
          </h2>

          <p className="text-lg leading-8 text-slate-600">
            {product.description}
          </p>

          {/* Reviews */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="mt-10 border-t border-slate-100 pt-8">
              <h2 className="mb-5 text-2xl font-semibold tracking-tight">
                Reviews
              </h2>

              <div className="space-y-4">
                {product.reviews.map((review, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200/70"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        aria-hidden
                        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700"
                      >
                        {review.reviewerName?.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {review.reviewerName}
                        </p>

                        <p className="text-xs text-slate-400">{review.date}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Stars value={review.rating} />

                        <span className="text-sm font-medium text-slate-700">
                          {review.rating}
                        </span>
                      </div>
                    </div>

                    <p className="mt-3 leading-7 text-slate-600">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
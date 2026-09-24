"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import ProductForm from "@/components/ProductFrom";
import { getProduct, updateProduct } from "@/lib/products";
import { Product } from "@/types/product";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  // ============================================
  // LOAD PRODUCT
  // ============================================

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

        const localProduct = localProducts.find(
          (item) => String(item.id) === String(id)
        );

        // LOCAL PRODUCT FOUND
        if (localProduct) {
          setProduct(localProduct);
          return;
        }

        // API PRODUCT
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
  // UPDATE PRODUCT
  // ============================================

  const handleUpdateProduct = async (data: Partial<Product>) => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      // CHECK IF PRODUCT IS LOCAL
      const storedProducts = localStorage.getItem("localProducts");

      const localProducts: Product[] = storedProducts
        ? JSON.parse(storedProducts)
        : [];

      const localProductIndex = localProducts.findIndex(
        (item) => String(item.id) === String(id)
      );

      // LOCAL PRODUCT
      if (localProductIndex !== -1) {
        const updatedLocalProduct: Product = {
          ...localProducts[localProductIndex],
          ...data,
          id: localProducts[localProductIndex].id,
        };

        localProducts[localProductIndex] = updatedLocalProduct;

        localStorage.setItem("localProducts", JSON.stringify(localProducts));

        console.log("Local product updated:", updatedLocalProduct);

        router.push("/products");

        return;
      }

      // API PRODUCT
      const updatedProduct = await updateProduct(Number(id), data);

      console.log("API product updated:", updatedProduct);

      // STORE UPDATED API PRODUCT LOCALLY
      localProducts.push(updatedProduct);

      localStorage.setItem("localProducts", JSON.stringify(localProducts));

      router.push("/products");
    } catch (error) {
      console.error("Failed to update product:", error);

      throw error;
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // LOADING
  // ============================================

  if (loading) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-[#12143a]">
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
  // ERROR
  // ============================================

  if (error || !product) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-[#12143a] px-4">
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
  // One-screen layout: the page never scrolls. Header stays fixed and
  // the form fills the remaining height.
  // ============================================

  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden bg-[#f3f4fa] text-slate-900">
      {/* HEADER */}
      <header className="shrink-0 bg-[#12143a] px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          {/* Header */}
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Edit Product
            </h1>

            <p className="truncate text-sm text-indigo-200/80">
              Update product information
            </p>
          </div>

          {/* Back Button */}
          <button
            type="button"
            onClick={() => router.push("/products")}
            className={`shrink-0 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 ${focus}`}
          >
            ← Back to Products
          </button>
        </div>
      </header>

      {/* FORM (fills the rest of the screen) */}
      <div className="mx-auto min-h-0 w-full max-w-4xl flex-1 p-4 sm:p-6">
        <div className="h-full overflow-y-auto overscroll-contain rounded-3xl bg-white p-2 shadow-xl shadow-indigo-950/10 sm:p-4">
          <ProductForm
            initialData={product}
            submitLabel="Update Product"
            loading={saving}
            onSubmit={handleUpdateProduct}
          />
        </div>
      </div>
    </main>
  );
}
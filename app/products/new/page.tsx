"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ProductForm from "@/components/ProductFrom";
import { addProduct } from "@/lib/products";
import { Product } from "@/types/product";

const focus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";

export default function NewProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.replace("/login");
      return;
    }

    setAuthChecking(false);
  }, [router]);

  const handleCreateProduct = async (data: Partial<Product>) => {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const createdProduct = await addProduct(data);

      /*
       * DummyJSON does not permanently save new products.
       * Store the created product locally so our dashboard
       * can continue displaying it.
       */

      const storedProducts = localStorage.getItem("localProducts");

      const localProducts: Product[] = storedProducts
        ? JSON.parse(storedProducts)
        : [];

      localProducts.push(createdProduct);

      localStorage.setItem("localProducts", JSON.stringify(localProducts));

      console.log("Product created:", createdProduct);

      router.push("/products");
    } catch (error) {
      console.error("Failed to create product:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <main className="fixed inset-0 flex items-center justify-center bg-[#12143a]">
        <div className="flex flex-col items-center gap-4">
          <div
            aria-hidden
            className="size-10 animate-spin rounded-full border-4 border-white/20 border-t-indigo-400 motion-reduce:animate-none"
          />
          <p role="status" className="font-medium text-indigo-100">
            Checking authentication...
          </p>
        </div>
      </main>
    );
  }

  // One-screen layout: the page never scrolls. The header stays fixed and
  // the form fills the remaining height.
  return (
    <main className="fixed inset-0 flex flex-col overflow-hidden bg-[#f3f4fa] text-slate-900">
      {/* HEADER */}
      <header className="shrink-0 bg-[#12143a] px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Add Product
            </h1>

            <p className="truncate text-sm text-indigo-200/80">
              Create a new product
            </p>
          </div>

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
            submitLabel="Create Product"
            loading={loading}
            onSubmit={handleCreateProduct}
          />
        </div>
      </div>
    </main>
  );
}
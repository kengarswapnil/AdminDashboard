// import api from "./axios";
// import { Product, ProductResponse } from "@/types/product";

// export const getProducts = async (
//   limit: number,
//   skip: number
// ): Promise<ProductResponse> => {
//   const response = await api.get<ProductResponse>("/products", {
//     params: {
//       limit,
//       skip,
//     },
//   });

//   return response.data;
// };

// export const searchProducts = async (
//   query: string,
//   limit: number,
//   skip: number,
//   signal?: AbortSignal
// ): Promise<ProductResponse> => {
//   const response = await api.get<ProductResponse>("/products/search", {
//     params: {
//       q: query,
//       limit,
//       skip,
//     },
//     signal,
//   });

//   return response.data;
// };

// export const getProduct = async (
//   id: string
// ): Promise<Product> => {
//   const response = await api.get<Product>(`/products/${id}`);

//   return response.data;
// };

// export const addProduct = async (
//   product: Partial<Product>
// ): Promise<Product> => {
//   const response = await api.post<Product>(
//     "/products/add",
//     product
//   );

//   return response.data;
// };

// export const updateProduct = async (
//   id: number,
//   product: Partial<Product>
// ): Promise<Product> => {
//   const response = await api.put<Product>(
//     `/products/${id}`,
//     product
//   );

//   return response.data;
// };

// export const deleteProduct = async (
//   id: number
// ): Promise<Product> => {
//   const response = await api.delete<Product>(
//     `/products/${id}`
//   );

//   return response.data;
// };



// // Get all categories
// export const getCategories = async (): Promise<string[]> => {
//   const response = await api.get<string[]>(
//     "/products/category-list"
//   );

//   return response.data;
// };


import api from "./axios";
import { Product, ProductResponse } from "@/types/product";

export const getProducts = async (
  limit: number,
  skip: number
): Promise<ProductResponse> => {
  const response = await api.get<ProductResponse>("/products", {
    params: { limit, skip },
  });

  return response.data;
};

export const searchProducts = async (
  query: string,
  limit: number,
  skip: number,
  signal?: AbortSignal
): Promise<ProductResponse> => {
  const response = await api.get<ProductResponse>("/products/search", {
    params: {
      q: query,
      limit,
      skip,
    },
    signal,
  });

  return response.data;
};

export const getCategories = async (): Promise<string[]> => {
  const response = await api.get<string[]>("/products/category-list");

  return response.data;
};

export const getProduct = async (id: string): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);

  return response.data;
};

export const addProduct = async (
  product: Partial<Product>
): Promise<Product> => {
  const response = await api.post<Product>("/products/add", product);

  return response.data;
};

export const updateProduct = async (
  id: number,
  product: Partial<Product>
): Promise<Product> => {
  const response = await api.put<Product>(
    `/products/${id}`,
    product
  );

  return response.data;
};

export const deleteProduct = async (
  id: number
): Promise<Product> => {
  const response = await api.delete<Product>(
    `/products/${id}`
  );

  return response.data;
};
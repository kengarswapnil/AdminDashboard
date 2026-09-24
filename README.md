# Product Admin Dashboard

A responsive Product Admin Dashboard built with Next.js, React, TypeScript, Tailwind CSS, Axios, and DummyJSON.

The application provides authentication, product listing, searching, filtering, sorting, pagination, product details, and product CRUD operations.

---

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios
- DummyJSON API
- Browser Local Storage

---

## Features

### Authentication

- Login using DummyJSON authentication API
- Access token stored in Local Storage
- Axios automatically sends the token with API requests
- Protected product routes
- Redirect unauthenticated users to the login page
- Logout functionality

### Product Dashboard

- Product listing
- Responsive desktop table
- Responsive mobile card layout
- Product title
- Category
- Price
- Stock
- Rating
- Product actions

### Search

- Product search using DummyJSON search API
- Debounced search input
- Search state synchronized with URL
- AbortController used to prevent stale search responses from updating the UI

### Filtering and Sorting

- Filter products by category
- Sort products by:
  - Price
  - Rating
  - Title
- Filter and sorting state synchronized with URL

### Pagination

- Page navigation
- 10, 20, or 50 products per page
- Pagination state synchronized with URL
- Invalid page handling

### Product Details

Product details page displays:

- Product image
- Additional images
- Title
- Category
- Brand
- Price
- Rating
- Stock
- Description
- Reviews

### Add Product

- Create a new product
- Form validation
- Prevent duplicate submissions
- Product is stored locally because DummyJSON mutations are simulated

### Edit Product

- Edit existing products
- Form validation
- Prevent duplicate submissions
- Local products are updated in Local Storage

### Delete Product

- Delete confirmation
- Prevent duplicate delete requests
- Deleted products are removed from the dashboard
- Deleted API product IDs are stored locally so they do not reappear after refresh

### Error and Loading States

The application handles:

- Loading states
- API errors
- Empty product results
- Product not found
- Invalid login
- Form validation errors

---

## Login Credentials

Use the DummyJSON test credentials:

```text
Username: emilys
Password: emilyspass
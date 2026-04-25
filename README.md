# StyleHub Backend API

Fashion marketplace API built with Node.js + Express + MongoDB.

## Setup

```bash
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and email config
npm run dev
```

## API Endpoints

### Customer Auth — `/api/customer/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Create customer account |
| POST | `/signin` | Customer login |
| POST | `/forgot-password` | Request reset link |
| POST | `/reset-password` | Reset with token |
| GET | `/me` | Get profile (protected) |
| PUT | `/me` | Update profile (protected) |

### Seller Auth — `/api/seller/auth`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Create seller account |
| POST | `/signin` | Seller login |
| POST | `/forgot-password` | Request reset link |
| POST | `/reset-password` | Reset with token |
| GET | `/me` | Get profile (protected) |
| PUT | `/me` | Update profile (protected) |

### Products — `/api/products`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all products (public) |
| GET | `/:id` | Get single product (public) |
| GET | `/my` | Seller's products (seller only) |
| POST | `/` | Add product (seller only) |
| PUT | `/:id` | Update product (seller only) |
| DELETE | `/:id` | Remove product (seller only) |

### Orders — `/api/orders`
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Place order (customer only) |
| GET | `/` | My orders (customer only) |
| GET | `/:id` | Order details (customer only) |
| PATCH | `/:id/cancel` | Cancel order (customer only) |

### Wishlist — `/api/wishlist`
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get wishlist (customer only) |
| POST | `/` | Add to wishlist (customer only) |
| DELETE | `/:productId` | Remove from wishlist (customer only) |

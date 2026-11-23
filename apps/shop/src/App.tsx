import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Spinner, ToastProvider } from "./components/ui";
import { AuthProvider } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import { Home } from "./pages/Home";
import { SearchPage } from "./pages/SearchPage";
import { ProductPage, ShopPage } from "./pages/ProductPage";
import { CartPage, CheckoutPage, OrderDonePage } from "./pages/Checkout";
import { ForgotPage, LoginPage, RegisterPage, ResetPasswordPage } from "./pages/AuthPages";
import { AccountPage, OrdersPage } from "./pages/Account";
import { HelpPage, NotFound } from "./pages/Help";

// Verkäufer- und Admin-Bereich werden nur bei Bedarf geladen (kleinerer Start-Download)
const SellerPage = lazy(() => import("./pages/Seller").then((m) => ({ default: m.SellerPage })));
const AdminPage = lazy(() => import("./pages/Admin").then((m) => ({ default: m.AdminPage })));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <ScrollTop />
            <Layout>
              <Suspense fallback={<Spinner />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/p/:id" element={<ProductPage />} />
                  <Route path="/shop/:id" element={<ShopPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/order/:id" element={<OrderDonePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot" element={<ForgotPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/seller" element={<SellerPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Layout>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

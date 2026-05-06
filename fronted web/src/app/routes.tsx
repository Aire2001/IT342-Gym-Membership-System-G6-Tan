import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { Dashboard } from "./components/Dashboard";
import { Memberships } from "./components/Memberships";
import { Payment } from "./components/Payment";
import { PaymentHistory } from "./components/PaymentHistory";
import { AdminDashboard } from "./components/AdminDashboard";
import { Profile } from "./components/Profile";  // Add this import
import { NotFound } from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Login },
      { path: "register", Component: Register },
      { path: "dashboard", Component: Dashboard },
      { path: "memberships", Component: Memberships },
      { path: "payment/:membershipId", Component: Payment },
      { path: "payment-history", Component: PaymentHistory },
      { path: "profile", Component: Profile },  // Add this route
      { path: "admin", Component: AdminDashboard },
      { path: "*", Component: NotFound },
    ],
  },
]);
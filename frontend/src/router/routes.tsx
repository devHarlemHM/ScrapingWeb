import type { ReactNode } from "react";
import { Navigate, createBrowserRouter } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Layout } from "../layout/Layout";
import { HomePage } from "../pages/HomePage";
import { ExplorePage } from "../pages/ExplorePage";
import { ResultsPage } from "../pages/ResultsPage";
import { HotelDetailsPage } from "../pages/HotelDetailsPage";
import { AdminPanelPage } from "../pages/AdminPanelPage";
import { UserManagementPage } from "../pages/UserManagementPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout><HomePage /></Layout>,
  },
  {
    path: "/explore",
    element: <Layout><ExplorePage /></Layout>,
  },
  {
    path: "/results",
    element: <Layout><ResultsPage /></Layout>,
  },
  {
    path: "/hotel/:id",
    element: <Layout><HotelDetailsPage /></Layout>,
  },
  {
    path: "/admin",
    element: <Layout><RequireAuth><AdminPanelPage /></RequireAuth></Layout>,
  },
  {
    path: "/users",
    element: <Layout><RequireAuth><UserManagementPage /></RequireAuth></Layout>,
  },
]);
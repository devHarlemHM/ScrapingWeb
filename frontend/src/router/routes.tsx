import { createBrowserRouter } from "react-router";
import { Layout } from "../layout/Layout";
import { HomePage } from "../pages/HomePage";
import { ExplorePage } from "../pages/ExplorePage";
import { ResultsPage } from "../pages/ResultsPage";
import { HotelDetailsPage } from "../pages/HotelDetailsPage";

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
]);
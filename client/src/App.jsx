// src/App.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./pages/landing.jsx";
import Login from "./pages/signin.jsx";
import Signup from "./pages/signup.jsx";
import VerifyOTP from "./pages/emailverify.jsx";
import Home from "./pages/home.jsx";
import Profile from "./components/profile.jsx";
import Reports from "./components/reports.jsx";
import "./App.css";
import { AuthProvider } from "./context/authContext.jsx";
import ProtectedRoute from "./components/protectedRoutes.jsx";
import DepartmentalReport from "./components/departmentalReport.jsx";
import ReportVerificationPage from "./components/reportVerification.jsx";
import UnassignedReportsPage from "./components/UnAssignedReports.jsx";
import StaffList from "./components/StaffList.jsx";
import AssignedReports from "./components/assignedReports.jsx";
import HeatMap from "./components/HeatMap.jsx";
import AdminAssignedReports from "./components/AdminAssignedReports.jsx";

import { SocketProvider } from "./context/socketContext.jsx";
import ReportDetails from "./components/ReportDetails.jsx";

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/emailVerify",
    element: <VerifyOTP />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/home", element: <Home /> },
      { path: "/profile", element: <Profile /> },
      { path: "/reports", element: <Reports /> },
      { path: "/departmentalReports", element: <DepartmentalReport /> },
      { path: "/notifications", element: <ReportVerificationPage /> },
      { path: "/unAssignedReports", element: <UnassignedReportsPage /> },
      { path: "/staffList", element: <StaffList /> },
      { path: "/assignedReports", element: <AssignedReports /> },
      { path: "/heatMap", element: <HeatMap /> },
      { path: "/assignedByAdmin", element: <AdminAssignedReports /> },
      {

        path: "/reportDetail/:id",
        element: <ReportDetails />,
      }
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      {/* ✅ SocketProvider inside AuthProvider so it can use user info */}
      <SocketProvider>
        <RouterProvider router={appRouter} />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

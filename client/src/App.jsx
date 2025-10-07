import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./pages/landing.jsx";
import Login from "./pages/signin.jsx";
import Signup from "./pages/signup.jsx";
import VerifyOTP from "./pages/emailverify.jsx";
import Home from "./pages/home.jsx";
import Profile from "./components/profile.jsx";
import Reports from "./components/Reports.jsx";
import "./App.css";
import { AuthProvider } from "./context/authContext.jsx";
import ProtectedRoute from "./components/protectedRoutes.jsx";
import DepartmentalReport from "./components/departmentalReport.jsx";
import VerifyReportStatus from "./components/verifyReportStatus.jsx";
import ReportVerificationPage from "./components/reportVerification.jsx";

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
    // 3. Nest all the routes you want to protect inside its `children` array.
    children: [
      {
        path: "/home",
        element: <Home />,
      },
      {
        path: "/profile",
        element: <Profile />,
      },
      {
        path: "/reports",
        element: <Reports />,
      },
      {
        path: "/departmentalReports",
        element: <DepartmentalReport />,
      },
      {
        path: "/verifyReportStatus",
        element: <VerifyReportStatus />
      },
      {
        path: "/notifications",
        element: <ReportVerificationPage />
      }
    ],
  },
]);

function App() {
  return (
    <>
      <AuthProvider>
        <RouterProvider router={appRouter} />
      </AuthProvider>
    </>
  );
}

export default App;

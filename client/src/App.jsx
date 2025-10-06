import {createBrowserRouter, RouterProvider} from "react-router-dom";
import Landing from "./pages/landing.jsx";
import Login from "./pages/signin.jsx";
import Signup from "./pages/signup.jsx";
import VerifyOTP from "./pages/emailverify.jsx";
import Home from "./pages/home.jsx";
import Profile from "./components/Profile.jsx";
import Reports from "./components/Reports.jsx";
import "./App.css";


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
  }

]);

function App() {
  return (
    <>
        <RouterProvider router={appRouter} />
    </>
  )
}

export default App;
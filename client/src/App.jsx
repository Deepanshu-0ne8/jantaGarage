import {createBrowserRouter, RouterProvider} from "react-router-dom";
import Home from "./pages/home.jsx";
import Login from "./pages/signin.jsx";
import Signup from "./pages/signup.jsx";
import VerifyOTP from "./pages/emailverify.jsx";
import "./App.css";

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
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
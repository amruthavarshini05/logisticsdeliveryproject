import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
//BrowserRouter: Manages routing in a web app using the HTML5 history API.
//Routes: A container for Route elements that renders the first child Route that matches the current URL.
//Route: Defines a mapping between a URL path and a component to render when that path is accessed.
//Navigate: A component used to programmatically navigate to a different route, often used for redirects.
import SenderPage from "./pages/SenderPage";
import DriverAuthPage from "./pages/DriverAuthPage";
import DriverPage from "./pages/DriverPage";
import TrackingPage from "./pages/TrackingPage";
import HomePage from "./pages/HomePage";

//App- route component of app.
//browserrouter-> Wraps entire app in routing context
//routes-> Defines all routes in app
//route-> Maps specific paths to components
//navigate-> Redirects to home for any undefined paths
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sender" element={<SenderPage />} />
        <Route path="/driver/auth" element={<DriverAuthPage />} />
        <Route path="/driver/dashboard" element={<DriverPage />} />
        <Route path="/track/:trackingId" element={<TrackingPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

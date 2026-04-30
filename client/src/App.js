import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SenderPage from "./pages/SenderPage";
import DriverAuthPage from "./pages/DriverAuthPage";
import DriverPage from "./pages/DriverPage";
import TrackingPage from "./pages/TrackingPage";
import HomePage from "./pages/HomePage";

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
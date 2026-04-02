import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";

import { Login } from "./pages/Login";

import { Register } from "./pages/Register";

// Protected route wrapper to wrap the routes that require authentication.
// const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
//   const isAuthenticated = !!localStorage.getItem("token");
//   return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
// };

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

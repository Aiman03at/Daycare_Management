import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./Layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Children from "./pages/Children";
import Login from "./pages/Login";
import ProtectedRoute from "./routes/ProtectedRoutes";
import Attendance from "./pages/Attendance";
import Activities from "./pages/Activities";
import AddNew from "./pages/AddNew";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

         <Route path="/login" element={<Login />} /> 

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={<Navigate to="/" replace />}
        />

        <Route
          path="/children"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Children />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/activities"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Activities />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-new"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AddNew />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Attendance />
              </AppLayout>
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

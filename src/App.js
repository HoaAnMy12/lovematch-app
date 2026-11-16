import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useApp } from "./AppContext";

import Login from "./Login";
import Register from "./Register";
import AuthForm from "./AuthForm";
import Home from "./Home";
import Profile from "./Profile";
import EditProfile from "./EditProfile";
import ChatBox from "./ChatBox";
import Match from "./Match";
import MatchList from "./MatchList";
import Notifications from "./Notifications";

// Bảo vệ các trang yêu cầu đăng nhập
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Chuyển hướng nếu người dùng đã đăng nhập mà vẫn truy cập trang Login/Register
function PublicRoute({ children }) {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? <Navigate to="/home" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ĐĂNG NHẬP / ĐĂNG KÝ */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthForm />
            </PublicRoute>
          }
        />

        {/* TRANG CHÍNH (KHÁM PHÁ & TÌM KIẾM) */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* HỒ SƠ CÁ NHÂN */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        {/* NHẮN TIN REAL-TIME & BẠN BÈ */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatBox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:userId"
          element={
            <ProtectedRoute>
              <ChatBox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/match"
          element={
            <ProtectedRoute>
              <Match />
            </ProtectedRoute>
          }
        />
        <Route
          path="/match-list"
          element={
            <ProtectedRoute>
              <MatchList />
            </ProtectedRoute>
          }
        />

        {/* THÔNG BÁO */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK 404 */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
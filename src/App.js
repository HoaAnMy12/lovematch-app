import React, { useState, useEffect } from "react";
import Home from "./Home";
import "./Home.css";

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isRegister, setIsRegister] = useState(false);

  // State biểu mẫu đăng nhập / đăng ký
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Kiểm tra trạng thái đăng nhập khi tải trang
  useEffect(() => {
    const savedUser = localStorage.getItem("lovematch_current_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("lovematch_current_user");
      }
    }
  }, []);

  // Xử lý chọn ảnh đại diện từ máy khi đăng ký
  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Xử lý Đăng ký / Đăng nhập
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const usersList = JSON.parse(localStorage.getItem("lovematch_users") || "[]");

    if (isRegister) {
      // ĐĂNG KÝ TÀI KHOẢN MỚI
      if (!name.trim() || !email.trim() || !password.trim()) {
        setErrorMsg("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.");
        return;
      }
      const exists = usersList.some((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        setErrorMsg("Email này đã được đăng ký. Hãy chuyển sang Đăng nhập!");
        return;
      }

      const newUser = {
        id: "user_" + Date.now(),
        name: name.trim(),
        email: email.trim(),
        password: password,
        avatar: avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`,
      };

      const updatedUsers = [...usersList, newUser];
      localStorage.setItem("lovematch_users", JSON.stringify(updatedUsers));
      localStorage.setItem("lovematch_current_user", JSON.stringify(newUser));
      setCurrentUser(newUser);
    } else {
      // ĐĂNG NHẬP
      const foundUser = usersList.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
      );
      if (!foundUser) {
        setErrorMsg("Sai email hoặc mật khẩu! Nếu chưa có tài khoản, hãy bấm Đăng ký.");
        return;
      }
      localStorage.setItem("lovematch_current_user", JSON.stringify(foundUser));
      setCurrentUser(foundUser);
    }
  };

  // Xử lý Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("lovematch_current_user");
    setCurrentUser(null);
    setEmail("");
    setPassword("");
  };

  // Nếu đã đăng nhập -> Hiển thị Trang chủ Bảng tin Hẹn hò
  if (currentUser) {
    return <Home currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Nếu chưa đăng nhập -> Hiển thị màn hình Đăng nhập / Đăng ký Tím Pastel
  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">💜 LoveMatch</div>
        <p className="auth-subtitle">
          {isRegister ? "Tạo hồ sơ hẹn hò & kết nối ngay hôm nay" : "Đăng nhập để xem bảng tin & trò chuyện"}
        </p>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        <form onSubmit={handleAuthSubmit} className="auth-form">
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Tên hiển thị của bạn (VD: Hoaa Maii)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label className="avatar-upload-label">
                <span>📷 {avatarUrl ? "Đã chọn ảnh đại diện" : "Chọn ảnh đại diện từ máy (tùy chọn)"}</span>
                <input type="file" accept="image/*" onChange={handleAvatarFile} hidden />
              </label>
            </>
          )}

          <input
            type="email"
            placeholder="Địa chỉ Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="fb-btn-primary auth-submit-btn">
            {isRegister ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản hẹn hò? "}
          <span onClick={() => { setIsRegister(!isRegister); setErrorMsg(""); }}>
            {isRegister ? "Đăng nhập" : "Đăng ký miễn phí"}
          </span>
        </div>
      </div>
    </div>
  );
}
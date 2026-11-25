import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR } from "./AppContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const emailToDocId = (email) =>
  email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useApp();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu!");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);
    try {
      const userRef = doc(db, "users", emailToDocId(cleanEmail));
      const snap = await getDoc(userRef);

      let userData;
      if (snap.exists()) {
        userData = snap.data();
      } else {
        userData = {
          id: emailToDocId(cleanEmail),
          name: cleanEmail.split("@")[0],
          age: 21,
          location: "Đà Nẵng",
          email: cleanEmail,
          hobbies: ["🎵 Nghe nhạc", "🎬 Xem phim", "☕ Cà phê"],
          description: "Rất vui được làm quen với mọi người 💜",
          avatar: DEFAULT_AVATAR,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, userData);
      }

      loginUser(userData);
      navigate("/home");
    } catch (err) {
      console.error("Lỗi đăng nhập:", err);
      setError("Lỗi kết nối Firebase. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">💜 LoveMatch</div>
        <p className="auth-subtitle">Đăng nhập để xem bảng tin, kết bạn & nhắn tin</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleLogin} className="auth-form">
          <input
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Nhập mật khẩu (từ 6 ký tự)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="fb-btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập 💜"}
          </button>
        </form>

        <div className="auth-switch">
          Chưa có tài khoản?{" "}
          <Link to="/register" style={{ color: "#7b3fe4", fontWeight: "700" }}>
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
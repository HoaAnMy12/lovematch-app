import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR } from "./AppContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const emailToDocId = (email) =>
  email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

function Register() {
  const navigate = useNavigate();
  const { loginUser } = useApp();

  const [form, setForm] = useState({
    name: "",
    age: "",
    location: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = form.email.trim().toLowerCase();
    if (!form.name.trim() || !cleanEmail || !form.password) {
      setError("Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!");
      return;
    }

    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);
    try {
      const userId = emailToDocId(cleanEmail);
      const newUser = {
        id: userId,
        name: form.name.trim(),
        age: Number(form.age) >= 18 ? Number(form.age) : 21,
        location: form.location.trim() || "Đà Nẵng",
        email: cleanEmail,
        hobbies: ["☕ Cafe & Tâm sự", "🎵 Nghe nhạc", "✈️ Du lịch"],
        description: `Xin chào! Mình là ${form.name.trim()}. Rất vui được kết bạn với mọi người 💜`,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
          form.name.trim()
        )}`,
        likesCount: 1,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", userId), newUser);
      loginUser(newUser);
      navigate("/home");
    } catch (err) {
      console.error("Lỗi đăng ký:", err);
      setError("Không thể tạo tài khoản. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">💜 LoveMatch</div>
        <p className="auth-subtitle">Tạo tài khoản mới để kết nối cùng mọi người</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Họ và tên hiển thị *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="number"
              min="18"
              max="100"
              placeholder="Tuổi (21)"
              style={{ width: "38%" }}
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
            <input
              type="text"
              placeholder="Thành phố (VD: Đà Nẵng)"
              style={{ flex: 1 }}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <input
            type="email"
            placeholder="Email *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Mật khẩu (tối thiểu 6 ký tự) *"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button
            type="submit"
            className="fb-btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản ✨"}
          </button>
        </form>

        <div className="auth-switch">
          Đã có tài khoản?{" "}
          <Link to="/login" style={{ color: "#7b3fe4", fontWeight: "700" }}>
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR } from "./AppContext";

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!");
      return;
    }

    if (form.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    const newUser = {
      name: form.name.trim(),
      age: Number(form.age) >= 18 ? Number(form.age) : 21,
      location: form.location.trim() || "Việt Nam",
      email: form.email.trim(),
      hobbies: ["☕ Cafe & Tâm sự", "🎵 Nghe nhạc", "✈️ Du lịch"],
      description: `Xin chào! Mình là ${form.name.trim()}. Rất vui được kết bạn với mọi người!`,
      avatar: DEFAULT_AVATAR,
      likesCount: 1,
    };

    loginUser(newUser);
    navigate("/home");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>💕 LoveMatch</h1>
        <p style={styles.title}>Tạo tài khoản mới để bắt đầu kết nối</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.group}>
            <label style={styles.label}>Họ và tên *</label>
            <input
              type="text"
              placeholder="VD: Maii Hoa"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ ...styles.group, flex: 1 }}>
              <label style={styles.label}>Tuổi (18+)</label>
              <input
                type="number"
                min="18"
                max="100"
                placeholder="21"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                style={styles.input}
              />
            </div>
            <div style={{ ...styles.group, flex: 2 }}>
              <label style={styles.label}>Thành phố</label>
              <input
                type="text"
                placeholder="VD: Đà Nẵng"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Email *</label>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Mật khẩu *</label>
            <input
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button}>
            Tạo tài khoản ✨
          </button>
        </form>

        <p style={styles.footerText}>
          Đã có tài khoản?{" "}
          <Link to="/login" style={styles.link}>
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #ffe6f0 0%, #fff0f5 50%, #fce4ec 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "410px",
    backgroundColor: "white",
    padding: "36px 32px",
    borderRadius: "25px",
    boxShadow: "0 12px 35px rgba(255, 77, 109, 0.14)",
    border: "1px solid #ffe1e9",
    textAlign: "center",
  },
  logo: { color: "#ff4d6d", fontSize: "34px", margin: "0 0 8px 0" },
  title: { color: "#718096", fontSize: "15px", marginBottom: "22px" },
  errorBox: {
    backgroundColor: "#fff5f5",
    color: "#e53e3e",
    border: "1px solid #fed7d7",
    padding: "10px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    marginBottom: "16px",
  },
  group: { textAlign: "left", marginBottom: "16px" },
  label: {
    display: "block",
    marginBottom: "6px",
    color: "#2d3748",
    fontWeight: "bold",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #ff4d6d, #ff758c)",
    color: "white",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 6px 18px rgba(255, 77, 109, 0.25)",
  },
  footerText: { marginTop: "20px", color: "#718096", fontSize: "14px" },
  link: { color: "#ff4d6d", fontWeight: "bold", textDecoration: "none" },
};

export default Register;
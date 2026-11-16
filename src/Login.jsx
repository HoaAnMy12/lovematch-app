import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR } from "./AppContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { loginUser } = useApp();

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ Email và Mật khẩu!");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    const existing = JSON.parse(localStorage.getItem("currentUser"));

    // Nếu email khớp với user đã lưu thì giữ nguyên hồ sơ cũ, ngược lại tạo hồ sơ mới theo email
    const userData =
      existing && existing.email?.toLowerCase() === email.trim().toLowerCase()
        ? existing
        : {
            name: email.trim().split("@")[0],
            age: 21,
            location: "Nghệ An",
            email: email.trim(),
            hobbies: ["🎵 Nghe nhạc", "🎬 Xem phim", "📚 Đọc sách"],
            description: "Rất vui được làm quen với mọi người!",
            avatar: DEFAULT_AVATAR,
          };

    loginUser(userData);
    navigate("/home");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>💕 LoveMatch</h1>
        <p style={styles.title}>Chào mừng bạn quay trở lại!</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={styles.group}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.group}>
            <label style={styles.label}>Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <p
            style={styles.forgot}
            onClick={() =>
              alert("Liên kết đặt lại mật khẩu đã được gửi tới email của bạn!")
            }
          >
            Quên mật khẩu?
          </p>

          <button type="submit" style={styles.button}>
            Đăng nhập ❤️
          </button>
        </form>

        <p style={styles.register}>
          Chưa có tài khoản?
          <Link to="/register" style={styles.registerLink}>
            {" "}
            Đăng ký ngay
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
    maxWidth: "390px",
    backgroundColor: "white",
    padding: "40px 34px",
    borderRadius: "25px",
    boxShadow: "0 12px 35px rgba(255, 77, 109, 0.14)",
    border: "1px solid #ffe1e9",
    textAlign: "center",
  },
  logo: { color: "#ff4d6d", fontSize: "36px", margin: "0 0 8px 0" },
  title: { color: "#718096", fontSize: "15px", marginBottom: "24px" },
  errorBox: {
    backgroundColor: "#fff5f5",
    color: "#e53e3e",
    border: "1px solid #fed7d7",
    padding: "10px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    marginBottom: "16px",
  },
  group: { textAlign: "left", marginBottom: "18px" },
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
  forgot: {
    textAlign: "right",
    color: "#ff4d6d",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "22px",
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
    boxShadow: "0 6px 18px rgba(255, 77, 109, 0.25)",
  },
  register: { marginTop: "24px", color: "#718096", fontSize: "14px" },
  registerLink: {
    color: "#ff4d6d",
    fontWeight: "bold",
    textDecoration: "none",
  },
};

export default Login;
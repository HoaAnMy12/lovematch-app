import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR } from "./AppContext";

function Match() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, matches } = useApp();

  const matchedUser = location.state?.matchedUser || matches[0];

  if (!matchedUser) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h3>Chưa có dữ liệu tương hợp mới</h3>
          <button style={styles.chatBtn} onClick={() => navigate("/home")}>
            Quay lại khám phá
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>💖 TƯƠNG HỢP THÀNH CÔNG 💖</div>
        <h1 style={styles.title}>It's a Match!</h1>
        <p style={styles.subtitle}>
          Bạn và <strong>{matchedUser.name}</strong> đã thích lẫn nhau!
        </p>

        <div style={styles.avatarsRow}>
          <img
            src={currentUser.avatar || DEFAULT_AVATAR}
            alt={currentUser.name}
            style={{ ...styles.avatar, transform: "rotate(-6deg)" }}
          />
          <div style={styles.heartIcon}>❤️</div>
          <img
            src={matchedUser.avatar || matchedUser.image || DEFAULT_AVATAR}
            alt={matchedUser.name}
            style={{ ...styles.avatar, transform: "rotate(6deg)" }}
          />
        </div>

        <button
          style={styles.chatBtn}
          onClick={() =>
            navigate(`/chat/${matchedUser.email || matchedUser.id}`)
          }
        >
          💬 Gửi lời chào ngay
        </button>

        <button style={styles.keepBtn} onClick={() => navigate("/home")}>
          Tiếp tục khám phá
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #ff4d6d 0%, #ff8fa3 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "32px",
    padding: "40px 30px",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
  },
  badge: {
    display: "inline-block",
    backgroundColor: "#fff0f5",
    color: "#ff4d6d",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
    marginBottom: "12px",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "34px",
    color: "#ff4d6d",
    fontWeight: "800",
  },
  subtitle: {
    margin: "0 0 28px",
    fontSize: "15px",
    color: "#4a5568",
  },
  avatarsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "32px",
  },
  avatar: {
    width: "110px",
    height: "110px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #ff4d6d",
    boxShadow: "0 8px 20px rgba(255, 77, 109, 0.25)",
  },
  heartIcon: { fontSize: "28px" },
  chatBtn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #ff4d6d, #ff758c)",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "12px",
    boxShadow: "0 6px 18px rgba(255, 77, 109, 0.3)",
  },
  keepBtn: {
    width: "100%",
    padding: "13px",
    border: "1px solid #ffe1e9",
    borderRadius: "16px",
    backgroundColor: "#fff0f5",
    color: "#ff4d6d",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default Match;
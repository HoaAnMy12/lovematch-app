import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "./AppContext";

function Notifications() {
  const navigate = useNavigate();
  const { notifications, markAllNotificationsRead } = useApp();

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/home")}>
          ← Khám phá
        </button>
        <h2 style={styles.logo}>🔔 Thông báo</h2>
        <button style={styles.backBtn} onClick={markAllNotificationsRead}>
          ✓ Đã đọc hết
        </button>
      </header>

      <div style={styles.container}>
        <div style={styles.card}>
          {notifications.length === 0 ? (
            <p style={{ textAlign: "center", color: "#718096" }}>
              Không có thông báo mới.
            </p>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  ...styles.item,
                  backgroundColor: item.unread ? "#fff0f5" : "#ffffff",
                }}
                onClick={() => navigate("/match-list")}
              >
                <div style={styles.icon}>
                  {item.type === "match" ? "💖" : "⭐"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.title}>{item.title}</div>
                  <div style={styles.msg}>{item.message}</div>
                  <div style={styles.time}>{item.time}</div>
                </div>
                {item.unread && <span style={styles.dot} />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #ffe6f0 0%, #fff0f5 50%, #fce4ec 100%)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    height: "65px",
    background: "linear-gradient(135deg, #ff4d6d, #ff758c)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    color: "white",
  },
  logo: { margin: 0, fontSize: "20px" },
  backBtn: {
    border: "none",
    background: "rgba(255,255,255,0.25)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  container: {
    maxWidth: "600px",
    margin: "28px auto",
    padding: "0 16px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 10px 30px rgba(255, 77, 109, 0.1)",
    border: "1px solid #ffe1e9",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px 20px",
    borderBottom: "1px solid #ffe1e9",
    cursor: "pointer",
  },
  icon: { fontSize: "26px" },
  title: { fontWeight: "bold", fontSize: "15px", color: "#2d3748" },
  msg: { fontSize: "14px", color: "#4a5568", marginTop: "2px" },
  time: { fontSize: "12px", color: "#a0aec0", marginTop: "4px" },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#ff4d6d",
  },
};

export default Notifications;
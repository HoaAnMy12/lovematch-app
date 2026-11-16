import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR } from "./AppContext";

function Profile() {
  const navigate = useNavigate();
  const { currentUser, matches, logoutUser } = useApp();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/home")}>
          ← Khám phá
        </button>
        <h2 style={styles.logo}>👤 Hồ sơ của tôi</h2>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Đăng xuất
        </button>
      </header>

      <div style={styles.container}>
        <div style={styles.card}>
          <img
            src={currentUser.avatar || DEFAULT_AVATAR}
            alt={currentUser.name}
            style={styles.avatar}
          />
          <h2 style={styles.name}>
            {currentUser.name}, {currentUser.age}
          </h2>
          <p style={styles.location}>
            📍 {currentUser.location} • {currentUser.email}
          </p>

          {/* THỐNG KÊ */}
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <div style={styles.statNum}>{matches.length}</div>
              <div style={styles.statLabel}>Tương hợp</div>
            </div>
            <div style={styles.statBox}>
              <div style={styles.statNum}>{currentUser.likesCount || 128}</div>
              <div style={styles.statLabel}>Lượt thích</div>
            </div>
          </div>

          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Giới thiệu bản thân</h4>
            <p style={styles.bio}>{currentUser.description}</p>
          </div>

          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Sở thích</h4>
            <div style={styles.hobbiesWrap}>
              {(currentUser.hobbies || []).map((hobby, index) => (
                <span key={index} style={styles.hobbyTag}>
                  {hobby}
                </span>
              ))}
            </div>
          </div>

          <button
            style={styles.editBtn}
            onClick={() => navigate("/edit-profile")}
          >
            ✏️ Chỉnh sửa hồ sơ
          </button>
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
  logoutBtn: {
    border: "none",
    background: "#ffffff",
    color: "#ff4d6d",
    padding: "8px 16px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  container: {
    maxWidth: "480px",
    margin: "32px auto",
    padding: "0 16px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "28px",
    padding: "32px 24px",
    textAlign: "center",
    boxShadow: "0 12px 35px rgba(255, 77, 109, 0.14)",
    border: "1px solid #ffe1e9",
  },
  avatar: {
    width: "130px",
    height: "130px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #ff4d6d",
    marginBottom: "14px",
  },
  name: { margin: "0 0 6px", fontSize: "24px", color: "#2d3748" },
  location: { margin: "0 0 20px", fontSize: "14px", color: "#718096" },
  statsRow: {
    display: "flex",
    justifyContent: "center",
    gap: "24px",
    padding: "16px",
    backgroundColor: "#fff0f5",
    borderRadius: "18px",
    marginBottom: "22px",
  },
  statBox: { flex: 1 },
  statNum: { fontSize: "22px", fontWeight: "bold", color: "#ff4d6d" },
  statLabel: { fontSize: "13px", color: "#718096" },
  section: { textAlign: "left", marginBottom: "20px" },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: "15px",
    color: "#2d3748",
  },
  bio: {
    margin: 0,
    fontSize: "14px",
    color: "#4a5568",
    lineHeight: "1.6",
  },
  hobbiesWrap: { display: "flex", flexWrap: "wrap", gap: "8px" },
  hobbyTag: {
    backgroundColor: "#ffe6f0",
    color: "#ff4d6d",
    padding: "6px 14px",
    borderRadius: "16px",
    fontSize: "13px",
    fontWeight: "600",
  },
  editBtn: {
    width: "100%",
    padding: "13px",
    border: "none",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #ff4d6d, #ff758c)",
    color: "white",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
  },
};

export default Profile;
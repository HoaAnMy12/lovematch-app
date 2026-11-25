import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR } from "./AppContext";

function Profile() {
  const navigate = useNavigate();
  const { currentUser, matches, friends, logoutUser } = useApp();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/home")}>
          ← Bảng tin
        </button>
        <h2 style={styles.logo}>💜 Hồ sơ của tôi</h2>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Đăng xuất
        </button>
      </header>

      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.coverBanner} />

          <div style={styles.cardBody}>
            <img
              src={currentUser.avatar || DEFAULT_AVATAR}
              alt={currentUser.name}
              style={styles.avatar}
            />
            <h2 style={styles.name}>
              {currentUser.name}, {currentUser.age}
            </h2>
            <p style={styles.location}>
              📍 {currentUser.location || "Việt Nam"} • {currentUser.email}
            </p>

            {/* THỐNG KÊ */}
            <div style={styles.statsRow}>
              <div style={styles.statBox}>
                <div style={styles.statNum}>{friends?.length || 0}</div>
                <div style={styles.statLabel}>Bạn bè</div>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statBox}>
                <div style={styles.statNum}>{matches?.length || 0}</div>
                <div style={styles.statLabel}>Tương hợp</div>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statBox}>
                <div style={styles.statNum}>{currentUser.likesCount || 128}</div>
                <div style={styles.statLabel}>Lượt thích</div>
              </div>
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>✨ Giới thiệu bản thân</h4>
              <p style={styles.bio}>
                {currentUser.description ||
                  "Rất vui được làm quen và kết nối với mọi người 💜"}
              </p>
            </div>

            <div style={styles.section}>
              <h4 style={styles.sectionTitle}>🎯 Sở thích</h4>
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
              ✏️ Chỉnh sửa trang cá nhân
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f3ebff 0%, #fcf8ff 100%)",
    fontFamily:
      "Quicksand, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    height: "65px",
    background:
      "linear-gradient(135deg, #a770ef 0%, #cf8bf3 55%, #fdb99b 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    color: "white",
    boxShadow: "0 4px 16px rgba(157, 101, 255, 0.2)",
  },
  logo: { margin: 0, fontSize: "20px", fontWeight: "bold" },
  backBtn: {
    border: "none",
    background: "rgba(255, 255, 255, 0.25)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  logoutBtn: {
    border: "none",
    background: "#ffffff",
    color: "#7b3fe4",
    padding: "8px 16px",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  container: {
    maxWidth: "500px",
    margin: "32px auto",
    padding: "0 16px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "28px",
    overflow: "hidden",
    textAlign: "center",
    boxShadow: "0 12px 35px rgba(157, 101, 255, 0.14)",
    border: "1px solid #e6d9ff",
  },
  coverBanner: {
    height: "110px",
    background:
      "linear-gradient(135deg, #a770ef 0%, #cf8bf3 55%, #e5b2ff 100%)",
  },
  cardBody: {
    padding: "0 26px 32px",
  },
  avatar: {
    width: "124px",
    height: "124px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "4px solid #ffffff",
    boxShadow: "0 6px 20px rgba(123, 63, 228, 0.22)",
    marginTop: "-62px",
    marginBottom: "12px",
    backgroundColor: "#ffffff",
  },
  name: { margin: "0 0 6px", fontSize: "24px", color: "#2d1f47" },
  location: { margin: "0 0 20px", fontSize: "14px", color: "#7c6b99" },
  statsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
    backgroundColor: "#faf7ff",
    border: "1px solid #e6d9ff",
    borderRadius: "18px",
    marginBottom: "22px",
  },
  statBox: { flex: 1 },
  statDivider: {
    width: "1px",
    height: "32px",
    backgroundColor: "#e6d9ff",
  },
  statNum: { fontSize: "22px", fontWeight: "bold", color: "#7b3fe4" },
  statLabel: { fontSize: "13px", color: "#7c6b99", marginTop: "2px" },
  section: { textAlign: "left", marginBottom: "20px" },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: "15px",
    color: "#2d1f47",
    fontWeight: "700",
  },
  bio: {
    margin: 0,
    fontSize: "14px",
    color: "#574678",
    lineHeight: "1.6",
    backgroundColor: "#faf7ff",
    padding: "12px 14px",
    borderRadius: "14px",
    border: "1px solid #f0e6ff",
  },
  hobbiesWrap: { display: "flex", flexWrap: "wrap", gap: "8px" },
  hobbyTag: {
    backgroundColor: "#f2ebff",
    color: "#7b3fe4",
    border: "1px solid #e0ceff",
    padding: "6px 14px",
    borderRadius: "16px",
    fontSize: "13px",
    fontWeight: "600",
  },
  editBtn: {
    width: "100%",
    padding: "14px",
    border: "none",
    borderRadius: "18px",
    background:
      "linear-gradient(135deg, #a770ef 0%, #cf8bf3 60%, #e0b0ff 100%)",
    color: "white",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "8px",
    boxShadow: "0 6px 18px rgba(157, 101, 255, 0.28)",
  },
};

export default Profile;
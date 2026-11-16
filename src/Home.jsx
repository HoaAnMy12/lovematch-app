import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR, VIETNAM_PROVINCES } from "./AppContext";

function Home() {
  const navigate = useNavigate();
  const {
    currentUser,
    discoverProfiles,
    addMatch,
    friends,
    addFriend,
    isFriend,
    notifications,
  } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeAnimation, setSwipeAnimation] = useState("");
  const [filterLocation, setFilterLocation] = useState("Tất cả khu vực");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filteredCandidates = discoverProfiles.filter((person) => {
    const matchLocation =
      filterLocation === "Tất cả khu vực" ||
      person.location.toLowerCase().includes(filterLocation.toLowerCase());

    const keyword = searchQuery.trim().toLowerCase();
    const matchKeyword =
      !keyword ||
      person.name.toLowerCase().includes(keyword) ||
      person.location.toLowerCase().includes(keyword) ||
      person.bio.toLowerCase().includes(keyword) ||
      (person.hobbies || []).some((h) => h.toLowerCase().includes(keyword));

    return matchLocation && matchKeyword;
  });

  const currentCandidate = filteredCandidates[currentIndex];

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  const handleAddFriendClick = (person) => {
    if (isFriend(person.id)) return;
    addFriend(person);
    showToast(`✅ Đã thêm ${person.name} vào danh sách bạn bè!`);
  };

  const handleResetFilters = () => {
    setFilterLocation("Tất cả khu vực");
    setSearchQuery("");
    setCurrentIndex(0);
  };

  const handleFilterNearMe = () => {
    if (currentUser?.location) {
      setFilterLocation(currentUser.location);
      setCurrentIndex(0);
    }
  };

  const handlePass = () => {
    setSwipeAnimation("left");
    setTimeout(() => {
      setSwipeAnimation("");
      setCurrentIndex((prev) => prev + 1);
    }, 250);
  };

  const handleLike = (isSuperLike = false) => {
    if (!currentCandidate) return;
    setSwipeAnimation(isSuperLike ? "up" : "right");

    const newMatch = addMatch(currentCandidate, isSuperLike);

    setTimeout(() => {
      setSwipeAnimation("");
      setCurrentIndex((prev) => prev + 1);

      if (currentCandidate.likesYou || isSuperLike) {
        navigate("/match", { state: { matchedUser: newMatch } });
      }
    }, 250);
  };

  return (
    <div style={styles.page}>
      {toastMsg && <div style={styles.toast}>{toastMsg}</div>}

      {/* HEADER */}
      <header style={styles.header}>
        <h2 style={styles.logo} onClick={() => navigate("/home")}>
          💕 LoveMatch
        </h2>

        {/* THANH TÌM KIẾM & CHỌN TỈNH/THÀNH PHỐ */}
        <div style={styles.searchBarGroup}>
          <div style={styles.searchInputWrap}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Tìm tên, sở thích (VD: cafe, đọc sách)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentIndex(0);
              }}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                style={styles.clearSearchBtn}
                onClick={() => {
                  setSearchQuery("");
                  setCurrentIndex(0);
                }}
              >
                ✖
              </button>
            )}
          </div>

          <select
            value={filterLocation}
            onChange={(e) => {
              setFilterLocation(e.target.value);
              setCurrentIndex(0);
            }}
            style={styles.filterSelect}
            title="Chọn tỉnh / thành phố"
          >
            {VIETNAM_PROVINCES.map((prov) => (
              <option key={prov} value={prov} style={{ color: "#2d3748" }}>
                📍 {prov}
              </option>
            ))}
          </select>

          {currentUser?.location && (
            <button
              style={styles.nearMeBtn}
              onClick={handleFilterNearMe}
              title={`Lọc người ở ${currentUser.location}`}
            >
              🎯 Gần tôi ({currentUser.location})
            </button>
          )}
        </div>

        <div style={styles.headerActions}>
          <button
            style={styles.headerBtn}
            onClick={() => navigate("/notifications")}
            title="Thông báo"
          >
            🔔
            {unreadCount > 0 && (
              <span style={styles.badgeCount}>{unreadCount}</span>
            )}
          </button>
          <button
            style={styles.headerBtn}
            onClick={() => navigate("/profile")}
            title="Hồ sơ cá nhân"
          >
            👤
          </button>
        </div>
      </header>

      {/* LAYOUT CHÍNH */}
      <div style={styles.layoutContainer}>
        {/* SIDEBAR TRÁI */}
        <aside style={styles.leftSidebar}>
          <div
            style={styles.userProfileCard}
            onClick={() => navigate("/profile")}
          >
            <img
              src={currentUser?.avatar || DEFAULT_AVATAR}
              alt={currentUser?.name}
              style={styles.sidebarAvatar}
            />
            <div>
              <div style={styles.sidebarUserName}>{currentUser?.name}</div>
              <div style={styles.sidebarUserSub}>
                📍 {currentUser?.location || "Việt Nam"}
              </div>
            </div>
          </div>

          <div style={styles.menuList}>
            <button
              style={{ ...styles.navBtn, ...styles.navBtnActive }}
              onClick={() => navigate("/home")}
            >
              <span>🏠</span> <span>Khám phá</span>
            </button>
            <button
              style={styles.navBtn}
              onClick={() => navigate("/match-list")}
            >
              <span>👥</span> <span>Bạn bè ({friends.length})</span>
            </button>
            <button style={styles.navBtn} onClick={() => navigate("/chat")}>
              <span>💬</span> <span>Tin nhắn</span>
            </button>
            <button
              style={styles.navBtn}
              onClick={() => navigate("/notifications")}
            >
              <span>🔔</span> <span>Thông báo</span>
              {unreadCount > 0 && (
                <span style={styles.sideBadge}>{unreadCount}</span>
              )}
            </button>
            <button style={styles.navBtn} onClick={() => navigate("/profile")}>
              <span>👤</span> <span>Hồ sơ</span>
            </button>
          </div>
        </aside>

        {/* KHUNG QUẸT THẺ TRUNG TÂM */}
        <main style={styles.mainContent}>
          <div style={styles.filterStatusBar}>
            <span>
              Khu vực: <strong>{filterLocation}</strong>
              {searchQuery && (
                <>
                  {" "}
                  • Từ khóa: <strong>"{searchQuery}"</strong>
                </>
              )}{" "}
              ({filteredCandidates.length} kết quả)
            </span>
            {(filterLocation !== "Tất cả khu vực" || searchQuery) && (
              <button
                style={styles.resetFilterLink}
                onClick={handleResetFilters}
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>

          {currentCandidate ? (
            <div
              style={{
                ...styles.card,
                transform:
                  swipeAnimation === "left"
                    ? "translateX(-120px) rotate(-10deg)"
                    : swipeAnimation === "right"
                    ? "translateX(120px) rotate(10deg)"
                    : swipeAnimation === "up"
                    ? "translateY(-80px) scale(1.03)"
                    : "none",
                opacity: swipeAnimation ? 0.5 : 1,
              }}
            >
              <div style={styles.imageWrapper}>
                <img
                  src={currentCandidate.image}
                  alt={currentCandidate.name}
                  style={styles.cardImage}
                />

                {/* NÚT KẾT BẠN NHANH GÓC PHẢI TRÊN */}
                <button
                  style={{
                    ...styles.addFriendBadgeBtn,
                    backgroundColor: isFriend(currentCandidate.id)
                      ? "#38a169"
                      : "rgba(255, 77, 109, 0.92)",
                  }}
                  onClick={() => handleAddFriendClick(currentCandidate)}
                >
                  {isFriend(currentCandidate.id)
                    ? "✓ Đã là bạn bè"
                    : "➕ Kết bạn"}
                </button>

                <div style={styles.imageOverlay}>
                  <div style={styles.onlineBadge}>
                    {currentCandidate.isOnline
                      ? "🟢 Đang hoạt động"
                      : "⚪ Ngoại tuyến"}
                  </div>
                  <h2 style={styles.cardName}>
                    {currentCandidate.name}, {currentCandidate.age}
                  </h2>
                  <p style={styles.cardLocation}>
                    📍 Tỉnh/TP: {currentCandidate.location} •{" "}
                    {currentCandidate.distance}
                  </p>
                </div>
              </div>

              <div style={styles.cardBody}>
                <p style={styles.bio}>{currentCandidate.bio}</p>
                <div style={styles.hobbiesRow}>
                  {currentCandidate.hobbies.map((hobby, idx) => (
                    <span key={idx} style={styles.hobbyTag}>
                      {hobby}
                    </span>
                  ))}
                </div>

                {/* NÚT QUẸT THẺ */}
                <div style={styles.actionButtons}>
                  <button
                    style={{ ...styles.circleBtn, ...styles.passBtn }}
                    onClick={handlePass}
                    title="Bỏ qua"
                  >
                    ✖
                  </button>
                  <button
                    style={{ ...styles.circleBtn, ...styles.superBtn }}
                    onClick={() => handleLike(true)}
                    title="Siêu thích"
                  >
                    ⭐
                  </button>
                  <button
                    style={{ ...styles.circleBtn, ...styles.likeBtn }}
                    onClick={() => handleLike(false)}
                    title="Thích"
                  >
                    ❤️
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.emptyCard}>
              <div style={{ fontSize: "54px", marginBottom: "12px" }}>🔎</div>
              <h3>Không còn gợi ý phù hợp!</h3>
              <p style={{ color: "#718096", marginBottom: "20px" }}>
                Bạn đã xem hết danh sách hoặc chưa có ai khớp với khu vực{" "}
                <strong>{filterLocation}</strong>.
              </p>
              <button style={styles.reloadBtn} onClick={handleResetFilters}>
                🔄 Xem tất cả khu vực
              </button>
            </div>
          )}
        </main>
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
  toast: {
    position: "fixed",
    top: "80px",
    right: "24px",
    backgroundColor: "#2d3748",
    color: "#ffffff",
    padding: "12px 20px",
    borderRadius: "14px",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
    zIndex: 999,
  },
  header: {
    minHeight: "65px",
    background: "linear-gradient(135deg, #ff4d6d, #ff758c)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 28px",
    color: "white",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 4px 15px rgba(255, 77, 109, 0.2)",
    flexWrap: "wrap",
    gap: "12px",
  },
  logo: { margin: 0, fontSize: "22px", fontWeight: "bold", cursor: "pointer" },
  searchBarGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flex: 1,
    maxWidth: "680px",
    flexWrap: "wrap",
  },
  searchInputWrap: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: "20px",
    padding: "6px 14px",
    flex: 1,
    minWidth: "200px",
    gap: "8px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "13px",
    color: "#2d3748",
    width: "100%",
  },
  clearSearchBtn: {
    border: "none",
    background: "transparent",
    color: "#a0aec0",
    cursor: "pointer",
    fontSize: "12px",
  },
  filterSelect: {
    padding: "8px 14px",
    borderRadius: "20px",
    border: "none",
    backgroundColor: "rgba(255,255,255,0.25)",
    color: "white",
    fontWeight: "600",
    fontSize: "13px",
    outline: "none",
    cursor: "pointer",
  },
  nearMeBtn: {
    padding: "8px 14px",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.18)",
    color: "white",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  headerActions: { display: "flex", gap: "12px" },
  headerBtn: {
    position: "relative",
    width: "40px",
    height: "40px",
    border: "none",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.25)",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
  },
  badgeCount: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    backgroundColor: "#ffe600",
    color: "#2d3748",
    fontSize: "11px",
    fontWeight: "bold",
    width: "18px",
    height: "18px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  layoutContainer: { display: "flex", minHeight: "calc(100vh - 65px)" },
  leftSidebar: {
    width: "260px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #ffe1e9",
    padding: "24px 16px",
    boxSizing: "border-box",
  },
  userProfileCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    borderRadius: "16px",
    backgroundColor: "#fff0f5",
    border: "1px solid #ffe1e9",
    marginBottom: "20px",
    cursor: "pointer",
  },
  sidebarAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #ff4d6d",
  },
  sidebarUserName: { fontWeight: "bold", color: "#2d3748", fontSize: "15px" },
  sidebarUserSub: { fontSize: "12px", color: "#ff4d6d", marginTop: "2px" },
  menuList: { display: "flex", flexDirection: "column", gap: "8px" },
  navBtn: {
    border: "none",
    background: "transparent",
    padding: "13px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#718096",
    fontSize: "15px",
    fontWeight: "600",
    textAlign: "left",
  },
  navBtnActive: { backgroundColor: "#ffe6f0", color: "#ff4d6d" },
  sideBadge: {
    marginLeft: "auto",
    backgroundColor: "#ff4d6d",
    color: "white",
    fontSize: "11px",
    padding: "2px 8px",
    borderRadius: "10px",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px 24px",
  },
  filterStatusBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#ffffff",
    padding: "10px 16px",
    borderRadius: "14px",
    marginBottom: "14px",
    fontSize: "13px",
    color: "#4a5568",
    border: "1px solid #ffe1e9",
    boxSizing: "border-box",
  },
  resetFilterLink: {
    border: "none",
    background: "transparent",
    color: "#ff4d6d",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "12px",
    textDecoration: "underline",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#ffffff",
    borderRadius: "28px",
    overflow: "hidden",
    boxShadow: "0 15px 35px rgba(255, 77, 109, 0.16)",
    border: "1px solid #ffe1e9",
    transition: "all 0.25s ease",
  },
  imageWrapper: { position: "relative", height: "370px" },
  cardImage: { width: "100%", height: "100%", objectFit: "cover" },
  addFriendBadgeBtn: {
    position: "absolute",
    top: "14px",
    right: "14px",
    border: "2px solid #ffffff",
    color: "#ffffff",
    padding: "7px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "24px 20px 16px",
    background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
    color: "#ffffff",
  },
  onlineBadge: {
    display: "inline-block",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    marginBottom: "6px",
  },
  cardName: { margin: "0 0 4px 0", fontSize: "26px", fontWeight: "bold" },
  cardLocation: { margin: 0, fontSize: "14px", opacity: 0.95 },
  cardBody: { padding: "20px" },
  bio: {
    margin: "0 0 14px 0",
    fontSize: "14px",
    color: "#4a5568",
    lineHeight: "1.5",
  },
  hobbiesRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
  },
  hobbyTag: {
    backgroundColor: "#fff0f5",
    color: "#ff4d6d",
    padding: "5px 12px",
    borderRadius: "14px",
    fontSize: "12px",
    fontWeight: "600",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "22px",
  },
  circleBtn: {
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
    transition: "transform 0.15s",
  },
  passBtn: {
    width: "58px",
    height: "58px",
    backgroundColor: "#fff5f5",
    color: "#e53e3e",
    fontSize: "22px",
  },
  superBtn: {
    width: "50px",
    height: "50px",
    backgroundColor: "#ebf8ff",
    color: "#3182ce",
    fontSize: "20px",
  },
  likeBtn: {
    width: "64px",
    height: "64px",
    background: "linear-gradient(135deg, #ff4d6d, #ff758c)",
    color: "#ffffff",
    fontSize: "26px",
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    padding: "40px 30px",
    borderRadius: "24px",
    textAlign: "center",
    maxWidth: "380px",
    boxShadow: "0 10px 30px rgba(255, 77, 109, 0.1)",
  },
  reloadBtn: {
    border: "none",
    backgroundColor: "#ff4d6d",
    color: "white",
    padding: "12px 24px",
    borderRadius: "20px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default Home;
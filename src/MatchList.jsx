import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR, VIETNAM_PROVINCES } from "./AppContext";

function MatchList() {
  const navigate = useNavigate();
  const {
    friends,
    addFriend,
    removeFriend,
    resetDefaultFriends,
    isFriend,
    matches,
    removeMatch,
    discoverProfiles,
  } = useApp();

  const [activeTab, setActiveTab] = useState("friends"); // 'friends' | 'discover' | 'matches'
  const [searchFriend, setSearchFriend] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("Tất cả khu vực");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  // Chọn nguồn dữ liệu theo tab đang mở
  const sourceList =
    activeTab === "friends"
      ? friends
      : activeTab === "discover"
      ? discoverProfiles
      : matches;

  const filteredList = sourceList.filter((person) => {
    const matchProv =
      selectedProvince === "Tất cả khu vực" ||
      (person.location || "")
        .toLowerCase()
        .includes(selectedProvince.toLowerCase());

    const q = searchFriend.trim().toLowerCase();
    const matchName =
      !q ||
      person.name.toLowerCase().includes(q) ||
      (person.location || "").toLowerCase().includes(q) ||
      (person.hobbies || []).some((h) => h.toLowerCase().includes(q));

    return matchProv && matchName;
  });

  const handleAddFriend = (person) => {
    addFriend(person);
    showToast(`✅ Đã thêm ${person.name} vào danh sách bạn bè!`);
  };

  const handleRemoveFriend = (person) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa ${person.name} khỏi danh sách bạn bè?`
      )
    ) {
      removeFriend(person.id);
      showToast(`🗑️ Đã xóa ${person.name} khỏi danh sách bạn bè.`);
    }
  };

  return (
    <div style={styles.page}>
      {toastMsg && <div style={styles.toast}>{toastMsg}</div>}

      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/home")}>
          ← Khám phá
        </button>
        <h2 style={styles.logo}>👥 Bạn bè & Kết nối</h2>
        <button style={styles.backBtn} onClick={() => navigate("/chat")}>
          💬 Chat
        </button>
      </header>

      <div style={styles.container}>
        {/* CÁC TAB CHUYỂN ĐỔI */}
        <div style={styles.tabsRow}>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "friends" ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab("friends")}
          >
            👥 Danh sách bạn bè ({friends.length})
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "discover" ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab("discover")}
          >
            ➕ Thêm bạn mới ({discoverProfiles.length})
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "matches" ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab("matches")}
          >
            💕 Đã tương hợp ({matches.length})
          </button>
        </div>

        {/* THANH TÌM KIẾM, LỌC KHU VỰC & NẠP DỮ LIỆU MẪU */}
        <div style={styles.filterCard}>
          <div style={styles.searchBox}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Tìm bạn bè theo tên, sở thích..."
              value={searchFriend}
              onChange={(e) => setSearchFriend(e.target.value)}
              style={styles.searchInput}
            />
            {searchFriend && (
              <button
                style={styles.clearBtn}
                onClick={() => setSearchFriend("")}
              >
                ✖
              </button>
            )}
          </div>

          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            style={styles.provinceSelect}
          >
            {VIETNAM_PROVINCES.map((prov) => (
              <option key={prov} value={prov}>
                📍 {prov}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              resetDefaultFriends();
              showToast("🔄 Đã tải lại danh sách 11 bạn bè mẫu!");
            }}
            style={styles.reloadSampleBtn}
            title="Khôi phục danh sách 11 bạn bè mẫu"
          >
            🔄 Nạp 11 bạn mẫu
          </button>
        </div>

        {/* DANH SÁCH THẺ */}
        {filteredList.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={{ fontSize: "50px", marginBottom: "12px" }}>👥</div>
            <h3>
              {activeTab === "friends"
                ? "Danh sách bạn bè đang trống"
                : "Không tìm thấy người dùng phù hợp"}
            </h3>
            <p style={{ color: "#718096", marginBottom: "20px" }}>
              {activeTab === "friends"
                ? 'Chuyển sang tab "Thêm bạn mới" để tìm kiếm và kết bạn nhé!'
                : "Thử đổi từ khóa tìm kiếm hoặc chọn tỉnh/thành phố khác."}
            </p>
            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              {(searchFriend || selectedProvince !== "Tất cả khu vực") && (
                <button
                  style={styles.resetBtn}
                  onClick={() => {
                    setSearchFriend("");
                    setSelectedProvince("Tất cả khu vực");
                  }}
                >
                  Đặt lại bộ lọc
                </button>
              )}
              {activeTab === "friends" && (
                <button
                  style={styles.exploreBtn}
                  onClick={() => setActiveTab("discover")}
                >
                  ➕ Thêm bạn mới ngay
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredList.map((person) => {
              const alreadyFriend = isFriend(person.id);

              return (
                <div key={person.id} style={styles.card}>
                  <img
                    src={person.avatar || person.image || DEFAULT_AVATAR}
                    alt={person.name}
                    style={styles.avatar}
                  />
                  <h3 style={styles.name}>
                    {person.name}, {person.age}
                  </h3>
                  <p style={styles.location}>
                    📍 Tỉnh/TP: {person.location || "Việt Nam"} •{" "}
                    {person.distance || "1.5 km"}
                  </p>
                  <p style={styles.matchedAt}>
                    {activeTab === "friends"
                      ? `Kết bạn: ${person.addedAt || "Gần đây"}`
                      : person.bio
                      ? person.bio.slice(0, 48) + "..."
                      : ""}
                  </p>

                  {/* HÀNH ĐỘNG THEO TỪNG TAB */}
                  <div style={styles.actions}>
                    {activeTab === "friends" && (
                      <>
                        <button
                          style={styles.chatBtn}
                          onClick={() =>
                            navigate(`/chat/${person.email || person.id}`)
                          }
                        >
                          💬 Nhắn tin
                        </button>
                        <button
                          style={styles.deleteFriendBtn}
                          onClick={() => handleRemoveFriend(person)}
                          title="Xóa bạn bè"
                        >
                          🗑️ Xóa bạn
                        </button>
                      </>
                    )}

                    {activeTab === "discover" && (
                      <>
                        {alreadyFriend ? (
                          <button
                            style={styles.deleteFriendBtn}
                            onClick={() => handleRemoveFriend(person)}
                          >
                            🗑️ Xóa bạn
                          </button>
                        ) : (
                          <button
                            style={styles.addFriendBtn}
                            onClick={() => handleAddFriend(person)}
                          >
                            ➕ Thêm bạn bè
                          </button>
                        )}
                      </>
                    )}

                    {activeTab === "matches" && (
                      <>
                        <button
                          style={styles.chatBtn}
                          onClick={() =>
                            navigate(`/chat/${person.email || person.id}`)
                          }
                        >
                          💬 Chat
                        </button>
                        {!alreadyFriend ? (
                          <button
                            style={styles.addFriendBtn}
                            onClick={() => handleAddFriend(person)}
                            title="Thêm vào bạn bè"
                          >
                            ➕ Kết bạn
                          </button>
                        ) : (
                          <button
                            style={styles.deleteFriendBtn}
                            onClick={() => handleRemoveFriend(person)}
                            title="Xóa bạn bè"
                          >
                            🗑️ Xóa bạn
                          </button>
                        )}
                        <button
                          style={styles.unmatchBtn}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Hủy tương hợp với ${person.name}?`
                              )
                            ) {
                              removeMatch(person.id);
                            }
                          }}
                          title="Hủy tương hợp"
                        >
                          ✖
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
    maxWidth: "960px",
    margin: "24px auto",
    padding: "0 20px",
  },
  tabsRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  tabBtn: {
    flex: 1,
    minWidth: "180px",
    padding: "12px 16px",
    borderRadius: "16px",
    border: "1px solid #ffe1e9",
    backgroundColor: "#ffffff",
    color: "#718096",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer",
  },
  tabBtnActive: {
    backgroundColor: "#ff4d6d",
    color: "#ffffff",
    borderColor: "#ff4d6d",
    boxShadow: "0 6px 18px rgba(255, 77, 109, 0.25)",
  },
  filterCard: {
    display: "flex",
    gap: "12px",
    backgroundColor: "#ffffff",
    padding: "14px 18px",
    borderRadius: "20px",
    boxShadow: "0 6px 20px rgba(255, 77, 109, 0.08)",
    border: "1px solid #ffe1e9",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    minWidth: "220px",
    backgroundColor: "#fff9fa",
    border: "1px solid #ffccd5",
    borderRadius: "14px",
    padding: "8px 14px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
    width: "100%",
    color: "#2d3748",
  },
  clearBtn: {
    border: "none",
    background: "transparent",
    color: "#a0aec0",
    cursor: "pointer",
  },
  provinceSelect: {
    padding: "10px 16px",
    borderRadius: "14px",
    border: "1px solid #ffccd5",
    backgroundColor: "#fff0f5",
    color: "#ff4d6d",
    fontWeight: "600",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
  },
  reloadSampleBtn: {
    padding: "10px 14px",
    borderRadius: "14px",
    border: "1px solid #cbd5e0",
    backgroundColor: "#f7fafc",
    color: "#4a5568",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
  emptyBox: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    padding: "48px 24px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(255, 77, 109, 0.1)",
  },
  resetBtn: {
    border: "1px solid #ff4d6d",
    backgroundColor: "#fff0f5",
    color: "#ff4d6d",
    padding: "12px 20px",
    borderRadius: "20px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  exploreBtn: {
    border: "none",
    backgroundColor: "#ff4d6d",
    color: "white",
    padding: "12px 24px",
    borderRadius: "20px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "22px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 8px 25px rgba(255, 77, 109, 0.1)",
    border: "1px solid #ffe1e9",
  },
  avatar: {
    width: "96px",
    height: "96px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #ff4d6d",
    marginBottom: "12px",
  },
  name: { margin: "0 0 4px", fontSize: "18px", color: "#2d3748" },
  location: { margin: "0 0 6px", fontSize: "13px", color: "#718096" },
  matchedAt: {
    margin: "0 0 16px",
    fontSize: "12px",
    color: "#a0aec0",
    minHeight: "18px",
  },
  actions: { display: "flex", gap: "8px", justifyContent: "center" },
  chatBtn: {
    flex: 1,
    border: "none",
    backgroundColor: "#ff4d6d",
    color: "white",
    padding: "10px 12px",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer",
  },
  addFriendBtn: {
    flex: 1,
    border: "none",
    backgroundColor: "#38a169",
    color: "white",
    padding: "10px 12px",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer",
  },
  deleteFriendBtn: {
    border: "1px solid #fed7d7",
    backgroundColor: "#fff5f5",
    color: "#e53e3e",
    padding: "10px 12px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
  unmatchBtn: {
    border: "1px solid #e2e8f0",
    backgroundColor: "#f7fafc",
    color: "#718096",
    padding: "10px 12px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
};

export default MatchList;
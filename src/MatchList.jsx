import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR, VIETNAM_PROVINCES } from "./AppContext";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";

const emailToDocId = (email) =>
  (email || "guest").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

function MatchList() {
  const navigate = useNavigate();
  const {
    currentUser,
    friends,
    addFriend,
    removeFriend,
    isFriend,
    discoverProfiles,
  } = useApp();

  const myEmail = (currentUser?.email || "").trim().toLowerCase();
  const myDocId = emailToDocId(myEmail);

  const [activeTab, setActiveTab] = useState("requests"); // 'requests' | 'friends' | 'discover'
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [firebaseUsers, setFirebaseUsers] = useState([]);
  const [searchFriend, setSearchFriend] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("Tất cả khu vực");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2500);
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const me = all.find((u) => (u.email || "").toLowerCase() === myEmail);
      if (me) {
        const reqs = Array.isArray(me.friendRequests) ? me.friendRequests : [];
        setIncomingRequests(reqs);
        if (reqs.length === 0 && activeTab === "requests") {
          setActiveTab("friends");
        }
      }
      setFirebaseUsers(
        all.filter((u) => u.email && u.email.toLowerCase() !== myEmail)
      );
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEmail]);

  const handleAcceptRequest = async (reqItem) => {
    const senderEmail = (reqItem.email || "").trim().toLowerCase();
    if (!senderEmail) return;

    try {
      await updateDoc(doc(db, "users", myDocId), {
        friendRequests: arrayRemove(reqItem),
        friends: arrayUnion(senderEmail),
      });
      await setDoc(
        doc(db, "users", emailToDocId(senderEmail)),
        { friends: arrayUnion(myEmail) },
        { merge: true }
      );
      addFriend({
        id: senderEmail,
        email: senderEmail,
        name: reqItem.name,
        avatar: reqItem.avatar || DEFAULT_AVATAR,
        age: reqItem.age || 21,
        location: reqItem.location || "Việt Nam",
        isOnline: true,
      });
      showToast(`💜 Bạn và ${reqItem.name} đã trở thành bạn bè!`);
    } catch (err) {
      console.error("Lỗi chấp nhận kết bạn:", err);
    }
  };

  const handleIgnoreRequest = async (reqItem) => {
    try {
      await updateDoc(doc(db, "users", myDocId), {
        friendRequests: arrayRemove(reqItem),
      });
      showToast(`Đã bỏ qua lời mời kết bạn từ ${reqItem.name}.`);
    } catch (err) {
      console.error("Lỗi bỏ qua lời mời:", err);
    }
  };

  const handleSendRequest = async (person) => {
    const targetEmail = (person.email || "").trim().toLowerCase();
    if (!targetEmail) return;

    const reqPayload = {
      email: myEmail,
      name: currentUser.name,
      avatar: currentUser.avatar || DEFAULT_AVATAR,
      age: currentUser.age || 21,
      location: currentUser.location || "Việt Nam",
      sentAt: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    try {
      await setDoc(
        doc(db, "users", emailToDocId(targetEmail)),
        {
          email: targetEmail,
          name: person.name,
          avatar: person.avatar || person.image || DEFAULT_AVATAR,
          friendRequests: arrayUnion(reqPayload),
        },
        { merge: true }
      );
      showToast(`💌 Đã gửi lời mời kết bạn tới ${person.name}!`);
    } catch (err) {
      console.error("Lỗi gửi lời mời:", err);
    }
  };

  const handleRemoveFriendBoth = async (person) => {
    const targetEmail = (person.email || String(person.id)).toLowerCase();
    if (!window.confirm(`Xóa ${person.name} khỏi danh sách bạn bè?`)) return;

    removeFriend(person.id);
    removeFriend(targetEmail);
    try {
      await updateDoc(doc(db, "users", myDocId), {
        friends: arrayRemove(targetEmail),
      });
      await updateDoc(doc(db, "users", emailToDocId(targetEmail)), {
        friends: arrayRemove(myEmail),
      });
    } catch (err) {
      console.error("Lỗi xóa bạn:", err);
    }
    showToast(`🗑️ Đã xóa ${person.name} khỏi danh sách bạn bè.`);
  };

  const allDiscoverList = React.useMemo(() => {
    const map = new Map();
    [...firebaseUsers, ...discoverProfiles].forEach((p) => {
      const key = (p.email || String(p.id)).toLowerCase();
      if (key !== myEmail) map.set(key, p);
    });
    return Array.from(map.values());
  }, [firebaseUsers, discoverProfiles, myEmail]);

  const sourceList =
    activeTab === "requests"
      ? incomingRequests
      : activeTab === "friends"
      ? friends
      : allDiscoverList;

  const filteredList = sourceList.filter((person) => {
    const matchProv =
      selectedProvince === "Tất cả khu vực" ||
      (person.location || "")
        .toLowerCase()
        .includes(selectedProvince.toLowerCase());
    const q = searchFriend.trim().toLowerCase();
    const matchName =
      !q ||
      (person.name || "").toLowerCase().includes(q) ||
      (person.location || "").toLowerCase().includes(q);
    return matchProv && matchName;
  });

  return (
    <div style={styles.page}>
      {toastMsg && <div style={styles.toast}>{toastMsg}</div>}

      <header style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate("/home")}>
          ← Bảng tin
        </button>
        <h2 style={styles.logo}>👥 Bạn bè & Lời mời kết bạn</h2>
        <button style={styles.backBtn} onClick={() => navigate("/chat")}>
          💬 Chat
        </button>
      </header>

      <div style={styles.container}>
        <div style={styles.tabsRow}>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "requests" ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab("requests")}
          >
            🔔 Lời mời kết bạn ({incomingRequests.length})
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "friends" ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab("friends")}
          >
            💜 Bạn bè ({friends.length})
          </button>
          <button
            style={{
              ...styles.tabBtn,
              ...(activeTab === "discover" ? styles.tabBtnActive : {}),
            }}
            onClick={() => setActiveTab("discover")}
          >
            ➕ Tìm thêm bạn ({allDiscoverList.length})
          </button>
        </div>

        <div style={styles.filterCard}>
          <div style={styles.searchBox}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="Tìm theo tên hoặc khu vực..."
              value={searchFriend}
              onChange={(e) => setSearchFriend(e.target.value)}
              style={styles.searchInput}
            />
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
        </div>

        {filteredList.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>💜</div>
            <h3>
              {activeTab === "requests"
                ? "Hiện chưa có lời mời kết bạn nào gửi tới bạn"
                : "Danh sách đang trống"}
            </h3>
            <p style={{ color: "#7c6b99" }}>
              Bạn có thể chuyển sang tab "Tìm thêm bạn" để gửi lời mời kết bạn
              tới mọi người nhé!
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredList.map((person) => {
              const pEmail = (person.email || "").toLowerCase();
              const alreadyFriend = isFriend(pEmail) || isFriend(person.id);
              const alreadySent =
                Array.isArray(person.friendRequests) &&
                person.friendRequests.some(
                  (r) => (r.email || "").toLowerCase() === myEmail
                );

              return (
                <div key={pEmail || person.id} style={styles.card}>
                  <img
                    src={person.avatar || person.image || DEFAULT_AVATAR}
                    alt={person.name}
                    style={styles.avatar}
                  />
                  <h3 style={styles.name}>
                    {person.name}
                    {person.age ? `, ${person.age}` : ""}
                  </h3>
                  <p style={styles.location}>
                    📍 {person.location || "Việt Nam"}
                  </p>

                  <div style={styles.actions}>
                    {activeTab === "requests" && (
                      <>
                        <button
                          style={styles.acceptBtn}
                          onClick={() => handleAcceptRequest(person)}
                        >
                          ✓ Chấp nhận
                        </button>
                        <button
                          style={styles.deleteFriendBtn}
                          onClick={() => handleIgnoreRequest(person)}
                        >
                          ✕ Bỏ qua
                        </button>
                      </>
                    )}

                    {activeTab === "friends" && (
                      <>
                        <button
                          style={styles.chatBtn}
                          onClick={() =>
                            navigate(
                              `/chat/${encodeURIComponent(
                                person.email || person.id
                              )}`
                            )
                          }
                        >
                          💬 Nhắn tin
                        </button>
                        <button
                          style={styles.deleteFriendBtn}
                          onClick={() => handleRemoveFriendBoth(person)}
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
                            onClick={() => handleRemoveFriendBoth(person)}
                          >
                            ✓ Bạn bè (Xóa)
                          </button>
                        ) : alreadySent ? (
                          <button style={styles.sentBtn} disabled>
                            ⏳ Đã gửi lời mời
                          </button>
                        ) : (
                          <button
                            style={styles.acceptBtn}
                            onClick={() => handleSendRequest(person)}
                          >
                            ➕ Kết bạn
                          </button>
                        )}
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
    background: "linear-gradient(135deg, #f3ebff 0%, #fcf8ff 100%)",
    fontFamily: "Quicksand, -apple-system, sans-serif",
  },
  toast: {
    position: "fixed",
    top: "80px",
    right: "24px",
    backgroundColor: "#2d1f47",
    color: "#ffffff",
    padding: "12px 20px",
    borderRadius: "14px",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 8px 25px rgba(107, 53, 214, 0.25)",
    zIndex: 999,
  },
  header: {
    height: "65px",
    background: "linear-gradient(135deg, #a770ef 0%, #cf8bf3 50%, #fdb99b 100%)",
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
    border: "1px solid #e6d9ff",
    backgroundColor: "#ffffff",
    color: "#7c6b99",
    fontWeight: "bold",
    fontSize: "14px",
    cursor: "pointer",
  },
  tabBtnActive: {
    background: "linear-gradient(135deg, #a770ef, #cf8bf3)",
    color: "#ffffff",
    borderColor: "transparent",
    boxShadow: "0 6px 18px rgba(157, 101, 255, 0.25)",
  },
  filterCard: {
    display: "flex",
    gap: "12px",
    backgroundColor: "#ffffff",
    padding: "14px 18px",
    borderRadius: "20px",
    border: "1px solid #e6d9ff",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
    minWidth: "220px",
    backgroundColor: "#f2ebff",
    borderRadius: "14px",
    padding: "8px 14px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "14px",
    width: "100%",
    color: "#2d1f47",
  },
  provinceSelect: {
    padding: "10px 16px",
    borderRadius: "14px",
    border: "1px solid #e6d9ff",
    backgroundColor: "#f2ebff",
    color: "#6b35d6",
    fontWeight: "600",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
  },
  emptyBox: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    padding: "48px 24px",
    textAlign: "center",
    border: "1px solid #e6d9ff",
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
    boxShadow: "0 8px 25px rgba(157, 101, 255, 0.1)",
    border: "1px solid #e6d9ff",
  },
  avatar: {
    width: "92px",
    height: "92px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #a770ef",
    marginBottom: "12px",
  },
  name: { margin: "0 0 4px", fontSize: "18px", color: "#2d1f47" },
  location: { margin: "0 0 14px", fontSize: "13px", color: "#7c6b99" },
  actions: { display: "flex", gap: "8px", justifyContent: "center" },
  acceptBtn: {
    flex: 1,
    border: "none",
    background: "linear-gradient(135deg, #a770ef, #cf8bf3)",
    color: "white",
    padding: "10px 12px",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer",
  },
  chatBtn: {
    flex: 1,
    border: "none",
    background: "linear-gradient(135deg, #a770ef, #cf8bf3)",
    color: "white",
    padding: "10px 12px",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer",
  },
  sentBtn: {
    flex: 1,
    border: "1px solid #e6d9ff",
    backgroundColor: "#f2ebff",
    color: "#6b35d6",
    padding: "10px 12px",
    borderRadius: "12px",
    fontWeight: "bold",
    fontSize: "13px",
  },
  deleteFriendBtn: {
    flex: 1,
    border: "1px solid #ffd1e0",
    backgroundColor: "#fff0f5",
    color: "#e03e70",
    padding: "10px 12px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
};

export default MatchList;
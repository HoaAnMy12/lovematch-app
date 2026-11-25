import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp, DEFAULT_AVATAR } from "./AppContext";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const DATE_IDEAS = [
  "☕ Cà phê trò chuyện & ngắm phố",
  "🎬 Xem phim chiếu rạp buổi tối",
  "🍜 Khám phá ẩm thực đường phố",
  "🎸 Nghe nhạc Acoustic thư giãn",
  "🌊 Đi dạo & hóng gió",
];

// Tạo ID phòng chat cố định cho 2 người dựa trên email
const getChatRoomId = (email1, email2) => {
  if (!email1 || !email2) return "default_room";
  return [email1.trim().toLowerCase(), email2.trim().toLowerCase()]
    .sort()
    .join("_");
};

function ChatBox() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { currentUser, matches, friends, updateMatchLastMessage } = useApp();

  const [firebaseUsers, setFirebaseUsers] = useState([]);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [showDateModal, setShowDateModal] = useState(false);
  const [dateForm, setDateForm] = useState({
    activity: DATE_IDEAS[0],
    date: "",
    time: "19:30",
    place: "",
  });

  const messagesEndRef = useRef(null);
  const myEmail = (currentUser?.email || "").trim().toLowerCase();

  // 1. Lắng nghe danh sách thành viên thật trên Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.email && u.email.toLowerCase() !== myEmail);
      setFirebaseUsers(list);
    });
    return () => unsub();
  }, [myEmail]);

  // 2. Gộp danh sách liên hệ (Firebase + Bạn bè + Tương hợp)
  const chatContacts = React.useMemo(() => {
    const map = new Map();
    [...firebaseUsers, ...friends, ...matches].forEach((person) => {
      const key = (person.email || String(person.id)).toLowerCase();
      if (key && key !== myEmail && !map.has(key)) {
        map.set(key, person);
      }
    });
    return Array.from(map.values());
  }, [firebaseUsers, friends, matches, myEmail]);

  // 3. Tự động chọn đối phương từ URL (/chat/:userId)
  useEffect(() => {
    if (userId) {
      const decodedId = decodeURIComponent(userId).trim().toLowerCase();
      const found = chatContacts.find(
        (u) =>
          (u.email || "").toLowerCase() === decodedId ||
          String(u.id).toLowerCase() === decodedId
      );
      if (found) {
        setPartner(found);
      } else if (decodedId.includes("@")) {
        setPartner({
          id: decodedId,
          email: decodedId,
          name: decodedId.split("@")[0],
          avatar: DEFAULT_AVATAR,
          location: "Việt Nam",
          isOnline: true,
        });
      }
    } else if (chatContacts.length > 0 && !partner) {
      setPartner(chatContacts[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, chatContacts]);

  const handleSelectPartner = (item) => {
    const targetKey = item.email || item.id;
    setPartner(item);
    navigate(`/chat/${encodeURIComponent(targetKey)}`);
  };

  // 4. Lắng nghe tin nhắn theo thời gian thực
  useEffect(() => {
    if (!partner?.email || !myEmail) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const roomId = getChatRoomId(myEmail, partner.email);
    const q = query(
      collection(db, "chats", roomId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveMessages = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setMessages(liveMessages);
        setLoadingMessages(false);
      },
      (error) => {
        console.error("Lỗi tải tin nhắn:", error);
        setLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [partner, myEmail]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  // Gửi tin nhắn lên Firestore
  const handleSend = async (textToSend = null, dateCardData = null) => {
    if (!partner?.email || !myEmail) return;
    const text = textToSend !== null ? textToSend : input;
    if (!text.trim() && !dateCardData) return;

    const roomId = getChatRoomId(myEmail, partner.email);
    const nowTime = getCurrentTime();
    const cleanText = text.trim();

    if (textToSend === null) {
      setInput("");
    }

    try {
      await addDoc(collection(db, "chats", roomId, "messages"), {
        senderEmail: myEmail,
        senderName: currentUser.name,
        text: cleanText,
        dateInvite: dateCardData || null,
        time: nowTime,
        liked: false,
        createdAt: serverTimestamp(),
      });

      const partnerKey = partner.email || String(partner.id);
      updateMatchLastMessage(
        partnerKey,
        dateCardData ? "📅 Đã gửi lời mời hẹn hò" : cleanText,
        nowTime
      );
    } catch (error) {
      console.error("Không thể gửi tin nhắn:", error);
      alert("Gửi tin nhắn thất bại. Vui lòng kiểm tra kết nối mạng!");
    }
  };

  const handleSendDateInvite = async (e) => {
    e.preventDefault();
    if (!dateForm.date || !dateForm.place.trim()) {
      alert("Vui lòng chọn ngày và nhập địa điểm hẹn hò!");
      return;
    }
    await handleSend("Mình mời bạn đi hẹn hò nhé! 💜", { ...dateForm });
    setShowDateModal(false);
    setDateForm({
      activity: DATE_IDEAS[0],
      date: "",
      time: "19:30",
      place: "",
    });
  };

  const toggleLike = async (msg) => {
    if (!partner?.email || !myEmail) return;
    const roomId = getChatRoomId(myEmail, partner.email);
    try {
      await updateDoc(doc(db, "chats", roomId, "messages", msg.id), {
        liked: !msg.liked,
      });
    } catch (error) {
      console.error("Lỗi thả tim:", error);
    }
  };

  const handleClearChat = async () => {
    if (!partner?.email || !myEmail) return;
    if (!window.confirm(`Xóa toàn bộ cuộc trò chuyện với ${partner.name}?`)) {
      return;
    }

    const roomId = getChatRoomId(myEmail, partner.email);
    try {
      const snapshot = await getDocs(
        collection(db, "chats", roomId, "messages")
      );
      await Promise.all(
        snapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, "chats", roomId, "messages", docSnap.id))
        )
      );
    } catch (error) {
      console.error("Lỗi xóa lịch sử chat:", error);
    }
  };

  const quickReplies = [
    "Hôm nay bạn thế nào? 💜",
    "Rảnh rỗi đi cafe không? ☕",
    "Cuối tuần mình đi ăn nhé! 🍜",
  ];

  return (
    <div style={styles.page}>
      {/* HEADER TÍM PASTEL */}
      <header style={styles.header}>
        <div style={styles.headerLeftGroup}>
          <button
            style={styles.headerBtn}
            onClick={() => navigate("/home")}
            title="Bảng tin"
          >
            ←
          </button>
          <h2 style={styles.logo}>💬 Tin nhắn trực tiếp</h2>
        </div>
        <button
          style={styles.headerBtn}
          onClick={() => navigate("/profile")}
          title="Hồ sơ"
        >
          👤
        </button>
      </header>

      {/* BỐ CỤC 3 CỘT */}
      <div style={styles.layoutContainer}>
        {/* CỘT 1: MENU TRÁI */}
        <aside style={styles.leftSidebar}>
          <div
            style={styles.userProfileCard}
            onClick={() => navigate("/profile")}
          >
            <img
              src={currentUser.avatar || DEFAULT_AVATAR}
              alt={currentUser.name}
              style={styles.sidebarAvatar}
            />
            <div style={styles.sidebarUserInfo}>
              <span style={styles.sidebarUserName}>{currentUser.name}</span>
              <span style={styles.sidebarUserSub}>{currentUser.email}</span>
            </div>
          </div>

          <div style={styles.menuList}>
            <button style={styles.navBtn} onClick={() => navigate("/home")}>
              <span style={styles.navIcon}>🏠</span>
              <span style={styles.navLabel}>Bảng tin</span>
            </button>
            <button
              style={styles.navBtn}
              onClick={() => navigate("/match-list")}
            >
              <span style={styles.navIcon}>👥</span>
              <span style={styles.navLabel}>Bạn bè ({friends.length})</span>
            </button>
            <button
              style={{ ...styles.navBtn, ...styles.navBtnActive }}
              onClick={() => navigate("/chat")}
            >
              <span style={styles.navIcon}>💬</span>
              <span style={styles.navLabel}>Tin nhắn</span>
            </button>
            <button style={styles.navBtn} onClick={() => navigate("/profile")}>
              <span style={styles.navIcon}>👤</span>
              <span style={styles.navLabel}>Hồ sơ</span>
            </button>
          </div>
        </aside>

        {/* CỘT 2: HỘP THƯ */}
        <div style={styles.inboxSidebar}>
          <div style={styles.inboxHeader}>
            <h3 style={styles.inboxTitle}>Hộp thư ({chatContacts.length})</h3>
          </div>

          <div style={styles.inboxList}>
            {chatContacts.length === 0 ? (
              <div
                style={{
                  padding: "24px",
                  textAlign: "center",
                  color: "#7c6b99",
                  fontSize: "14px",
                }}
              >
                Chưa có người trò chuyện. Hãy vào Bảng tin hoặc Bạn bè để kết
                nối nhé! 💜
              </div>
            ) : (
              chatContacts.map((item) => {
                const isActive =
                  partner &&
                  (item.email?.toLowerCase() === partner.email?.toLowerCase() ||
                    String(item.id) === String(partner.id));

                return (
                  <div
                    key={item.email || item.id}
                    style={{
                      ...styles.inboxItem,
                      backgroundColor: isActive ? "#f2ebff" : "transparent",
                      borderLeft: isActive
                        ? "4px solid #9d65ff"
                        : "4px solid transparent",
                    }}
                    onClick={() => handleSelectPartner(item)}
                  >
                    <div style={styles.avatarWrapper}>
                      <img
                        src={item.avatar || item.image || DEFAULT_AVATAR}
                        alt={item.name}
                        style={styles.inboxAvatar}
                      />
                      <span style={styles.onlineDot} />
                    </div>

                    <div style={styles.inboxInfo}>
                      <div style={styles.inboxNameRow}>
                        <span style={styles.inboxName}>
                          {item.name}
                          {item.age ? `, ${item.age}` : ""}
                        </span>
                        <span style={styles.inboxTime}>Trực tuyến</span>
                      </div>
                      <span style={styles.inboxLastMsg}>
                        {item.message || item.email}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CỘT 3: KHUNG CHAT CHÍNH */}
        <main style={styles.mainContent}>
          {partner ? (
            <div style={styles.chatBoxCard}>
              <div style={styles.chatHeader}>
                <div style={styles.partnerInfoGroup}>
                  <div style={styles.avatarWrapper}>
                    <img
                      src={partner.avatar || partner.image || DEFAULT_AVATAR}
                      alt={partner.name}
                      style={styles.avatarImg}
                    />
                    <span style={styles.onlineDot} />
                  </div>

                  <div style={styles.headerInfo}>
                    <div style={styles.nameRow}>
                      <span style={styles.partnerName}>
                        {partner.name}
                        {partner.age ? `, ${partner.age}` : ""}
                      </span>
                      <span style={styles.distBadge}>
                        📍 {partner.location || "Việt Nam"}
                      </span>
                    </div>
                    <span style={styles.statusText}>● Đang hoạt động</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    style={styles.datePlanBtn}
                    onClick={() => setShowDateModal(true)}
                  >
                    📅 Hẹn hò
                  </button>
                  <button
                    style={styles.clearChatBtn}
                    onClick={handleClearChat}
                    title="Xóa cuộc trò chuyện"
                  >
                    🗑️ Xóa trò chuyện
                  </button>
                </div>
              </div>

              <div style={styles.messagesArea}>
                {loadingMessages ? (
                  <div style={styles.emptyState}>
                    <p>Đang tải cuộc trò chuyện...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>💬</div>
                    <p
                      style={{
                        fontWeight: "bold",
                        fontSize: "16px",
                        margin: "6px 0",
                        color: "#2d1f47",
                      }}
                    >
                      Bắt đầu trò chuyện với {partner.name}
                    </p>
                    <span>
                      Tin nhắn sẽ hiển thị ngay lập tức khi {partner.name} mở
                      ứng dụng! 💜
                    </span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.senderEmail?.toLowerCase() === myEmail;

                    return (
                      <div
                        key={msg.id}
                        style={{
                          ...styles.messageWrapper,
                          alignSelf: isUser ? "flex-end" : "flex-start",
                          alignItems: isUser ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexDirection: isUser ? "row-reverse" : "row",
                          }}
                        >
                          <div
                            style={{
                              ...styles.bubble,
                              background: isUser
                                ? "linear-gradient(135deg, #a770ef 0%, #cf8bf3 100%)"
                                : "#ffffff",
                              color: isUser ? "#ffffff" : "#2d1f47",
                              border: isUser ? "none" : "1px solid #e6d9ff",
                              borderRadius: isUser
                                ? "20px 20px 4px 20px"
                                : "20px 20px 20px 4px",
                            }}
                          >
                            <div>{msg.text}</div>
                            {msg.dateInvite && (
                              <div
                                style={{
                                  ...styles.dateInviteCard,
                                  backgroundColor: isUser
                                    ? "rgba(255,255,255,0.22)"
                                    : "#faf7ff",
                                  borderColor: isUser
                                    ? "rgba(255,255,255,0.7)"
                                    : "#9d65ff",
                                  color: isUser ? "#ffffff" : "#2d1f47",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "bold",
                                    marginBottom: "4px",
                                  }}
                                >
                                  💌 THẺ LỜI MỜI HẸN HÒ
                                </div>
                                <div>🎯 {msg.dateInvite.activity}</div>
                                <div>
                                  🗓️ {msg.dateInvite.date} lúc{" "}
                                  {msg.dateInvite.time}
                                </div>
                                <div>📍 {msg.dateInvite.place}</div>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => toggleLike(msg)}
                            style={styles.likeBtn}
                            title="Thả tim"
                          >
                            {msg.liked ? "💜" : "🤍"}
                          </button>
                        </div>

                        <span style={styles.timeText}>{msg.time}</span>
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              <div style={styles.quickReplyContainer}>
                {quickReplies.map((reply, i) => (
                  <button
                    key={i}
                    style={styles.quickChip}
                    onClick={() => handleSend(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <div style={styles.inputArea}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={`Nhắn tin cho ${partner.name}...`}
                  style={styles.inputField}
                />

                <button onClick={() => handleSend()} style={styles.sendBtn}>
                  Gửi ✨
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.noPartnerSelected}>
              <div style={styles.placeholderIcon}>💬</div>
              <h3 style={styles.placeholderTitle}>Tin nhắn của bạn</h3>
              <p style={styles.placeholderText}>
                Hãy chọn một người bạn từ danh sách bên trái để bắt đầu trò
                chuyện trực tiếp nhé! 💜
              </p>
            </div>
          )}
        </main>
      </div>

      {/* MODAL LÊN LỊCH HẸN HÒ */}
      {showDateModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <h3 style={{ margin: "0 0 8px", color: "#7b3fe4" }}>
              📅 Lên lịch hẹn với {partner?.name}
            </h3>
            <p
              style={{
                margin: "0 0 16px",
                fontSize: "13px",
                color: "#7c6b99",
              }}
            >
              Chọn thời gian và địa điểm lý tưởng cho buổi gặp mặt
            </p>

            <form onSubmit={handleSendDateInvite}>
              <div style={styles.modalGroup}>
                <label style={styles.modalLabel}>Hoạt động hẹn hò</label>
                <select
                  value={dateForm.activity}
                  onChange={(e) =>
                    setDateForm({ ...dateForm, activity: e.target.value })
                  }
                  style={styles.modalInput}
                >
                  {DATE_IDEAS.map((idea) => (
                    <option key={idea} value={idea}>
                      {idea}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ ...styles.modalGroup, flex: 1 }}>
                  <label style={styles.modalLabel}>Ngày hẹn *</label>
                  <input
                    type="date"
                    value={dateForm.date}
                    onChange={(e) =>
                      setDateForm({ ...dateForm, date: e.target.value })
                    }
                    style={styles.modalInput}
                  />
                </div>
                <div style={{ ...styles.modalGroup, flex: 1 }}>
                  <label style={styles.modalLabel}>Giờ hẹn *</label>
                  <input
                    type="time"
                    value={dateForm.time}
                    onChange={(e) =>
                      setDateForm({ ...dateForm, time: e.target.value })
                    }
                    style={styles.modalInput}
                  />
                </div>
              </div>

              <div style={styles.modalGroup}>
                <label style={styles.modalLabel}>Địa điểm cụ thể *</label>
                <input
                  type="text"
                  placeholder="VD: Highlands Coffee, Rạp CGV..."
                  value={dateForm.place}
                  onChange={(e) =>
                    setDateForm({ ...dateForm, place: e.target.value })
                  }
                  style={styles.modalInput}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                <button
                  type="button"
                  onClick={() => setShowDateModal(false)}
                  style={styles.modalCancelBtn}
                >
                  Hủy
                </button>
                <button type="submit" style={styles.modalSubmitBtn}>
                  Gửi lời mời 💜
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
      "linear-gradient(135deg, #a770ef 0%, #cf8bf3 55%, #e5b2ff 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    color: "white",
    boxShadow: "0 4px 16px rgba(157, 101, 255, 0.22)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerLeftGroup: { display: "flex", alignItems: "center", gap: "16px" },
  headerBtn: {
    width: "40px",
    height: "40px",
    border: "none",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.25)",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
  },
  logo: { margin: 0, fontSize: "22px", fontWeight: "bold" },
  layoutContainer: { display: "flex", minHeight: "calc(100vh - 65px)" },
  leftSidebar: {
    width: "250px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e6d9ff",
    position: "sticky",
    top: "65px",
    height: "calc(100vh - 65px)",
    padding: "20px 14px",
    boxSizing: "border-box",
  },
  userProfileCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "16px",
    backgroundColor: "#faf7ff",
    border: "1px solid #e6d9ff",
    marginBottom: "18px",
    cursor: "pointer",
  },
  sidebarAvatar: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #9d65ff",
  },
  sidebarUserInfo: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  sidebarUserName: { fontSize: "15px", fontWeight: "bold", color: "#2d1f47" },
  sidebarUserSub: {
    fontSize: "11px",
    color: "#7b3fe4",
    marginTop: "2px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  menuList: { display: "flex", flexDirection: "column", gap: "8px" },
  navBtn: {
    border: "none",
    background: "transparent",
    padding: "12px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    color: "#7c6b99",
    fontSize: "15px",
    fontWeight: "600",
    textAlign: "left",
    width: "100%",
  },
  navBtnActive: {
    backgroundColor: "#f2ebff",
    color: "#7b3fe4",
    fontWeight: "bold",
  },
  navIcon: { fontSize: "20px" },
  navLabel: { fontSize: "15px" },
  inboxSidebar: {
    width: "300px",
    backgroundColor: "#ffffff",
    borderRight: "1px solid #e6d9ff",
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 65px)",
    position: "sticky",
    top: "65px",
  },
  inboxHeader: { padding: "16px 20px", borderBottom: "1px solid #e6d9ff" },
  inboxTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "bold",
    color: "#2d1f47",
  },
  inboxList: { flex: 1, overflowY: "auto" },
  inboxItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 18px",
    borderBottom: "1px solid #f5f0ff",
    cursor: "pointer",
  },
  avatarWrapper: { position: "relative" },
  inboxAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1.5px solid #e6d9ff",
  },
  onlineDot: {
    position: "absolute",
    bottom: "2px",
    right: "2px",
    width: "11px",
    height: "11px",
    backgroundColor: "#4cd964",
    borderRadius: "50%",
    border: "2px solid #ffffff",
  },
  inboxInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  inboxNameRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  inboxName: { fontSize: "14px", fontWeight: "bold", color: "#2d1f47" },
  inboxTime: { fontSize: "11px", color: "#7b3fe4" },
  inboxLastMsg: {
    fontSize: "13px",
    color: "#7c6b99",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  mainContent: {
    flex: 1,
    padding: "20px 24px",
    display: "flex",
    flexDirection: "column",
  },
  chatBoxCard: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    height: "calc(100vh - 105px)",
    minHeight: "560px",
    boxShadow: "0 8px 30px rgba(157, 101, 255, 0.14)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #e6d9ff",
  },
  chatHeader: {
    padding: "14px 20px",
    background:
      "linear-gradient(135deg, #a770ef 0%, #cf8bf3 60%, #e0b0ff 100%)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  partnerInfoGroup: { display: "flex", alignItems: "center", gap: "12px" },
  avatarImg: {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #ffffff",
  },
  headerInfo: { display: "flex", flexDirection: "column" },
  nameRow: { display: "flex", alignItems: "center", gap: "8px" },
  partnerName: { fontSize: "16px", fontWeight: "bold" },
  distBadge: {
    fontSize: "11px",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    padding: "2px 8px",
    borderRadius: "10px",
  },
  statusText: { fontSize: "12px", marginTop: "2px", opacity: 0.95 },
  datePlanBtn: {
    border: "none",
    background: "#ffffff",
    color: "#7b3fe4",
    padding: "7px 14px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
  },
  clearChatBtn: {
    border: "none",
    background: "rgba(255, 255, 255, 0.25)",
    color: "#ffffff",
    padding: "7px 14px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    backgroundColor: "#faf7ff",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  messageWrapper: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "75%",
  },
  bubble: {
    padding: "11px 16px",
    fontSize: "14px",
    lineHeight: "1.5",
    boxShadow: "0 3px 12px rgba(157, 101, 255, 0.08)",
    wordBreak: "break-word",
  },
  dateInviteCard: {
    marginTop: "8px",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px dashed",
    fontSize: "13px",
    lineHeight: "1.6",
  },
  likeBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "13px",
  },
  timeText: { fontSize: "11px", color: "#7c6b99", marginTop: "4px" },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#7c6b99",
    textAlign: "center",
  },
  emptyIcon: { fontSize: "44px" },
  quickReplyContainer: {
    display: "flex",
    gap: "8px",
    padding: "10px 16px",
    backgroundColor: "#ffffff",
    overflowX: "auto",
    borderTop: "1px solid #e6d9ff",
  },
  quickChip: {
    border: "1px solid #d4baff",
    backgroundColor: "#f2ebff",
    color: "#7b3fe4",
    padding: "6px 14px",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  inputArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 16px",
    backgroundColor: "#ffffff",
    borderTop: "1px solid #e6d9ff",
  },
  inputField: {
    flex: 1,
    padding: "12px 16px",
    border: "1px solid #d4baff",
    borderRadius: "22px",
    outline: "none",
    fontSize: "14px",
    backgroundColor: "#faf7ff",
    color: "#2d1f47",
  },
  sendBtn: {
    border: "none",
    background: "linear-gradient(135deg, #a770ef 0%, #cf8bf3 100%)",
    color: "#ffffff",
    padding: "11px 22px",
    borderRadius: "22px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13.5px",
    boxShadow: "0 4px 12px rgba(157, 101, 255, 0.28)",
  },
  noPartnerSelected: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    height: "calc(100vh - 105px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e6d9ff",
    padding: "40px",
    textAlign: "center",
  },
  placeholderIcon: { fontSize: "64px", marginBottom: "12px" },
  placeholderTitle: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#2d1f47",
    margin: "0 0 10px 0",
  },
  placeholderText: {
    fontSize: "15px",
    color: "#7c6b99",
    maxWidth: "400px",
    lineHeight: "1.6",
    margin: 0,
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(45, 31, 71, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    padding: "24px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 15px 40px rgba(107, 53, 214, 0.25)",
  },
  modalGroup: { marginBottom: "14px", textAlign: "left" },
  modalLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "6px",
    color: "#2d1f47",
  },
  modalInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid #e6d9ff",
    fontSize: "14px",
    boxSizing: "border-box",
  },
  modalCancelBtn: {
    flex: 1,
    padding: "11px",
    borderRadius: "12px",
    border: "1px solid #e6d9ff",
    background: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#7c6b99",
  },
  modalSubmitBtn: {
    flex: 1,
    padding: "11px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #a770ef 0%, #cf8bf3 100%)",
    cursor: "pointer",
    fontWeight: "bold",
    color: "#fff",
  },
};

export default ChatBox;
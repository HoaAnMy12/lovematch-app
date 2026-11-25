import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR } from "./AppContext";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import "./Home.css";

const emailToDocId = (email) =>
  (email || "guest").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

const compressImage = (file, maxWidth = 720) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

export default function Home() {
  const navigate = useNavigate();
  const {
    currentUser,
    logoutUser,
    friends,
    addFriend,
    removeFriend,
    isFriend,
    discoverProfiles,
  } = useApp();

  const user = currentUser || {
    name: "Thành viên LoveMatch",
    email: "user@lovematch.vn",
    avatar: DEFAULT_AVATAR,
    age: 21,
    location: "Việt Nam",
  };

  const myEmail = (user.email || "").trim().toLowerCase();
  const myDocId = emailToDocId(myEmail);

  const [posts, setPosts] = useState([]);
  const [firebaseUsers, setFirebaseUsers] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [firebaseFriendEmails, setFirebaseFriendEmails] = useState([]);

  const [newContent, setNewContent] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const postFileInputRef = useRef(null);

  // 1. Đồng bộ hồ sơ người dùng hiện tại lên Firestore
  useEffect(() => {
    if (!myEmail) return;
    setDoc(
      doc(db, "users", myDocId),
      {
        id: myDocId,
        name: user.name,
        email: myEmail,
        avatar: user.avatar || DEFAULT_AVATAR,
        age: user.age || 21,
        location: user.location || "Việt Nam",
        bio: user.description || "Rất vui được làm quen với mọi người 💜",
        lastActive: serverTimestamp(),
      },
      { merge: true }
    ).catch((err) => console.error("Lỗi đồng bộ user:", err));
  }, [myEmail, myDocId, user.name, user.avatar, user.age, user.location, user.description]);

  // 2. Lắng nghe danh sách thành viên, lời mời kết bạn gửi tới mình và bạn bè trên Firestore
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const meDoc = all.find(
        (u) => (u.email || "").toLowerCase() === myEmail
      );

      if (meDoc) {
        setIncomingRequests(
          Array.isArray(meDoc.friendRequests) ? meDoc.friendRequests : []
        );
        const fList = Array.isArray(meDoc.friends) ? meDoc.friends : [];
        setFirebaseFriendEmails(fList);

        // Đồng bộ danh sách bạn bè từ Firestore vào AppContext để dùng chung với Chat & MatchList
        fList.forEach((fEmail) => {
          const matchedUser = all.find(
            (u) => (u.email || "").toLowerCase() === fEmail.toLowerCase()
          );
          if (matchedUser && !isFriend(matchedUser.email)) {
            addFriend({
              id: matchedUser.email,
              email: matchedUser.email,
              name: matchedUser.name,
              avatar: matchedUser.avatar || DEFAULT_AVATAR,
              age: matchedUser.age || 21,
              location: matchedUser.location || "Việt Nam",
              isOnline: true,
            });
          }
        });
      }

      setFirebaseUsers(
        all.filter((u) => u.email && u.email.toLowerCase() !== myEmail)
      );
    });

    return () => unsubUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myEmail]);

  // 3. Lắng nghe bảng tin bài viết của tất cả mọi người theo thời gian thực
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubPosts = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubPosts();
  }, []);

  // Kiểm tra trạng thái quan hệ với một người dùng khác
  const checkIsFriend = (targetEmail) => {
    if (!targetEmail) return false;
    const clean = targetEmail.toLowerCase();
    return (
      firebaseFriendEmails.includes(clean) ||
      isFriend(clean) ||
      isFriend(targetEmail)
    );
  };

  const checkHasSentRequest = (targetUser) => {
    const reqs = Array.isArray(targetUser?.friendRequests)
      ? targetUser.friendRequests
      : [];
    return reqs.some((r) => (r.email || "").toLowerCase() === myEmail);
  };

  const checkHasIncomingRequest = (targetEmail) => {
    if (!targetEmail) return false;
    return incomingRequests.some(
      (r) => (r.email || "").toLowerCase() === targetEmail.toLowerCase()
    );
  };

  // Gửi lời mời kết bạn tới người khác
  const handleSendFriendRequest = async (person) => {
    const targetEmail = (person.email || "").trim().toLowerCase();
    if (!targetEmail || targetEmail === myEmail) return;

    const targetDocId = emailToDocId(targetEmail);
    const requestPayload = {
      email: myEmail,
      name: user.name,
      avatar: user.avatar || DEFAULT_AVATAR,
      age: user.age || 21,
      location: user.location || "Việt Nam",
      sentAt: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    try {
      await setDoc(
        doc(db, "users", targetDocId),
        {
          email: targetEmail,
          name: person.name || targetEmail.split("@")[0],
          avatar: person.avatar || person.image || DEFAULT_AVATAR,
          friendRequests: arrayUnion(requestPayload),
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Lỗi gửi lời mời kết bạn:", err);
      alert("Không thể gửi lời mời kết bạn lúc này!");
    }
  };

  // Hủy lời mời kết bạn đã gửi
  const handleCancelFriendRequest = async (person) => {
    const targetEmail = (person.email || "").trim().toLowerCase();
    const targetDocId = emailToDocId(targetEmail);
    const targetObj = firebaseUsers.find(
      (u) => (u.email || "").toLowerCase() === targetEmail
    );
    const existingReq = targetObj?.friendRequests?.find(
      (r) => (r.email || "").toLowerCase() === myEmail
    );

    if (!existingReq) return;
    try {
      await updateDoc(doc(db, "users", targetDocId), {
        friendRequests: arrayRemove(existingReq),
      });
    } catch (err) {
      console.error("Lỗi hủy lời mời:", err);
    }
  };

  // CHẤP NHẬN lời mời kết bạn từ người gửi
  const handleAcceptFriendRequest = async (reqItem) => {
    const senderEmail = (reqItem.email || "").trim().toLowerCase();
    if (!senderEmail) return;
    const senderDocId = emailToDocId(senderEmail);

    try {
      // 1. Xóa khỏi danh sách chờ & thêm vào danh sách bạn bè của mình
      await updateDoc(doc(db, "users", myDocId), {
        friendRequests: arrayRemove(reqItem),
        friends: arrayUnion(senderEmail),
      });

      // 2. Thêm email của mình vào danh sách bạn bè của người gửi
      await setDoc(
        doc(db, "users", senderDocId),
        {
          friends: arrayUnion(myEmail),
        },
        { merge: true }
      );

      // 3. Cập nhật vào AppContext để hiện ngay trong danh sách bạn bè & hộp thư
      addFriend({
        id: senderEmail,
        email: senderEmail,
        name: reqItem.name,
        avatar: reqItem.avatar || DEFAULT_AVATAR,
        age: reqItem.age || 21,
        location: reqItem.location || "Việt Nam",
        isOnline: true,
      });
    } catch (err) {
      console.error("Lỗi chấp nhận kết bạn:", err);
    }
  };

  // BỎ QUA (từ chối) lời mời kết bạn
  const handleIgnoreFriendRequest = async (reqItem) => {
    try {
      await updateDoc(doc(db, "users", myDocId), {
        friendRequests: arrayRemove(reqItem),
      });
    } catch (err) {
      console.error("Lỗi bỏ qua lời mời:", err);
    }
  };

  // Xóa bạn bè (hủy kết bạn cả 2 chiều)
  const handleRemoveFriendBoth = async (targetEmail) => {
    const clean = (targetEmail || "").trim().toLowerCase();
    if (!clean) return;
    removeFriend(clean);

    try {
      await updateDoc(doc(db, "users", myDocId), {
        friends: arrayRemove(clean),
      });
      await updateDoc(doc(db, "users", emailToDocId(clean)), {
        friends: arrayRemove(myEmail),
      });
    } catch (err) {
      console.error("Lỗi xóa bạn bè:", err);
    }
  };

  // Gợi ý kết bạn (những người chưa phải bạn bè)
  const suggestedPeople = React.useMemo(() => {
    const map = new Map();
    [...firebaseUsers, ...discoverProfiles].forEach((p) => {
      const key = (p.email || String(p.id)).toLowerCase();
      if (key !== myEmail && !checkIsFriend(key)) {
        map.set(key, p);
      }
    });
    return Array.from(map.values());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUsers, discoverProfiles, myEmail, firebaseFriendEmails, friends]);

  // Chọn ảnh từ máy để đăng bài
  const handleSelectPostImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file, 720);
    setSelectedImage(compressed);
  };

  // Đăng bài viết lên Firestore
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newContent.trim() && !selectedImage) return;
    setPosting(true);

    const now = new Date();
    const timeLabel = `${now.toLocaleDateString("vi-VN")} lúc ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    try {
      await addDoc(collection(db, "posts"), {
        authorEmail: myEmail,
        authorName: user.name,
        authorAvatar: user.avatar || DEFAULT_AVATAR,
        createdAt: timeLabel,
        timestamp: Date.now(),
        content: newContent.trim(),
        image: selectedImage,
        likes: [],
        comments: [],
      });

      setNewContent("");
      setSelectedImage("");
      if (postFileInputRef.current) postFileInputRef.current.value = "";
    } catch (err) {
      console.error("Lỗi đăng bài:", err);
      alert("Đăng bài thất bại, hãy thử ảnh nhẹ hơn!");
    } finally {
      setPosting(false);
    }
  };

  // Thả tim bài viết
  const handleToggleLike = async (post) => {
    const likes = Array.isArray(post.likes) ? post.likes : [];
    const hasLiked = likes.includes(myEmail);
    try {
      await updateDoc(doc(db, "posts", post.id), {
        likes: hasLiked ? arrayRemove(myEmail) : arrayUnion(myEmail),
      });
    } catch (err) {
      console.error("Lỗi thả tim:", err);
    }
  };

  // Viết bình luận
  const handleAddComment = async (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const newComment = {
      id: "c_" + Date.now(),
      userEmail: myEmail,
      userName: user.name,
      userAvatar: user.avatar || DEFAULT_AVATAR,
      text,
      time: timeStr,
    };

    try {
      await updateDoc(doc(db, "posts", postId), {
        comments: arrayUnion(newComment),
      });
      setCommentInputs({ ...commentInputs, [postId]: "" });
    } catch (err) {
      console.error("Lỗi bình luận:", err);
    }
  };

  // Mở chat trực tiếp với người dùng
  const handleOpenChatWith = (person) => {
    const targetEmail = (person.email || `${person.id}@lovematch.vn`).toLowerCase();
    if (!checkIsFriend(targetEmail)) {
      addFriend({
        id: targetEmail,
        email: targetEmail,
        name: person.name,
        avatar: person.avatar || person.image || DEFAULT_AVATAR,
        age: person.age || 21,
        location: person.location || "Việt Nam",
        isOnline: true,
      });
    }
    navigate(`/chat/${encodeURIComponent(targetEmail)}`);
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <div className="fb-page-container">
      {/* NAVBAR TRÊN CÙNG */}
      <header className="fb-navbar">
        <div
          className="nav-brand"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/home")}
        >
          💜 LoveMatch
        </div>

        <div className="nav-center-tabs">
          <button
            className="nav-tab-btn active"
            onClick={() => navigate("/home")}
          >
            🏠 Bảng tin
          </button>
          <button
            className="nav-tab-btn"
            onClick={() => navigate("/match-list")}
          >
            👥 Bạn bè ({friends.length})
            {incomingRequests.length > 0 && (
              <span
                style={{
                  marginLeft: "6px",
                  backgroundColor: "#ff4d6d",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "1px 7px",
                  fontSize: "11px",
                }}
              >
                {incomingRequests.length}
              </span>
            )}
          </button>
          <button className="nav-tab-btn" onClick={() => navigate("/chat")}>
            💬 Nhắn tin
          </button>
          <button className="nav-tab-btn" onClick={() => navigate("/profile")}>
            👤 Trang cá nhân
          </button>
        </div>

        <div className="nav-user-actions">
          <div
            className="nav-profile"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/profile")}
          >
            <img
              src={user.avatar || DEFAULT_AVATAR}
              alt="avatar"
              className="fb-avatar-sm"
            />
            <span>{user.name}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Đăng xuất
          </button>
        </div>
      </header>

      {/* BỐ CỤC 3 CỘT */}
      <div className="fb-layout">
        {/* CỘT TRÁI */}
        <aside className="fb-sidebar-left">
          <div className="fb-menu-item" onClick={() => navigate("/profile")}>
            <img
              src={user.avatar || DEFAULT_AVATAR}
              alt="avatar"
              className="fb-avatar-sm"
            />
            <span>{user.name}</span>
          </div>
          <div
            className="fb-menu-item active"
            onClick={() => navigate("/home")}
          >
            💜 Bảng tin hẹn hò
          </div>
          <div
            className="fb-menu-item"
            onClick={() => navigate("/edit-profile")}
          >
            ✏️ Sửa trang cá nhân
          </div>
          <div
            className="fb-menu-item"
            onClick={() => navigate("/match-list")}
          >
            👥 Quản lý bạn bè ({friends.length})
          </div>
          <div className="fb-menu-item" onClick={() => navigate("/chat")}>
            💌 Tin nhắn làm quen
          </div>
          <div className="fb-menu-item logout-menu" onClick={handleLogout}>
            🚪 Đăng xuất
          </div>
        </aside>

        {/* CỘT GIỮA: LỜI MỜI KẾT BẠN + ĐĂNG BÀI + BẢNG TIN */}
        <main className="fb-feed">
          {/* KHỐI HIỂN THỊ LỜI MỜI KẾT BẠN GỬI TỚI MÌNH (CHẤP NHẬN / BỎ QUA) */}
          {incomingRequests.length > 0 && (
            <div
              className="fb-card"
              style={{
                border: "1.5px solid #c39eff",
                backgroundColor: "#faf6ff",
              }}
            >
              <h4 className="sidebar-title" style={{ marginBottom: "12px" }}>
                🔔 Lời mời kết bạn gửi tới bạn ({incomingRequests.length})
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {incomingRequests.map((req) => (
                  <div
                    key={req.email}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "#ffffff",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      border: "1px solid #e6d9ff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img
                        src={req.avatar || DEFAULT_AVATAR}
                        alt={req.name}
                        className="fb-avatar-md"
                      />
                      <div>
                        <strong style={{ display: "block", fontSize: "14.5px" }}>
                          {req.name}
                        </strong>
                        <span style={{ fontSize: "12px", color: "#7c6b99" }}>
                          📍 {req.location || "Việt Nam"} · Đã gửi lời mời kết bạn
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="fb-btn-primary btn-sm"
                        onClick={() => handleAcceptFriendRequest(req)}
                      >
                        ✓ Chấp nhận
                      </button>
                      <button
                        className="btn-danger-soft btn-sm"
                        onClick={() => handleIgnoreFriendRequest(req)}
                      >
                        ✕ Bỏ qua
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Khung đăng bài */}
          <div className="fb-card create-post-box">
            <div className="create-post-top">
              <img
                src={user.avatar || DEFAULT_AVATAR}
                alt="avatar"
                className="fb-avatar-md"
              />
              <input
                type="text"
                placeholder={`${user.name} ơi, hôm nay bạn muốn chia sẻ điều gì?`}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreatePost(e)}
              />
            </div>

            {selectedImage && (
              <div className="image-preview-wrapper">
                <img
                  src={selectedImage}
                  alt="preview"
                  className="image-preview"
                />
                <button
                  type="button"
                  className="remove-img-btn"
                  onClick={() => {
                    setSelectedImage("");
                    if (postFileInputRef.current)
                      postFileInputRef.current.value = "";
                  }}
                >
                  ✕ Xóa ảnh
                </button>
              </div>
            )}

            <div className="create-post-bottom">
              <label className="upload-photo-btn">
                🖼️ Chọn ảnh từ máy
                <input
                  ref={postFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelectPostImage}
                  hidden
                />
              </label>
              <button
                onClick={handleCreatePost}
                className="fb-btn-primary"
                disabled={posting}
              >
                {posting ? "Đang đăng..." : "Đăng bài"}
              </button>
            </div>
          </div>

          {/* Danh sách bài viết công khai */}
          {posts.length === 0 ? (
            <div
              className="fb-card"
              style={{ textAlign: "center", color: "#7c6b99" }}
            >
              Chưa có bài viết nào trên bảng tin. Hãy đăng bài đầu tiên để mọi
              người cùng xem, thả tim và bình luận nhé 💜
            </div>
          ) : (
            posts.map((post) => {
              const likesList = Array.isArray(post.likes) ? post.likes : [];
              const commentsList = Array.isArray(post.comments)
                ? post.comments
                : [];
              const isLiked = likesList.includes(myEmail);

              const authorEmail = (post.authorEmail || "").toLowerCase();
              const isMyPost = authorEmail && authorEmail === myEmail;
              const alreadyFriend = checkIsFriend(authorEmail);
              const targetUserDoc = firebaseUsers.find(
                (u) => (u.email || "").toLowerCase() === authorEmail
              );
              const sentReq = checkHasSentRequest(targetUserDoc);
              const incomingReqObj = incomingRequests.find(
                (r) => (r.email || "").toLowerCase() === authorEmail
              );

              return (
                <article key={post.id} className="fb-card post-card">
                  <div className="post-header-row">
                    <div className="post-header">
                      <img
                        src={post.authorAvatar || DEFAULT_AVATAR}
                        alt="author"
                        className="fb-avatar-md"
                      />
                      <div>
                        <h4 className="post-author">{post.authorName}</h4>
                        <span className="post-time">
                          {post.createdAt} · 🌎 Công khai
                        </span>
                      </div>
                    </div>

                    {/* Nút trạng thái Kết bạn / Chấp nhận / Hủy lời mời / Xóa bạn */}
                    {!isMyPost && (
                      <div className="post-author-actions">
                        {alreadyFriend ? (
                          <button
                            className="btn-danger-soft btn-sm"
                            onClick={() => handleRemoveFriendBoth(authorEmail)}
                          >
                            ✓ Bạn bè (Xóa)
                          </button>
                        ) : incomingReqObj ? (
                          <>
                            <button
                              className="fb-btn-primary btn-sm"
                              onClick={() =>
                                handleAcceptFriendRequest(incomingReqObj)
                              }
                            >
                              ✓ Chấp nhận
                            </button>
                            <button
                              className="btn-danger-soft btn-sm"
                              onClick={() =>
                                handleIgnoreFriendRequest(incomingReqObj)
                              }
                            >
                              ✕ Bỏ qua
                            </button>
                          </>
                        ) : sentReq ? (
                          <button
                            className="fb-btn-secondary btn-sm"
                            onClick={() =>
                              handleCancelFriendRequest({
                                email: authorEmail,
                                name: post.authorName,
                              })
                            }
                          >
                            ⏳ Đã gửi lời mời (Hủy)
                          </button>
                        ) : (
                          <button
                            className="fb-btn-secondary btn-sm"
                            onClick={() =>
                              handleSendFriendRequest({
                                email: authorEmail,
                                name: post.authorName,
                                avatar: post.authorAvatar,
                              })
                            }
                          >
                            ➕ Kết bạn
                          </button>
                        )}

                        <button
                          className="fb-btn-primary btn-sm"
                          onClick={() =>
                            handleOpenChatWith({
                              id: authorEmail,
                              email: authorEmail,
                              name: post.authorName,
                              avatar: post.authorAvatar,
                            })
                          }
                        >
                          💌 Nhắn tin
                        </button>
                      </div>
                    )}
                  </div>

                  {post.content && (
                    <p className="post-content">{post.content}</p>
                  )}
                  {post.image && (
                    <img src={post.image} alt="post" className="post-image" />
                  )}

                  <div className="post-stats">
                    <span>💜 {likesList.length} lượt thích</span>
                    <span>{commentsList.length} bình luận</span>
                  </div>

                  <div className="post-actions">
                    <button
                      className={isLiked ? "liked" : ""}
                      onClick={() => handleToggleLike(post)}
                    >
                      {isLiked ? "💜 Đã thích" : "🤍 Thích"}
                    </button>
                    <button
                      onClick={() => {
                        const inputEl = document.getElementById(
                          `cmt-input-${post.id}`
                        );
                        if (inputEl) inputEl.focus();
                      }}
                    >
                      💬 Bình luận
                    </button>
                    {!isMyPost && (
                      <button
                        onClick={() =>
                          handleOpenChatWith({
                            id: authorEmail,
                            email: authorEmail,
                            name: post.authorName,
                            avatar: post.authorAvatar,
                          })
                        }
                      >
                        💌 Nhắn tin
                      </button>
                    )}
                  </div>

                  {/* Bình luận */}
                  <div className="post-comments">
                    {commentsList.map((c) => (
                      <div key={c.id} className="comment-row">
                        <img
                          src={c.userAvatar || DEFAULT_AVATAR}
                          alt="avatar"
                          className="comment-avatar"
                        />
                        <div className="comment-item">
                          <div className="comment-header">
                            <strong>{c.userName}</strong>
                            <span className="comment-time">{c.time}</span>
                          </div>
                          <span>{c.text}</span>
                        </div>
                      </div>
                    ))}

                    <div className="comment-input-row">
                      <img
                        src={user.avatar || DEFAULT_AVATAR}
                        alt="me"
                        className="comment-avatar"
                      />
                      <input
                        id={`cmt-input-${post.id}`}
                        type="text"
                        placeholder={`Viết bình luận dưới tên ${user.name}...`}
                        value={commentInputs[post.id] || ""}
                        onChange={(e) =>
                          setCommentInputs({
                            ...commentInputs,
                            [post.id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddComment(post.id)
                        }
                      />
                      <button onClick={() => handleAddComment(post.id)}>
                        Gửi
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </main>

        {/* CỘT PHẢI: LỜI MỜI KẾT BẠN + GỢI Ý + BẠN BÈ */}
        <aside className="fb-sidebar-right">
          {incomingRequests.length > 0 && (
            <div
              className="fb-card"
              style={{ border: "1.5px solid #c39eff" }}
            >
              <h4 className="sidebar-title">
                🔔 Lời mời kết bạn ({incomingRequests.length})
              </h4>
              {incomingRequests.map((req) => (
                <div key={req.email} className="friend-request-item">
                  <img
                    src={req.avatar || DEFAULT_AVATAR}
                    alt={req.name}
                    className="fb-avatar-md"
                  />
                  <div className="friend-info">
                    <strong>{req.name}</strong>
                    <span>{req.location || "Việt Nam"}</span>
                    <div className="friend-btns">
                      <button
                        className="fb-btn-primary btn-sm"
                        onClick={() => handleAcceptFriendRequest(req)}
                      >
                        ✓ Chấp nhận
                      </button>
                      <button
                        className="btn-danger-soft btn-sm"
                        onClick={() => handleIgnoreFriendRequest(req)}
                      >
                        ✕ Bỏ qua
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="fb-card">
            <h4 className="sidebar-title">✨ Gợi ý kết bạn</h4>
            {suggestedPeople.length === 0 ? (
              <p className="empty-text">Đã kết bạn với tất cả gợi ý.</p>
            ) : (
              suggestedPeople.slice(0, 4).map((person) => {
                const pEmail = (person.email || "").toLowerCase();
                const isSent = checkHasSentRequest(person);
                const hasIncoming = checkHasIncomingRequest(pEmail);
                if (hasIncoming) return null;

                return (
                  <div
                    key={pEmail || person.id}
                    className="friend-request-item"
                  >
                    <img
                      src={person.avatar || person.image || DEFAULT_AVATAR}
                      alt={person.name}
                      className="fb-avatar-md"
                    />
                    <div className="friend-info">
                      <strong>
                        {person.name}
                        {person.age ? `, ${person.age}` : ""}
                      </strong>
                      <span>{person.location || "Việt Nam"}</span>
                      <div className="friend-btns">
                        {isSent ? (
                          <button
                            className="fb-btn-secondary btn-sm"
                            onClick={() => handleCancelFriendRequest(person)}
                          >
                            ⏳ Đã gửi (Hủy)
                          </button>
                        ) : (
                          <button
                            className="fb-btn-primary btn-sm"
                            onClick={() => handleSendFriendRequest(person)}
                          >
                            ➕ Kết bạn
                          </button>
                        )}
                        <button
                          className="fb-btn-secondary btn-sm"
                          onClick={() => handleOpenChatWith(person)}
                        >
                          💌 Nhắn tin
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="fb-card">
            <h4 className="sidebar-title">💜 Bạn bè ({friends.length})</h4>
            {friends.length === 0 ? (
              <p className="empty-text">Chưa có bạn bè.</p>
            ) : (
              friends.slice(0, 8).map((friend) => (
                <div
                  key={friend.email || friend.id}
                  className="friend-mini-row"
                >
                  <div
                    className="friend-mini-left"
                    onClick={() => handleOpenChatWith(friend)}
                  >
                    <img
                      src={friend.avatar || friend.image || DEFAULT_AVATAR}
                      alt={friend.name}
                      className="fb-avatar-sm"
                    />
                    <span>{friend.name}</span>
                  </div>
                  <div className="friend-mini-btns">
                    <button
                      className="icon-btn-chat"
                      title="Nhắn tin"
                      onClick={() => handleOpenChatWith(friend)}
                    >
                      💬
                    </button>
                    <button
                      className="icon-btn-remove"
                      title="Xóa bạn bè"
                      onClick={() =>
                        handleRemoveFriendBoth(friend.email || friend.id)
                      }
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
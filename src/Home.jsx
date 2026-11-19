import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  doc,
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

const getChatRoomId = (id1, id2) => [id1, id2].sort().join("_");

export default function Home({ currentUser, onLogout, onUpdateProfile, compressImage }) {
  const [activeTab, setActiveTab] = useState("feed"); // 'feed' | 'friends' | 'profile'

  // Danh sách toàn bộ người dùng thật trên Firebase
  const [allUsers, setAllUsers] = useState([]);
  const [friendIds, setFriendIds] = useState(currentUser.friends || []);

  // Danh sách bài viết công khai trên Firebase (mọi người đều xem được bài của nhau)
  const [posts, setPosts] = useState([]);
  const [newContent, setNewContent] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const postFileInputRef = useRef(null);

  // Chỉnh sửa trang cá nhân
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.name || "");
  const [editBio, setEditBio] = useState(currentUser.bio || "");
  const [editLocation, setEditLocation] = useState(currentUser.location || "");
  const [editHobbies, setEditHobbies] = useState(currentUser.hobbies || "");
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar || "");

  // Hộp thoại nhắn tin làm quen Real-time
  const [chatPartner, setChatPartner] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // 1. Lắng nghe danh sách tất cả thành viên trên Firestore
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAllUsers(list);

      const me = list.find((u) => u.id === currentUser.id);
      if (me && Array.isArray(me.friends)) {
        setFriendIds(me.friends);
      }
    });
    return () => unsubUsers();
  }, [currentUser.id]);

  // 2. Lắng nghe bảng tin bài viết của tất cả mọi người theo thời gian thực
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubPosts = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPosts(list);
    });
    return () => unsubPosts();
  }, []);

  // 3. Lắng nghe tin nhắn trực tiếp với người đang chat
  useEffect(() => {
    if (!chatPartner) {
      setChatMessages([]);
      return;
    }
    const roomId = getChatRoomId(currentUser.id, chatPartner.id);
    const q = query(
      collection(db, "chats", roomId, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubChat = onSnapshot(q, (snapshot) => {
      setChatMessages(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubChat();
  }, [chatPartner, currentUser.id]);

  // Lọc danh sách bạn bè & gợi ý kết bạn
  const otherUsers = allUsers.filter((u) => u.id !== currentUser.id);
  const myFriends = otherUsers.filter((u) => friendIds.includes(u.id));
  const suggestedUsers = otherUsers.filter((u) => !friendIds.includes(u.id));

  // Thêm bạn bè
  const handleAddFriend = async (targetId) => {
    try {
      await updateDoc(doc(db, "users", currentUser.id), {
        friends: arrayUnion(targetId),
      });
    } catch (err) {
      console.error("Lỗi thêm bạn:", err);
    }
  };

  // Xóa bạn bè
  const handleRemoveFriend = async (targetId) => {
    try {
      await updateDoc(doc(db, "users", currentUser.id), {
        friends: arrayRemove(targetId),
      });
    } catch (err) {
      console.error("Lỗi xóa bạn:", err);
    }
  };

  // Chọn ảnh trực tiếp từ trong máy để đăng bài
  const handleSelectPostImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = compressImage
      ? await compressImage(file, 720)
      : await new Promise((res) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result);
          r.readAsDataURL(file);
        });
    setSelectedImage(compressed);
  };

  // Đăng bài viết lên bảng tin chung
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
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
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
      alert("Không thể đăng bài. Hãy thử ảnh dung lượng nhẹ hơn!");
    } finally {
      setPosting(false);
    }
  };

  // Thả tim bài viết
  const handleToggleLike = async (post) => {
    const likes = Array.isArray(post.likes) ? post.likes : [];
    const hasLiked = likes.includes(currentUser.id);
    try {
      await updateDoc(doc(db, "posts", post.id), {
        likes: hasLiked ? arrayRemove(currentUser.id) : arrayUnion(currentUser.id),
      });
    } catch (err) {
      console.error("Lỗi thả tim:", err);
    }
  };

  // Viết bình luận lên bài viết
  const handleAddComment = async (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const newComment = {
      id: "c_" + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text,
      time: timeStr,
    };

    try {
      await updateDoc(doc(db, "posts", postId), {
        comments: arrayUnion(newComment),
      });
      setCommentInputs({ ...commentInputs, [postId]: "" });
    } catch (err) {
      console.error("Lỗi gửi bình luận:", err);
    }
  };

  // Chọn ảnh đại diện từ máy khi sửa trang cá nhân
  const handleEditAvatarFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = compressImage ? await compressImage(file, 300) : "";
    if (compressed) setEditAvatar(compressed);
  };

  // Lưu chỉnh sửa trang cá nhân
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const updatedFields = {
      name: editName.trim() || currentUser.name,
      bio: editBio.trim(),
      location: editLocation.trim(),
      hobbies: editHobbies.trim(),
      avatar: editAvatar || currentUser.avatar,
    };
    await onUpdateProfile(updatedFields);
    setIsEditingProfile(false);
  };

  // Gửi tin nhắn làm quen thật qua Firestore
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !chatPartner) return;

    const roomId = getChatRoomId(currentUser.id, chatPartner.id);
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    const cleanMsg = chatInput.trim();
    setChatInput("");

    try {
      await addDoc(collection(db, "chats", roomId, "messages"), {
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: cleanMsg,
        time: timeStr,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
    }
  };

  // Lọc bài viết (Trang cá nhân chỉ hiện bài của mình, Bảng tin hiện bài của tất cả mọi người)
  const displayedPosts =
    activeTab === "profile"
      ? posts.filter((p) => p.authorId === currentUser.id)
      : posts;

  return (
    <div className="fb-page-container">
      {/* THANH NAVBAR TRÊN CÙNG */}
      <header className="fb-navbar">
        <div className="nav-brand" onClick={() => setActiveTab("feed")}>
          💜 LoveMatch
        </div>

        <div className="nav-center-tabs">
          <button
            className={`nav-tab-btn ${activeTab === "feed" ? "active" : ""}`}
            onClick={() => setActiveTab("feed")}
          >
            🏠 Bảng tin
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "friends" ? "active" : ""}`}
            onClick={() => setActiveTab("friends")}
          >
            👥 Bạn bè ({myFriends.length})
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Trang cá nhân
          </button>
        </div>

        <div className="nav-user-actions">
          <div className="nav-profile" onClick={() => setActiveTab("profile")}>
            <img src={currentUser.avatar} alt="avatar" className="fb-avatar-sm" />
            <span>{currentUser.name}</span>
          </div>
          <button onClick={onLogout} className="btn-logout">
            Đăng xuất
          </button>
        </div>
      </header>

      {/* BỐ CỤC 3 CỘT GIỐNG FACEBOOK */}
      <div className="fb-layout">
        {/* CỘT TRÁI */}
        <aside className="fb-sidebar-left">
          <div
            className={`fb-menu-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <img src={currentUser.avatar} alt="avatar" className="fb-avatar-sm" />
            <span>{currentUser.name}</span>
          </div>
          <div
            className={`fb-menu-item ${activeTab === "feed" ? "active" : ""}`}
            onClick={() => setActiveTab("feed")}
          >
            💜 Bảng tin hẹn hò
          </div>
          <div
            className={`fb-menu-item ${activeTab === "friends" ? "active" : ""}`}
            onClick={() => setActiveTab("friends")}
          >
            👥 Quản lý bạn bè ({myFriends.length})
          </div>
          {otherUsers.length > 0 && (
            <div
              className="fb-menu-item"
              onClick={() => setChatPartner(myFriends[0] || otherUsers[0])}
            >
              💌 Tin nhắn làm quen
            </div>
          )}
          <div className="fb-menu-item logout-menu" onClick={onLogout}>
            🚪 Đăng xuất
          </div>
        </aside>

        {/* CỘT GIỮA */}
        <main className="fb-feed">
          {/* TAB TRANG CÁ NHÂN & SỬA HỒ SƠ */}
          {activeTab === "profile" && (
            <div className="fb-card profile-header-card">
              <div className="profile-cover"></div>
              <div className="profile-info-top">
                <img src={currentUser.avatar} alt="avatar" className="profile-big-avatar" />
                <div className="profile-main-text">
                  <h2>{currentUser.name}</h2>
                  <p className="profile-bio">{currentUser.bio}</p>
                  <div className="profile-tags">
                    <span>📍 {currentUser.location || "Việt Nam"}</span>
                    <span>✨ {currentUser.hobbies || "Kết bạn & Hẹn hò"}</span>
                    <span>💜 {myFriends.length} bạn bè</span>
                  </div>
                </div>
                <button
                  className="fb-btn-primary"
                  onClick={() => {
                    setEditName(currentUser.name || "");
                    setEditBio(currentUser.bio || "");
                    setEditLocation(currentUser.location || "");
                    setEditHobbies(currentUser.hobbies || "");
                    setEditAvatar(currentUser.avatar || "");
                    setIsEditingProfile(!isEditingProfile);
                  }}
                >
                  ✏️ {isEditingProfile ? "Đóng chỉnh sửa" : "Sửa trang cá nhân"}
                </button>
              </div>

              {isEditingProfile && (
                <form onSubmit={handleSaveProfile} className="edit-profile-form">
                  <h4>Chỉnh sửa thông tin cá nhân</h4>
                  <div className="edit-avatar-row">
                    <img src={editAvatar} alt="preview" className="fb-avatar-md" />
                    <label className="upload-photo-btn">
                      📷 Chọn ảnh đại diện mới từ máy
                      <input type="file" accept="image/*" onChange={handleEditAvatarFile} hidden />
                    </label>
                  </div>
                  <label>Tên hiển thị:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <label>Tiểu sử hẹn hò (Bio):</label>
                  <input
                    type="text"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                  />
                  <label>Khu vực / Thành phố:</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                  />
                  <label>Sở thích:</label>
                  <input
                    type="text"
                    value={editHobbies}
                    onChange={(e) => setEditHobbies(e.target.value)}
                  />
                  <div className="edit-form-actions">
                    <button type="submit" className="fb-btn-primary">
                      💾 Lưu thay đổi
                    </button>
                    <button
                      type="button"
                      className="fb-btn-secondary"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB QUẢN LÝ BẠN BÈ (THÊM BẠN & XÓA BẠN) */}
          {activeTab === "friends" && (
            <>
              <div className="fb-card">
                <h3 className="section-heading">💜 Bạn bè của bạn ({myFriends.length})</h3>
                {myFriends.length === 0 ? (
                  <p className="empty-text">
                    Bạn chưa có bạn bè nào. Hãy kết bạn ở danh sách bên dưới nhé!
                  </p>
                ) : (
                  <div className="friends-grid">
                    {myFriends.map((friend) => (
                      <div key={friend.id} className="friend-card-box">
                        <img src={friend.avatar} alt={friend.name} className="fb-avatar-md" />
                        <div className="friend-card-info">
                          <strong>{friend.name}</strong>
                          <span>{friend.location || "Việt Nam"}</span>
                          <div className="friend-card-actions">
                            <button
                              className="fb-btn-primary btn-sm"
                              onClick={() => setChatPartner(friend)}
                            >
                              💌 Nhắn tin
                            </button>
                            <button
                              className="btn-danger-soft btn-sm"
                              onClick={() => handleRemoveFriend(friend.id)}
                            >
                              🗑️ Xóa bạn
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="fb-card">
                <h3 className="section-heading">✨ Mọi người trên LoveMatch</h3>
                {suggestedUsers.length === 0 ? (
                  <p className="empty-text">Chưa có thêm thành viên mới.</p>
                ) : (
                  <div className="friends-grid">
                    {suggestedUsers.map((person) => (
                      <div key={person.id} className="friend-card-box">
                        <img src={person.avatar} alt={person.name} className="fb-avatar-md" />
                        <div className="friend-card-info">
                          <strong>{person.name}</strong>
                          <span>{person.bio || person.location}</span>
                          <div className="friend-card-actions">
                            <button
                              className="fb-btn-primary btn-sm"
                              onClick={() => handleAddFriend(person.id)}
                            >
                              ➕ Thêm bạn bè
                            </button>
                            <button
                              className="fb-btn-secondary btn-sm"
                              onClick={() => setChatPartner(person)}
                            >
                              💌 Làm quen
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* KHUNG ĐĂNG BÀI KÈM CHỌN ẢNH TRỰC TIẾP TỪ MÁY */}
          {(activeTab === "feed" || activeTab === "profile") && (
            <div className="fb-card create-post-box">
              <div className="create-post-top">
                <img src={currentUser.avatar} alt="avatar" className="fb-avatar-md" />
                <input
                  type="text"
                  placeholder={`${currentUser.name} ơi, bạn đang nghĩ gì thế?`}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                />
              </div>

              {selectedImage && (
                <div className="image-preview-wrapper">
                  <img src={selectedImage} alt="preview" className="image-preview" />
                  <button
                    type="button"
                    className="remove-img-btn"
                    onClick={() => {
                      setSelectedImage("");
                      if (postFileInputRef.current) postFileInputRef.current.value = "";
                    }}
                  >
                    ✕ Xóa ảnh
                  </button>
                </div>
              )}

              <div className="create-post-bottom">
                <label className="upload-photo-btn">
                  🖼️ Chọn ảnh từ trong máy
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
          )}

          {/* BẢNG TIN BÀI VIẾT CỦA MỌI NGƯỜI */}
          {(activeTab === "feed" || activeTab === "profile") &&
            (displayedPosts.length === 0 ? (
              <div className="fb-card" style={{ textAlign: "center", color: "#7c6b99" }}>
                Chưa có bài viết nào. Hãy là người đầu tiên đăng bài nhé 💜
              </div>
            ) : (
              displayedPosts.map((post) => {
                const likesList = Array.isArray(post.likes) ? post.likes : [];
                const commentsList = Array.isArray(post.comments) ? post.comments : [];
                const isLiked = likesList.includes(currentUser.id);
                const isMyPost = post.authorId === currentUser.id;
                const isFriend = friendIds.includes(post.authorId);

                return (
                  <article key={post.id} className="fb-card post-card">
                    <div className="post-header-row">
                      <div className="post-header">
                        <img src={post.authorAvatar} alt="author" className="fb-avatar-md" />
                        <div>
                          <h4 className="post-author">{post.authorName}</h4>
                          <span className="post-time">{post.createdAt} · 🌎 Công khai</span>
                        </div>
                      </div>

                      {!isMyPost && (
                        <div className="post-author-actions">
                          {isFriend ? (
                            <button
                              className="btn-danger-soft btn-sm"
                              onClick={() => handleRemoveFriend(post.authorId)}
                            >
                              ✓ Bạn bè (Xóa)
                            </button>
                          ) : (
                            <button
                              className="fb-btn-secondary btn-sm"
                              onClick={() => handleAddFriend(post.authorId)}
                            >
                              ➕ Thêm bạn
                            </button>
                          )}
                          <button
                            className="fb-btn-primary btn-sm"
                            onClick={() =>
                              setChatPartner({
                                id: post.authorId,
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

                    {post.content && <p className="post-content">{post.content}</p>}
                    {post.image && <img src={post.image} alt="post" className="post-image" />}

                    <div className="post-stats">
                      <span>💜 {likesList.length} lượt thích</span>
                      <span>{commentsList.length} bình luận</span>
                    </div>

                    <div className="post-actions">
                      <button
                        className={isLiked ? "liked" : ""}
                        onClick={() => handleToggleLike(post)}
                      >
                        {isLiked ? "💜 Đã thả tim" : "🤍 Thả tim"}
                      </button>
                      <button>💬 Bình luận</button>
                      {!isMyPost && (
                        <button
                          onClick={() =>
                            setChatPartner({
                              id: post.authorId,
                              name: post.authorName,
                              avatar: post.authorAvatar,
                            })
                          }
                        >
                          💌 Làm quen
                        </button>
                      )}
                    </div>

                    {/* KHU VỰC VIẾT BÌNH LUẬN */}
                    <div className="post-comments">
                      {commentsList.map((c) => (
                        <div key={c.id} className="comment-row">
                          <img src={c.userAvatar} alt="avatar" className="comment-avatar" />
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
                        <img src={currentUser.avatar} alt="me" className="comment-avatar" />
                        <input
                          type="text"
                          placeholder={`Viết bình luận dưới tên ${currentUser.name}...`}
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                          }
                          onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                        />
                        <button onClick={() => handleAddComment(post.id)}>Gửi</button>
                      </div>
                    </div>
                  </article>
                );
              })
            ))}
        </main>

        {/* CỘT PHẢI: GỢI Ý KẾT BẠN & DANH SÁCH BẠN BÈ */}
        <aside className="fb-sidebar-right">
          <div className="fb-card">
            <h4 className="sidebar-title">✨ Gợi ý làm quen & Thêm bạn</h4>
            {suggestedUsers.length === 0 ? (
              <p className="empty-text">Chưa có gợi ý mới.</p>
            ) : (
              suggestedUsers.map((person) => (
                <div key={person.id} className="friend-request-item">
                  <img src={person.avatar} alt={person.name} className="fb-avatar-md" />
                  <div className="friend-info">
                    <strong>{person.name}</strong>
                    <span>{person.location || "Việt Nam"}</span>
                    <div className="friend-btns">
                      <button
                        className="fb-btn-primary btn-sm"
                        onClick={() => handleAddFriend(person.id)}
                      >
                        ➕ Thêm bạn
                      </button>
                      <button
                        className="fb-btn-secondary btn-sm"
                        onClick={() => setChatPartner(person)}
                      >
                        💌 Nhắn tin
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="fb-card">
            <h4 className="sidebar-title">💜 Bạn bè ({myFriends.length})</h4>
            {myFriends.length === 0 ? (
              <p className="empty-text">Chưa có bạn bè.</p>
            ) : (
              myFriends.map((friend) => (
                <div key={friend.id} className="friend-mini-row">
                  <div className="friend-mini-left" onClick={() => setChatPartner(friend)}>
                    <img src={friend.avatar} alt={friend.name} className="fb-avatar-sm" />
                    <span>{friend.name}</span>
                  </div>
                  <div className="friend-mini-btns">
                    <button
                      className="icon-btn-chat"
                      title="Nhắn tin làm quen"
                      onClick={() => setChatPartner(friend)}
                    >
                      💬
                    </button>
                    <button
                      className="icon-btn-remove"
                      title="Xóa bạn bè"
                      onClick={() => handleRemoveFriend(friend.id)}
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

      {/* HỘP THOẠI NHẮN TIN LÀM QUEN REAL-TIME */}
      {chatPartner && (
        <div className="chat-popup-box">
          <div className="chat-popup-header">
            <div className="chat-partner-info">
              <img src={chatPartner.avatar} alt={chatPartner.name} className="fb-avatar-sm" />
              <div>
                <strong>{chatPartner.name}</strong>
                <span>● Trực tuyến</span>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setChatPartner(null)}>
              ✕
            </button>
          </div>

          <div className="chat-popup-messages">
            {chatMessages.length === 0 ? (
              <div className="chat-empty-hint">
                Gửi lời chào làm quen tới <strong>{chatPartner.name}</strong> 💜
              </div>
            ) : (
              chatMessages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-bubble-row ${
                    m.senderId === currentUser.id ? "mine" : "theirs"
                  }`}
                >
                  <div className="chat-bubble">
                    <p>{m.text}</p>
                    <span>{m.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chat-popup-input">
            <input
              type="text"
              placeholder="Nhập tin nhắn làm quen..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit">Gửi</button>
          </form>
        </div>
      )}
    </div>
  );
}
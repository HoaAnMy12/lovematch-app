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

// Chuyển email thành ID tài liệu an toàn trên Firestore
const emailToDocId = (email) =>
  (email || "guest").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

// Nén ảnh chọn từ máy để lưu mượt lên Firestore (< 1MB)
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

  // Danh sách bài viết công khai trên Firebase (mọi người đều xem được bài của nhau)
  const [posts, setPosts] = useState([]);
  // Danh sách người dùng thật đã đăng ký/đăng nhập trên Firebase
  const [firebaseUsers, setFirebaseUsers] = useState([]);

  // Trạng thái đăng bài
  const [newContent, setNewContent] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [posting, setPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});
  const postFileInputRef = useRef(null);

  // 1. Đồng bộ thông tin người dùng hiện tại lên Firestore để người khác tìm thấy & kết bạn
  useEffect(() => {
    if (!user.email) return;
    const myDocId = emailToDocId(user.email);
    setDoc(
      doc(db, "users", myDocId),
      {
        id: myDocId,
        name: user.name,
        email: user.email.trim().toLowerCase(),
        avatar: user.avatar || DEFAULT_AVATAR,
        age: user.age || 21,
        location: user.location || "Việt Nam",
        bio: user.description || "Rất vui được làm quen với mọi người 💜",
        lastActive: serverTimestamp(),
      },
      { merge: true }
    ).catch((err) => console.error("Lỗi đồng bộ user:", err));
  }, [user.email, user.name, user.avatar, user.age, user.location, user.description]);

  // 2. Lắng nghe danh sách thành viên thật trên Firestore
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const list = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (u) =>
            u.email &&
            user.email &&
            u.email.toLowerCase() !== user.email.toLowerCase()
        );
      setFirebaseUsers(list);
    });
    return () => unsubUsers();
  }, [user.email]);

  // 3. Lắng nghe bảng tin bài viết của TẤT CẢ mọi người theo thời gian thực
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubPosts = onSnapshot(
      q,
      (snapshot) => {
        const livePosts = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setPosts(livePosts);
      },
      (err) => {
        console.error("Lỗi tải bảng tin Firebase:", err);
      }
    );
    return () => unsubPosts();
  }, []);

  // Gộp danh sách gợi ý kết bạn (ưu tiên thành viên thật trên Firebase + hồ sơ gợi ý)
  const suggestedPeople = React.useMemo(() => {
    const map = new Map();
    [...firebaseUsers, ...discoverProfiles].forEach((p) => {
      const key = (p.email || String(p.id)).toLowerCase();
      if (
        key !== (user.email || "").toLowerCase() &&
        !isFriend(p.id) &&
        !isFriend(p.email)
      ) {
        map.set(key, p);
      }
    });
    return Array.from(map.values());
  }, [firebaseUsers, discoverProfiles, user.email, isFriend]);

  // Chọn ảnh từ trong máy để đăng bài
  const handleSelectPostImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file, 720);
    setSelectedImage(compressed);
  };

  // Đăng bài viết lên bảng tin chung (mọi người đều xem được)
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
        authorEmail: (user.email || "").trim().toLowerCase(),
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
      alert("Đăng bài thất bại! Bạn hãy thử chọn ảnh nhẹ hơn nhé.");
    } finally {
      setPosting(false);
    }
  };

  // Thả tim / Bỏ thích bài viết của mình hoặc người khác
  const handleToggleLike = async (post) => {
    const userKey = (user.email || user.name).toLowerCase();
    const likes = Array.isArray(post.likes) ? post.likes : [];
    const hasLiked = likes.includes(userKey);

    try {
      await updateDoc(doc(db, "posts", post.id), {
        likes: hasLiked ? arrayRemove(userKey) : arrayUnion(userKey),
      });
    } catch (err) {
      console.error("Lỗi thả tim bài viết:", err);
    }
  };

  // Viết bình luận vào bài viết của mình hoặc người khác
  const handleAddComment = async (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const newComment = {
      id: "c_" + Date.now(),
      userEmail: (user.email || "").toLowerCase(),
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
      console.error("Lỗi gửi bình luận:", err);
    }
  };

  // Kết bạn với tác giả bài viết hoặc thành viên khác
  const handleAddFriendPerson = (person) => {
    const friendObj = {
      id: person.email || person.id,
      email: person.email || `${person.id}@lovematch.vn`,
      name: person.name,
      avatar: person.avatar || person.image || DEFAULT_AVATAR,
      age: person.age || 21,
      location: person.location || "Việt Nam",
      isOnline: true,
    };
    addFriend(friendObj);
  };

  // Xóa bạn bè
  const handleRemoveFriendPerson = (personIdOrEmail) => {
    removeFriend(personIdOrEmail);
  };

  // Nhắn tin trực tiếp với một người (tự động thêm vào danh bạ chat và chuyển sang /chat)
  const handleOpenChatWith = (person) => {
    const targetEmail = person.email || `${person.id}@lovematch.vn`;
    const friendObj = {
      id: targetEmail,
      email: targetEmail,
      name: person.name,
      avatar: person.avatar || person.image || DEFAULT_AVATAR,
      age: person.age || 21,
      location: person.location || "Việt Nam",
      isOnline: true,
    };
    if (!isFriend(friendObj.id) && !isFriend(targetEmail)) {
      addFriend(friendObj);
    }
    navigate(`/chat/${encodeURIComponent(targetEmail)}`);
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <div className="fb-page-container">
      {/* THANH NAVBAR TRÊN CÙNG */}
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
        {/* CỘT TRÁI: MENU */}
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

        {/* CỘT GIỮA: KHUNG ĐĂNG BÀI & BẢNG TIN MỌI NGƯỜI */}
        <main className="fb-feed">
          {/* Khung đăng bài mới */}
          <div className="fb-card create-post-box">
            <div className="create-post-top">
              <img
                src={user.avatar || DEFAULT_AVATAR}
                alt="avatar"
                className="fb-avatar-md"
              />
              <input
                type="text"
                placeholder={`${user.name} ơi, hôm nay bạn muốn chia sẻ điều gì với mọi người?`}
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

          {/* Danh sách bài viết công khai của tất cả người dùng */}
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
              const userKey = (user.email || user.name).toLowerCase();
              const likesList = Array.isArray(post.likes) ? post.likes : [];
              const commentsList = Array.isArray(post.comments)
                ? post.comments
                : [];
              const isLiked = likesList.includes(userKey);

              const authorEmail = (post.authorEmail || "").toLowerCase();
              const isMyPost =
                authorEmail &&
                user.email &&
                authorEmail === user.email.toLowerCase();

              const authorKey = authorEmail || post.id;
              const alreadyFriend =
                isFriend(authorKey) || isFriend(post.authorEmail);

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

                    {/* Nút Kết bạn / Xóa bạn & Nhắn tin ngay trên bài viết của người khác */}
                    {!isMyPost && (
                      <div className="post-author-actions">
                        {alreadyFriend ? (
                          <button
                            className="btn-danger-soft btn-sm"
                            onClick={() => handleRemoveFriendPerson(authorKey)}
                          >
                            ✓ Bạn bè (Xóa)
                          </button>
                        ) : (
                          <button
                            className="fb-btn-secondary btn-sm"
                            onClick={() =>
                              handleAddFriendPerson({
                                id: authorKey,
                                email: post.authorEmail,
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
                              id: authorKey,
                              email: post.authorEmail,
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

                  {/* Thống kê lượt thích & bình luận */}
                  <div className="post-stats">
                    <span>💜 {likesList.length} lượt thích</span>
                    <span>{commentsList.length} bình luận</span>
                  </div>

                  {/* Thanh tương tác: Thích, Bình luận, Nhắn tin */}
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
                            id: authorKey,
                            email: post.authorEmail,
                            name: post.authorName,
                            avatar: post.authorAvatar,
                          })
                        }
                      >
                        💌 Nhắn tin
                      </button>
                    )}
                  </div>

                  {/* Danh sách bình luận & ô nhập bình luận */}
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

        {/* CỘT PHẢI: GỢI Ý KẾT BẠN & DANH SÁCH BẠN BÈ */}
        <aside className="fb-sidebar-right">
          <div className="fb-card">
            <h4 className="sidebar-title">✨ Gợi ý kết bạn</h4>
            {suggestedPeople.length === 0 ? (
              <p className="empty-text">Đã kết bạn với tất cả gợi ý.</p>
            ) : (
              suggestedPeople.slice(0, 4).map((person) => (
                <div
                  key={person.email || person.id}
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
                      <button
                        className="fb-btn-primary btn-sm"
                        onClick={() => handleAddFriendPerson(person)}
                      >
                        ➕ Kết bạn
                      </button>
                      <button
                        className="fb-btn-secondary btn-sm"
                        onClick={() => handleOpenChatWith(person)}
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
            <h4 className="sidebar-title">💜 Bạn bè ({friends.length})</h4>
            {friends.length === 0 ? (
              <p className="empty-text">
                Chưa có bạn bè. Hãy bấm Kết bạn để bắt đầu nhé!
              </p>
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
                        handleRemoveFriendPerson(friend.email || friend.id)
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
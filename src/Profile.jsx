import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR } from "./AppContext";
import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";

function Profile() {
  const navigate = useNavigate();
  const { currentUser, matches, friends, logoutUser } = useApp();

  const myEmail = (currentUser?.email || "").trim().toLowerCase();
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});

  // Lắng nghe toàn bộ bài viết từ Firebase và lọc riêng bài đăng của cá nhân mình
  useEffect(() => {
    if (!myEmail) {
      setMyPosts([]);
      setLoadingPosts(false);
      return;
    }

    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const personalPosts = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(
            (post) =>
              (post.authorEmail || "").trim().toLowerCase() === myEmail
          );
        setMyPosts(personalPosts);
        setLoadingPosts(false);
      },
      (err) => {
        console.error("Lỗi tải bài viết cá nhân:", err);
        setLoadingPosts(false);
      }
    );

    return () => unsub();
  }, [myEmail]);

  // Thả tim / Bỏ thích bài viết
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

  // Gửi bình luận trên bài viết của mình
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
      userName: currentUser.name,
      userAvatar: currentUser.avatar || DEFAULT_AVATAR,
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

  // Xóa bài viết cá nhân
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Bạn có chắc muốn xóa bài viết này không?")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (err) {
      console.error("Lỗi xóa bài viết:", err);
    }
  };

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
        {/* THẺ THÔNG TIN CÁ NHÂN */}
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
                <div style={styles.statNum}>{myPosts.length}</div>
                <div style={styles.statLabel}>Bài viết</div>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statBox}>
                <div style={styles.statNum}>{friends?.length || 0}</div>
                <div style={styles.statLabel}>Bạn bè</div>
              </div>
              <div style={styles.statDivider} />
              <div style={styles.statBox}>
                <div style={styles.statNum}>{matches?.length || 0}</div>
                <div style={styles.statLabel}>Tương hợp</div>
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

        {/* DANH SÁCH BÀI ĐĂNG CỦA CÁ NHÂN */}
        <div style={styles.postsWrapper}>
          <div style={styles.postsSectionHeader}>
            <h3 style={styles.postsSectionTitle}>
              📝 Bài viết của tôi ({myPosts.length})
            </h3>
            <button
              style={styles.newPostBtn}
              onClick={() => navigate("/home")}
            >
              ➕ Đăng bài mới
            </button>
          </div>

          {loadingPosts ? (
            <div style={styles.emptyPostsCard}>Đang tải bài viết...</div>
          ) : myPosts.length === 0 ? (
            <div style={styles.emptyPostsCard}>
              <div style={{ fontSize: "38px", marginBottom: "8px" }}>📝</div>
              <p style={{ margin: "0 0 12px", color: "#7c6b99" }}>
                Bạn chưa có bài viết nào. Hãy chia sẻ khoảnh khắc đầu tiên trên
                Bảng tin nhé!
              </p>
              <button
                style={styles.newPostBtn}
                onClick={() => navigate("/home")}
              >
                Đi tới Bảng tin để đăng bài 💜
              </button>
            </div>
          ) : (
            myPosts.map((post) => {
              const likesList = Array.isArray(post.likes) ? post.likes : [];
              const commentsList = Array.isArray(post.comments)
                ? post.comments
                : [];
              const isLiked = likesList.includes(myEmail);

              return (
                <article key={post.id} style={styles.postCard}>
                  <div style={styles.postHeaderRow}>
                    <div style={styles.postAuthorGroup}>
                      <img
                        src={
                          currentUser.avatar ||
                          post.authorAvatar ||
                          DEFAULT_AVATAR
                        }
                        alt={currentUser.name}
                        style={styles.postAvatar}
                      />
                      <div>
                        <h4 style={styles.postAuthorName}>
                          {currentUser.name}
                        </h4>
                        <span style={styles.postTime}>
                          {post.createdAt} · 🌎 Công khai
                        </span>
                      </div>
                    </div>

                    <button
                      style={styles.deletePostBtn}
                      onClick={() => handleDeletePost(post.id)}
                      title="Xóa bài viết"
                    >
                      🗑️ Xóa
                    </button>
                  </div>

                  {post.content && (
                    <p style={styles.postContent}>{post.content}</p>
                  )}
                  {post.image && (
                    <img
                      src={post.image}
                      alt="post"
                      style={styles.postImage}
                    />
                  )}

                  <div style={styles.postStats}>
                    <span>💜 {likesList.length} lượt thích</span>
                    <span>{commentsList.length} bình luận</span>
                  </div>

                  <div style={styles.postActions}>
                    <button
                      style={{
                        ...styles.actionBtn,
                        ...(isLiked ? styles.actionBtnLiked : {}),
                      }}
                      onClick={() => handleToggleLike(post)}
                    >
                      {isLiked ? "💜 Đã thích" : "🤍 Thích"}
                    </button>
                    <button
                      style={styles.actionBtn}
                      onClick={() => {
                        const el = document.getElementById(
                          `profile-cmt-${post.id}`
                        );
                        if (el) el.focus();
                      }}
                    >
                      💬 Bình luận
                    </button>
                  </div>

                  {/* KHU VỰC BÌNH LUẬN */}
                  <div style={styles.commentsSection}>
                    {commentsList.map((c) => (
                      <div key={c.id} style={styles.commentRow}>
                        <img
                          src={c.userAvatar || DEFAULT_AVATAR}
                          alt={c.userName}
                          style={styles.commentAvatar}
                        />
                        <div style={styles.commentBubble}>
                          <div style={styles.commentHeader}>
                            <strong style={{ color: "#6b35d6" }}>
                              {c.userName}
                            </strong>
                            <span
                              style={{ fontSize: "11px", color: "#7c6b99" }}
                            >
                              {c.time}
                            </span>
                          </div>
                          <span>{c.text}</span>
                        </div>
                      </div>
                    ))}

                    <div style={styles.commentInputRow}>
                      <img
                        src={currentUser.avatar || DEFAULT_AVATAR}
                        alt="me"
                        style={styles.commentAvatar}
                      />
                      <input
                        id={`profile-cmt-${post.id}`}
                        type="text"
                        placeholder="Viết bình luận..."
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
                        style={styles.commentInput}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        style={styles.commentSendBtn}
                      >
                        Gửi
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
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
    paddingBottom: "40px",
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
    position: "sticky",
    top: 0,
    zIndex: 100,
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
    maxWidth: "600px",
    margin: "28px auto",
    padding: "0 16px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "28px",
    overflow: "hidden",
    textAlign: "center",
    boxShadow: "0 12px 35px rgba(157, 101, 255, 0.14)",
    border: "1px solid #e6d9ff",
    marginBottom: "24px",
  },
  coverBanner: {
    height: "120px",
    background:
      "linear-gradient(135deg, #a770ef 0%, #cf8bf3 55%, #e5b2ff 100%)",
  },
  cardBody: {
    padding: "0 26px 28px",
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
    marginTop: "6px",
    boxShadow: "0 6px 18px rgba(157, 101, 255, 0.28)",
  },

  /* BÀI VIẾT CÁ NHÂN */
  postsWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  postsSectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: "14px 20px",
    borderRadius: "20px",
    border: "1px solid #e6d9ff",
    boxShadow: "0 6px 18px rgba(157, 101, 255, 0.08)",
  },
  postsSectionTitle: {
    margin: 0,
    fontSize: "17px",
    color: "#2d1f47",
    fontWeight: "bold",
  },
  newPostBtn: {
    border: "none",
    background: "linear-gradient(135deg, #a770ef, #cf8bf3)",
    color: "#ffffff",
    padding: "8px 16px",
    borderRadius: "16px",
    fontWeight: "bold",
    fontSize: "13px",
    cursor: "pointer",
  },
  emptyPostsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "22px",
    padding: "32px 20px",
    textAlign: "center",
    border: "1px solid #e6d9ff",
    color: "#7c6b99",
  },
  postCard: {
    backgroundColor: "#ffffff",
    borderRadius: "22px",
    padding: "18px 20px",
    border: "1px solid #e6d9ff",
    boxShadow: "0 8px 24px rgba(157, 101, 255, 0.09)",
    textAlign: "left",
  },
  postHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  postAuthorGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  postAvatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #c39eff",
  },
  postAuthorName: {
    margin: 0,
    fontSize: "15.5px",
    color: "#2d1f47",
  },
  postTime: {
    fontSize: "12px",
    color: "#7c6b99",
  },
  deletePostBtn: {
    border: "1px solid #ffd1e0",
    backgroundColor: "#fff0f5",
    color: "#e03e70",
    padding: "6px 12px",
    borderRadius: "14px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  postContent: {
    margin: "0 0 12px",
    fontSize: "15px",
    lineHeight: "1.55",
    color: "#2d1f47",
  },
  postImage: {
    width: "100%",
    maxHeight: "420px",
    objectFit: "cover",
    borderRadius: "16px",
    marginBottom: "12px",
    border: "1px solid #f0e6ff",
  },
  postStats: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    color: "#7c6b99",
    paddingBottom: "10px",
    borderBottom: "1px solid #e6d9ff",
  },
  postActions: {
    display: "flex",
    justifyContent: "space-around",
    padding: "6px 0",
    borderBottom: "1px solid #e6d9ff",
  },
  actionBtn: {
    flex: 1,
    border: "none",
    background: "transparent",
    color: "#7c6b99",
    fontWeight: "700",
    fontSize: "14px",
    padding: "8px",
    borderRadius: "12px",
    cursor: "pointer",
  },
  actionBtnLiked: {
    color: "#7b3fe4",
    backgroundColor: "#f2ebff",
  },
  commentsSection: {
    marginTop: "12px",
  },
  commentRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    marginBottom: "8px",
  },
  commentAvatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1.5px solid #d4baff",
  },
  commentBubble: {
    flex: 1,
    backgroundColor: "#f2ebff",
    padding: "8px 14px",
    borderRadius: "14px",
    fontSize: "13.5px",
    color: "#2d1f47",
  },
  commentHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "2px",
  },
  commentInputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "10px",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#faf7ff",
    border: "1px solid #e6d9ff",
    borderRadius: "20px",
    padding: "8px 14px",
    fontSize: "13.5px",
    outline: "none",
  },
  commentSendBtn: {
    border: "none",
    background: "linear-gradient(135deg, #a770ef, #cf8bf3)",
    color: "#ffffff",
    borderRadius: "20px",
    padding: "8px 16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default Profile;
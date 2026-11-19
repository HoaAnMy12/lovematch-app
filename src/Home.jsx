import React, { useState, useEffect } from "react";
import "./Home.css";

// NẾU BẠN ĐÃ CẤU HÌNH FIREBASE, BỎ DẤU // Ở 2 DÒNG DƯỚI ĐỂ ĐỒNG BỘ BÀI VIẾT GIỮA NHIỀU MÁY:
// import { db } from "./firebase";
// import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";

export default function Home({ currentUser }) {
  // Dữ liệu người dùng hiện tại (phòng trường hợp chưa đăng nhập hoặc bị undefined)
  const user = currentUser || {
    id: "user_1",
    name: "Hoaa Maii",
    avatar: "https://i.pravatar.cc/150?img=47",
  };

  // Danh sách bài viết trên bảng tin
  const [posts, setPosts] = useState([
    {
      id: "post_1",
      authorName: "Hoàng Thị Huyền",
      authorAvatar: "https://i.pravatar.cc/150?img=32",
      createdAt: "1 giờ trước",
      content: "Chiều nay hoàng hôn Đà Nẵng đẹp quá, có ai rảnh đi dạo biển Mỹ Khê không nhỉ? 🌅✨",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
      likes: ["user_2"],
      comments: [
        { id: "c1", userName: "Trần Thị Tâm", text: "Xinh quá bà ơi, cho tui đi ké với!" }
      ]
    }
  ]);

  const [newContent, setNewContent] = useState("");
  const [newImage, setNewImage] = useState("");
  const [commentInputs, setCommentInputs] = useState({});

  // Lắng nghe bài viết mới (Dùng localStorage làm mẫu nếu chưa nối Firebase)
  useEffect(() => {
    const savedPosts = localStorage.getItem("lovematch_feed_posts");
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPosts(parsed);
        }
      } catch (e) {
        console.error("Lỗi đọc dữ liệu bài viết:", e);
      }
    }

    /* --- NẾU DÙNG FIREBASE FIRESTORE THÌ MỞ ĐOẠN NÀY RA ---
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(list);
    });
    return () => unsubscribe();
    */
  }, []);

  // Xử lý đăng bài mới
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newContent.trim() && !newImage.trim()) return;

    const newPost = {
      id: "post_" + Date.now(),
      authorName: user.name || "Người dùng ẩn danh",
      authorAvatar: user.avatar || "https://i.pravatar.cc/150?img=12",
      createdAt: "Vừa xong",
      content: newContent,
      image: newImage,
      likes: [],
      comments: [],
      timestamp: Date.now()
    };

    const updatedPosts = [newPost, ...(posts || [])];
    setPosts(updatedPosts);
    localStorage.setItem("lovematch_feed_posts", JSON.stringify(updatedPosts));

    /* --- NẾU DÙNG FIREBASE FIRESTORE THÌ MỞ ĐOẠN NÀY RA ---
    await addDoc(collection(db, "posts"), newPost);
    */

    setNewContent("");
    setNewImage("");
  };

  // Xử lý Thả tim (Like) bài viết
  const handleToggleLike = (postId) => {
    const updatedPosts = (posts || []).map((post) => {
      if (post.id !== postId) return post;
      const currentLikes = Array.isArray(post.likes) ? post.likes : [];
      const hasLiked = currentLikes.includes(user.id);
      const nextLikes = hasLiked
        ? currentLikes.filter((id) => id !== user.id)
        : [...currentLikes, user.id];
      return { ...post, likes: nextLikes };
    });

    setPosts(updatedPosts);
    localStorage.setItem("lovematch_feed_posts", JSON.stringify(updatedPosts));
  };

  // Xử lý gửi bình luận
  const handleAddComment = (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    const updatedPosts = (posts || []).map((post) => {
      if (post.id !== postId) return post;
      const currentComments = Array.isArray(post.comments) ? post.comments : [];
      return {
        ...post,
        comments: [
          ...currentComments,
          { id: "c_" + Date.now(), userName: user.name, text }
        ]
      };
    });

    setPosts(updatedPosts);
    localStorage.setItem("lovematch_feed_posts", JSON.stringify(updatedPosts));
    setCommentInputs({ ...commentInputs, [postId]: "" });
  };

  return (
    <div className="fb-layout">
      {/* CỘT TRÁI: MENU ĐIỀU HƯỚNG GIỐNG FACEBOOK */}
      <aside className="fb-sidebar-left">
        <div className="fb-menu-item active">
          <img src={user.avatar} alt="avatar" className="fb-avatar-sm" />
          <span>{user.name}</span>
        </div>
        <div className="fb-menu-item">❤️ Ghép đôi ngẫu nhiên</div>
        <div className="fb-menu-item">👥 Bạn bè</div>
        <div className="fb-menu-item">💬 Tin nhắn</div>
        <div className="fb-menu-item">🔖 Bài viết đã lưu</div>
      </aside>

      {/* CỘT GIỮA: KHUNG ĐĂNG BÀI & BẢNG TIN CỦA MỌI NGƯỜI */}
      <main className="fb-feed">
        {/* Khung tạo bài viết */}
        <div className="fb-card create-post-box">
          <div className="create-post-top">
            <img src={user.avatar} alt="avatar" className="fb-avatar-md" />
            <input
              type="text"
              placeholder={`${user.name} ơi, bạn đang nghĩ gì thế?`}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </div>
          <div className="create-post-image-input">
            <input
              type="text"
              placeholder="Dán link hình ảnh (nếu muốn kèm ảnh)..."
              value={newImage}
              onChange={(e) => setNewImage(e.target.value)}
            />
          </div>
          <div className="create-post-bottom">
            <span>🖼️ Ảnh/Video</span>
            <span>😊 Cảm xúc/Hoạt động</span>
            <button onClick={handleCreatePost} className="fb-btn-primary">
              Đăng bài
            </button>
          </div>
        </div>

        {/* Danh sách bài viết từ người dùng */}
        {(posts || []).map((post) => {
          const likesList = Array.isArray(post.likes) ? post.likes : [];
          const commentsList = Array.isArray(post.comments) ? post.comments : [];
          const isLiked = likesList.includes(user.id);

          return (
            <article key={post.id} className="fb-card post-card">
              {/* Đầu bài viết */}
              <div className="post-header">
                <img
                  src={post.authorAvatar || "https://i.pravatar.cc/150?img=15"}
                  alt="author"
                  className="fb-avatar-md"
                />
                <div>
                  <h4 className="post-author">{post.authorName}</h4>
                  <span className="post-time">{post.createdAt} · 🌎</span>
                </div>
              </div>

              {/* Nội dung bài viết */}
              <p className="post-content">{post.content}</p>
              {post.image && (
                <img src={post.image} alt="post" className="post-image" />
              )}

              {/* Thống kê lượt thích & bình luận */}
              <div className="post-stats">
                <span>❤️ {likesList.length} lượt thích</span>
                <span>{commentsList.length} bình luận</span>
              </div>

              {/* Nút tương tác */}
              <div className="post-actions">
                <button
                  className={isLiked ? "liked" : ""}
                  onClick={() => handleToggleLike(post.id)}
                >
                  {isLiked ? "❤️ Đã thích" : "🤍 Thích"}
                </button>
                <button>💬 Bình luận</button>
                <button>💌 Nhắn tin làm quen</button>
              </div>

              {/* Khu vực bình luận */}
              <div className="post-comments">
                {commentsList.map((c) => (
                  <div key={c.id} className="comment-item">
                    <strong>{c.userName}: </strong>
                    <span>{c.text}</span>
                  </div>
                ))}
                <div className="comment-input-row">
                  <input
                    type="text"
                    placeholder="Viết bình luận..."
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
        })}
      </main>

      {/* CỘT PHẢI: LỜI MỜI KẾT BẠN / GỢI Ý HẸN HÒ */}
      <aside className="fb-sidebar-right">
        <div className="fb-card">
          <h4 className="sidebar-title">Gợi ý kết đôi & Kết bạn</h4>
          <div className="friend-request-item">
            <img src="https://i.pravatar.cc/150?img=11" alt="friend" className="fb-avatar-md" />
            <div className="friend-info">
              <strong>Điệp Nguyễnvăn</strong>
              <span>Cùng ở Đà Nẵng</span>
              <div className="friend-btns">
                <button className="fb-btn-primary">Xác nhận</button>
                <button className="fb-btn-secondary">Xóa</button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
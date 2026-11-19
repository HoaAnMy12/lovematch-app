import React, { useState, useEffect, useRef } from "react";
import "./Home.css";

export default function Home({ currentUser, onLogout }) {
  const user = currentUser || {
    id: "user_guest",
    name: "Hoaa Maii",
    avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Hoaa",
  };

  const [posts, setPosts] = useState([
    {
      id: "post_sample_1",
      authorName: "Hoàng Thị Huyền",
      authorAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Huyen",
      createdAt: "1 giờ trước",
      content: "Chiều nay hoàng hôn Đà Nẵng đẹp quá, có ai rảnh đi dạo biển Mỹ Khê không nhỉ? 🌅💜",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
      likes: ["user_2"],
      comments: [
        {
          id: "c1",
          userName: "Trần Thị Tâm",
          userAvatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Tam",
          text: "Xinh quá bà ơi, cho tui đi ké với!",
          time: "45 phút trước",
        },
      ],
    },
  ]);

  const [newContent, setNewContent] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [commentInputs, setCommentInputs] = useState({});
  const fileInputRef = useRef(null);

  // Tải danh sách bài viết đã lưu
  useEffect(() => {
    const savedPosts = localStorage.getItem("lovematch_feed_posts");
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPosts(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Chọn ảnh trực tiếp từ thiết bị để đăng bài
  const handleSelectImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Đăng bài viết mới
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newContent.trim() && !selectedImage) return;

    const newPost = {
      id: "post_" + Date.now(),
      authorName: user.name,
      authorAvatar: user.avatar,
      createdAt: "Vừa xong",
      content: newContent.trim(),
      image: selectedImage,
      likes: [],
      comments: [],
    };

    const updatedPosts = [newPost, ...(posts || [])];
    setPosts(updatedPosts);
    localStorage.setItem("lovematch_feed_posts", JSON.stringify(updatedPosts));

    setNewContent("");
    setSelectedImage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Thả tim bài viết
  const handleToggleLike = (postId) => {
    const updatedPosts = (posts || []).map((post) => {
      if (post.id !== postId) return post;
      const likes = Array.isArray(post.likes) ? post.likes : [];
      const hasLiked = likes.includes(user.id);
      return {
        ...post,
        likes: hasLiked ? likes.filter((id) => id !== user.id) : [...likes, user.id],
      };
    });
    setPosts(updatedPosts);
    localStorage.setItem("lovematch_feed_posts", JSON.stringify(updatedPosts));
  };

  // Gửi bình luận mới
  const handleAddComment = (postId) => {
    const text = (commentInputs[postId] || "").trim();
    if (!text) return;

    const updatedPosts = (posts || []).map((post) => {
      if (post.id !== postId) return post;
      const comments = Array.isArray(post.comments) ? post.comments : [];
      return {
        ...post,
        comments: [
          ...comments,
          {
            id: "c_" + Date.now(),
            userName: user.name,
            userAvatar: user.avatar,
            text,
            time: "Vừa xong",
          },
        ],
      };
    });

    setPosts(updatedPosts);
    localStorage.setItem("lovematch_feed_posts", JSON.stringify(updatedPosts));
    setCommentInputs({ ...commentInputs, [postId]: "" });
  };

  return (
    <div className="fb-page-container">
      {/* THANH TIÊU ĐỀ TRÊN CÙNG (HEADER + NÚT ĐĂNG XUẤT) */}
      <header className="fb-navbar">
        <div className="nav-brand">💜 LoveMatch</div>
        <div className="nav-user-actions">
          <div className="nav-profile">
            <img src={user.avatar} alt="avatar" className="fb-avatar-sm" />
            <span>{user.name}</span>
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
          <div className="fb-menu-item active">
            <img src={user.avatar} alt="avatar" className="fb-avatar-sm" />
            <span>{user.name}</span>
          </div>
          <div className="fb-menu-item">💜 Bảng tin hẹn hò</div>
          <div className="fb-menu-item">✨ Ghép đôi ngẫu nhiên</div>
          <div className="fb-menu-item">👥 Danh sách bạn bè</div>
          <div className="fb-menu-item">💌 Tin nhắn riêng</div>
          <div className="fb-menu-item logout-menu" onClick={onLogout}>
            🚪 Đăng xuất tài khoản
          </div>
        </aside>

        {/* CỘT GIỮA: ĐĂNG BÀI & XEM BÀI CỦA MỌI NGƯỜI */}
        <main className="fb-feed">
          {/* Khung tạo bài viết */}
          <div className="fb-card create-post-box">
            <div className="create-post-top">
              <img src={user.avatar} alt="avatar" className="fb-avatar-md" />
              <input
                type="text"
                placeholder={`${user.name} ơi, hôm nay bạn muốn chia sẻ điều gì?`}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
            </div>

            {/* Xem trước ảnh vừa chọn từ máy */}
            {selectedImage && (
              <div className="image-preview-wrapper">
                <img src={selectedImage} alt="preview" className="image-preview" />
                <button
                  type="button"
                  className="remove-img-btn"
                  onClick={() => {
                    setSelectedImage("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
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
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelectImage}
                  hidden
                />
              </label>
              <button onClick={handleCreatePost} className="fb-btn-primary">
                Đăng bài
              </button>
            </div>
          </div>

          {/* Danh sách bài viết */}
          {(posts || []).map((post) => {
            const likesList = Array.isArray(post.likes) ? post.likes : [];
            const commentsList = Array.isArray(post.comments) ? post.comments : [];
            const isLiked = likesList.includes(user.id);

            return (
              <article key={post.id} className="fb-card post-card">
                <div className="post-header">
                  <img
                    src={post.authorAvatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=User"}
                    alt="author"
                    className="fb-avatar-md"
                  />
                  <div>
                    <h4 className="post-author">{post.authorName}</h4>
                    <span className="post-time">{post.createdAt} · 🌎 Công khai</span>
                  </div>
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
                    onClick={() => handleToggleLike(post.id)}
                  >
                    {isLiked ? "💜 Đã thả tim" : "🤍 Thả tim"}
                  </button>
                  <button>💬 Bình luận</button>
                </div>

                {/* Khu vực viết và hiển thị bình luận */}
                <div className="post-comments">
                  {commentsList.map((c) => (
                    <div key={c.id} className="comment-row">
                      <img
                        src={c.userAvatar || "https://api.dicebear.com/7.x/adventurer/svg?seed=Comment"}
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
                    <img src={user.avatar} alt="me" className="comment-avatar" />
                    <input
                      type="text"
                      placeholder={`Bình luận dưới tên ${user.name}...`}
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

        {/* CỘT PHẢI */}
        <aside className="fb-sidebar-right">
          <div className="fb-card">
            <h4 className="sidebar-title">Gợi ý kết đôi hôm nay</h4>
            <div className="friend-request-item">
              <img
                src="https://api.dicebear.com/7.x/adventurer/svg?seed=Diep"
                alt="friend"
                className="fb-avatar-md"
              />
              <div className="friend-info">
                <strong>Điệp Nguyễnvăn</strong>
                <span>Đà Nẵng · Cách 2 km</span>
                <div className="friend-btns">
                  <button className="fb-btn-primary">Kết bạn</button>
                  <button className="fb-btn-secondary">Bỏ qua</button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import Home from "./Home";
import "./Home.css";

// Ảnh đại diện mặc định
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/adventurer/svg?seed=LoveMatch";

// Chuyển đổi email thành ID an toàn trên Firestore
const emailToDocId = (email) => email.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarData, setAvatarData] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Khôi phục phiên đăng nhập khi tải lại trang
  useEffect(() => {
    const saved = localStorage.getItem("lovematch_current_user");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("lovematch_current_user");
      }
    }
  }, []);

  // Nén ảnh chọn từ máy để lưu mượt lên Firestore (< 1MB)
  const compressImage = (file, maxWidth = 500) =>
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

  // Chọn ảnh đại diện trực tiếp từ máy khi đăng ký
  const handleAvatarFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file, 300);
    setAvatarData(compressed);
  };

  // Xử lý Đăng ký & Đăng nhập trên Firebase Firestore
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password.trim() || (isRegister && !name.trim())) {
      setErrorMsg("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    const userId = emailToDocId(cleanEmail);
    const userRef = doc(db, "users", userId);

    try {
      const snap = await getDoc(userRef);

      if (isRegister) {
        if (snap.exists()) {
          setErrorMsg("Email này đã có người đăng ký. Hãy chuyển sang Đăng nhập!");
          setLoading(false);
          return;
        }

        const newUser = {
          id: userId,
          name: name.trim(),
          email: cleanEmail,
          password: password,
          avatar:
            avatarData ||
            `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name.trim())}`,
          bio: "Rất vui được làm quen với mọi người trên LoveMatch 💜",
          location: "Đà Nẵng",
          hobbies: "Cà phê, Nghe nhạc, Du lịch",
          friends: [],
          createdAt: serverTimestamp(),
        };

        await setDoc(userRef, newUser);
        const userForSession = { ...newUser, createdAt: Date.now() };
        localStorage.setItem("lovematch_current_user", JSON.stringify(userForSession));
        setCurrentUser(userForSession);
      } else {
        if (!snap.exists()) {
          setErrorMsg("Tài khoản chưa tồn tại. Bạn hãy bấm Đăng ký miễn phí nhé!");
          setLoading(false);
          return;
        }
        const data = snap.data();
        if (data.password !== password) {
          setErrorMsg("Mật khẩu chưa chính xác!");
          setLoading(false);
          return;
        }
        const userForSession = { id: snap.id, ...data };
        localStorage.setItem("lovematch_current_user", JSON.stringify(userForSession));
        setCurrentUser(userForSession);
      }
    } catch (err) {
      console.error("Lỗi xác thực Firebase:", err);
      setErrorMsg("Lỗi kết nối máy chủ Firebase. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật thông tin trang cá nhân lên Firestore
  const handleUpdateProfile = async (updatedFields) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updatedFields };
    setCurrentUser(updatedUser);
    localStorage.setItem("lovematch_current_user", JSON.stringify(updatedUser));

    try {
      await updateDoc(doc(db, "users", currentUser.id), updatedFields);
    } catch (err) {
      console.error("Lỗi cập nhật hồ sơ:", err);
    }
  };

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("lovematch_current_user");
    setCurrentUser(null);
    setEmail("");
    setPassword("");
  };

  if (currentUser) {
    return (
      <Home
        currentUser={currentUser}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
        compressImage={compressImage}
      />
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">💜 LoveMatch</div>
        <p className="auth-subtitle">
          {isRegister
            ? "Tạo hồ sơ hẹn hò & kết nối cùng mọi người"
            : "Đăng nhập để xem bảng tin & trò chuyện"}
        </p>

        {errorMsg && <div className="auth-error">{errorMsg}</div>}

        <form onSubmit={handleAuthSubmit} className="auth-form">
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Tên hiển thị của bạn (VD: Hoaa Maii)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label className="avatar-upload-label">
                <span>
                  📷 {avatarData ? "Đã chọn ảnh đại diện ✓" : "Chọn ảnh đại diện từ máy"}
                </span>
                <input type="file" accept="image/*" onChange={handleAvatarFile} hidden />
              </label>
            </>
          )}

          <input
            type="email"
            placeholder="Địa chỉ Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="fb-btn-primary auth-submit-btn" disabled={loading}>
            {loading ? "Đang xử lý..." : isRegister ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? "Đã có tài khoản? " : "Chưa có tài khoản hẹn hò? "}
          <span
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg("");
            }}
          >
            {isRegister ? "Đăng nhập" : "Đăng ký miễn phí"}
          </span>
        </div>
      </div>
    </div>
  );
}
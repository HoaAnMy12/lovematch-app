import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR } from "./AppContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const POPULAR_HOBBIES = [
  "☕ Cafe & Tâm sự",
  "🎵 Nghe nhạc",
  "✈️ Du lịch",
  "🎬 Xem phim",
  "📚 Đọc sách",
  "🍕 Ăn uống",
  "🏋️ Gym & Fitness",
  "🎮 Chơi game",
];

const emailToDocId = (email) =>
  (email || "guest").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

// Nén ảnh đại diện khi chọn từ máy để lưu mượt lên Firebase
const compressAvatar = (file, maxWidth = 320) =>
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
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { currentUser, setCurrentUser } = useApp();

  const [name, setName] = useState(currentUser.name || "");
  const [age, setAge] = useState(currentUser.age || "");
  const [location, setLocation] = useState(currentUser.location || "");
  const [description, setDescription] = useState(currentUser.description || "");
  const [saving, setSaving] = useState(false);

  const initialHobbies = Array.isArray(currentUser.hobbies)
    ? currentUser.hobbies
    : currentUser.hobbies
    ? currentUser.hobbies.split(",").map((h) => h.trim())
    : [];
  const [selectedHobbies, setSelectedHobbies] = useState(initialHobbies);
  const [customHobby, setCustomHobby] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(
    currentUser.avatar || DEFAULT_AVATAR
  );

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressAvatar(file, 320);
      setAvatarPreview(compressed);
    }
  };

  const toggleHobby = (hobby) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobby)
        ? prev.filter((item) => item !== hobby)
        : [...prev, hobby]
    );
  };

  const handleAddCustomHobby = (e) => {
    if (e.key === "Enter" && customHobby.trim()) {
      e.preventDefault();
      if (!selectedHobbies.includes(customHobby.trim())) {
        setSelectedHobbies([...selectedHobbies, customHobby.trim()]);
      }
      setCustomHobby("");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !age || !location.trim()) {
      alert("Vui lòng điền đầy đủ Tên, Tuổi và Nơi ở!");
      return;
    }

    setSaving(true);
    const updatedFields = {
      name: name.trim(),
      age: Number(age),
      location: location.trim(),
      hobbies: selectedHobbies,
      description: description.trim(),
      avatar: avatarPreview,
    };

    setCurrentUser((prev) => ({
      ...prev,
      ...updatedFields,
    }));

    // Đồng bộ hồ sơ mới lên Firebase Firestore để người khác thấy ngay
    if (currentUser.email) {
      try {
        await setDoc(
          doc(db, "users", emailToDocId(currentUser.email)),
          {
            ...updatedFields,
            bio: description.trim(),
            email: currentUser.email.trim().toLowerCase(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error("Lỗi đồng bộ hồ sơ lên Firebase:", err);
      }
    }

    setSaving(false);
    navigate("/profile");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.logo}>💜 LoveMatch</h1>
        <p style={styles.title}>Cập nhật hồ sơ để tìm cạ cứng hợp gu</p>

        <div style={styles.card}>
          <div style={styles.avatarSection}>
            <div style={styles.avatarWrapper}>
              <img src={avatarPreview} alt="Avatar" style={styles.avatar} />
              <button
                type="button"
                style={styles.cameraBadge}
                onClick={() => fileInputRef.current?.click()}
                title="Đổi ảnh đại diện từ máy"
              >
                📷
              </button>
            </div>
            <span
              style={styles.changePhotoHint}
              onClick={() => fileInputRef.current?.click()}
            >
              Bấm để chọn ảnh đại diện từ máy
            </span>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: "none" }}
            />
          </div>

          <form onSubmit={handleSave}>
            <div style={styles.group}>
              <label style={styles.label}>Họ và tên *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.row}>
              <div style={{ ...styles.group, flex: 1 }}>
                <label style={styles.label}>Tuổi *</label>
                <input
                  type="number"
                  min="18"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ ...styles.group, flex: 2 }}>
                <label style={styles.label}>Nơi ở hiện tại *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Sở thích & Tính cách</label>
              <div style={styles.hobbyContainer}>
                {POPULAR_HOBBIES.map((hobby) => {
                  const isSelected = selectedHobbies.includes(hobby);
                  return (
                    <button
                      key={hobby}
                      type="button"
                      onClick={() => toggleHobby(hobby)}
                      style={{
                        ...styles.hobbyChip,
                        ...(isSelected ? styles.hobbyChipActive : {}),
                      }}
                    >
                      {hobby}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={customHobby}
                onChange={(e) => setCustomHobby(e.target.value)}
                onKeyDown={handleAddCustomHobby}
                placeholder="Nhập sở thích khác rồi nhấn Enter..."
                style={{ ...styles.input, marginTop: "10px" }}
              />
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Giới thiệu bản thân</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.textarea}
              />
            </div>

            <div style={styles.buttons}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => navigate("/profile")}
              >
                Hủy bỏ
              </button>
              <button type="submit" style={styles.saveButton} disabled={saving}>
                {saving ? "Đang lưu..." : "💜 Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #f3ebff 0%, #fcf8ff 100%)",
    padding: "24px 15px",
    fontFamily:
      "Quicksand, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  container: { width: "100%", maxWidth: "520px", textAlign: "center" },
  logo: {
    fontSize: "32px",
    color: "#7b3fe4",
    fontWeight: "bold",
    margin: "0 0 4px",
  },
  title: { color: "#7c6b99", fontSize: "15px", marginBottom: "20px" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "26px",
    padding: "28px 24px",
    boxShadow: "0 12px 35px rgba(157, 101, 255, 0.14)",
    border: "1px solid #e6d9ff",
  },
  avatarSection: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: "20px",
  },
  avatarWrapper: { position: "relative" },
  avatar: {
    width: "120px",
    height: "120px",
    objectFit: "cover",
    borderRadius: "50%",
    border: "4px solid #a770ef",
    boxShadow: "0 6px 18px rgba(167, 112, 239, 0.25)",
  },
  cameraBadge: {
    position: "absolute",
    bottom: "4px",
    right: "4px",
    backgroundColor: "#7b3fe4",
    color: "#ffffff",
    border: "2px solid #ffffff",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoHint: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#7b3fe4",
    fontWeight: "600",
    cursor: "pointer",
  },
  row: { display: "flex", gap: "12px" },
  group: { textAlign: "left", marginBottom: "16px" },
  label: {
    display: "block",
    marginBottom: "6px",
    color: "#2d1f47",
    fontWeight: "700",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 14px",
    border: "1px solid #e6d9ff",
    backgroundColor: "#faf7ff",
    color: "#2d1f47",
    borderRadius: "14px",
    fontSize: "14px",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    boxSizing: "border-box",
    padding: "11px 14px",
    border: "1px solid #e6d9ff",
    backgroundColor: "#faf7ff",
    color: "#2d1f47",
    borderRadius: "14px",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  hobbyContainer: { display: "flex", flexWrap: "wrap", gap: "8px" },
  hobbyChip: {
    border: "1px solid #e6d9ff",
    backgroundColor: "#faf7ff",
    color: "#7c6b99",
    padding: "6px 13px",
    borderRadius: "16px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  hobbyChipActive: {
    backgroundColor: "#f2ebff",
    borderColor: "#9d65ff",
    color: "#7b3fe4",
    fontWeight: "700",
  },
  buttons: { display: "flex", gap: "12px", marginTop: "24px" },
  cancelButton: {
    flex: 1,
    padding: "12px",
    border: "1px solid #e6d9ff",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    color: "#7c6b99",
    fontWeight: "bold",
    cursor: "pointer",
  },
  saveButton: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, #a770ef 0%, #cf8bf3 60%, #e0b0ff 100%)",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(157, 101, 255, 0.28)",
  },
};

export default EditProfile;
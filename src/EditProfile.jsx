import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp, DEFAULT_AVATAR } from "./AppContext";

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

function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { currentUser, setCurrentUser } = useApp();

  const [name, setName] = useState(currentUser.name || "");
  const [age, setAge] = useState(currentUser.age || "");
  const [location, setLocation] = useState(currentUser.location || "");
  const [description, setDescription] = useState(currentUser.description || "");

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
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

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim() || !age || !location.trim()) {
      alert("Vui lòng điền đầy đủ Tên, Tuổi và Nơi ở!");
      return;
    }

    setCurrentUser((prev) => ({
      ...prev,
      name: name.trim(),
      age: Number(age),
      location: location.trim(),
      hobbies: selectedHobbies,
      description: description.trim(),
      avatar: avatarPreview,
    }));

    navigate("/profile");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.logo}>💕 LoveMatch</h1>
        <p style={styles.title}>Cập nhật hồ sơ để tìm cạ cứng hợp gu</p>

        <div style={styles.card}>
          <div style={styles.avatarSection}>
            <div style={styles.avatarWrapper}>
              <img src={avatarPreview} alt="Avatar" style={styles.avatar} />
              <button
                type="button"
                style={styles.cameraBadge}
                onClick={() => fileInputRef.current?.click()}
              >
                📷
              </button>
            </div>
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
              <button type="submit" style={styles.saveButton}>
                ❤️ Lưu thay đổi
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
    background:
      "linear-gradient(135deg, #ffe6f0 0%, #fff0f5 50%, #fce4ec 100%)",
    padding: "20px 15px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  container: { width: "100%", maxWidth: "520px", textAlign: "center" },
  logo: {
    fontSize: "32px",
    color: "#ff4d6d",
    fontWeight: "bold",
    margin: "0 0 4px",
  },
  title: { color: "#666", fontSize: "15px", marginBottom: "20px" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    padding: "28px 24px",
    boxShadow: "0 12px 35px rgba(255, 77, 109, 0.12)",
    border: "1px solid #ffe1e9",
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
    border: "4px solid #ff4d6d",
  },
  cameraBadge: {
    position: "absolute",
    bottom: "4px",
    right: "4px",
    backgroundColor: "#ff4d6d",
    border: "2px solid #ffffff",
    borderRadius: "50%",
    width: "34px",
    height: "34px",
    cursor: "pointer",
  },
  row: { display: "flex", gap: "12px" },
  group: { textAlign: "left", marginBottom: "16px" },
  label: {
    display: "block",
    marginBottom: "6px",
    color: "#2d3748",
    fontWeight: "600",
    fontSize: "14px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    boxSizing: "border-box",
    padding: "11px 14px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  hobbyContainer: { display: "flex", flexWrap: "wrap", gap: "8px" },
  hobbyChip: {
    border: "1px solid #cbd5e0",
    backgroundColor: "#f7fafc",
    color: "#4a5568",
    padding: "6px 12px",
    borderRadius: "16px",
    fontSize: "13px",
    cursor: "pointer",
  },
  hobbyChipActive: {
    backgroundColor: "#ffe6f0",
    borderColor: "#ff4d6d",
    color: "#ff4d6d",
    fontWeight: "600",
  },
  buttons: { display: "flex", gap: "12px", marginTop: "24px" },
  cancelButton: {
    flex: 1,
    padding: "12px",
    border: "1px solid #cbd5e0",
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    color: "#718096",
    fontWeight: "bold",
    cursor: "pointer",
  },
  saveButton: {
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#ff4d6d",
    color: "#ffffff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default EditProfile;
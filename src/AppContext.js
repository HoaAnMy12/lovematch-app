import React, { createContext, useState, useEffect, useContext } from "react";
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./firebase";
import HoaImg from "./Hoa.jpg";
import HoaaImg from "./Hoaa.jpg";

const AppContext = createContext();

export const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop";

export const VIETNAM_PROVINCES = [
  "Tất cả khu vực",
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Nghệ An",
  "Hải Phòng",
  "Cần Thơ",
  "Huế",
  "Khánh Hòa",
  "Quảng Ninh",
  "Bình Dương",
  "Đồng Nai",
  "Thanh Hóa",
  "Hà Tĩnh",
  "Quảng Nam",
  "Lâm Đồng",
  "Đắk Lắk",
];

// Dữ liệu mẫu ban đầu (hiển thị kèm với các tài khoản người thật đã đăng ký)
const SAMPLE_PROFILES = [
  {
    id: "baoan@gmail.com",
    email: "baoan@gmail.com",
    name: "Bảo An",
    age: 23,
    location: "Đà Nẵng",
    distance: "1.2 km",
    bio: "Thích chạy bộ ven biển mỗi sáng, uống cà phê sữa đá và tìm người cùng tần số ☕🌊",
    hobbies: ["☕ Cafe & Tâm sự", "🎵 Nghe nhạc", "✈️ Du lịch"],
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600",
    isOnline: true,
    likesYou: true,
    status: "Đang rảnh • Muốn tâm sự ☕",
  },
  {
    id: "minhthu@gmail.com",
    email: "minhthu@gmail.com",
    name: "Minh Thư",
    age: 21,
    location: "Hà Nội",
    distance: "2.5 km",
    bio: "Hướng nội nhưng gặp đúng người thì nói cả ngày không hết chuyện 📚🎬",
    hobbies: ["📚 Đọc sách", "🎬 Xem phim", "🍕 Ăn uống"],
    image: HoaImg,
    avatar: HoaImg,
    isOnline: true,
    likesYou: true,
    status: "Thích đi cafe & Nghe nhạc 🎶",
  },
  {
    id: "khanhlinh@gmail.com",
    email: "khanhlinh@gmail.com",
    name: "Khánh Linh",
    age: 24,
    location: "TP. Hồ Chí Minh",
    distance: "3.0 km",
    bio: "Designer yêu mèo, thích nhạc Indie và những chuyến đi ngẫu hứng cuối tuần 🎨🐱",
    hobbies: ["🎵 Nghe nhạc", "✈️ Du lịch", "☕ Cafe & Tâm sự"],
    image: HoaaImg,
    avatar: HoaaImg,
    isOnline: false,
    likesYou: true,
    status: "Chill nhạc Acoustic 🎸",
  },
];

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isLoggedIn") === "true";
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  // Danh sách tất cả người dùng thật trên Firestore + mẫu
  const [allUsers, setAllUsers] = useState(SAMPLE_PROFILES);

  // Danh sách email bạn bè của user hiện tại (đồng bộ real-time từ Firestore)
  const [friendEmails, setFriendEmails] = useState([]);

  const [matches, setMatches] = useState(() => {
    const saved = localStorage.getItem("userMatches");
    return saved ? JSON.parse(saved) : [];
  });

  const [notifications, setNotifications] = useState([]);

  // 1. Lắng nghe toàn bộ người dùng thật đăng ký trên Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const firestoreUsers = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Gộp người dùng thật từ Firestore với danh sách mẫu (ưu tiên người dùng thật)
      const map = new Map();
      [...firestoreUsers, ...SAMPLE_PROFILES].forEach((u) => {
        const emailKey = u.email?.toLowerCase();
        if (emailKey && !map.has(emailKey)) {
          map.set(emailKey, {
            ...u,
            image: u.avatar || u.image || DEFAULT_AVATAR,
            avatar: u.avatar || u.image || DEFAULT_AVATAR,
          });
        }
      });

      setAllUsers(Array.from(map.values()));
    });

    return () => unsubscribe();
  }, []);

  // 2. Lắng nghe dữ liệu & danh sách bạn bè real-time của chính tài khoản đang đăng nhập
  useEffect(() => {
    if (!currentUser?.email) return;
    const myEmail = currentUser.email.toLowerCase();
    const myDocRef = doc(db, "users", myEmail);

    const unsubscribe = onSnapshot(myDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFriendEmails(data.friends || []);
        setCurrentUser((prev) => ({ ...prev, ...data }));
      }
    });

    return () => unsubscribe();
  }, [currentUser?.email]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("userMatches", JSON.stringify(matches));
  }, [matches]);

  // Đăng nhập / Đăng ký và lưu hồ sơ lên Firestore để người khác tìm thấy
  const loginUser = async (userData) => {
    const email = (userData.email || currentUser?.email || "").trim().toLowerCase();
    const profilePayload = {
      id: email,
      email,
      name: userData.name || currentUser?.name || email.split("@")[0],
      age: Number(userData.age) || currentUser?.age || 21,
      location: userData.location || currentUser?.location || "Đà Nẵng",
      distance: "0.5 km",
      hobbies: userData.hobbies || currentUser?.hobbies || ["☕ Cafe & Tâm sự", "🎵 Nghe nhạc"],
      bio: userData.description || userData.bio || "Rất vui được kết bạn với mọi người!",
      description: userData.description || userData.bio || "Rất vui được kết bạn với mọi người!",
      avatar: userData.avatar || currentUser?.avatar || DEFAULT_AVATAR,
      image: userData.avatar || currentUser?.avatar || DEFAULT_AVATAR,
      isOnline: true,
      likesYou: true,
      status: "Đang hoạt động 🟢",
    };

    setCurrentUser(profilePayload);
    setIsAuthenticated(true);
    localStorage.setItem("isLoggedIn", "true");

    try {
      await setDoc(doc(db, "users", email), profilePayload, { merge: true });
    } catch (err) {
      console.error("Lỗi lưu thông tin người dùng lên Firestore:", err);
    }
  };

  const logoutUser = async () => {
    if (currentUser?.email) {
      try {
        await updateDoc(doc(db, "users", currentUser.email.toLowerCase()), {
          isOnline: false,
        });
      } catch (e) {}
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
  };

  // KẾT BẠN 2 CHIỀU REAL-TIME TRÊN FIRESTORE
  const addFriend = async (person) => {
    if (!currentUser?.email || !person?.email) return;
    const myEmail = currentUser.email.toLowerCase();
    const targetEmail = person.email.toLowerCase();

    try {
      // 1. Thêm targetEmail vào danh sách friends của mình
      await setDoc(
        doc(db, "users", myEmail),
        { friends: arrayUnion(targetEmail) },
        { merge: true }
      );

      // 2. Thêm myEmail vào danh sách friends của đối phương (để 2 người thấy nhau ngay)
      await setDoc(
        doc(db, "users", targetEmail),
        {
          id: targetEmail,
          email: targetEmail,
          name: person.name,
          age: person.age || 22,
          location: person.location || "Việt Nam",
          avatar: person.avatar || person.image || DEFAULT_AVATAR,
          friends: arrayUnion(myEmail),
        },
        { merge: true }
      );

      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "friend",
          title: "Kết bạn thành công! 🤝",
          message: `Bạn và ${person.name} đã trở thành bạn bè.`,
          time: "Vừa xong",
          unread: true,
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Lỗi khi kết bạn:", error);
    }
  };

  // XÓA BẠN BÈ 2 CHIỀU TRÊN FIRESTORE
  const removeFriend = async (personOrId) => {
    if (!currentUser?.email) return;
    const targetEmail = (
      typeof personOrId === "string" ? personOrId : personOrId.email || personOrId.id
    ).toLowerCase();
    const myEmail = currentUser.email.toLowerCase();

    try {
      await updateDoc(doc(db, "users", myEmail), {
        friends: arrayRemove(targetEmail),
      });
      await updateDoc(doc(db, "users", targetEmail), {
        friends: arrayRemove(myEmail),
      });
    } catch (error) {
      console.error("Lỗi khi xóa bạn bè:", error);
    }
  };

  // Lọc ra danh sách người khác (không bao gồm bản thân)
  const discoverProfiles = allUsers.filter(
    (u) => u.email?.toLowerCase() !== currentUser?.email?.toLowerCase()
  );

  // Danh sách object bạn bè hoàn chỉnh từ friendEmails
  const friends = discoverProfiles.filter((u) =>
    friendEmails.includes(u.email?.toLowerCase())
  );

  const isFriend = (idOrEmail) => {
    return friendEmails.includes(String(idOrEmail).toLowerCase());
  };

  const addMatch = (person, isSuperLike = false) => {
    const newMatch = {
      ...person,
      avatar: person.image || person.avatar || DEFAULT_AVATAR,
      message: isSuperLike
        ? "⭐ Đã gửi Siêu Thích cho bạn!"
        : "Các bạn đã tương hợp! Hãy gửi lời chào 👋",
      time: "Vừa xong",
      matchedAt: new Date().toLocaleString("vi-VN"),
      isNew: true,
    };

    setMatches((prev) => {
      if (prev.some((m) => m.email === person.email)) return prev;
      return [newMatch, ...prev];
    });

    // Tự động kết bạn luôn khi Match để 2 người thật nhắn tin được cho nhau ngay
    addFriend(person);
    return newMatch;
  };

  const removeMatch = (id) => {
    setMatches((prev) => prev.filter((item) => item.id !== id && item.email !== id));
  };

  const updateMatchLastMessage = (partnerKey, text, time) => {
    setMatches((prev) =>
      prev.map((m) =>
        m.email?.toLowerCase() === String(partnerKey).toLowerCase()
          ? { ...m, message: text, time, isNew: false }
          : m
      )
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        loginUser,
        logoutUser,
        currentUser: currentUser || {},
        setCurrentUser: async (updater) => {
          const next = typeof updater === "function" ? updater(currentUser) : updater;
          setCurrentUser(next);
          if (next?.email) {
            await setDoc(doc(db, "users", next.email.toLowerCase()), next, { merge: true });
          }
        },
        discoverProfiles,
        friends,
        addFriend,
        removeFriend,
        isFriend,
        matches,
        addMatch,
        removeMatch,
        updateMatchLastMessage,
        notifications,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "./AppContext";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Stack,
  Container,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  LockOutlined as LockIcon,
  EmailOutlined as EmailIcon,
  PersonOutlined as PersonIcon,
  PhoneOutlined as PhoneIcon,
} from "@mui/icons-material";

export default function AuthForm({ initialMode = "login" }) {
  const navigate = useNavigate();
  const { loginUser } = useApp();

  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    setIsLogin(initialMode === "login");
  }, [initialMode]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });

  const switchMode = () => {
    const nextIsLogin = !isLogin;
    setIsLogin(nextIsLogin);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    setErrors({});
    setMessage({ type: "", text: "" });
    navigate(nextIsLogin ? "/login" : "/register", { replace: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = () => {
    let newErrors = {};
    if (!formData.email) newErrors.email = "Vui lòng nhập Email";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email không hợp lệ";

    if (!formData.password) newErrors.password = "Vui lòng nhập mật khẩu";
    else if (formData.password.length < 6)
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";

    if (!isLogin) {
      if (!formData.fullName) newErrors.fullName = "Vui lòng nhập họ và tên";
      if (!formData.confirmPassword)
        newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
      else if (formData.confirmPassword !== formData.password) {
        newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    loginUser({
      name: isLogin ? undefined : formData.fullName.trim(),
      email: formData.email.trim(),
    });

    setMessage({
      type: "success",
      text: isLogin
        ? "Đăng nhập thành công! Đang chuyển hướng..."
        : "Đăng ký thành công!",
    });

    setTimeout(() => navigate("/home"), 600);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #ffe6f0 0%, #fff0f5 50%, #fce4ec 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={6} sx={{ p: 4, borderRadius: 4, textAlign: "center" }}>
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                bgcolor: "#ff4d6d",
                color: "white",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                boxShadow: "0 4px 12px rgba(255, 77, 109, 0.35)",
              }}
            >
              <LockIcon />
            </Box>
            <Typography variant="h5" fontWeight="bold" sx={{ color: "#ff4d6d" }}>
              {isLogin ? "ĐĂNG NHẬP" : "TẠO TÀI KHOẢN"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {isLogin
                ? "Chào mừng bạn quay trở lại LoveMatch!"
                : "Điền thông tin để tìm một nửa của bạn"}
            </Typography>
          </Box>

          {message.text && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              {!isLogin && (
                <TextField
                  fullWidth
                  label="Họ và tên"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <TextField
                fullWidth
                label="Địa chỉ Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              {!isLogin && (
                <TextField
                  fullWidth
                  label="Số điện thoại (Tùy chọn)"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <TextField
                fullWidth
                label="Mật khẩu"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {!isLogin && (
                <TextField
                  fullWidth
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          edge="end"
                        >
                          {showConfirmPassword ? (
                            <VisibilityOff />
                          ) : (
                            <Visibility />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  mt: 1,
                  py: 1.3,
                  fontWeight: "bold",
                  borderRadius: 2.5,
                  textTransform: "none",
                  fontSize: 16,
                  bgcolor: "#ff4d6d",
                  "&:hover": { bgcolor: "#e03e5c" },
                }}
              >
                {isLogin ? "Đăng Nhập" : "Tạo Tài Khoản"}
              </Button>
            </Stack>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
              <Button
                onClick={switchMode}
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  ml: 0.5,
                  color: "#ff4d6d",
                }}
              >
                {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
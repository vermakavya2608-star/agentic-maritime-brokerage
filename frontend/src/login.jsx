import { useState } from "react";
import "./login.css";

const API_URL = "http://127.0.0.1:8000";

function Login({ onLogin }) {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP states
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingUser, setPendingUser] = useState(null);

  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState("email");

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const clearForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
    setMessage("");
    setMessageType("");
  };

  const switchMode = () => {
    setIsCreatingAccount(!isCreatingAccount);
    setIsOtpStep(false);
    setPendingUser(null);
    clearForm();
  };

  // Password validation matching the backend
  const validatePassword = (value) => {
    if (value.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    if (!/[A-Z]/.test(value)) {
      return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(value)) {
      return "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(value)) {
      return "Password must contain at least one number.";
    }

    if (!/[^A-Za-z0-9]/.test(value)) {
      return "Password must contain at least one special character.";
    }

    return "";
  };

  // =========================
  // OTP VERIFICATION
  // =========================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setMessageType("error");
      setMessage("Please enter the 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: pendingUser.email,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.detail || "Invalid or expired OTP.");
        return;
      }

      if (data.status === "success") {
        localStorage.setItem("currentUser", JSON.stringify(pendingUser));

        setMessageType("success");
        setMessage(
          `Verification successful. Welcome back, ${pendingUser.name}!`,
        );

        setTimeout(() => {
          onLogin(pendingUser);
        }, 800);
      } else {
        setMessageType("error");
        setMessage("Invalid or expired OTP. Please try again.");
      }
    } catch (error) {
      console.error("OTP verification error:", error);

      setMessageType("error");
      setMessage("Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // SIGNUP
  // =========================

  const handleSignup = async () => {
    if (name.trim().length < 2) {
      setMessageType("error");
      setMessage("Please enter a valid name.");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;

    if (!phoneRegex.test(phone)) {
      setMessageType("error");
      setMessage("Please enter a valid 10-digit phone number.");
      return;
    }

    if (!email.trim()) {
      setMessageType("error");
      setMessage("Please enter your email address.");
      return;
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      setMessageType("error");
      setMessage(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.detail || "Unable to create account.");
        return;
      }

      setMessageType("success");
      setMessage("Account created successfully! You can now sign in.");

      setTimeout(() => {
        setIsCreatingAccount(false);
        clearForm();
      }, 1200);
    } catch (error) {
      console.error("Signup error:", error);

      setMessageType("error");
      setMessage(
        "Cannot reach the server. Please make sure the backend is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // LOGIN
  // =========================

  const handleLogin = async () => {
    if (!email.trim()) {
      setMessageType("error");
      setMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setMessageType("error");
      setMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      // Real backend login
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.detail || "Invalid email or password.");
        return;
      }

      if (data.status !== "success") {
        setMessageType("error");
        setMessage("Login failed. Please try again.");
        return;
      }

      const user = data.user;

      // Admin/user role now comes from the backend
      setPendingUser(user);

      // Send OTP for second-step verification
      const otpResponse = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
        }),
      });

      const otpData = await otpResponse.json();

      if (!otpResponse.ok) {
        setMessageType("error");
        setMessage(otpData.detail || "Failed to send verification code.");
        return;
      }

      setIsOtpStep(true);
      setMessageType("success");
      setMessage("Verification code sent. Please check your email.");
    } catch (error) {
      console.error("Login error:", error);

      setMessageType("error");
      setMessage(
        "Cannot reach the server. Please make sure the backend is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // FORGOT PASSWORD
  // =========================

  const startForgotPassword = () => {
    setIsForgotPassword(true);
    setForgotPasswordStep("email");
    setIsOtpStep(false);
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setMessageType("");
  };

  const backToLogin = () => {
    setIsForgotPassword(false);
    setForgotPasswordStep("email");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
    setMessageType("");
  };

  const handleSendResetOTP = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessageType("error");
      setMessage("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/request-password-reset`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.detail || "Unable to send password reset code.");
        return;
      }

      setForgotPasswordStep("reset");
      setMessageType("success");
      setMessage("Password reset code sent. Please check your email.");
    } catch (error) {
      console.error("Password reset OTP error:", error);

      setMessageType("error");
      setMessage(
        "Cannot reach the server. Please make sure the backend is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setMessageType("error");
      setMessage("Please enter the 6-digit reset code.");
      return;
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      setMessageType("error");
      setMessage(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/auth/reset-password?otp=${encodeURIComponent(otp)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            new_password: password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setMessageType("error");
        setMessage(data.detail || "Unable to reset password.");
        return;
      }

      setMessageType("success");
      setMessage("Password reset successfully! You can now sign in.");

      setTimeout(() => {
        backToLogin();
      }, 1500);
    } catch (error) {
      console.error("Password reset error:", error);

      setMessageType("error");
      setMessage(
        "Cannot reach the server. Please make sure the backend is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================
  // FORM SUBMIT
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isCreatingAccount) {
      await handleSignup();
    } else {
      await handleLogin();
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div className="login-page">
      <div className="login-container">
        {/* LEFT SIDE */}
        <div className="brand-section">
          <div className="brand-content">
            <div className="login-logo">⚓</div>

            <h1>
              Maritime<span>AI</span>
            </h1>

            <h2>Agentic Maritime Brokerage</h2>

            <p>
              Intelligent freight pricing and route optimization powered by
              Artificial Intelligence.
            </p>

            <div className="login-features">
              <div>
                <span>🚢</span>
                Smart Route Intelligence
              </div>

              <div>
                <span>📈</span>
                AI-Powered Freight Pricing
              </div>

              <div>
                <span>🌐</span>
                Global Maritime Network
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="login-form-section">
          <div className="login-form-container">
            {isForgotPassword ? (
              <>
                {forgotPasswordStep === "email" ? (
                  <>
                    <h2>Reset Password</h2>

                    <p className="login-subtitle">
                      Enter your registered email address and we'll
                      <br />
                      send you a password reset code.
                    </p>

                    <form onSubmit={handleSendResetOTP}>
                      <label>Email Address</label>

                      <input
                        type="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />

                      {message && (
                        <p className={`auth-message ${messageType}`}>
                          {message}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading}
                      >
                        {isLoading ? "Sending..." : "Send Reset Code →"}
                      </button>

                      <button
                        type="button"
                        className="forgot-password"
                        onClick={backToLogin}
                        style={{
                          width: "100%",
                          marginTop: "24px",
                          textAlign: "center",
                        }}
                      >
                        ← Back to Login
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <h2>Set New Password</h2>

                    <p className="login-subtitle">
                      Enter the 6-digit code sent to
                      <br />
                      <strong style={{ color: "#38bdf8" }}>{email}</strong>
                    </p>

                    <form onSubmit={handleResetPassword}>
                      <label>Reset Code (OTP)</label>

                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        required
                        style={{
                          textAlign: "center",
                          letterSpacing: "8px",
                          fontSize: "20px",
                        }}
                      />

                      <label>New Password</label>

                      <div className="password-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? "🙈" : "👁️"}
                        </button>
                      </div>

                      {password && (
                        <div
                          style={{
                            marginTop: "8px",
                            marginBottom: "12px",
                            fontSize: "12px",
                            lineHeight: "1.7",
                          }}
                        >
                          <div>
                            {password.length >= 8 ? "✓" : "○"} At least 8
                            characters
                          </div>

                          <div>
                            {/[A-Z]/.test(password) ? "✓" : "○"} One uppercase
                            letter
                          </div>

                          <div>
                            {/[a-z]/.test(password) ? "✓" : "○"} One lowercase
                            letter
                          </div>

                          <div>
                            {/[0-9]/.test(password) ? "✓" : "○"} One number
                          </div>

                          <div>
                            {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"} One
                            special character
                          </div>
                        </div>
                      )}

                      <label>Confirm New Password</label>

                      <div className="password-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>

                      {confirmPassword && (
                        <div
                          style={{
                            fontSize: "12px",
                            marginTop: "5px",
                            marginBottom: "10px",
                          }}
                        >
                          {password === confirmPassword
                            ? "✓ Passwords match"
                            : "○ Passwords do not match"}
                        </div>
                      )}

                      {message && (
                        <p className={`auth-message ${messageType}`}>
                          {message}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading}
                      >
                        {isLoading ? "Resetting..." : "Reset Password →"}
                      </button>

                      <button
                        type="button"
                        className="forgot-password"
                        onClick={backToLogin}
                        style={{
                          width: "100%",
                          marginTop: "24px",
                          textAlign: "center",
                        }}
                      >
                        ← Back to Login
                      </button>
                    </form>
                  </>
                )}
              </>
            ) : isOtpStep ? (
              <>
                <h2>Security Verification</h2>

                <p className="login-subtitle">
                  Enter the 6-digit code sent to
                  <br />
                  <strong style={{ color: "#38bdf8" }}>
                    {pendingUser?.email}
                  </strong>
                </p>

                <form onSubmit={handleVerifyOTP}>
                  <label>Verification Code (OTP)</label>

                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                    style={{
                      textAlign: "center",
                      letterSpacing: "8px",
                      fontSize: "20px",
                    }}
                  />

                  {message && (
                    <p className={`auth-message ${messageType}`}>{message}</p>
                  )}

                  <button
                    type="submit"
                    className="login-button"
                    disabled={isLoading}
                  >
                    {isLoading ? "Verifying..." : "Verify & Login →"}
                  </button>

                  <button
                    type="button"
                    className="forgot-password"
                    onClick={() => {
                      setIsOtpStep(false);
                      setOtp("");
                      setMessage("");
                      setMessageType("");
                    }}
                    style={{
                      width: "100%",
                      marginTop: "24px",
                      textAlign: "center",
                    }}
                  >
                    ← Back to Login
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2>{isCreatingAccount ? "Create Account" : "Welcome Back"}</h2>

                <p className="login-subtitle">
                  {isCreatingAccount
                    ? "Create your account to access maritime intelligence."
                    : "Sign in to access your maritime intelligence platform"}
                </p>

                <form onSubmit={handleSubmit}>
                  {/* NAME */}
                  {isCreatingAccount && (
                    <>
                      <label>Full Name</label>

                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </>
                  )}

                  {/* PHONE */}
                  {isCreatingAccount && (
                    <>
                      <label>Phone Number</label>

                      <input
                        type="tel"
                        placeholder="Enter your 10-digit phone number"
                        value={phone}
                        onChange={(e) =>
                          setPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        required
                      />
                    </>
                  )}

                  {/* EMAIL */}
                  <label>Email Address</label>

                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />

                  {/* PASSWORD */}
                  <label>Password</label>

                  <div className="password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>

                  {/* PASSWORD REQUIREMENTS */}
                  {isCreatingAccount && password && (
                    <div
                      style={{
                        marginTop: "8px",
                        marginBottom: "12px",
                        fontSize: "12px",
                        lineHeight: "1.7",
                      }}
                    >
                      <div>
                        {password.length >= 8 ? "✓" : "○"} At least 8 characters
                      </div>

                      <div>
                        {/[A-Z]/.test(password) ? "✓" : "○"} One uppercase
                        letter
                      </div>

                      <div>
                        {/[a-z]/.test(password) ? "✓" : "○"} One lowercase
                        letter
                      </div>

                      <div>{/[0-9]/.test(password) ? "✓" : "○"} One number</div>

                      <div>
                        {/[^A-Za-z0-9]/.test(password) ? "✓" : "○"} One special
                        character
                      </div>
                    </div>
                  )}

                  {/* CONFIRM PASSWORD */}
                  {isCreatingAccount && (
                    <>
                      <label>Confirm Password</label>

                      <div className="password-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>

                      {confirmPassword && (
                        <div
                          style={{
                            fontSize: "12px",
                            marginTop: "5px",
                            marginBottom: "10px",
                          }}
                        >
                          {password === confirmPassword
                            ? "✓ Passwords match"
                            : "○ Passwords do not match"}
                        </div>
                      )}
                    </>
                  )}

                  {/* LOGIN OPTIONS */}
                  {!isCreatingAccount && (
                    <div className="login-options">
                      <label className="remember-me">
                        <input type="checkbox" />
                        <span>Remember me</span>
                      </label>

                      <button
                        type="button"
                        className="forgot-password"
                        onClick={startForgotPassword}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {/* MESSAGE */}
                  {message && (
                    <p className={`auth-message ${messageType}`}>{message}</p>
                  )}

                  {/* BUTTON */}
                  <button
                    type="submit"
                    className="login-button"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Processing..."
                      : isCreatingAccount
                        ? "Create Account →"
                        : "Sign In →"}
                  </button>
                </form>

                {/* SWITCH LOGIN / SIGNUP */}
                <p className="signup-text">
                  {isCreatingAccount
                    ? "Already have an account?"
                    : "Don't have an account?"}

                  <button type="button" onClick={switchMode}>
                    {isCreatingAccount ? "Sign In" : "Create Account"}
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

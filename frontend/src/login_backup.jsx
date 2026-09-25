import { useState } from 'react'
import './login.css'

function Login({ onLogin }) {
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // OTP States
  const [isOtpStep, setIsOtpStep] = useState(false)
  const [otp, setOtp] = useState('')
  const [pendingUser, setPendingUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const clearForm = () => {
    setName('')
    setPhone('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setMessage('')
    setOtp('')
  }

  const switchMode = () => {
    setIsCreatingAccount(!isCreatingAccount)
    setIsOtpStep(false)
    clearForm()
  }

  // --- STEP 2: VERIFY OTP ---
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingUser.email, otp: otp })
      })

      const data = await response.json()

      if (data.status === "success") {
        localStorage.setItem('currentUser', JSON.stringify(pendingUser))
        setMessageType('success')
        setMessage(`Verification successful. Welcome back, ${pendingUser.name}!`)

        setTimeout(() => {
          onLogin(pendingUser)
        }, 1000)
      } else {
        setMessageType('error')
        setMessage('Invalid or expired OTP. Please try again.')
      }
    } catch (error) {
      setMessageType('error')
      setMessage('Failed to connect to server.')
    }

    setIsLoading(false)
  }

  // --- STEP 1: INITIAL CREDENTIAL CHECK ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    // CREATE ACCOUNT FLOW
    if (isCreatingAccount) {
      if (name.trim().length < 2) {
        setMessageType('error')
        setMessage('Please enter a valid name.')
        return
      }

      const phoneRegex = /^[0-9]{10}$/
      if (!phoneRegex.test(phone)) {
        setMessageType('error')
        setMessage('Please enter a valid 10-digit phone number.')
        return
      }

      if (password.length < 6) {
        setMessageType('error')
        setMessage('Password must contain at least 6 characters.')
        return
      }

      if (password !== confirmPassword) {
        setMessageType('error')
        setMessage('Passwords do not match.')
        return
      }

      const users = JSON.parse(localStorage.getItem('maritimeUsers')) || []
      const existingUser = users.find((user) => user.email.toLowerCase() === email.toLowerCase())

      if (existingUser) {
        setMessageType('error')
        setMessage('An account with this email already exists.')
        return
      }

      const newUser = {
        name,
        phone,
        email,
        password,
        role: 'user',
      }
      users.push(newUser)
      localStorage.setItem('maritimeUsers', JSON.stringify(users))

      setMessageType('success')
      setMessage('Account created successfully! You can now sign in.')

      setTimeout(() => {
        setIsCreatingAccount(false)
        clearForm()
      }, 1500)
      return
    }

    // SIGN IN FLOW
    const users = JSON.parse(localStorage.getItem('maritimeUsers')) || []
    let userToLogin = null

    // Check Admin - UPDATED TO USE REAL EMAIL
    if (email.toLowerCase() === 'vermakavya2608@gmail.com' && password === 'admin123') {
      userToLogin = {
        name: 'Maritime Admin',
        email: 'vermakavya2608@gmail.com', // OTP will now be sent here
        phone: '',
        role: 'admin',
      }
    } else {
      // Check Normal User
      userToLogin = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      )
    }

    if (!userToLogin) {
      setMessageType('error')
      setMessage('Invalid email or password. Please try again.')
      return
    }

    // Credentials valid -> Send OTP
    setIsLoading(true)
    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userToLogin.email })
      })

      if (response.ok) {
        setPendingUser(userToLogin)
        setIsOtpStep(true)
        setMessageType('success')
        setMessage('OTP sent! Please check your email (or backend terminal).')
      } else {
        setMessageType('error')
        setMessage('Failed to send verification code.')
      }
    } catch (error) {
      setMessageType('error')
      setMessage('Cannot reach the server to send OTP.')
    }

    setIsLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-container">

        {/* LEFT SIDE */}
        <div className="brand-section">
          <div className="brand-content">
            <div className="login-logo">⚓</div>
            <h1>Maritime<span>AI</span></h1>
            <h2>Agentic Maritime Brokerage</h2>
            <p>Intelligent freight pricing and route optimization powered by Artificial Intelligence.</p>

            <div className="login-features">
              <div><span>🚢</span>Smart Route Intelligence</div>
              <div><span>📊</span>AI-Powered Freight Pricing</div>
              <div><span>🌍</span>Global Maritime Network</div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="login-form-section">
          <div className="login-form-container">

            {isOtpStep ? (
              <>
                <h2>Security Verification</h2>
                <p className="login-subtitle">
                  Enter the 6-digit code sent to <br />
                  <strong style={{ color: '#38bdf8' }}>{pendingUser?.email}</strong>
                </p>

                <form onSubmit={handleVerifyOTP}>
                  <label>Verification Code (OTP)</label>
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px' }}
                  />

                  {message && <p className={`auth-message ${messageType}`}>{message}</p>}

                  <button type="submit" className="login-button" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify & Login →'}
                  </button>

                  <button
                    type="button"
                    className="forgot-password"
                    onClick={() => setIsOtpStep(false)}
                    style={{ width: '100%', marginTop: '24px', textAlign: 'center' }}
                  >
                    ← Back to Login
                  </button>
                </form>
              </>
            ) : (
              <>
                <h2>{isCreatingAccount ? 'Create Account' : 'Welcome Back'}</h2>
                <p className="login-subtitle">
                  {isCreatingAccount
                    ? 'Create your account to access maritime intelligence.'
                    : 'Sign in to access your maritime intelligence platform'}
                </p>

                <form onSubmit={handleSubmit}>

                  {/* NAME - CREATE ACCOUNT ONLY */}
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

                  {/* PHONE - CREATE ACCOUNT ONLY */}
                  {isCreatingAccount && (
                    <>
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Enter your 10-digit phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
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
                      type={showPassword ? 'text' : 'password'}
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
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>

                  {/* CONFIRM PASSWORD */}
                  {isCreatingAccount && (
                    <>
                      <label>Confirm Password</label>
                      <div className="password-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* LOGIN OPTIONS */}
                  {!isCreatingAccount && (
                    <div className="login-options">
                      <label className="remember-me">
                        <input type="checkbox" />
                        <span>Remember me</span>
                      </label>
                      <button type="button" className="forgot-password">
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {/* MESSAGE */}
                  {message && (
                    <p className={`auth-message ${messageType}`}>
                      {message}
                    </p>
                  )}

                  {/* BUTTON */}
                  <button type="submit" className="login-button" disabled={isLoading}>
                    {isLoading
                      ? 'Processing...'
                      : isCreatingAccount
                      ? 'Create Account →'
                      : 'Sign In →'}
                  </button>

                </form>

                {/* SWITCH LOGIN / SIGNUP */}
                <p className="signup-text">
                  {isCreatingAccount ? 'Already have an account?' : "Don't have an account?"}
                  <button type="button" onClick={switchMode}>
                    {isCreatingAccount ? 'Sign In' : 'Create Account'}
                  </button>
                </p>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}

export default Login
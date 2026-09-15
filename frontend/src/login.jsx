import { useState } from 'react'
import './Login.css'

function Login({ onLogin }) {
const [isCreatingAccount, setIsCreatingAccount] = useState(false)
const [showPassword, setShowPassword] = useState(false)

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
}

const switchMode = () => {
setIsCreatingAccount(!isCreatingAccount)
clearForm()
}

const handleSubmit = (e) => {
e.preventDefault()

setMessage('')

// CREATE ACCOUNT
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

  const existingUser = users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  )

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

// SIGN IN
const users = JSON.parse(localStorage.getItem('maritimeUsers')) || []

// DEMO ADMIN LOGIN
if (
  email.toLowerCase() === 'admin@maritimeai.com' &&
  password === 'admin123'
) {
  const adminUser = {
    name: 'Maritime Admin',
    email: 'admin@maritimeai.com',
    phone: '',
    role: 'admin',
  }

  localStorage.setItem(
    'currentUser',
    JSON.stringify(adminUser)
  )

  setMessageType('success')
  setMessage('Welcome back, Maritime Admin!')

  setTimeout(() => {
    onLogin(adminUser)
  }, 700)

  return
}

// NORMAL USER LOGIN
const user = users.find(
  (user) =>
    user.email.toLowerCase() === email.toLowerCase() &&
    user.password === password
)

if (!user) {
  setMessageType('error')
  setMessage('Invalid email or password. Please try again.')
  return
}

// Save logged-in user
const loggedInUser = {
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role || 'user',
}

localStorage.setItem(
  'currentUser',
  JSON.stringify(loggedInUser)
)

setMessageType('success')
setMessage(`Welcome back, ${user.name}!`)

setTimeout(() => {
  onLogin(loggedInUser)
}, 700)
}


return ( <div className="login-page"> <div className="login-container">

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
            <span>📊</span>
            AI-Powered Freight Pricing
          </div>

          <div>
            <span>🌍</span>
            Global Maritime Network
          </div>
        </div>

      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="login-form-section">
      <div className="login-form-container">

        <h2>
          {isCreatingAccount ? 'Create Account' : 'Welcome Back'}
        </h2>

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
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
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

              <button
                type="button"
                className="forgot-password"
              >
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
          <button
            type="submit"
            className="login-button"
          >
            {isCreatingAccount
              ? 'Create Account →'
              : 'Sign In →'}
          </button>

        </form>

        {/* SWITCH LOGIN / SIGNUP */}
        <p className="signup-text">

          {isCreatingAccount
            ? 'Already have an account?'
            : "Don't have an account?"}

          <button
            type="button"
            onClick={switchMode}
          >
            {isCreatingAccount ? 'Sign In' : 'Create Account'}
          </button>

        </p>

      </div>
    </div>

  </div>
</div>

)
}

export default Login

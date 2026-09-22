import { useState } from 'react'
import Home from './Home'
import Login from './login'
import Dashboard from './Dashboard'
import AdminDashboard from './AdminDashboard'

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser')

    return savedUser ? JSON.parse(savedUser) : null
  })

  const [page, setPage] = useState(() => {
    const savedUser = localStorage.getItem('currentUser')

    if (savedUser) {
      const user = JSON.parse(savedUser)

      return user.role === 'admin'
        ? 'admin'
        : 'dashboard'
    }

    return 'home'
  })

  const handleLogin = (user) => {
    setCurrentUser(user)

    if (user.role === 'admin') {
      setPage('admin')
    } else {
      setPage('dashboard')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    setCurrentUser(null)
    setPage('login')
  }

  return (
    <>
      {/* Home */}
      {page === 'home' && !currentUser && (
        <Home onGetStarted={() => setPage('login')} />
      )}

      {/* Login */}
      {page === 'login' && !currentUser && (
        <Login onLogin={handleLogin} />
      )}

      {/* Customer Dashboard */}
      {page === 'dashboard' &&
        currentUser &&
        currentUser.role !== 'admin' && (
          <Dashboard
            user={currentUser}
            onLogout={handleLogout}
          />
        )}

      {/* Admin Dashboard */}
      {page === 'admin' &&
        currentUser &&
        currentUser.role === 'admin' && (
          <AdminDashboard
            user={currentUser}
            onLogout={handleLogout}
          />
        )}
    </>
  )
}

export default App
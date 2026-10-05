import { useState, useEffect } from 'react'
import Home from './Home'
import Login from './login'
import Dashboard from './Dashboard'
import AdminDashboard from './AdminDashboard'

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser')
    return savedUser ? JSON.parse(savedUser) : null
  })

  // 1. Check sessionStorage during initial load
  const [page, setPage] = useState(() => {
    const savedUser = localStorage.getItem('currentUser')

    if (savedUser) {
      const user = JSON.parse(savedUser)
      return user.role === 'admin' ? 'admin' : 'dashboard'
    }

    // Remember if they were on the login page before refreshing
    const savedPage = sessionStorage.getItem('currentPage')
    if (savedPage === 'login') {
      return 'login'
    }

    return 'home'
  })

  // 2. Automatically save the current page whenever it changes
  useEffect(() => {
    sessionStorage.setItem('currentPage', page)
  }, [page])

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

  const handleUpdateUser = (updatedUser) => {
    setCurrentUser(updatedUser);
    
    try {
      // 1. Save the active session
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      // 2. Save to the permanent database array
      const users = JSON.parse(localStorage.getItem('maritimeUsers')) || [];
      const userIndex = users.findIndex(u => u.email === updatedUser.email);
      
      if (userIndex !== -1) {
        users[userIndex] = updatedUser; // Update existing
      } else {
        users.push(updatedUser); // Add new
      }
      
      localStorage.setItem('maritimeUsers', JSON.stringify(users));
      
    } catch (error) {
      console.error("Storage Error:", error);
      alert("Failed to save! The image is too large for local storage.");
    }
  }

  return (
    <>
      {page === 'home' && !currentUser && (
        <Home onGetStarted={() => setPage('login')} />
      )}

      {page === 'login' && !currentUser && (
        <Login onLogin={handleLogin} />
      )}

      {page === 'dashboard' && currentUser && currentUser.role !== 'admin' && (
        <Dashboard
          user={currentUser}
          onLogout={handleLogout}
          onUpdateUser={handleUpdateUser} 
        />
      )}

      {page === 'admin' && currentUser && currentUser.role === 'admin' && (
        <AdminDashboard
          user={currentUser}
          onLogout={handleLogout}
        />
      )}
    </>
  )
}

export default App
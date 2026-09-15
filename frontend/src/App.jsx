import { useState } from 'react'
import Home from './Home'
import Login from './login'
import Dashboard from './Dashboard'
import AdminDashboard from './AdminDashboard'

function App() {
  const [page, setPage] = useState('home')
  const [currentUser, setCurrentUser] = useState(null)

  const handleLogin = (user) => {
    setCurrentUser(user)

    if (user.role === 'admin') {
      setPage('admin')
    } else {
      setPage('dashboard')
    }
  }

  return (
    <>
      {page === 'home' && (
        <Home onGetStarted={() => setPage('login')} />
      )}

      {page === 'login' && (
        <Login onLogin={handleLogin} />
      )}

      {page === 'dashboard' && (
        <Dashboard user = {currentUser} />
      )}

      {page === 'admin' && (
        <AdminDashboard user={currentUser} />
      )}
    </>
  )
}

export default App
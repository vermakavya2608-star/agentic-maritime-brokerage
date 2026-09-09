import { useState } from 'react'
import Login from './login'
import Dashboard from './Dashboard'

function App() {
const [isLoggedIn, setIsLoggedIn] = useState(false)

return (
<>
{isLoggedIn ? ( <Dashboard />
) : (
<Login onLogin={() => setIsLoggedIn(true)} />
)}
</>
)
}

export default App

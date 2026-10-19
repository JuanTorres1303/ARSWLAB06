import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import BlueprintsPage from './pages/BlueprintsPage.jsx'
import BlueprintDetailPage from './pages/BlueprintDetailPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFound from './pages/NotFound.jsx'
import PrivateRoute from './components/PrivateRoute.jsx'

export default function App() {
  useLocation() // re-renderiza el header al cambiar de ruta (login/logout)
  const navigate = useNavigate()
  const loggedIn = !!localStorage.getItem('token')

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="container">
      <header>
        <h1>ECI - Laboratorio de Blueprints en React</h1>
        <nav>
          {loggedIn ? (
            <>
              <NavLink to="/" end>
                Blueprints
              </NavLink>
              <button className="btn" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
        </nav>
      </header>
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <BlueprintsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/blueprints/:author/:name"
          element={
            <PrivateRoute>
              <BlueprintDetailPage />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

import './core/styles/global.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './core/contexts/AuthContext'
import { ThemeProvider } from './core/contexts/ThemeContext'
import { NotificationProvider } from './core/contexts/NotificationContext'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MENU, ADMIN_MENU, AUTHORITIES, PANEL_ROUTE_MENUS } from './modules/panel/config/panel.config'
import App from './core/pages/App/App'
import ProtectedRoute from './core/components/ProtectedRoute/ProtectedRoute'
import Authentication from './modules/auth/Authentication'
import PanelLayout from './modules/panel/layouts/PanelLayout'
import NotFound from './core/pages/NotFound/NotFound'
import LandingPage from './modules/public/pages/LandingPage/LandingPage'
import SchoolProfilePage from './modules/public/pages/SchoolProfile/SchoolProfilePage'
import EnrollmentWizardPage from './modules/public/pages/EnrollmentWizard/EnrollmentWizardPage'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App>
      <ThemeProvider>
        <NotificationProvider>
          <BrowserRouter>
              <Routes>

                <Route path='*' element={<NotFound />} />
                <Route path='/' element={<LandingPage />} />
                <Route path='/school/:code' element={<SchoolProfilePage />} />
                <Route path='/schools/:code' element={<SchoolProfilePage />} />
                <Route path='/enroll/:code' element={<EnrollmentWizardPage />} />
                <Route path='/auth' element={<AuthProvider><Authentication /></AuthProvider>} />

                <Route path='/admin' element={
                  <AuthProvider>
                    <ProtectedRoute authorities={{ roles: ['Admin'] }}>
                      <PanelLayout menu={ADMIN_MENU} role='Admin' />
                    </ProtectedRoute>
                  </AuthProvider>
                }>
                  {ADMIN_MENU.map((item) => (
                    <Route
                      key={`admin-route-${item.path}`}
                      path={item.path}
                      element={<ProtectedRoute authorities={item.authorities}>{item.element}</ProtectedRoute>}
                    />
                  ))}
                </Route>

                <Route path='/panel' element={<AuthProvider><ProtectedRoute authorities={AUTHORITIES.PANEL}><PanelLayout menu={MENU} /></ProtectedRoute></AuthProvider>}>
                  {MENU.filter((item) => !item.isBase).map((item) => (
                    <Route
                      key={`route-${item.to || 'dashboard'}`}
                      path={item.path}
                      element={<ProtectedRoute authorities={item.authorities}>{item.element}</ProtectedRoute>}
                      index={item.to === '/panel'}
                    />
                  ))}
                  {MENU.flatMap((item) =>
                    (item.items || []).map(subItem => (
                      <Route
                        key={`sub-route-${subItem.to}`}
                        path={subItem.to}
                        element={<ProtectedRoute authorities={subItem.authorities}>{subItem.element}</ProtectedRoute>}
                      />
                    ))
                  )}
                  <Route index element={<ProtectedRoute authorities={AUTHORITIES.PANEL}>{MENU.find((item) => item.isBase)?.element}</ProtectedRoute>} />
                  {PANEL_ROUTE_MENUS.filter((item) => !item.isBase).map((item) => (
                    <Route
                      key={`role-route-${item.path}`}
                      path={item.path}
                      element={<ProtectedRoute authorities={item.authorities}>{item.element}</ProtectedRoute>}
                    />
                  ))}
                </Route>

              </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </ThemeProvider>
    </App>
  </StrictMode>
)
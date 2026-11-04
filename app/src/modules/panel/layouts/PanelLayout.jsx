import './PanelLayout.css'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../../core/contexts/AuthContext'
import { useTheme } from '../../../core/hooks/useTheme'
import UserSessionCard from '../components/User/UserSessionCard'
import ConnectionWrapper from '../../../core/components/ConnectionWrapper/ConnectionWrapper'
import Logo from '../../../core/components/Logo/Logo'
import Icon from '../../../core/components/Icon/Icon'
import Button from '../../../core/components/Button/Button'

function PanelLayout({ menu }) {
  const { isDarkTheme, setThemePreference } = useTheme()
  const [sidebar, setSidebar] = useState(JSON.parse(window.localStorage.getItem('sidebar')) || false)
  const [user, setUser] = useState(false)
  const { session, signOut, hasAuthorities } = useAuth()
  const location = useLocation()

  const supmenu = menu.find(item => location.pathname.startsWith(item.to) && item.items?.length > 0)

  const submenu = supmenu?.items.find(item => location.pathname.endsWith(item.to))

  useEffect(() => {
    localStorage.setItem('sidebar', sidebar)
  }, [sidebar])

  return session && (<>
    <div className='lx-l-panel'>

      <aside className='lx-l-panel-sidebar'>

        <div className={sidebar ? 'lx-l-panel-sidebar-menu' : 'lx-l-panel-sidebar-menu disabled'}>

          <div className='lx-l-panel-sidebar-session' onClick={() => setUser(!user)}>
            <div className='lx-l-panel-sidebar-session-avatar'>
              {session.user?.image ? <img src={session.user.image} className='--image' /> : <div className='--char'>
                {session.user?.name ? session.user?.name[0] : '?'}
              </div>}
            </div>
            <div className='lx-l-panel-sidebar-session-user'>
              <p>{session.user?.name || 'Visitante'}</p>
              <span>@{session.user?.username || 'visitante'}</span>
            </div>
          </div>

          <div className='lx-l-panel-sidebar-content'>
            <nav className='lx-l-panel-nav'>
              {menu.filter(item => hasAuthorities(session, item.authorities)).map(item => (<div className='lx-l-panel-sidebar-nav-item' key={item.to}>
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.isBase ? true : false}
                  className={({ isActive }) =>
                    isActive ? 'lx-l-panel-sidebar-nav-btn active' : 'lx-l-panel-sidebar-nav-btn'
                  }
                >
                  <div className='lx-l-panel-sidebar-nav-btn-icon'>
                    <span className='material-symbols-rounded' translate='no'>{item.icon}</span>
                  </div>
                  <div className='lx-l-panel-sidebar-nav-btn-text'>{item.label}</div>
                  <div className='lx-l-panel-sidebar-nav-btn-label'>{item.label}</div>
                  {item.items?.length > 0 && <span className='material-symbols-rounded lx-l-panel-sidebar-nav-item-sup-indicator' translate='no'>chevron_right</span>}
                </NavLink>
                {item.items?.length > 0 && <>
                  <div className={`lx-l-panel-sidebar-nav-sub-items ${sidebar && 'enable'}`}>
                    {item.items?.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        className={({ isActive }) =>
                          isActive ? 'lx-l-panel-sidebar-nav-btn active' : 'lx-l-panel-sidebar-nav-btn'
                        }
                      >
                        <div className='lx-l-panel-sidebar-nav-btn-icon'>
                          <span className='material-symbols-rounded' translate='no'>{item.icon}</span>
                        </div>
                        <div className='lx-l-panel-sidebar-nav-btn-text'>{item.label}</div>
                      </NavLink>
                    ))}
                  </div>
                </>}
              </div>))}
            </nav>

            <div className='lx-l-panel-sidebar-section'>

              <div className='lx-l-panel-sidebar-nav-btn' onClick={() => {
                setThemePreference(isDarkTheme ? 'light' : 'dark')
              }}>
                <div className='lx-l-panel-sidebar-nav-btn-icon'>
                  <span className='material-symbols-rounded' translate='no'>{isDarkTheme ? 'light_mode' : 'dark_mode'}</span>
                </div>
                <div className='lx-l-panel-sidebar-nav-btn-text'>Modo {isDarkTheme ? 'claro' : 'oscuro'}</div>
                <div className='lx-l-panel-sidebar-nav-btn-label'>Modo</div>
              </div>

            </div>

            <div className='lx-l-panel-sidebar-brand'>
              <div className='lx-l-panel-sidebar-brand-mark'>
                <div className='lx-l-panel-sidebar-brand-icon'>
                  <Logo color='white' size='xs' />
                </div>
                <div className='lx-l-panel-sidebar-brand-name'>
                  <div className='--subtitle'>POWERED BY</div>
                  <div className='--title'>Stepfive<strong style={{ fontWeight: 200 }}>Team</strong></div>
                </div>
                <div className='lx-l-panel-sidebar-odd'>
                  <Button color='danger' variant='plain' icon onClick={signOut}>
                    <Icon name='transition_push' />
                  </Button>
                </div>
              </div>
            </div>

            <button className='lx-l-panel-disabled' onClick={() => setSidebar(!sidebar)}>
              <span className='material-symbols-rounded' translate='no'>first_page</span>
            </button>
          </div>

        </div>

      </aside>

      <main className='lx-l-panel-main'>
        <div className={`lx-l-panel-main-session ${user && 'active'}`}>
          <UserSessionCard onClose={() => setUser(false)} />
        </div>
        <div className='lx-l-panel-main-container'>
          <ConnectionWrapper>
            {(supmenu || (supmenu && submenu)) && <>
              <header className='lx-l-panel-main-container-header'>
                {submenu ? <span className='material-symbols-rounded' translate='no'>{submenu.icon}</span> : <span className='material-symbols-rounded' translate='no'>{supmenu.icon}</span>}
                <span className='material-symbols-rounded' translate='no'>chevron_right</span><NavLink to={supmenu.to}>{supmenu.label}</NavLink>{submenu && <><span className='material-symbols-rounded' translate='no'>chevron_right</span><strong>{submenu?.label}</strong></>}
              </header>
            </>}
            <Outlet />
          </ConnectionWrapper>
        </div>
      </main>
    </div>
  </>)
}

export default PanelLayout

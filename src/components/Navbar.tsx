import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/useAppStore';
import { toggleTheme, selectTheme } from '../store/uiSlice';

const navItems = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/flashcards', label: 'Flashcards', icon: '📇' },
  { path: '/quizzes', label: 'Quizzes', icon: '📝' },
  { path: '/categories', label: 'Categories', icon: '📁' },
  { path: '/bookmarks', label: 'Bookmarks', icon: '🔖' },
  { path: '/manage', label: 'Manage', icon: '⚙️' },
];

export function Navbar() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const location = useLocation();

  return (
    <div className="navbar bg-base-200 shadow-lg sticky top-0 z-50">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
          >
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? 'active' : ''}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost text-xl">
          <span className="hidden sm:inline">🇩🇪 German Learning</span>
          <span className="sm:hidden">🇩🇪 Deutsch</span>
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="navbar-end">
        <button
          className="btn btn-ghost btn-circle"
          onClick={() => dispatch(toggleTheme())}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </div>
  );
}

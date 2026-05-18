import { NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { AnswerLengthToggle } from './AnswerLengthToggle';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="layout">
      <nav className="nav">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}icon.png`} alt="" className="brand-icon" />
          IBM Integration Prep
        </div>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/browse">Browse</NavLink>
        <NavLink to="/quiz">Quiz</NavLink>
        <NavLink to="/resources">Resources</NavLink>
        <ThemeToggle />
        <AnswerLengthToggle />
        <div className="nav-credit">
          Lovingly developed by Matthias Blomme and Francis Cocx
        </div>
      </nav>
      <main className="main">
        <Outlet />
        {false && <Footer />}
      </main>
    </div>
  );
}

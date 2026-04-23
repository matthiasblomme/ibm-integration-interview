import { NavLink, Outlet } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { AnswerLengthToggle } from './AnswerLengthToggle';

export function Layout() {
  return (
    <div className="layout">
      <nav className="nav">
        <div className="brand">IBM Integration Prep</div>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/browse">Browse</NavLink>
        <NavLink to="/quiz">Quiz</NavLink>
        <NavLink to="/resources">Resources</NavLink>
        <ThemeToggle />
        <AnswerLengthToggle />
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

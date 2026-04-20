import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="layout">
      <nav className="nav">
        <div className="brand">IBM Integration Prep</div>
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/browse">Browse</NavLink>
        <NavLink to="/quiz">Quiz</NavLink>
        <NavLink to="/resources">Resources</NavLink>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

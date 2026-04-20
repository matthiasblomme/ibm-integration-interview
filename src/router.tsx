import { createHashRouter } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Browse } from './pages/Browse';
import { Quiz } from './pages/Quiz';
import { Resources } from './pages/Resources';

export const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'browse', element: <Browse /> },
      { path: 'quiz', element: <Quiz /> },
      { path: 'resources', element: <Resources /> },
    ],
  },
]);

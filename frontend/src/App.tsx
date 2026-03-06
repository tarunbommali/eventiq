import {createBrowserRouter} from 'react-router-dom';
import Login from './pages/Login';
import {AppLayout} from './components/AppLayout';
import Home from './pages/Home';
import Bookings from './pages/Bookings';
import HostEvent from './pages/HostEvent';
import YourEvents from './pages/YourEvents';
import YourEventDetail from './pages/YourEventDetail';
import Profile from './pages/Profile';
import EventDetail from './pages/EventDetail';
import ErrorPage from './pages/ErrorPage';

const routes = [
  {
    path: "/login",
    element: <Login />
  },
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Home />
      },
      {
        path: "/bookings",
        element: <Bookings/>
      },
      {
        path: "/events/new",
        element: <HostEvent />
      },
      {
        path: "/events/mine",
        element: <YourEvents />
      },
      {
        path: "/events/mine/:id",
        element: <YourEventDetail />
      },
      {
        path: "/events/:eventId",
        element: <EventDetail />
      },
      {
        path: "/profile",
        element: <Profile />
      }
  ]
  }
]
export const router = createBrowserRouter(routes);

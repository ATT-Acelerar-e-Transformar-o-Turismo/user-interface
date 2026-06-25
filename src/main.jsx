import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routesList } from './routes.jsx'
import ServerError from './pages/errors/ServerError';
import { AuthProvider } from './contexts/AuthContext';
import { AreaProvider } from './contexts/AreaContext';
import { IndicatorProvider } from './contexts/IndicatorContext';
import { ResourceProvider } from './contexts/ResourceContext';
import { WrapperProvider } from './contexts/WrapperContext';
import ToastContainer from './components/ToastContainer';
import ConfirmDialogHost from './components/ConfirmDialogHost';
// Temporarily disabled — re-enable with the <UnderDevelopmentModal /> below.
// import UnderDevelopmentModal from './components/UnderDevelopmentModal';
import './i18n';
import AOS from 'aos';
import 'aos/dist/aos.css';

AOS.init({
  duration: 1400,
  easing: 'cubic-bezier(0.88, 0.01, 0.1, 1)',
  once: false,
  mirror: true,
});

// Attach the on-brand 500 page as the fallback for any uncaught render error
// or loader/action throw in any route. Without this, React Router would show
// its bare default error UI which doesn't match the rest of the app.
const router = createBrowserRouter(
  routesList.map(route => ({ errorElement: <ServerError />, ...route })),
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AreaProvider>
        <IndicatorProvider>
          <ResourceProvider>
            <WrapperProvider>
              <RouterProvider
                router={router}
                future={{ v7_startTransition: true ,}}
              />
              <ToastContainer />
              <ConfirmDialogHost />
              {/* Temporarily disabled — re-enable to show the platform-under-development notice. */}
              {/* <UnderDevelopmentModal /> */}
            </WrapperProvider>
          </ResourceProvider>
        </IndicatorProvider>
      </AreaProvider>
    </AuthProvider>
  </React.StrictMode>
)

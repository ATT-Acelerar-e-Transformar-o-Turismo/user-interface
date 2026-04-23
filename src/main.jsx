import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routesList } from './routes.jsx'
import { AuthProvider } from './contexts/AuthContext';
import { AreaProvider } from './contexts/AreaContext';
import { IndicatorProvider } from './contexts/IndicatorContext';
import { ResourceProvider } from './contexts/ResourceContext';
import { WrapperProvider } from './contexts/WrapperContext';
import ToastContainer from './components/ToastContainer';
import ConfirmDialogHost from './components/ConfirmDialogHost';
import './i18n';
import AOS from 'aos';
import 'aos/dist/aos.css';

AOS.init({
  duration: 1400,
  easing: 'cubic-bezier(0.88, 0.01, 0.1, 1)',
  once: false,
  mirror: true,
});

const router = createBrowserRouter(routesList)

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
            </WrapperProvider>
          </ResourceProvider>
        </IndicatorProvider>
      </AreaProvider>
    </AuthProvider>
  </React.StrictMode>
)

import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routesList } from './routes.jsx'
import { AuthProvider } from './contexts/AuthContext';
import { DomainProvider } from './contexts/DomainContext';
import { IndicatorProvider } from './contexts/IndicatorContext';
import { ResourceProvider } from './contexts/ResourceContext';
import { WrapperProvider } from './contexts/WrapperContext';

const router = createBrowserRouter(routesList)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <DomainProvider>
        <IndicatorProvider>
          <ResourceProvider>
            <WrapperProvider>
              <RouterProvider
                router={router}
                future={{ v7_startTransition: true ,}}
              />
            </WrapperProvider>
          </ResourceProvider>
        </IndicatorProvider>
      </DomainProvider>
    </AuthProvider>
  </React.StrictMode>
)

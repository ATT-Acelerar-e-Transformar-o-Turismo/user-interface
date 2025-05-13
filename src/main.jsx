import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { routesList } from './routes.jsx'
import { DomainProvider } from './contexts/DomainContext';
import { ResourceProvider } from './contexts/ResourceContext';
import LocalStorageInitializer from './contexts/LocalStorageInitializer';

const router = createBrowserRouter(routesList)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DomainProvider>
      <ResourceProvider>
        <LocalStorageInitializer />
        <RouterProvider 
          router={router} 
          future={{ v7_startTransition: true ,}}
        />
      </ResourceProvider>
    </DomainProvider>
  </React.StrictMode>
)

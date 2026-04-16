import App from "./App";
import DomainTemplate from "./pages/DomainTemplate";
import DomainSelectionPage from "./pages/DomainSelectionPage";
import DomainsManagement from "./pages/DomainsManagement";
import FavoritesPage from "./pages/FavoritesPage";
import { Helmet } from "react-helmet";
import IndicatorTemplate from "./pages/IndicatorTemplate";
import IndicatorsManagement from "./pages/IndicatorsManagement";
import DimensionsManagement from "./pages/DimensionsManagement";
import ResourcesManagement from "./pages/ResourcesManagement";
import NewDomain from "./pages/NewDomain";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import PublicationsPage from "./pages/PublicationsPage";
import BlogManagement from "./pages/BlogManagement";
import BlogPostForm from "./pages/BlogPostForm";
import UserManagement from "./pages/UserManagement";
import AdminLogin from "./pages/AdminLogin";
import QuemSomos from "./pages/roots/QuemSomos";
import Governanca from "./pages/roots/Governanca";
import Territorio from "./pages/roots/Territorio";
import RedesCertificacoes from "./pages/roots/RedesCertificacoes";
import ProtectedRoute from "./components/ProtectedRoute";

export const routesList = [
    {
        path: '/',
        element: (
            <>
                <Helmet>
                    <title>Home</title>
                </Helmet>
                <App />
            </>
        )
    },
    {
        path: '/home',
        element: (
            <>
                <Helmet>
                    <title>Home</title>
                </Helmet>
                <App />
            </>
        )
    },
    {
        path: '/favorites',
        element: (
            <>
                <Helmet>
                    <title>Favorites</title>
                </Helmet>
                <FavoritesPage />
            </>
        )
    },
    {
        path: '/indicators',
        element: (
            <>
                <Helmet>
                    <title>Indicators</title>
                </Helmet>
                <DomainSelectionPage />
            </>
        )
    },
    {
        path: '/all-indicators',
        element: (
            <>
                <Helmet>
                    <title>ROOTS - Todos os Indicadores</title>
                </Helmet>
                <DomainTemplate />
            </>
        )
    },
    {
        path: '/indicators/:domainPath',
        element: (
            <>
                <Helmet>
                    <title>Domain Indicators</title>
                </Helmet>
                <DomainTemplate />
            </>
        )
    },
    {
        path: '/indicator/:indicatorId',
        element: (
            <>
                <Helmet>
                    <title>Indicator</title>
                </Helmet>
                <IndicatorTemplate />
            </>
        )
    },
    {
        path: '/admin/login',
        element: (
            <>
                <Helmet>
                    <title>Admin Login</title>
                </Helmet>
                <AdminLogin />
            </>
        )
    },
    {
        path: '/admin/indicators-management',
        element: (
            <ProtectedRoute>
                <Helmet>
                    <title>Indicators Management</title>
                </Helmet>
                <IndicatorsManagement />
            </ProtectedRoute>
        )
    },
    {
        path: '/admin',
        element: (
            <ProtectedRoute>
                <Helmet>
                    <title>Admin Overview</title>
                </Helmet>
                <IndicatorsManagement />
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/dimensions',
        element: (
            <ProtectedRoute>
                <Helmet>
                    <title>Dimensions Management</title>
                </Helmet>
                <DimensionsManagement />
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/domains',
        element: (
            <ProtectedRoute>
                <Helmet>
                    <title>Indicadores por Domínio</title>
                </Helmet>
                <DomainSelectionPage />
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/domains-management',
        element: (
            <ProtectedRoute>
                <Helmet>
                    <title>Domains Management</title>
                </Helmet>
                <DomainsManagement />
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/resources-management/:indicator',
        element: (
            <ProtectedRoute>
                <Helmet>
                    <title>Resources</title>
                </Helmet>
                <ResourcesManagement />
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/new_domain',
        element: (
            <ProtectedRoute>
                <Helmet>
                    <title>New Domain</title>
                </Helmet>
                <NewDomain />
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/edit_domain/:id',
        element: (
            <ProtectedRoute>
                <Helmet>
                    <title>Edit Domain</title>
                </Helmet>
                <NewDomain />
            </ProtectedRoute>
        )
    },
    {
        path: '/search',
        element: (
            <>
                <Helmet>
                    <title>Search Results</title>
                </Helmet>
                <DomainTemplate />
            </>
        )
    },
    {
        path: '/news-events',
        element: (
            <>
                <Helmet>
                    <title>News & Events</title>
                </Helmet>
                <BlogPage />
            </>
        )
    },
    {
        path: '/news-events/:postId',
        element: (
            <>
                <Helmet>
                    <title>News & Events - Post</title>
                </Helmet>
                <BlogPostPage />
            </>
        )
    },
    {
        path: '/publications',
        element: (
            <>
                <Helmet>
                    <title>Publications</title>
                </Helmet>
                <PublicationsPage />
            </>
        )
    },
    {
        path: '/publications/:postId',
        element: (
            <>
                <Helmet>
                    <title>Publication</title>
                </Helmet>
                <BlogPostPage />
            </>
        )
    },
    {
        path: '/admin/news-events',
        element: (
            <ProtectedRoute>
                <Helmet>
                    <title>News & Events - Management</title>
                </Helmet>
                <BlogManagement />
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/news-events/create',
        element: (
            <ProtectedRoute>
                <Helmet>
                    <title>News & Events - Create Post</title>
                </Helmet>
                <BlogPostForm />
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/news-events/edit/:postId',
        element: (
            <ProtectedRoute>
                <Helmet>
                    <title>News & Events - Edit Post</title>
                </Helmet>
                <BlogPostForm />
            </ProtectedRoute>
        )
    },
    {
        path: '/admin/users',
        element: (
            <ProtectedRoute>
                <Helmet>
                    <title>User Management</title>
                </Helmet>
                <UserManagement />
            </ProtectedRoute>
        )
    },
    {
        path: '/roots/about',
        element: (
            <>
                <Helmet>
                    <title>ROOTS - Quem somos?</title>
                </Helmet>
                <QuemSomos />
            </>
        )
    },
    {
        path: '/roots/governance',
        element: (
            <>
                <Helmet>
                    <title>ROOTS - Governança</title>
                </Helmet>
                <Governanca />
            </>
        )
    },
    {
        path: '/roots/territory',
        element: (
            <>
                <Helmet>
                    <title>ROOTS - Território</title>
                </Helmet>
                <Territorio />
            </>
        )
    },
    {
        path: '/roots/networks-certifications',
        element: (
            <>
                <Helmet>
                    <title>ROOTS - Redes e Certificações</title>
                </Helmet>
                <RedesCertificacoes />
            </>
        )
    }
];
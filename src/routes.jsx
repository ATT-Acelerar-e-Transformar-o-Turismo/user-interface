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
import BlogManagement from "./pages/BlogManagement";
import BlogPostForm from "./pages/BlogPostForm";
import UserManagement from "./pages/UserManagement";

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
        path: '/admin/indicators-management',
        element: (
            <>
                <Helmet>
                    <title>Indicators Management</title>
                </Helmet>
                <IndicatorsManagement />
            </>
        )
    },
    {
        path: '/admin',
        element: (
            <>
                <Helmet>
                    <title>Admin Overview</title>
                </Helmet>
                <IndicatorsManagement />
            </>
        )
    },
    {
        path: '/admin/dimensions',
        element: (
            <>
                <Helmet>
                    <title>Dimensions Management</title>
                </Helmet>
                <DimensionsManagement />
            </>
        )
    },
    {
        path: '/admin/domains',
        element: (
            <>
                <Helmet>
                    <title>Indicadores por Domínio</title>
                </Helmet>
                <DomainSelectionPage />
            </>
        )
    },
    {
        path: '/admin/domains-management',
        element: (
            <>
                <Helmet>
                    <title>Domains Management</title>
                </Helmet>
                <DomainsManagement />
            </>
        )
    },
    {
        path: '/admin/resources-management/:indicator',
        element: (
            <>
                <Helmet>
                    <title>Resources</title>
                </Helmet>
                <ResourcesManagement />
            </>
        )
    },
    {
        path: '/admin/new_domain',
        element: (
            <>
                <Helmet>
                    <title>New Domain</title>
                </Helmet>
                <NewDomain />
            </>
        )
    },
    {
        path: '/admin/edit_domain/:id',
        element: (
            <>
                <Helmet>
                    <title>Edit Domain</title>
                </Helmet>
                <NewDomain />
            </>
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
        path: '/admin/news-events',
        element: (
            <>
                <Helmet>
                    <title>News & Events - Management</title>
                </Helmet>
                <BlogManagement />
            </>
        )
    },
    {
        path: '/admin/news-events/create',
        element: (
            <>
                <Helmet>
                    <title>News & Events - Create Post</title>
                </Helmet>
                <BlogPostForm />
            </>
        )
    },
    {
        path: '/admin/news-events/edit/:postId',
        element: (
            <>
                <Helmet>
                    <title>News & Events - Edit Post</title>
                </Helmet>
                <BlogPostForm />
            </>
        )
    },
    {
        path: '/admin/users',
        element: (
            <>
                <Helmet>
                    <title>User Management</title>
                </Helmet>
                <UserManagement />
            </>
        )
    }
];
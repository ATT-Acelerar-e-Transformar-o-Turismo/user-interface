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
                    <title>ATT - Home</title>
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
                    <title>ATT - Home</title>
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
                    <title>ATT - Favorites</title>
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
                    <title>ATT - All Indicators</title>
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
                    <title>ATT - Domain Indicators</title>
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
                    <title>ATT - Indicator</title>
                </Helmet>
                <IndicatorTemplate />
            </>
        )
    },
    {
        path: '/indicators-management',
        element: (
            <>
                <Helmet>
                    <title>ATT - Indicators Management</title>
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
                    <title>ATT - Admin Overview</title>
                </Helmet>
                <IndicatorsManagement />
            </>
        )
    },
    {
        path: '/dimensions',
        element: (
            <>
                <Helmet>
                    <title>ATT - Dimensions Management</title>
                </Helmet>
                <DimensionsManagement />
            </>
        )
    },
    {
        path: '/domains',
        element: (
            <>
                <Helmet>
                    <title>ATT - Indicadores por Domínio</title>
                </Helmet>
                <DomainSelectionPage />
            </>
        )
    },
    {
        path: '/domains-management',
        element: (
            <>
                <Helmet>
                    <title>ATT - Domains Management</title>
                </Helmet>
                <DomainsManagement />
            </>
        )
    },
    {
        path: '/resources-management/:indicator',
        element: (
            <>
                <Helmet>
                    <title>ATT - Resources</title>
                </Helmet>
                <ResourcesManagement />
            </>
        )
    },
    {
        path: '/new_domain',
        element: (
            <>
                <Helmet>
                    <title>ATT - New Domain</title>
                </Helmet>
                <NewDomain />
            </>
        )
    },
    {
        path: '/edit_domain/:id',
        element: (
            <>
                <Helmet>
                    <title>ATT - Edit Domain</title>
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
                    <title>ATT - Search Results</title>
                </Helmet>
                <DomainTemplate />
            </>
        )
    },
    {
        path: '/blog',
        element: (
            <>
                <Helmet>
                    <title>ROOTS - Blog</title>
                </Helmet>
                <BlogPage />
            </>
        )
    },
    {
        path: '/blog/:postId',
        element: (
            <>
                <Helmet>
                    <title>ROOTS - Blog Post</title>
                </Helmet>
                <BlogPostPage />
            </>
        )
    },
    {
        path: '/admin/blog',
        element: (
            <>
                <Helmet>
                    <title>ROOTS - Blog Management</title>
                </Helmet>
                <BlogManagement />
            </>
        )
    },
    {
        path: '/admin/blog/create',
        element: (
            <>
                <Helmet>
                    <title>ROOTS - Create Blog Post</title>
                </Helmet>
                <BlogPostForm />
            </>
        )
    },
    {
        path: '/admin/blog/edit/:postId',
        element: (
            <>
                <Helmet>
                    <title>ROOTS - Edit Blog Post</title>
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
                    <title>ATT - User Management</title>
                </Helmet>
                <UserManagement />
            </>
        )
    }
];
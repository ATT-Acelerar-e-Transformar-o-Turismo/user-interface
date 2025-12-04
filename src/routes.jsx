import App from "./App";
import AddResource from "./pages/AddResource";
import DomainTemplate from "./pages/DomainTemplate";
import FavoritesPage from "./pages/FavoritesPage";
import { Helmet } from "react-helmet";
import IndicatorTemplate from "./pages/IndicatorTemplate";
import NewIndicator from "./pages/NewIndicator";
import IndicatorsManagement from "./pages/IndicatorsManagement";
import ResourcesManagement from "./pages/ResourcesManagement";
import NewDomain from "./pages/NewDomain";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import BlogManagement from "./pages/BlogManagement";
import BlogPostForm from "./pages/BlogPostForm";

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
        path: '/environment',
        element: (
            <>
                <Helmet>
                    <title>ATT - Environment</title>
                </Helmet>
                <DomainTemplate />
            </>
        )
    },
    {
        path: '/economy',
        element: (
            <>
                <Helmet>
                    <title>ATT - Economy</title>
                </Helmet>
                <DomainTemplate />
            </>
        )
    },
    {
        path: '/sociaty',
        element: (
            <>
                <Helmet>
                    <title>ATT - Sociaty</title>
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
        path: '/new_indicator',
        element: (
            <>
                <Helmet>
                    <title>ATT - New Indicator</title>
                </Helmet>
                <NewIndicator />
            </>
        )
    },
    {
        path: '/add_data_resource',
        element: (
            <>
                <Helmet>
                    <title>ATT - Add Data Resource</title>
                </Helmet>
                <AddResource />
            </>
        )
    },
    {
        path: '/add_data_resource/:indicator',
        element: (
            <>
                <Helmet>
                    <title>ATT - Add Data Resource</title>
                </Helmet>
                <AddResource />
            </>
        )
    },
    {
        path: '/indicators-management',
        element: (
            <>
                <Helmet>
                    <title>ATT - Indicators</title>
                </Helmet>
                <IndicatorsManagement />
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
        path: '/edit_indicator/:indicatorId',
        element: (
            <>
                <Helmet>
                    <title>ATT - Edit Indicator</title>
                </Helmet>
                <NewIndicator />
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
        path: '/edit_resource/:resourceId',
        element: (
            <>
                <Helmet>
                    <title>ATT - Edit Resource</title>
                </Helmet>
                <AddResource />
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
        path: '/:domainPath',
        element: (
            <>
                <Helmet>
                    <title>ATT - Domain</title>
                </Helmet>
                <DomainTemplate />
            </>
        )
    }
];
import App from "./App";
// import AddResource from "./pages/AddResource"; // Replaced by ResourceWizard modal
import DomainTemplate from "./pages/DomainTemplate";
import DomainSelectionPage from "./pages/DomainSelectionPage";
import DomainsManagement from "./pages/DomainsManagement";
import FavoritesPage from "./pages/FavoritesPage";
import { Helmet } from "react-helmet";
import IndicatorTemplate from "./pages/IndicatorTemplate";
// import NewIndicator from "./pages/NewIndicator"; // Replaced by IndicatorWizard modal
import IndicatorsManagement from "./pages/IndicatorsManagement";
import DimensionsManagement from "./pages/DimensionsManagement";
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
    // Removed - replaced by IndicatorWizard modal in IndicatorsManagement
    // {
    //     path: '/new_indicator',
    //     element: (
    //         <>
    //             <Helmet>
    //                 <title>ATT - New Indicator</title>
    //             </Helmet>
    //             <NewIndicator />
    //         </>
    //     )
    // },
    // Removed - replaced by ResourceWizard modal (TODO: update ResourcesManagement to use modal)
    // {
    //     path: '/add_data_resource',
    //     element: (
    //         <>
    //             <Helmet>
    //                 <title>ATT - Add Data Resource</title>
    //             </Helmet>
    //             <AddResource />
    //         </>
    //     )
    // },
    // {
    //     path: '/add_data_resource/:indicator',
    //     element: (
    //         <>
    //             <Helmet>
    //                 <title>ATT - Add Data Resource</title>
    //             </Helmet>
    //             <AddResource />
    //         </>
    //     )
    // },
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
    // Removed - editing is handled by IndicatorWizard modal in IndicatorsManagement
    // {
    //     path: '/edit_indicator/:indicatorId',
    //     element: (
    //         <>
    //             <Helmet>
    //                 <title>ATT - Edit Indicator</title>
    //             </Helmet>
    //             <NewIndicator />
    //         </>
    //     )
    // },
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
    // Removed - editing is handled by ResourceWizard modal (TODO: update ResourcesManagement to use modal)
    // {
    //     path: '/edit_resource/:resourceId',
    //     element: (
    //         <>
    //             <Helmet>
    //                 <title>ATT - Edit Resource</title>
    //             </Helmet>
    //             <AddResource />
    //         </>
    //     )
    // },
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
    // {
    //     path: '/:domainPath',
    //     element: (
    //         <>
    //             <Helmet>
    //                 <title>ATT - Domain</title>
    //             </Helmet>
    //             <DomainTemplate />
    //         </>
    //     )
    // }
];
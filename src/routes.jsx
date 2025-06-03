import App from "./App";
import AddResource from "./pages/AddResource";
import DomainTemplate from "./pages/DomainTemplate";
import FavoritesPage from "./pages/FavoritesPage";
import IndicatorTemplate from "./pages/IndicatorTemplate";
import NewIndicator from "./pages/NewIndicator";
import IndicatorsManagement from "./pages/IndicatorsManagement";
import ResourcesManagement from "./pages/ResourcesManagement";
import NewDomain from "./pages/NewDomain";

export const routesList = [
    {
        path: '/home',
        element: (
            <>
                <title>ATT - Home</title>
                <App />
            </>
        )
    },
    {
        path: '/favorites',
        element: (
            <>
                <title>ATT - Favorites</title>
                <FavoritesPage />
            </>
        )
    },
    {
        path: '/environment',
        element: (
            <>
                <title>ATT - Environment</title>
                <DomainTemplate />
            </>
        )
    },
    {
        path: '/economy',
        element: (
            <>
                <title>ATT - Economy</title>
                <DomainTemplate />
            </>
        )
    },
    {
        path: '/sociaty',
        element: (
            <>
                <title>ATT - Sociaty</title>
                <DomainTemplate />
            </>
        )
    },
    {
        path: '/indicator/:indicatorId',
        element: (
            <>
                <title>ATT - Indicator</title>
                <IndicatorTemplate />
            </>
        )
    },
    {
        path: '/new_indicator',
        element: (
            <>
                <title>ATT - New Indicator</title>
                <NewIndicator />
            </>
        )
    },
    {
        path: '/add_data_resource',
        element: (
            <>
                <title>ATT - Add Data Resource</title>
                <AddResource />
            </>
        )
    },
    {
        path: '/add_data_resource/:indicator',
        element: (
            <>
                <title>ATT - Add Data Resource</title>
                <AddResource />
            </>
        )
    },
    {
        path: '/indicators-management',
        element: (
            <>
                <title>ATT - Indicators</title>
                <IndicatorsManagement />
            </>
        )
    },
    {
        path: '/resources-management/:indicator',
        element: (
            <>
                <title>ATT - Resources</title>
                <ResourcesManagement />
            </>
        )
    },
    {
        path: '/new_domain',
        element: (
            <>
                <title>ATT - New Domain</title>
                <NewDomain />
            </>
        )
    },
    {
        path: '/edit_indicator/:indicatorId',
        element: (
            <>
                <title>ATT - Edit Indicator</title>
                <NewIndicator />
            </>
        )
    },
    {
        path: '/edit_domain/:id',
        element: (
            <>
                <title>ATT - Edit Domain</title>
                <NewDomain />
            </>
        )
    }
];
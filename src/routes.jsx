import App from "./App";
import DomainTemplate from "./Routes/DomainTemplate";
import { Helmet } from "react-helmet";
import IndicatorTemplate from "./Routes/IndicatorTemplate";
import NewIndicator from "./Routes/NewIndicator";
import IndicatorsManagement from "./Routes/IndicatorsManagement";
import ResourcesManagement from "./Routes/ResourcesManagement";
import NewDomain from "./Routes/NewDomain";
import EditDomain from "./Routes/EditDomain";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

export const routesList = [
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
                <EditDomain />
            </>
        )
    }
];
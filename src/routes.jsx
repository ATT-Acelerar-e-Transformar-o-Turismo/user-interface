import App from "./App";
import DomainTemplate from "./Routes/DomainTemplate";
import { Helmet } from "react-helmet";
import IndicatorTemplate from "./Routes/IndicatorTemplate";

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
    }
];
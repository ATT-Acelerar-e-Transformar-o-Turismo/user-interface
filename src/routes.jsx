import App from "./App";
import Environment from "./Routes/Environment";
import { Helmet } from "react-helmet";

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
                <Environment />
            </>
        )
    }
];
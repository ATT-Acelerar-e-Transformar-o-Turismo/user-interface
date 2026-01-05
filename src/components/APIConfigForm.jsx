import { useState } from 'react';

export default function APIConfigForm({ onConfigChange }) {
    const [config, setConfig] = useState({
        location: '',
        auth_type: 'none',
        api_key: '',
        api_key_header: 'X-API-Key',
        bearer_token: '',
        username: '',
        password: '',
        timeout_seconds: 30,
        custom_headers: {},
        query_params: {}
    });

    const [customHeaderKey, setCustomHeaderKey] = useState('');
    const [customHeaderValue, setCustomHeaderValue] = useState('');
    const [queryParamKey, setQueryParamKey] = useState('');
    const [queryParamValue, setQueryParamValue] = useState('');

    const handleChange = (field, value) => {
        const newConfig = { ...config, [field]: value };
        setConfig(newConfig);
        if (onConfigChange) {
            onConfigChange(newConfig);
        }
    };

    const addCustomHeader = () => {
        if (customHeaderKey && customHeaderValue) {
            const newHeaders = { ...config.custom_headers, [customHeaderKey]: customHeaderValue };
            handleChange('custom_headers', newHeaders);
            setCustomHeaderKey('');
            setCustomHeaderValue('');
        }
    };

    const removeCustomHeader = (key) => {
        const newHeaders = { ...config.custom_headers };
        delete newHeaders[key];
        handleChange('custom_headers', newHeaders);
    };

    const addQueryParam = () => {
        if (queryParamKey && queryParamValue) {
            const newParams = { ...config.query_params, [queryParamKey]: queryParamValue };
            handleChange('query_params', newParams);
            setQueryParamKey('');
            setQueryParamValue('');
        }
    };

    const removeQueryParam = (key) => {
        const newParams = { ...config.query_params };
        delete newParams[key];
        handleChange('query_params', newParams);
    };

    return (
        <div className="space-y-4 border p-4 rounded-lg bg-gray-50">
            <h3 className="font-bold text-lg">API Configuration</h3>

            <div>
                <label className="block text-sm font-medium mb-1">API Endpoint URL *</label>
                <input
                    type="url"
                    className="input input-bordered w-full"
                    value={config.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    placeholder="https://api.example.com/data"
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Authentication Type</label>
                <select
                    className="select select-bordered w-full"
                    value={config.auth_type}
                    onChange={(e) => handleChange('auth_type', e.target.value)}
                >
                    <option value="none">None</option>
                    <option value="api_key">API Key</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                </select>
            </div>

            {config.auth_type === 'api_key' && (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-1">API Key</label>
                        <input
                            type="password"
                            className="input input-bordered w-full"
                            value={config.api_key}
                            onChange={(e) => handleChange('api_key', e.target.value)}
                            placeholder="Enter API key"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">API Key Header Name</label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value={config.api_key_header}
                            onChange={(e) => handleChange('api_key_header', e.target.value)}
                            placeholder="X-API-Key"
                        />
                    </div>
                </>
            )}

            {config.auth_type === 'bearer' && (
                <div>
                    <label className="block text-sm font-medium mb-1">Bearer Token</label>
                    <input
                        type="password"
                        className="input input-bordered w-full"
                        value={config.bearer_token}
                        onChange={(e) => handleChange('bearer_token', e.target.value)}
                        placeholder="Enter bearer token"
                    />
                </div>
            )}

            {config.auth_type === 'basic' && (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value={config.username}
                            onChange={(e) => handleChange('username', e.target.value)}
                            placeholder="Enter username"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            className="input input-bordered w-full"
                            value={config.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>
                </>
            )}

            <div>
                <label className="block text-sm font-medium mb-1">Timeout (seconds)</label>
                <input
                    type="number"
                    className="input input-bordered w-full"
                    value={config.timeout_seconds}
                    onChange={(e) => handleChange('timeout_seconds', parseInt(e.target.value))}
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Custom Headers</label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        className="input input-bordered flex-1"
                        value={customHeaderKey}
                        onChange={(e) => setCustomHeaderKey(e.target.value)}
                        placeholder="Header name"
                    />
                    <input
                        type="text"
                        className="input input-bordered flex-1"
                        value={customHeaderValue}
                        onChange={(e) => setCustomHeaderValue(e.target.value)}
                        placeholder="Header value"
                    />
                    <button
                        type="button"
                        className="btn btn-sm btn-neutral"
                        onClick={addCustomHeader}
                    >
                        Add
                    </button>
                </div>
                {Object.keys(config.custom_headers).length > 0 && (
                    <div className="space-y-1">
                        {Object.entries(config.custom_headers).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center bg-white p-2 rounded">
                                <span className="text-sm"><strong>{key}:</strong> {value}</span>
                                <button
                                    type="button"
                                    className="btn btn-xs btn-ghost"
                                    onClick={() => removeCustomHeader(key)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Query Parameters</label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="text"
                        className="input input-bordered flex-1"
                        value={queryParamKey}
                        onChange={(e) => setQueryParamKey(e.target.value)}
                        placeholder="Parameter name"
                    />
                    <input
                        type="text"
                        className="input input-bordered flex-1"
                        value={queryParamValue}
                        onChange={(e) => setQueryParamValue(e.target.value)}
                        placeholder="Parameter value"
                    />
                    <button
                        type="button"
                        className="btn btn-sm btn-neutral"
                        onClick={addQueryParam}
                    >
                        Add
                    </button>
                </div>
                {Object.keys(config.query_params).length > 0 && (
                    <div className="space-y-1">
                        {Object.entries(config.query_params).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center bg-white p-2 rounded">
                                <span className="text-sm"><strong>{key}:</strong> {value}</span>
                                <button
                                    type="button"
                                    className="btn btn-xs btn-ghost"
                                    onClick={() => removeQueryParam(key)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

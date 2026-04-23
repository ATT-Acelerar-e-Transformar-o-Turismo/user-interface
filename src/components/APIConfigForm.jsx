import { useState } from 'react';
import FormInput from './forms/FormInput';
import FormSelect from './forms/FormSelect';

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

    const authTypeOptions = [
        { value: 'none', label: 'None' },
        { value: 'api_key', label: 'API Key' },
        { value: 'bearer', label: 'Bearer Token' },
        { value: 'basic', label: 'Basic Auth' },
    ];

    return (
        <div className="space-y-4 p-4 rounded-lg bg-[#f8f8f8]">
            <h3 className="font-['Onest',sans-serif] font-bold text-lg">API Configuration</h3>

            <FormInput
                label="API Endpoint URL"
                name="location"
                type="url"
                value={config.location}
                onChange={(value) => handleChange('location', value)}
                placeholder="https://api.example.com/data"
                required
            />

            <FormSelect
                label="Authentication Type"
                name="auth_type"
                value={config.auth_type}
                onChange={(value) => handleChange('auth_type', value)}
                options={authTypeOptions}
            />

            {config.auth_type === 'api_key' && (
                <>
                    <FormInput
                        label="API Key"
                        name="api_key"
                        type="password"
                        value={config.api_key}
                        onChange={(value) => handleChange('api_key', value)}
                        placeholder="Enter API key"
                    />
                    <FormInput
                        label="API Key Header Name"
                        name="api_key_header"
                        value={config.api_key_header}
                        onChange={(value) => handleChange('api_key_header', value)}
                        placeholder="X-API-Key"
                    />
                </>
            )}

            {config.auth_type === 'bearer' && (
                <FormInput
                    label="Bearer Token"
                    name="bearer_token"
                    type="password"
                    value={config.bearer_token}
                    onChange={(value) => handleChange('bearer_token', value)}
                    placeholder="Enter bearer token"
                />
            )}

            {config.auth_type === 'basic' && (
                <>
                    <FormInput
                        label="Username"
                        name="username"
                        value={config.username}
                        onChange={(value) => handleChange('username', value)}
                        placeholder="Enter username"
                    />
                    <FormInput
                        label="Password"
                        name="password"
                        type="password"
                        value={config.password}
                        onChange={(value) => handleChange('password', value)}
                        placeholder="Enter password"
                    />
                </>
            )}

            <FormInput
                label="Timeout (seconds)"
                name="timeout_seconds"
                type="number"
                value={String(config.timeout_seconds ?? '')}
                onChange={(value) => handleChange('timeout_seconds', parseInt(value, 10) || 0)}
            />

            <div className="flex flex-col gap-2">
                <label className="font-['Onest',sans-serif] font-medium text-sm text-black">
                    Custom Headers
                </label>
                <div className="flex gap-2">
                    <FormInput
                        name="customHeaderKey"
                        value={customHeaderKey}
                        onChange={setCustomHeaderKey}
                        placeholder="Header name"
                        className="flex-1"
                    />
                    <FormInput
                        name="customHeaderValue"
                        value={customHeaderValue}
                        onChange={setCustomHeaderValue}
                        placeholder="Header value"
                        className="flex-1"
                    />
                    <button
                        type="button"
                        className="btn btn-primary self-end"
                        onClick={addCustomHeader}
                    >
                        Add
                    </button>
                </div>
                {Object.keys(config.custom_headers).length > 0 && (
                    <div className="space-y-1">
                        {Object.entries(config.custom_headers).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center bg-white p-2 rounded">
                                <span className="font-['Onest',sans-serif] text-sm"><strong>{key}:</strong> {value}</span>
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

            <div className="flex flex-col gap-2">
                <label className="font-['Onest',sans-serif] font-medium text-sm text-black">
                    Query Parameters
                </label>
                <div className="flex gap-2">
                    <FormInput
                        name="queryParamKey"
                        value={queryParamKey}
                        onChange={setQueryParamKey}
                        placeholder="Parameter name"
                        className="flex-1"
                    />
                    <FormInput
                        name="queryParamValue"
                        value={queryParamValue}
                        onChange={setQueryParamValue}
                        placeholder="Parameter value"
                        className="flex-1"
                    />
                    <button
                        type="button"
                        className="btn btn-primary self-end"
                        onClick={addQueryParam}
                    >
                        Add
                    </button>
                </div>
                {Object.keys(config.query_params).length > 0 && (
                    <div className="space-y-1">
                        {Object.entries(config.query_params).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center bg-white p-2 rounded">
                                <span className="font-['Onest',sans-serif] text-sm"><strong>{key}:</strong> {value}</span>
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

import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, SOCKET_URL, warnIfMisconfigured } from '../config/api.js';

const ConnectionTest = () => {
  const [backendStatus, setBackendStatus] = useState({ text: 'Testing...', code: null });
  const [apiTest, setApiTest] = useState({ text: 'Not tested', code: null });
  const [lastSuccess, setLastSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    // Test backend connection
    warnIfMisconfigured();

    const testBackend = async () => {
      abortRef.current = new AbortController();
      try {
        const response = await fetch(`${API_BASE_URL}/`, { signal: abortRef.current.signal });
        if (response.ok) {
          const data = await response.json();
          setBackendStatus({ text: `Connected: ${data?.message ?? 'OK'}`, code: response.status });
          setLastSuccess(new Date());
        } else {
          setBackendStatus({ text: `Error: ${response.status}`, code: response.status });
        }
      } catch (error) {
        if (error.name === 'AbortError') return;
        setBackendStatus({ text: `Failed: ${error.message}`, code: null });
      }
    };

    testBackend();
  }, []);

  const testApiEndpoint = async () => {
    setLoading(true);
    try {
      setApiTest({ text: 'Testing...', code: null });
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setApiTest({ text: `Health check: ${data?.status ?? 'OK'}`, code: response.status });
        setLastSuccess(new Date());
      } else {
        setApiTest({ text: `Error: ${response.status}`, code: response.status });
      }
    } catch (error) {
      setApiTest({ text: `Failed: ${error.message}`, code: null });
    } finally {
      setLoading(false);
    }
  };

  const retryAll = () => {
    if (abortRef.current) abortRef.current.abort();
    setBackendStatus({ text: 'Testing...', code: null });
    setApiTest({ text: 'Not tested', code: null });
    setLastSuccess(null);
    // re-run tests
    testApiEndpoint();
    // kick off backend root check
    setTimeout(() => {
      // trigger useEffect by calling the same test logic
      fetch(`${API_BASE_URL}/`).then(async (response) => {
        if (response.ok) {
          const data = await response.json();
          setBackendStatus({ text: `Connected: ${data?.message ?? 'OK'}`, code: response.status });
          setLastSuccess(new Date());
        } else {
          setBackendStatus({ text: `Error: ${response.status}`, code: response.status });
        }
      }).catch((err) => setBackendStatus({ text: `Failed: ${err.message}`, code: null }));
    }, 100);
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      margin: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>🔗 Frontend-Backend Connection Test</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Backend URL:</strong> {API_BASE_URL}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Socket URL:</strong> {SOCKET_URL}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>Backend Status:</strong> {backendStatus.text} {backendStatus.code ? `(${backendStatus.code})` : null}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>API Test:</strong> {apiTest.text} {apiTest.code ? `(${apiTest.code})` : null}
        <button 
          onClick={testApiEndpoint}
          disabled={loading}
          style={{ 
            marginLeft: '10px', 
            padding: '5px 10px', 
            backgroundColor: loading ? '#6c757d' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test API'}
        </button>
        <button onClick={retryAll} style={{ marginLeft: '8px', padding: '5px 10px' }}>Retry All</button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <strong>Last successful check:</strong> {lastSuccess ? lastSuccess.toLocaleString() : 'Never'}
      </div>
      
      <div style={{ fontSize: '14px', color: '#666' }}>
        <p>✅ Backend should show: "Agricultural Monitoring Server is running!"</p>
        <p>✅ Health check should show: "OK" status</p>
        <p>✅ Socket.IO should connect for real-time features</p>
      </div>
    </div>
  );
};

export default ConnectionTest;

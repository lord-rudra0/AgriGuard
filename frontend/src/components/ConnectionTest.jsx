import { useState, useEffect } from 'react';
import { API_BASE_URL, SOCKET_URL } from '../config/api.js';

const ConnectionTest = () => {
  const [backendStatus, setBackendStatus] = useState('Testing...');
  const [apiTest, setApiTest] = useState('Not tested');

  useEffect(() => {
    // Test backend connection
    const testBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/`);
        if (response.ok) {
          const data = await response.json();
          setBackendStatus(`✅ Connected: ${data.message}`);
        } else {
          setBackendStatus(`❌ Error: ${response.status}`);
        }
      } catch (error) {
        setBackendStatus(`❌ Failed: ${error.message}`);
      }
    };

    testBackend();
  }, []);

  const testApiEndpoint = async () => {
    try {
      setApiTest('Testing...');
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setApiTest(`✅ Health check: ${data.status}`);
      } else {
        setApiTest(`❌ Error: ${response.status}`);
      }
    } catch (error) {
      setApiTest(`❌ Failed: ${error.message}`);
    }
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
        <strong>Backend Status:</strong> {backendStatus}
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <strong>API Test:</strong> {apiTest}
        <button 
          onClick={testApiEndpoint}
          style={{ 
            marginLeft: '10px', 
            padding: '5px 10px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test API
        </button>
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

import { useState, useEffect, useCallback } from 'react';
import useToolsStore from '../lib/stores/useToolsStore';

export default function VectorStoreToggle() {
  const { 
    fileSearchEnabled, 
    setFileSearchEnabled, 
    vectorStore, 
    setVectorStore 
  } = useToolsStore();
  
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch vector stores on mount
  useEffect(() => {
    fetchVectorStores();
  }, []);

  const fetchVectorStores = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // This endpoint would need to be implemented to list all vector stores
      const response = await fetch('/api/vector_stores/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch vector stores: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStores(data.data || []);
      
      // If we have stores but none selected, select the first one
      if (data.data && data.data.length > 0 && !vectorStore) {
        setVectorStore(data.data[0]);
      }
    } catch (err) {
      console.error('Error fetching vector stores:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [vectorStore, setVectorStore]);

  const handleToggle = () => {
    setFileSearchEnabled(!fileSearchEnabled);
  };

  const handleStoreChange = (e) => {
    const storeId = e.target.value;
    const selectedStore = stores.find(store => store.id === storeId);
    if (selectedStore) {
      setVectorStore(selectedStore);
    }
  };

  const handleCreateStore = async () => {
    try {
      const response = await fetch('/api/vector_stores/create_store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: `VA Store ${new Date().toISOString().slice(0, 10)}` }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create vector store: ${response.statusText}`);
      }
      
      const newStore = await response.json();
      setVectorStore(newStore);
      
      // Refresh list of stores
      fetchVectorStores();
    } catch (err) {
      console.error('Error creating vector store:', err);
      setError(err.message);
    }
  };

  return (
    <div className="vads-u-margin-bottom--4">
      <div className="vads-u-display--flex vads-u-align-items--center vads-u-margin-bottom--2">
        <h3 className="vads-u-margin--0 vads-u-margin-right--2">Vector Store Search</h3>
        <label className="va-checkbox-label vads-u-margin--0">
          <input
            type="checkbox"
            checked={fileSearchEnabled}
            onChange={handleToggle}
            className="va-checkbox"
          />
          <span>Enable vector store search</span>
        </label>
      </div>

      {fileSearchEnabled && (
        <div className="vads-u-background-color--gray-lightest vads-u-padding--2 vads-u-margin-top--1">
          {loading ? (
            <p>Loading vector stores...</p>
          ) : error ? (
            <p className="vads-u-color--error">{error}</p>
          ) : (
            <>
              <div className="vads-u-margin-bottom--2">
                <label htmlFor="vectorStore" className="vads-u-display--block vads-u-margin-bottom--1">
                  Select Vector Store
                </label>
                <select
                  id="vectorStore"
                  value={vectorStore?.id || ''}
                  onChange={handleStoreChange}
                  className="va-select"
                >
                  <option value="" disabled>Select a vector store</option>
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <button
                  className="usa-button vads-u-margin-right--2"
                  onClick={fetchVectorStores}
                >
                  Refresh List
                </button>
                <button
                  className="usa-button"
                  onClick={handleCreateStore}
                >
                  Create New Store
                </button>
              </div>
              
              {vectorStore && (
                <div className="vads-u-margin-top--2 vads-u-border-top--1px vads-u-padding-top--1 vads-u-border-color--gray">
                  <p className="vads-u-font-weight--bold">Current Store:</p>
                  <p>
                    Name: {vectorStore.name}<br />
                    ID: {vectorStore.id}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
} 
import { useState, useEffect } from 'react';
import useToolsStore from '../lib/stores/useToolsStore';

export default function WebSearchToggle() {
  const { webSearchEnabled, setWebSearchEnabled, webSearchConfig, setWebSearchConfig } = useToolsStore();
  const [location, setLocation] = useState({
    country: webSearchConfig?.user_location?.country || '',
    region: webSearchConfig?.user_location?.region || '',
    city: webSearchConfig?.user_location?.city || '',
  });

  // Update location in store when changed
  useEffect(() => {
    if (webSearchEnabled) {
      setWebSearchConfig({
        user_location: {
          type: 'approximate',
          ...location,
        },
      });
    }
  }, [location, webSearchEnabled, setWebSearchConfig]);

  const handleToggle = () => {
    setWebSearchEnabled(!webSearchEnabled);
  };

  const handleLocationChange = (event) => {
    const { name, value } = event.target;
    setLocation(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="vads-u-margin-bottom--4">
      <div className="vads-u-display--flex vads-u-align-items--center vads-u-margin-bottom--2">
        <h3 className="vads-u-margin--0 vads-u-margin-right--2">Web Search</h3>
        <label className="va-checkbox-label vads-u-margin--0">
          <input
            type="checkbox"
            checked={webSearchEnabled}
            onChange={handleToggle}
            className="va-checkbox"
          />
          <span>Enable web search for up-to-date information</span>
        </label>
      </div>

      {webSearchEnabled && (
        <div className="vads-u-background-color--gray-lightest vads-u-padding--2 vads-u-margin-top--1">
          <p className="vads-u-font-weight--bold vads-u-margin-top--0 vads-u-margin-bottom--1">
            Optional: Set approximate user location
          </p>
          <div className="vads-u-display--flex vads-u-flex-wrap--wrap">
            <div className="vads-u-margin-right--2 vads-u-margin-bottom--2">
              <label htmlFor="country" className="vads-u-display--block vads-u-margin-bottom--1">
                Country
              </label>
              <input
                id="country"
                name="country"
                type="text"
                value={location.country}
                onChange={handleLocationChange}
                className="va-text-input"
                placeholder="e.g. United States"
              />
            </div>
            <div className="vads-u-margin-right--2 vads-u-margin-bottom--2">
              <label htmlFor="region" className="vads-u-display--block vads-u-margin-bottom--1">
                Region/State
              </label>
              <input
                id="region"
                name="region"
                type="text"
                value={location.region}
                onChange={handleLocationChange}
                className="va-text-input"
                placeholder="e.g. California"
              />
            </div>
            <div className="vads-u-margin-bottom--2">
              <label htmlFor="city" className="vads-u-display--block vads-u-margin-bottom--1">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={location.city}
                onChange={handleLocationChange}
                className="va-text-input"
                placeholder="e.g. San Francisco"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
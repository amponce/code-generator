'use client';

import { useState, useEffect, useRef } from 'react';
import { VA_COMPONENTS } from '../../config/constants';

const ComponentGallerySelector = ({ onComponentsSelected }) => {
  const [selectedComponents, setSelectedComponents] = useState(new Set());
  const [activeCategory, setActiveCategory] = useState('All');
  const prevComponentsRef = useRef([]);
  
  // Only call the parent callback when selected components actually change
  useEffect(() => {
    // Convert Set to Array
    const componentsArray = Array.from(selectedComponents);
    
    // Check if components actually changed by comparing current and previous arrays
    const prevArray = prevComponentsRef.current;
    const hasChanged = 
      prevArray.length !== componentsArray.length || 
      componentsArray.some((component, i) => component !== prevArray[i]);
    
    // Only update if there's an actual change
    if (hasChanged && onComponentsSelected) {
      prevComponentsRef.current = componentsArray;
      onComponentsSelected(componentsArray);
    }
  }, [selectedComponents, onComponentsSelected]);

  const toggleComponent = (componentId) => {
    setSelectedComponents(prev => {
      // Create a new Set based on the previous state
      const newSelected = new Set(prev);
      
      // Toggle the selection
      if (newSelected.has(componentId)) {
        newSelected.delete(componentId);
      } else {
        newSelected.add(componentId);
      }
      
      return newSelected;
    });
  };

  // Get all unique categories from the components
  const categories = ['All', ...new Set(VA_COMPONENTS.map(comp => comp.category))];

  // Filter components by active category
  const filteredComponents = activeCategory === 'All' 
    ? VA_COMPONENTS 
    : VA_COMPONENTS.filter(comp => comp.category === activeCategory);

  // Group components by category for the card view
  const groupedComponents = filteredComponents.reduce((acc, component) => {
    const category = component.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(component);
    return acc;
  }, {});

  // Simple component preview generator based on id
  const getComponentPreview = (componentId) => {
    const id = componentId.toLowerCase();
    
    try {
      // Form components - Text and Selection inputs
      if (id.includes('text-input')) {
        return <div className="component-visual">Text Input</div>;
      }
      if (id.includes('textarea')) {
        return <div className="component-visual">Text Area</div>;
      }
      if (id.includes('select') && !id.includes('checkbox')) {
        return <div className="component-visual">Select Dropdown</div>;
      }
      if (id.includes('combo-box')) {
        return <div className="component-visual">Combo Box</div>;
      }
      if (id.includes('date') && !id.includes('memorable')) {
        return <div className="component-visual">Date Picker</div>;
      }
      if (id.includes('memorable-date')) {
        return <div className="component-visual">Memorable Date</div>;
      }
      
      // Form components - Checkboxes and Radio buttons
      if (id.includes('checkbox') && !id.includes('group')) {
        return <div className="component-visual checkbox">Checkbox</div>;
      }
      if (id.includes('checkbox-group')) {
        return <div className="component-visual checkbox-group">Checkbox Group</div>;
      }
      if (id.includes('radio')) {
        return <div className="component-visual radio">Radio Button</div>;
      }
      if (id.includes('file-input')) {
        return <div className="component-visual">File Input</div>;
      }
      
      // Button components
      if (id === 'va-button') {
        return <div className="component-visual button">Button</div>;
      }
      if (id.includes('button-pair')) {
        return <div className="component-visual button-pair">Button Pair</div>;
      }
      if (id.includes('button-icon')) {
        return <div className="component-visual button-icon">Icon Button</div>;
      }
      if (id === 'va-link') {
        return <div className="component-visual link">Link</div>;
      }
      if (id.includes('link-action')) {
        return <div className="component-visual link-action">Action Link</div>;
      }
      if (id.includes('critical-action')) {
        return <div className="component-visual critical-action">Critical Action</div>;
      }
      if (id.includes('back-to-top')) {
        return <div className="component-visual back-to-top">Back to Top</div>;
      }
      
      // Alert and notification components
      if (id === 'va-alert') {
        return <div className="component-visual alert">Alert</div>;
      }
      if (id.includes('alert-expandable')) {
        return <div className="component-visual alert-expandable">Expandable Alert</div>;
      }
      if (id.includes('alert-sign-in')) {
        return <div className="component-visual alert-sign-in">Sign-in Alert</div>;
      }
      if (id.includes('banner')) {
        return <div className="component-visual banner">Banner</div>;
      }
      if (id.includes('notification')) {
        return <div className="component-visual notification">Notification</div>;
      }
      if (id.includes('autosave-alert')) {
        return <div className="component-visual autosave">Autosave Alert</div>;
      }
      if (id.includes('maintenance-banner')) {
        return <div className="component-visual maintenance">Maintenance Banner</div>;
      }
      if (id.includes('promo-banner')) {
        return <div className="component-visual promo">Promo Banner</div>;
      }
      
      // Layout components
      if (id === 'va-accordion') {
        return <div className="component-visual accordion">Accordion</div>;
      }
      if (id.includes('accordion-item')) {
        return <div className="component-visual accordion-item">Accordion Item</div>;
      }
      if (id.includes('additional-info')) {
        return <div className="component-visual additional-info">Additional Info</div>;
      }
      if (id.includes('card')) {
        return <div className="component-visual card">Card</div>;
      }
      if (id.includes('divider')) {
        return <div className="component-visual divider">Divider</div>;
      }
      if (id.includes('table')) {
        return <div className="component-visual table">Table</div>;
      }
      if (id.includes('summary-box')) {
        return <div className="component-visual summary-box">Summary Box</div>;
      }
      if (id.includes('on-this-page')) {
        return <div className="component-visual on-this-page">On This Page</div>;
      }
      
      // Navigation
      if (id.includes('breadcrumbs')) {
        return <div className="component-visual breadcrumbs">Breadcrumbs</div>;
      }
      if (id.includes('pagination')) {
        return <div className="component-visual pagination">Pagination</div>;
      }
      if (id.includes('service-list-item')) {
        return <div className="component-visual service-list">Service List Item</div>;
      }
      
      // Progress indicators
      if (id.includes('loading')) {
        return <div className="component-visual loading">Loading Indicator</div>;
      }
      if (id.includes('progress-bar')) {
        return <div className="component-visual progress-bar">Progress Bar</div>;
      }
      if (id.includes('segmented-progress')) {
        return <div className="component-visual segmented-progress">Segmented Progress</div>;
      }
      if (id.includes('process-list')) {
        return <div className="component-visual process-list">Process List</div>;
      }
      
      // Other components
      if (id.includes('icon')) {
        return <div className="component-visual icon">Icon</div>;
      }
      if (id.includes('tag')) {
        return <div className="component-visual tag">Tag</div>;
      }
      if (id.includes('telephone')) {
        return <div className="component-visual telephone">Telephone</div>;
      }
      if (id.includes('eyebrow')) {
        return <div className="component-visual eyebrow">Eyebrow</div>;
      }
      if (id.includes('need-help')) {
        return <div className="component-visual need-help">Need Help</div>;
      }
      if (id.includes('crisis-line')) {
        return <div className="component-visual crisis-line">Crisis Line Modal</div>;
      }
      
      // Default for other components
      return <div className="component-visual">{componentId}</div>;
    } catch (error) {
      console.log(`Error rendering preview for ${componentId}:`, error);
      return <div className="error-preview">Preview Error</div>;
    }
  };

  return (
    <div className="component-selector">
      <p className="vads-u-font-size--base vads-u-margin-bottom--3 vads-u-color--gray-medium">
        Select components to include in your generated page. The AI will prioritize these components in your layout.
      </p>
      
      {/* Category filter tabs */}
      <div className="category-tabs vads-u-margin-bottom--4">
        {categories.map(category => (
          <button
            key={category}
            className={`category-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Component grid */}
      <div className="vads-l-row">
        {filteredComponents.map((component) => (
          <div 
            key={component.id}
            className="vads-l-col--12 vads-l-col--6-medium vads-l-col--4-large vads-u-padding--1"
          >
            <div 
              className={`component-card ${selectedComponents.has(component.id) ? 'selected' : ''}`}
              onClick={() => toggleComponent(component.id)}
            >
              <div className="card-header">
                <h3>{component.name}</h3>
                {selectedComponents.has(component.id) && (
                  <div className="selection-mark">
                    <div className="checkmark">✓</div>
                  </div>
                )}
              </div>
              
              <div className="component-description">
                <span className="category-tag">{component.category}</span>
                <span className="component-id">{component.id}</span>
              </div>
              
              <div className="component-preview">
                <div className="preview-content">
                  {getComponentPreview(component.id)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedComponents.size > 0 && (
        <div className="vads-u-margin-top--4 vads-u-padding--3 vads-u-background-color--primary-alt-lightest vads-u-border-radius--lg">
          <p className="vads-u-margin--0 vads-u-font-weight--bold vads-u-font-size--base vads-u-color--primary">
            {selectedComponents.size} component{selectedComponents.size !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
      
      <style jsx>{`
        .component-selector {
          width: 100%;
        }
        
        .category-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }
        
        .category-tab {
          background: none;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          color: #666;
          transition: all 0.2s;
        }
        
        .category-tab:hover {
          background-color: #f5f5f5;
          color: #333;
        }
        
        .category-tab.active {
          background-color: #0050d8;
          color: white;
        }
        
        .component-card {
          background: white;
          border: 2px solid #e1e1e1;
          border-radius: 8px;
          padding: 1rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .component-card:hover {
          border-color: #0050d8;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .component-card.selected {
          border-color: #0050d8;
          background-color: #f0f7ff;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .card-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
        }
        
        .selection-mark {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #0050d8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .checkmark {
          font-size: 16px;
          line-height: 1;
          font-weight: bold;
        }
        
        .component-description {
          color: #71767a;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .category-tag {
          background-color: #f1f1f1;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.8rem;
          display: inline-block;
          margin-right: 6px;
          color: #666;
        }
        
        .component-id {
          font-size: 0.8rem;
          color: #999;
          font-family: monospace;
        }
        
        .component-preview {
          background-color: #f9f9fa;
          border-radius: 4px;
          padding: 0.5rem;
          border: 1px solid #e1e1e1;
          margin-top: auto;
          min-height: 120px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        
        .preview-content {
          width: 100%;
          max-height: 180px;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .placeholder-preview {
          padding: 8px;
          background: #eee;
          border-radius: 4px;
          color: #666;
          text-align: center;
          font-family: monospace;
          font-size: 0.8rem;
        }
        
        .error-preview {
          padding: 8px;
          background: #fff0f0;
          border: 1px solid #ffcccc;
          border-radius: 4px;
          color: #cc0000;
          text-align: center;
          font-family: monospace;
          font-size: 0.8rem;
        }
        
        .table-preview {
          padding: 8px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          color: #333;
          text-align: center;
          font-family: monospace;
          font-size: 0.8rem;
        }
        
        .component-visual {
          width: 100%;
          min-height: 70px;
          padding: 15px 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f0f0f0;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          color: #333;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .component-visual:hover {
          transform: scale(1.02);
          box-shadow: 0 2px 5px rgba(0,0,0,0.15);
        }
        
        .component-visual::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background-color: #0050d8;
          opacity: 0.7;
        }
        
        // Specific component styling by type with distinctive colors
        
        // Form components
        .component-visual.checkbox,
        .component-visual.radio,
        .component-visual.checkbox-group {
          background-color: #f0f7e6;
        }
        .component-visual.checkbox::before,
        .component-visual.radio::before,
        .component-visual.checkbox-group::before {
          background-color: #2e8540;
        }
        
        // Button components
        .component-visual.button,
        .component-visual.button-pair,
        .component-visual.button-icon {
          background-color: #e1f3f8;
        }
        .component-visual.button::before,
        .component-visual.button-pair::before,
        .component-visual.button-icon::before {
          background-color: #0071bc;
        }
        
        // Link components
        .component-visual.link,
        .component-visual.link-action,
        .component-visual.critical-action,
        .component-visual.back-to-top {
          background-color: #e1f3f8;
        }
        .component-visual.link::before,
        .component-visual.link-action::before,
        .component-visual.critical-action::before,
        .component-visual.back-to-top::before {
          background-color: #205493;
        }
        
        // Alert components
        .component-visual.alert,
        .component-visual.alert-expandable,
        .component-visual.alert-sign-in,
        .component-visual.notification,
        .component-visual.banner,
        .component-visual.autosave,
        .component-visual.maintenance,
        .component-visual.promo {
          background-color: #fff1d2;
        }
        .component-visual.alert::before,
        .component-visual.alert-expandable::before,
        .component-visual.alert-sign-in::before,
        .component-visual.notification::before,
        .component-visual.banner::before,
        .component-visual.autosave::before,
        .component-visual.maintenance::before,
        .component-visual.promo::before {
          background-color: #fdb81e;
        }
        
        // Layout components
        .component-visual.accordion,
        .component-visual.accordion-item,
        .component-visual.additional-info,
        .component-visual.card,
        .component-visual.divider,
        .component-visual.table,
        .component-visual.summary-box,
        .component-visual.on-this-page {
          background-color: #e4f6ff;
        }
        .component-visual.accordion::before,
        .component-visual.accordion-item::before,
        .component-visual.additional-info::before,
        .component-visual.card::before,
        .component-visual.divider::before,
        .component-visual.table::before,
        .component-visual.summary-box::before,
        .component-visual.on-this-page::before {
          background-color: #02bfe7;
        }
        
        // Navigation components
        .component-visual.breadcrumbs,
        .component-visual.pagination,
        .component-visual.service-list {
          background-color: #f3e9ff;
        }
        .component-visual.breadcrumbs::before,
        .component-visual.pagination::before,
        .component-visual.service-list::before {
          background-color: #4c2c92;
        }
        
        // Progress indicators
        .component-visual.loading,
        .component-visual.progress-bar,
        .component-visual.segmented-progress,
        .component-visual.process-list {
          background-color: #e7f6ec;
        }
        .component-visual.loading::before,
        .component-visual.progress-bar::before,
        .component-visual.segmented-progress::before,
        .component-visual.process-list::before {
          background-color: #2e8540;
        }
        
        // Other components
        .component-visual.icon,
        .component-visual.tag,
        .component-visual.telephone,
        .component-visual.eyebrow,
        .component-visual.need-help,
        .component-visual.crisis-line {
          background-color: #f1f1f1;
        }
        .component-visual.icon::before,
        .component-visual.tag::before,
        .component-visual.telephone::before,
        .component-visual.eyebrow::before,
        .component-visual.need-help::before,
        .component-visual.crisis-line::before {
          background-color: #5b616b;
        }
      `}</style>
    </div>
  );
};

export default ComponentGallerySelector; 
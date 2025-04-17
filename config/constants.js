export const MODEL = "gpt-4o";

// Developer prompt for the assistant
export const DEVELOPER_PROMPT = `
You are an expert React developer specializing in creating VA (Veterans Affairs) components.
    Create a complete, functional React component based on the user's request.
    The component should follow VA Design System guidelines and be accessible.
    
    IMPORTANT - CREATE COMPLETE MOCK VA PAGES, NOT ISOLATED COMPONENTS:
    Always create a fully realized mock VA page that includes:
    1. Proper page context, headers, and navigation elements
    2. Realistic page layout with appropriate surrounding content
    3. Multiple related components that would appear on a real VA page
    4. Appropriate page title, breadcrumbs, and page navigation
    5. Mock data and state that simulates a real application
    6. Error states, loading states, and success states
    
    For example, if asked for a form, create a complete VA form page with:
    - Page header and navigation
    - Contextual help and information
    - The form component within proper page layout
    - Form submission and success/error handling
    - Related functionality a user would expect
    
    VA WEB COMPONENTS USAGE:
    Use VA Web Components with their proper syntax. Here are examples of properly formatted VA components:
    
    1. VA Button:
    <va-button
      text="Edit"
      onClick={(event) => console.log(event.detail)}
    />
    
    2. VA Alert:
    <va-alert
      status="info"
      visible
    >
      <h2 slot="headline">
        Information Alert
      </h2>
      <p>
        This is an informational message with a <va-link href="#" text="link example" />.
      </p>
    </va-alert>
    
    3. VA Accordion:
    <va-accordion>
      <va-accordion-item header="Question 1">
        Answer to question 1.
      </va-accordion-item>
      <va-accordion-item header="Question 2">
        Answer to question 2.
      </va-accordion-item>
    </va-accordion>
    
    4. VA Form Elements:
    <va-text-input
      label="First name"
      name="firstName"
      value={formData.firstName}
      onInput={(e) => handleChange(e)}
      required
    />
    
    <va-checkbox
      label="I agree to the terms"
      name="agree"
      checked={formData.agree}
      onInput={(e) => handleChange(e)}
    />
    
    <va-select
      label="Choose one"
      name="dropdown"
      onInput={(e) => handleChange(e)}
      required
    >
      <option value="">Select an option</option>
      <option value="1">Option 1</option>
      <option value="2">Option 2</option>
    </va-select>
    
    5. VA Need Help Section:
    <va-need-help>
      <div slot="content">
        <p>
          Call us at{' '}
          <va-telephone contact="8008271000" />
          . We're here Monday through Friday, 8:00 a.m to 9:00 p.m ET.
        </p>
      </div>
    </va-need-help>
    
    6. Additional VA Components:
    
    <va-additional-info trigger="More info">
      Additional information that can be expanded.
    </va-additional-info>
    
    <va-alert-expandable summary="Show details">
      Detailed alert information here.
    </va-alert-expandable>
    
    <va-autosave-alert message="Auto‑saved at 3:45 PM" />
    
    <va-back-to-top offset="300">Back to top</va-back-to-top>
    
    <va-banner status="info">Site is in beta.</va-banner>
    
    <va-breadcrumbs .links={[{ text: 'Home', href: '/' }]} />
    
    <va-button-pair>
      <va-button text="Cancel" back onClick={handleCancel} />
      <va-button text="Continue" continue onClick={handleContinue} />
    </va-button-pair>
    
    <va-card>
      <h3 slot="header">Card Title</h3>
      Card content here.
    </va-card>
    
    <va-checkbox-group legend="Select options">
      <va-checkbox label="Option 1" name="opt1" />
      <va-checkbox label="Option 2" name="opt2" />
    </va-checkbox-group>
    
    <va-combo-box 
      label="Choose item" 
      .options={['One', 'Two', 'Three']} 
      onSelect={handleSelect} 
    />
    
    <va-file-input 
      label="Upload file" 
      multiple={false} 
      accept=".pdf,.doc,.docx"
    />
    
    <va-loading-indicator label="Loading…" />
    
    <va-modal modal-title="Notice">
      Modal content.
      <va-button 
        slot="actions" 
        text="Close" 
        onClick={closeModal} 
      />
    </va-modal>
    
    <va-pagination 
      total-visible="5" 
      total-pages="10" 
      current-page="1" 
    />
    
    <va-progress-bar 
      value="60" 
      max="100" 
      label="Progress"
    />
    
    <va-table
      .headers={['Name', 'Age', 'Location']}
      .rows={[
        ['Alice', '30', 'New York'],
        ['Bob', '28', 'San Francisco']
      ]}
    />
    
    <va-textarea
      label="Comments"
      name="comments"
      rows="5"
      onInput={handleInput}
      charcount
    />
    
    IMPORTANT GUIDELINES FOR CONSISTENT OUTPUT:
    1. Always use proper multiline formatting for VA components with props on separate lines
    2. Use className for React CSS classes, not class
    3. Use {' '} for spaces within JSX when needed
    4. Always wrap your component in a "vads-l-grid-container" div
    5. Use VA Design System utility classes (vads-u-*) for styling 
    6. Include proper ARIA attributes for accessibility
    7. Use VA components wherever possible instead of HTML equivalents
    8. Always use consistent formatting with properties on separate lines
    9. For event handling with VA components, use proper event syntax, e.g., onClick={(e) => handleClick(e)}
    10. DO NOT include any markdown code blocks or code ticks (\`\`\`) in your response
    
    PAGE STRUCTURE REQUIREMENTS:
    1. Include a proper page header with title, navigation, and breadcrumbs
    2. Add contextual information to explain the purpose of the page
    3. Use proper VA layout structure with appropriate grid containers and columns
    4. Add realistic mock data that represents what users would see
    5. Include all success, error, and loading states
    6. Add a help section at the bottom of the page
    7. Create mock backend interactions (simulate API calls with setTimeout)
    
    VERSION INFO (as of April 6, 2025):
    - VA Component Library: Version 50.0.0
    - VA CSS Library: Version 1.0.0
    - VA Web Components: Version 5.0.0
    
    IMPORTANT: Your response must use this EXACT format, WITHOUT ANY MARKDOWN CODE BLOCKS OR TICKS:

    function App() {
      // VA generated logic here (state, handlers, etc.)

      return (
        <div className="vads-l-grid-container">
          // VA generated UI code here with properly formatted VA Web Components
        </div>
      );
    }

    DO NOT include ReactDOM.render, imports, or markdown code blocks. Just provide the clean App component code. 
    Use functional components with hooks, and follow best practices.
`;

// Initial message that will be displayed in the chat
export const INITIAL_MESSAGE = `
Hi, how can I help you?
`;

// Export the defaultVectorStore for use in the app
export const defaultVectorStore = {
  id: "",
  name: "Example",
};

// Comprehensive list of VA components for the component picker
export const VA_COMPONENTS = [
  // Basic form components
  { id: "va-text-input", name: "Text Input", category: "Form" },
  { id: "va-textarea", name: "Text Area", category: "Form" },
  { id: "va-checkbox", name: "Checkbox", category: "Form" },
  { id: "va-radio", name: "Radio Button", category: "Form" },
  { id: "va-select", name: "Select Dropdown", category: "Form" },
  { id: "va-combo-box", name: "Combo Box", category: "Form" },
  { id: "va-file-input", name: "File Input", category: "Form" },
  { id: "va-file-input-multiple", name: "Multiple File Input", category: "Form" },
  { id: "va-date", name: "Date Picker", category: "Form" },
  { id: "va-memorable-date", name: "Memorable Date", category: "Form" },
  { id: "va-checkbox-group", name: "Checkbox Group", category: "Form" },
  
  // Buttons & Actions
  { id: "va-button", name: "Button", category: "Buttons" },
  { id: "va-button-pair", name: "Button Pair", category: "Buttons" },
  // { id: "va-button-icon", name: "Icon Button", category: "Buttons" },
  { id: "va-link", name: "Link", category: "Buttons" },
  { id: "va-link-action", name: "Action Link", category: "Buttons" },
  { id: "va-critical-action", name: "Critical Action", category: "Buttons" },
  { id: "va-back-to-top", name: "Back to Top", category: "Buttons" },
  
  // Notifications & Alerts
  { id: "va-alert", name: "Alert", category: "Notifications" },
  { id: "va-alert-expandable", name: "Expandable Alert", category: "Notifications" },
  { id: "va-alert-sign-in", name: "Sign-in Alert", category: "Notifications" },
  { id: "va-autosave-alert", name: "Autosave Alert", category: "Notifications" },
  { id: "va-banner", name: "Banner", category: "Notifications" },
  { id: "va-notification", name: "Notification", category: "Notifications" },
  { id: "va-maintenance-banner", name: "Maintenance Banner", category: "Notifications" },
  { id: "va-promo-banner", name: "Promo Banner", category: "Notifications" },
  
  // Layout & Structure
  { id: "va-accordion", name: "Accordion", category: "Layout" },
  { id: "va-accordion-item", name: "Accordion Item", category: "Layout" },
  { id: "va-additional-info", name: "Additional Info", category: "Layout" },
  { id: "va-card", name: "Card", category: "Layout" },
  { id: "va-divider", name: "Divider", category: "Layout" },
  { id: "va-modal", name: "Modal", category: "Layout" },
  { id: "va-table", name: "Table", category: "Layout" },
  { id: "va-summary-box", name: "Summary Box", category: "Layout" },
  { id: "va-on-this-page", name: "On This Page", category: "Layout" },
  
  // Navigation
  { id: "va-breadcrumbs", name: "Breadcrumbs", category: "Navigation" },
  { id: "va-pagination", name: "Pagination", category: "Navigation" },
  { id: "va-service-list-item", name: "Service List Item", category: "Navigation" },
  
  // Progress Indicators
  { id: "va-loading-indicator", name: "Loading Indicator", category: "Progress" },
  { id: "va-progress-bar", name: "Progress Bar", category: "Progress" },
  { id: "va-segmented-progress-bar", name: "Segmented Progress", category: "Progress" },
  { id: "va-process-list", name: "Process List", category: "Progress" },
  
  // Page Elements
  { id: "va-icon", name: "Icon", category: "Elements" },
  { id: "va-tag", name: "Tag", category: "Elements" },
  { id: "va-telephone", name: "Telephone", category: "Elements" },
  { id: "va-eyebrow", name: "Eyebrow", category: "Elements" },
  { id: "va-need-help", name: "Need Help", category: "Elements" },
  { id: "va-crisis-line-modal", name: "Crisis Line Modal", category: "Elements" },
  
  // Headers & Footers  
  { id: "va-header-minimal", name: "Minimal Header", category: "Page" },
  { id: "va-minimal-footer", name: "Minimal Footer", category: "Page" },
  { id: "va-official-gov-banner", name: "Gov Banner", category: "Page" },
  { id: "va-language-toggle", name: "Language Toggle", category: "Page" },
  
  // Compliance
  { id: "va-privacy-agreement", name: "Privacy Agreement", category: "Compliance" },
  { id: "va-statement-of-truth", name: "Statement of Truth", category: "Compliance" },
  { id: "va-omb-info", name: "OMB Info", category: "Compliance" }
];

// Log to verify export
console.log("VA_COMPONENTS initialized with", VA_COMPONENTS.length, "components"); 
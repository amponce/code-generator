'use client';

import { useEffect, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { foldGutter, indentOnInput } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { lineNumbers } from "@codemirror/view";
import { scrollPastEnd } from "@codemirror/view";
import beautify from "js-beautify";

const EditorTabs = ({
  htmlCode,
  cssCode,
  jsCode,
  setHtmlCode,
  setCssCode,
  setJsCode,
  activeTab,
  setActiveTab,
  jsOnly,
  isGenerating = false,
}) => {
  const [mounted, setMounted] = useState(false);
  const htmlEditorRef = useRef(null);
  const cssEditorRef = useRef(null);
  const jsEditorRef = useRef(null);
  
  const baseTheme = EditorView.theme({
    "&": {
      height: "100%",
      fontSize: "14px",
      lineHeight: "1.5",
      maxHeight: "calc(100vh - 10rem)",
      overflowY: "auto"
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "monospace",
      maxHeight: "calc(100vh - 10rem)"
    },
    ".cm-content": {
      minHeight: "100%", 
      paddingBottom: "500px"
    },
    ".cm-gutters": {
      backgroundColor: "#1e1e1e",
      color: "#858585",
      border: "none",
      minHeight: "100%"
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(255, 255, 255, 0.1)"
    },
    ".cm-line": {
      whiteSpace: "pre-wrap",
      wordBreak: "break-word"
    }
  });
  
  const typingCursorTheme = EditorView.theme({
    "&": {
      position: "relative"
    },
    "&::after": {
      content: '""',
      position: "absolute",
      right: "8px",
      bottom: "8px",
      width: "8px",
      height: "16px",
      backgroundColor: "#09f",
      animation: "blink 1s step-end infinite"
    },
    "@keyframes blink": {
      "0%": { opacity: 1 },
      "50%": { opacity: 0 },
      "100%": { opacity: 1 }
    }
  });
  
  useEffect(() => {
    setMounted(true);
    console.log("EditorTabs mounted with code lengths - HTML:", htmlCode.length, "CSS:", cssCode.length, "JS:", jsCode.length);
    
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
    
    return () => {
      clearTimeout(timer);
      setMounted(false);
    };
  }, []);
  
  useEffect(() => {
    console.log("Active tab changed to:", activeTab);
    
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 50);
    
    return () => clearTimeout(timer);
  }, [activeTab]);
  
  useEffect(() => {
    console.log("Code updated in EditorTabs - HTML:", htmlCode.length, "CSS:", cssCode.length, "JS:", jsCode.length);
  }, [htmlCode, cssCode, jsCode]);
  
  const createEditorExtensions = (lang) => {
    const extensions = [
      EditorView.lineWrapping,
      baseTheme,
      lineNumbers(),
      foldGutter({
        markerDOM(open) {
          const marker = document.createElement("span");
          marker.textContent = open ? "▼" : "►";
          marker.style.fontSize = "10px"; 
          marker.style.position = "relative";
          marker.style.top = "-1px";
          return marker;
        }
      }),
      indentOnInput(),
      scrollPastEnd(),
      lang === 'html' ? html() : lang === 'css' ? css() : javascript()
    ];
    
    if (isGenerating && ((lang === 'javascript' && activeTab === 'react') || 
        (lang === 'html' && activeTab === 'html') || 
        (lang === 'css' && activeTab === 'css'))) {
      extensions.push(typingCursorTheme);
    }
    
    return extensions;
  };

  const formatCode = () => {
    let formattedCode = "";
    let code = "";

    switch (activeTab) {
      case "html":
        code = htmlCode.trim();
        formattedCode = beautify.html(code, { indent_size: 2, wrap_line_length: 80 });
        setHtmlCode(formattedCode);
        break;
      case "css":
        code = cssCode.trim();
        formattedCode = beautify.css(code, { indent_size: 2 });
        setCssCode(formattedCode);
        break;
      case "react":
        code = jsCode.trim();
        formattedCode = beautify.js(code, { indent_size: 2, space_in_empty_paren: true });
        setJsCode(formattedCode);
        break;
    }

    // Show success alert
    const alertContainer = document.createElement('div');
    alertContainer.innerHTML = `
      <va-alert status="success">
        <h3 slot="headline">Code Formatted</h3>
        ${activeTab.toUpperCase()} code has been beautified.
      </va-alert>
    `;
    document.body.appendChild(alertContainer);
    setTimeout(() => document.body.removeChild(alertContainer), 3000);
  };

  const getEditorKey = (tab) => `${tab}-editor-${mounted ? "mounted" : "loading"}`;
  
  if (!mounted) {
    return (
      <div className="vads-u-height--full vads-u-background-color--gray-lightest vads-u-display--flex vads-u-align-items--center vads-u-justify-content--center">
        <va-loading-indicator message="Loading editor..." />
      </div>
    );
  }

  return (
    <div className="vads-u-display--flex vads-u-flex-direction--column vads-u-height--full">
      <div className="vads-u-display--flex vads-u-justify-content--between vads-u-align-items--center vads-u-padding--2 vads-u-background-color--gray-lightest">
        <div className="vads-u-display--flex vads-u-align-items--center">
          {!jsOnly && (
            <va-button
              secondary={activeTab !== 'html'}
              onClick={() => setActiveTab('html')}
              text="HTML"
              class="vads-u-margin-right--1"
            />
          )}
          {!jsOnly && (
            <va-button
              secondary={activeTab !== 'css'}
              onClick={() => setActiveTab('css')}
              text="CSS"
              class="vads-u-margin-right--1"
            />
          )}
          <va-button
            secondary={activeTab !== 'react'}
            onClick={() => setActiveTab('react')}
            text={jsOnly ? "JavaScript" : "React"}
          />
          {isGenerating && activeTab === 'react' && (
            <va-loading-indicator
              message="Generating..."
              class="vads-u-margin-left--1"
            />
          )}
        </div>
        <va-button
          secondary
          onClick={formatCode}
          text="Format Code"
        />
      </div>

      <div className="vads-u-flex--1 vads-u-height--full">
        {!jsOnly && (
          <div 
            style={{ 
              display: activeTab === 'html' ? 'block' : 'none', 
              height: '100%',
              maxHeight: 'calc(100vh - 10rem)',
              overflow: 'auto'
            }}
          >
            <CodeMirror
              value={htmlCode}
              height="calc(100vh - 10rem)"
              theme="dark"
              basicSetup={false}
              extensions={createEditorExtensions('html')}
              onChange={(value) => setHtmlCode(value)}
              key={getEditorKey('html')}
              ref={htmlEditorRef}
            />
          </div>
        )}
        
        {!jsOnly && (
          <div 
            style={{ 
              display: activeTab === 'css' ? 'block' : 'none', 
              height: '100%',
              maxHeight: 'calc(100vh - 10rem)',
              overflow: 'auto'
            }}
          >
            <CodeMirror
              value={cssCode}
              height="calc(100vh - 10rem)"
              theme="dark"
              basicSetup={false}
              extensions={createEditorExtensions('css')}
              onChange={(value) => setCssCode(value)}
              key={getEditorKey('css')}
              ref={cssEditorRef}
            />
          </div>
        )}
        
        <div 
          style={{ 
            display: activeTab === 'react' ? 'block' : 'none', 
            height: '100%',
            maxHeight: 'calc(100vh - 10rem)',
            overflow: 'auto'
          }}
        >
          <CodeMirror
            value={jsCode}
            height="calc(100vh - 10rem)"
            theme="dark"
            basicSetup={false}
            extensions={createEditorExtensions('javascript')}
            onChange={(value) => setJsCode(value)}
            key={getEditorKey('react')}
            ref={jsEditorRef}
          />
        </div>
      </div>
    </div>
  );
};

export default EditorTabs; 
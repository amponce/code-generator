'use client';

import { useEffect } from "react";
import { updatePreview } from "./utils";

const PreviewPanel = ({
  isRunning,
  togglePreview,
  isPreviewExpanded,
  togglePreviewExpand,
  previewRef
}) => {
  useEffect(() => {
    console.log("PreviewPanel mounted - initializing iframe");

    const initTimer = setTimeout(() => {
      const preview = document.getElementById("preview");
      if (preview) {
        if (!preview.srcdoc || preview.srcdoc === "") {
          console.log("Preview iframe empty, refreshing...");
          handleRefresh();
        } else {
          console.log("Preview iframe already has content:", preview.srcdoc.substring(0, 50) + "...");
        }
      } else {
        console.error("Preview iframe element not found");
      }
    }, 50);

    return () => clearTimeout(initTimer);
  }, []);

  const handleRefresh = () => {
    console.log("Refreshing preview iframe");
    const preview = document.getElementById("preview");
    if (preview) {
      console.log("Requesting preview update");
      const event = new CustomEvent('request-preview-update');
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="vads-u-display--flex vads-u-flex-direction--column vads-u-height--full">
      <div className="vads-u-display--flex vads-u-align-items--center vads-u-justify-content--space-between vads-u-padding--2 vads-u-background-color--gray-lightest">
        <h2 className="vads-u-font-size--sm vads-u-font-weight--bold">Preview</h2>
        <div className="vads-u-display--flex vads-u-align-items--center">
          <va-button
            secondary
            onClick={handleRefresh}
            text="Refresh"
            class="vads-u-margin-right--1"
          />
          <va-button
            secondary
            onClick={togglePreview}
            text={isRunning ? "Pause" : "Run"}
            class="vads-u-margin-right--1"
          />
          <va-button
            secondary
            onClick={togglePreviewExpand}
            text={isPreviewExpanded ? "Exit Full" : "Full Screen"}
          />
        </div>
      </div>
      <div className="vads-u-flex--1 vads-u-overflow--auto vads-u-background-color--white" style={{ height: "100%" }}>
        <iframe
          id="preview"
          ref={previewRef}
          className="vads-u-width--full vads-u-height--full vads-u-border--0"
          title="Preview"
          scrolling="yes"
          sandbox="allow-scripts allow-same-origin"
          style={{
            display: "block",
            height: "100%",
            width: "100%",
            overflow: "auto",
            position: "relative"
          }}
          onLoad={(e) => {
            const iframe = e.target;
            if (iframe.contentDocument) {
              console.log("iframe loaded - ensuring scrolling is enabled");
              const style = iframe.contentDocument.createElement('style');
              style.textContent = `
                html, body {
                  height: auto !important;
                  overflow: visible !important;
                }

                pre, code {
                  white-space: pre;
                  overflow-x: auto;
                  max-width: 100%;
                  display: block;
                }
              `;
              iframe.contentDocument.head.appendChild(style);
            }
          }}
        ></iframe>
      </div>
    </div>
  );
};

export default PreviewPanel; 
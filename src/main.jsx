import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import * as Sentry from "@sentry/react";

Sentry.init({
    dsn: "https://7ebcfa0e69f691cc73b0647dbf3f6cde@o4508938006626304.ingest.de.sentry.io/4509361466572880",
    // Setting this option to true will send default PII data to Sentry.
    // For example, automatic IP address collection on events
    sendDefaultPii: true,

    // Disable HTTP instrumentation to avoid "this.enable is not a function" error
    integrations: (integrations) => {
        return integrations.filter(integration => integration.name !== 'Http');
    }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

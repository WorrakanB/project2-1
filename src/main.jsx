import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { JobsProvider } from "./context/JobsContext.jsx";
import { PeopleProvider } from "./context/PeopleContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PeopleProvider>
      <JobsProvider>
        <App />
      </JobsProvider>
    </PeopleProvider>
  </React.StrictMode>
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { FoldStage } from "./fold/FoldStage";
import "./index.css";

const lab = new URLSearchParams(window.location.search).has("lab");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {lab ? <App /> : <FoldStage />}
  </StrictMode>,
);

import { Component } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";

import Page from "./page";
import Service from "./service";
import { NotFound } from "./other";

import "./styles/common.scss";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

class Website extends Component {
    render() {
        return <HelmetProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Page />} />
                    <Route path="/:pageShortName" element={<Page />} />
                    <Route path="/:pageShortName/:serviceId" element={<Service />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </HelmetProvider>;
    }
}

createRoot(document.getElementById("root")).render(<Website />);

import { Component } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";

import Node from "./node";
import Page from "./page";
import { NotFound } from "./other";

import "./styles/common.scss";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

class Website extends Component {
    render() {
        return <BrowserRouter>
            <Routes>
                <Route path="/:pageShortName" element={<Page />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>;
    }
}

createRoot(document.getElementById("root")).render(<Website />);

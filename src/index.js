import { Component } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Page from "./page";
import { NotFound } from "./other";

import "./styles/common.scss";

class Website extends Component {
    render() {
        return <BrowserRouter>
            <Routes>
                <Route path="/pages/:shortName" element={<Page />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>;
    }
}

createRoot(document.getElementById("root")).render(<Website />);

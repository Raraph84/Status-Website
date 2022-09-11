import { Component } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./styles/common.scss";

class Website extends Component {
    render() {
        return <BrowserRouter>
            <Routes>
                <Route path="/" element={<div>En dev</div>} />
                <Route path="*" element={<div>404</div>} />
            </Routes>
        </BrowserRouter>;
    }
}

createRoot(document.getElementById("root")).render(<Website />);

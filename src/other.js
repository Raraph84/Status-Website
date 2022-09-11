import { Component } from "react";

export class NotFound extends Component {
    render() {

        document.title = "Page introuvable";

        return <div>
            <div style={{ fontSize: "50px" }}>Cette page n'existe pas !</div>
            <div style={{ fontSize: "24px", fontStyle: "italic" }}>Ou pas encore</div>
        </div>;
    }
}

export class Info extends Component {
    render() {
        return <div className="info" style={{ color: this.props.color || "red" }}>{this.props.children}</div>
    }
}

export class Loading extends Component {
    render() {
        return <div className="loading"><i className="fas fa-spinner" /></div>
    }
}

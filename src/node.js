import { Component } from "react";
import { useParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Info, Loading } from "./other";
import { getPage, getNode, getNodeUptime, getNodeResponseTimes } from "./api";
import moment from "moment";

import "./styles/node.scss";

class NodeClass extends Component {

    constructor(props) {

        super(props);

        this.state = { requesting: false, info: null, page: null, node: null, uptimes: null, responseTimes: null };
    }

    componentDidMount() {

        const since = Date.UTC(new Date().getFullYear(), new Date().getMonth() - 3, new Date().getDate());

        this.setState({ requesting: true, info: null, page: null, node: null, uptimes: null });
        getPage(this.props.params.pageShortName).then((page) => {
            getNode(this.props.params.nodeId).then((node) => {
                getNodeUptime(node.id, since, "days").then((uptimes) => {
                    getNodeResponseTimes(node.id, since, "days").then((responseTimes) => {
                        this.setState({ requesting: false, page, node, uptimes, responseTimes });
                    }).catch(() => {
                        this.setState({ requesting: false, info: <Info>Un problème est survenu !</Info> });
                    });
                    this.setState({ requesting: false, page, node, uptimes });
                }).catch(() => {
                    this.setState({ requesting: false, info: <Info>Un problème est survenu !</Info> });
                });
            }).catch((error) => {
                if (error === "This node does not exist")
                    this.setState({ requesting: false, info: <Info>Ce nœud n'existe pas !</Info> });
                else this.setState({ requesting: false, info: <Info>Un problème est survenu !</Info> });
            });
        }).catch((error) => {
            if (error === "This page does not exist")
                this.setState({ requesting: false, info: <Info>Cette page n'existe pas !</Info> });
            else this.setState({ requesting: false, info: <Info>Un problème est survenu !</Info> });
        });
    }

    componentDidUpdate(oldProps) {
        if (oldProps.params !== this.props.params) this.componentDidMount();
    }

    render() {

        document.title = this.state.node ? "Statut - " + this.state.node.name : "Statut - Chargement";

        return <div className="node">

            {this.state.requesting ? <Loading /> : null}
            {this.state.info}

            {this.state.page && this.state.node && this.state.uptimes && this.state.responseTimes ? <>

                <div className="header">
                    <img src={this.state.page.logoUrl} alt="Logo" />
                    <a href={this.state.page.url} className="link">{this.state.page.title}</a>
                </div>

                <div className="infos">
                    <div className="title">
                        <span>{this.state.node.name}</span>
                        <span>{this.state.node.online ? "En ligne" : "En panne"}</span>
                    </div>
                    <div className="uptime-title">En ligne à {Math.round(this.state.uptimes.filter((day) => day.uptime !== -1).reduce((acc, uptime) => acc + uptime.uptime, 0) / this.state.uptimes.filter((day) => day.uptime !== -1).length * 100) / 100}% ces trois dernier mois :</div>
                    <div className="uptime">{this.state.uptimes.map((day) =>
                        <div key={day.day} style={{ backgroundColor: day.uptime < 95 ? "red" : (day.uptime < 100 ? "orange" : "green") }} className="day">
                            <div className="tooltip">
                                <div>{moment(day.day * 24 * 60 * 60 * 1000).format("DD/MM/YYYY")}</div>
                                <div>En ligne à {day.uptime}%</div>
                            </div>
                        </div>
                    )}</div>
                </div>

                <div className="responseTime">
                    <Line data={{
                        labels: this.state.responseTimes.map((responseTime) => responseTime.day),
                        datasets: [{
                            label: "Temps de réponse",
                            data: this.state.responseTimes.map((responseTime) => responseTime.responseTime),
                            borderColor: "rgb(255, 150, 0)",
                            backgroundColor: "rgba(255, 150, 0, 0.5)",
                            borderWidth: 1,
                            tension: 0.4
                        }]
                    }} options={{
                        scales: {
                            x: { grid: { display: false } },
                            y: { grid: { display: false } }
                        }
                    }} />
                </div>

            </> : null}

        </div>;
    }
}

// eslint-disable-next-line
export default (props) => <NodeClass {...props} params={useParams()} />;

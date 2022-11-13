import { Component } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Info, Loading } from "./other";
import { getPage, getNode, getNodeUptime, getNodeResponseTimes } from "./api";
import moment from "moment";

import "./styles/node.scss";

class NodeClass extends Component {

    constructor(props) {

        super(props);

        this.state = { requesting: false, info: null, page: null, node: null, uptimes: null, responseTimes: null, displayedDays: 90 };
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

        this.updateDisplayedDays();
        window.addEventListener("resize", this.updateDisplayedDays.bind(this));
    }

    componentDidUpdate(oldProps) {
        if (oldProps.params !== this.props.params) this.componentDidMount();
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDisplayedDays.bind(this));
    }

    updateDisplayedDays() {
        this.setState({ displayedDays: window.innerWidth < 768 ? 30 : (window.innerWidth < 992 ? 60 : 90) });
    }

    render() {

        document.title = this.state.node ? "Statut - " + this.state.node.name : "Statut - Chargement";
        document.getElementById("favicon").href = this.state.page ? this.state.page.logoUrl : "/favicon.png";

        const params = new URLSearchParams(this.props.location.search);

        const averageUptime = this.state.uptimes ? Math.round(this.state.uptimes.slice(-this.state.displayedDays).filter((day) => day.uptime >= 0).reduce((acc, uptime) => acc + uptime.uptime, 0) / this.state.uptimes.slice(-this.state.displayedDays).filter((day) => day.uptime >= 0).length * 100) / 100 : -1;
        const averageResponseTime = this.state.responseTimes ? Math.round(this.state.responseTimes.slice(-this.state.displayedDays).filter((day) => day.responseTime >= 0).reduce((acc, day) => acc + day.responseTime, 0) / this.state.responseTimes.slice(-this.state.displayedDays).filter((day) => day.responseTime >= 0).length * 100) / 100 : -1;

        return <div className="node">

            {this.state.requesting ? <Loading /> : null}
            {this.state.info}

            {this.state.page && this.state.node && this.state.uptimes && this.state.responseTimes ? <>

                <div className="header">
                    <img src={this.state.page.logoUrl} alt="Logo" />
                    <div className="links">
                        <a href={this.state.page.url} className="link">{this.state.page.title} ({this.state.page.onlineNodes}/{this.state.page.totalNodes})</a>
                        {params.has("back") ? <Link to={params.get("back")} className="link back"><i className="fa-solid fa-arrow-left" />Retour</Link> : null}
                    </div>
                </div>

                <div className="infos">
                    <div className="title">
                        <span>{this.state.node.name}</span>
                        <span>{this.state.node.online ? "En ligne" : "En panne"}</span>
                    </div>
                    <div>En ligne à {averageUptime}% ces {this.state.displayedDays} derniers jours :</div>
                    <div className="uptime">{this.state.uptimes.slice(-this.state.displayedDays).map((day) =>
                        <div key={day.day} style={{ backgroundColor: day.uptime < 0 ? "gray" : (day.uptime < 95 ? "red" : (day.uptime < 100 ? "orange" : "green")) }} className="day">
                            <div className="tooltip">
                                <div>{moment(day.day * 24 * 60 * 60 * 1000).format("DD/MM/YYYY")}</div>
                                {day.uptime >= 0 ? <div>En ligne à {day.uptime}%</div> : <div>Aucune donnée</div>}
                            </div>
                        </div>
                    )}</div>
                </div>

                <div className="responseTime">
                    <div>Temps de réponse de {averageResponseTime}ms ces {this.state.displayedDays} derniers jours :</div>
                    <Line data={{
                        labels: this.state.responseTimes.slice(-this.state.displayedDays).map((responseTime) => moment(responseTime.day * 24 * 60 * 60 * 1000).format("DD/MM")),
                        datasets: [{
                            label: "Temps de réponse",
                            data: this.state.responseTimes.slice(-this.state.displayedDays).map((responseTime) => responseTime.responseTime < 0 ? null : responseTime.responseTime),
                            borderColor: "rgb(0, 175, 0)",
                            backgroundColor: "rgba(0, 175, 0, 0.5)",
                            borderWidth: 1,
                            tension: 0.4
                        }]
                    }} options={{
                        plugins: {
                            legend: { display: false },
                            tooltip: { callbacks: { label: (context) => context.parsed.y + "ms" } }
                        },
                        scales: {
                            x: {
                                title: {
                                    display: true,
                                    text: "Jours",
                                    color: "rgb(255, 255, 255)",
                                    font: { family: "Chillax" }
                                },
                                ticks: {
                                    color: "rgb(255, 255, 255)",
                                    font: { family: "Chillax" },
                                    precision: 0
                                },
                                grid: {
                                    display: false,
                                    borderColor: "rgb(255, 255, 255)"
                                }
                            },
                            y: {
                                title: {
                                    display: true,
                                    text: "Temps de réponse",
                                    color: "rgb(255, 255, 255)",
                                    font: { family: "Chillax" }
                                },
                                ticks: {
                                    display: window.innerWidth >= 768,
                                    color: "rgb(255, 255, 255)",
                                    font: { family: "Chillax" },
                                    callback: (value) => value + "ms"
                                },
                                grid: {
                                    display: false,
                                    borderColor: "rgb(255, 255, 255)"
                                },
                                beginAtZero: true
                            }
                        }
                    }} />
                </div>

            </> : null}

        </div>;
    }
}

// eslint-disable-next-line
export default (props) => <NodeClass {...props} params={useParams()} location={useLocation()} />;

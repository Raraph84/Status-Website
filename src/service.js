import { Component } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Info, Loading } from "./other";
import { getPage, getService, getServiceUptimes, getServiceResponseTimes } from "./api";
import moment from "moment";

import "./styles/service.scss";

class ServiceClass extends Component {

    constructor(props) {

        super(props);

        this.state = { requesting: false, info: null, page: null, service: null, uptimes: null, responseTimes: null, displayedDays: 90 };
    }

    componentDidMount() {

        const since = Date.UTC(new Date().getFullYear(), new Date().getMonth() - 3, new Date().getDate());

        this.setState({ requesting: true, info: null, page: null, service: null, uptimes: null });
        getPage(this.props.params.pageShortName).then((page) => {
            getService(this.props.params.serviceId).then((service) => {
                getServiceUptimes(service.id, since, "days").then((uptimes) => {
                    getServiceResponseTimes(service.id, since, "days").then((responseTimes) => {
                        this.setState({ requesting: false, page, service, uptimes, responseTimes });
                    }).catch(() => {
                        this.setState({ requesting: false, info: <Info>Un problème est survenu !</Info> });
                    });
                    this.setState({ requesting: false, page, service, uptimes });
                }).catch(() => {
                    this.setState({ requesting: false, info: <Info>Un problème est survenu !</Info> });
                });
            }).catch((error) => {
                if (error === "This service does not exist")
                    this.setState({ requesting: false, info: <Info>Ce service n'existe pas !</Info> });
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

        if (this.state.page) {
            document.title = "Statut - " + this.state.service.name;
            document.getElementById("favicon").href = this.state.page.logoUrl;
        }

        const params = new URLSearchParams(this.props.location.search);

        const uptimeDays = this.state.uptimes ? this.state.uptimes.slice(-this.state.displayedDays).filter((day) => day.uptime !== null) : null;
        const averageUptime = this.state.uptimes && uptimeDays.length > 0 ? Math.round(uptimeDays.reduce((acc, uptime) => acc + uptime.uptime, 0) / uptimeDays.length * 1000) / 1000 : null;
        const responseTimeDays = this.state.responseTimes ? this.state.responseTimes.slice(-this.state.displayedDays).filter((day) => day.responseTime !== null) : null;
        const averageResponseTime = this.state.responseTimes && responseTimeDays.length > 0 ? Math.round(responseTimeDays.reduce((acc, day) => acc + day.responseTime, 0) / responseTimeDays.length * 100) / 100 : null;

        return <div className="service">

            {this.state.requesting ? <Loading /> : null}
            {this.state.info}

            {this.state.page && this.state.service && this.state.uptimes && this.state.responseTimes ? <>

                <div className="header">
                    <img src={this.state.page.logoUrl} alt="Logo" />
                    <div className="links">
                        <a href={this.state.page.url} className="link">{this.state.page.title} ({this.state.page.onlineServices}/{this.state.page.totalServices})</a>
                        {params.has("back") ? <Link to={params.get("back")} className="link back"><i className="fa-solid fa-arrow-left" />Retour</Link> : null}
                    </div>
                </div>

                <div className="infos">
                    <div className="title">
                        <span>{this.state.page.services.find((service) => service.id === this.state.service.id)?.displayName || this.state.service.name}</span>
                        <span>{this.state.service.disabled ? "Désactivé" : (this.state.service.online ? "En ligne" : "En panne")}</span>
                    </div>
                    {averageUptime !== null ? <div>En ligne à {averageUptime.toFixed(3)}% ces {this.state.displayedDays} derniers jours :</div> : <div>Aucune données ces {this.state.displayedDays} derniers jours :</div>}
                    <div className="uptime">{this.state.uptimes.slice(-this.state.displayedDays).map((day) =>
                        <div key={day.day} style={{ backgroundColor: day.uptime === null ? "gray" : (day.uptime < 95 ? "red" : (day.uptime < 100 ? "orange" : "green")) }} className="day">
                            <div className="tooltip">
                                <div>{moment(day.day * 24 * 60 * 60 * 1000).format("DD/MM/YYYY")}</div>
                                {day.uptime !== null ? <div>En ligne à {day.uptime.toFixed(3)}%</div> : <div>Aucune données</div>}
                            </div>
                        </div>
                    )}</div>
                </div>

                <div className="responseTime">
                    {averageResponseTime !== null ? <div>Temps de réponse de {averageResponseTime}ms ces {this.state.displayedDays} derniers jours :</div> : <div>Aucune données de temps de réponse ces {this.state.displayedDays} derniers jours :</div>}
                    <Line data={{
                        labels: this.state.responseTimes.slice(-this.state.displayedDays).map((responseTime) => moment(responseTime.day * 24 * 60 * 60 * 1000).format("DD/MM")),
                        datasets: [{
                            label: "Temps de réponse",
                            data: this.state.responseTimes.slice(-this.state.displayedDays).map((responseTime) => responseTime.responseTime === null ? null : responseTime.responseTime),
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
export default (props) => <ServiceClass {...props} params={useParams()} location={useLocation()} />;

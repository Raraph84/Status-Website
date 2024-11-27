import { Component } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Info, Loading } from "./other";
import { getPage, getService, getServiceUptimes, getServiceResponseTimes } from "./api";
import { countServices } from "./utils";
import moment from "moment";

import "./styles/service.scss";

class ServiceClass extends Component {

    constructor(props) {

        super(props);

        this.state = { requesting: false, info: null, page: null, service: null, uptimes: null, responseTimes: null, displayedDays: 90 };
    }

    componentDidMount() {

        const since = Date.UTC(new Date().getFullYear(), new Date().getMonth() - 3, new Date().getDate());

        this.setState({ requesting: true });
        getPage(this.props.params.pageShortName, ["subpages", "subpages.subpage", "services", "services.service", "services.service.online"]).then((page) => {

            this.setState({ page });

            getService(this.props.params.serviceId, ["online"]).then((service) => {

                this.setState({ service });

                getServiceUptimes(service.id, since, "days").then((uptimes) => {

                    this.setState({ uptimes });

                    getServiceResponseTimes(service.id, since, "days").then((responseTimes) => {
                        this.setState({ requesting: false, responseTimes });
                    }).catch(() => {
                        this.setState({ requesting: false, info: <Info>Un problème est survenu !</Info> });
                    });

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

        const pageService = this.state.page?.services.find((service) => service.service.id === this.state.service?.id);

        document.title = "Statut" + (this.state.page && this.state.service ? ` - ${pageService?.displayName ?? this.state.service.name} - ${this.state.page.title}` : "");
        if (this.state.service) document.getElementById("favicon").href = this.state.page.logoUrl;

        const params = new URLSearchParams(this.props.location.search);

        const services = this.state.page ? countServices(this.state.page) : null;

        const uptimeDays = this.state.uptimes ? this.state.uptimes.slice(-this.state.displayedDays).filter((day) => day.uptime !== null) : null;
        const averageUptime = this.state.uptimes && uptimeDays.length > 0 ? Math.round(uptimeDays.reduce((acc, uptime) => acc + uptime.uptime, 0) / uptimeDays.length * 1000) / 1000 : null;
        const responseTimeDays = this.state.responseTimes ? this.state.responseTimes.slice(-this.state.displayedDays).filter((day) => day.responseTime !== null) : null;
        const averageResponseTime = this.state.responseTimes && responseTimeDays.length > 0 ? Math.round(responseTimeDays.reduce((acc, day) => acc + day.responseTime, 0) / responseTimeDays.length * 10) / 10 : null;

        return <div className="service">

            {this.state.requesting && <Loading />}
            {this.state.info}

            {this.state.page && <div className="header">
                <img src={this.state.page.logoUrl} alt="Logo" />
                <div className="links">
                    <a href={this.state.page.url} className="link">{this.state.page.title} ({services.online}/{services.total})</a>
                    {params.has("back") && <Link to={params.get("back")} className="link back"><i className="fa-solid fa-arrow-left" />Retour</Link>}
                </div>
            </div>}

            {this.state.service && <div className="infos">

                <div className="title">
                    <span>{pageService?.displayName ?? this.state.service.name}</span>
                    <span>{this.state.service.disabled ? "Désactivé" : (this.state.service.online ? "En ligne" : "En panne")}</span>
                </div>

                {averageUptime !== null ? <div>En ligne à {averageUptime.toFixed(3)}% ces {this.state.displayedDays} derniers jours :</div> : <div>Aucune données ces {this.state.displayedDays} derniers jours :</div>}

                {this.state.uptimes && <div className="uptime">{this.state.uptimes.slice(-this.state.displayedDays).map((day) =>
                    <div key={day.day} style={{ backgroundColor: day.uptime === null ? "gray" : (day.uptime < 95 ? "red" : (day.uptime < 100 ? "orange" : "green")) }} className="day">
                        <div className="tooltip">
                            <div>{moment(day.day * 24 * 60 * 60 * 1000).format("DD/MM/YYYY")}</div>
                            {day.uptime !== null ? <div>En ligne à {day.uptime.toFixed(3)}%</div> : <div>Aucune données</div>}
                        </div>
                    </div>
                )}</div>}
            </div>}

            {this.state.responseTimes && <div className="responseTime">

                {averageResponseTime !== null ? <div>Temps de réponse de {averageResponseTime}ms ces {this.state.displayedDays} derniers jours :</div> : <div>Aucune données de temps de réponse ces {this.state.displayedDays} derniers jours :</div>}

                <Line data={{
                    labels: this.state.responseTimes.slice(-this.state.displayedDays).map((responseTime) => moment(responseTime.day * 24 * 60 * 60 * 1000).format("DD/MM")),
                    datasets: [{
                        label: "Temps de réponse",
                        data: this.state.responseTimes.slice(-this.state.displayedDays).map((responseTime) => responseTime.responseTime),
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

            </div>}

        </div>;
    }
}

// eslint-disable-next-line
export default (props) => <ServiceClass {...props} params={useParams()} location={useLocation()} />;

import { Component } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Info, Loading } from "./other";
import { getServiceUptimes, getPage } from "./api";
import moment from "moment";

import "./styles/page.scss";

class PageClass extends Component {

    constructor(props) {

        super(props);

        this.state = { requesting: false, info: null, page: null };
    }

    componentDidMount() {

        this.setState({ requesting: true, info: null, page: null });
        getPage(this.props.params.pageShortName || window.location.hostname).then((page) => {
            this.setState({ requesting: false, page });
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

        if (this.state.page) {
            document.title = "Statut - " + this.state.page.title;
            document.getElementById("favicon").href = this.state.page.logoUrl;
        }

        const backParams = new URLSearchParams();
        backParams.set("back", this.props.location.pathname + this.props.location.search);
        const back = "?" + backParams.toString();

        const params = new URLSearchParams(this.props.location.search);

        return <div className="page">

            {this.state.requesting ? <Loading /> : null}
            {this.state.info}

            {this.state.page ? <>

                <div className="header">
                    <img src={this.state.page.logoUrl} alt="Logo" />
                    <div className="links">
                        <a href={this.state.page.url} className="link">{this.state.page.title} ({this.state.page.onlineServices}/{this.state.page.totalServices})</a>
                        {params.has("back") ? <Link to={params.get("back")} className="link back"><i className="fa-solid fa-arrow-left" />Retour</Link> : null}
                    </div>
                </div>

                {this.state.page.subPages.length > 0 ? <div className="subPages">
                    {this.state.page.subPages.map((subPage) => <SubPage key={subPage.shortName} subPage={subPage} back={back} />)}
                </div> : null}

                {this.state.page.services.length > 0 ? <div className="services">
                    {this.state.page.services.sort((a, b) => a.position - b.position).map((service) => <Service key={service.id} service={service} page={this.state.page} back={back} />)}
                </div> : null}

            </> : null}

        </div>;
    }
}

class SubPage extends Component {
    render() {
        return <Link to={"/" + this.props.subPage.shortName + this.props.back} className="subPage link-container">
            <img src={this.props.subPage.logoUrl} alt="Logo" />
            <span className="link">{this.props.subPage.title} ({this.props.subPage.onlineServices}/{this.props.subPage.totalServices})</span>
        </Link>;
    }
}

class Service extends Component {

    constructor(props) {

        super(props);

        this.state = { requesting: false, info: null, days: null, displayedDays: 90 };
    }

    componentDidMount() {

        const since = Date.UTC(new Date().getFullYear(), new Date().getMonth() - 3, new Date().getDate());

        this.setState({ requesting: true });
        getServiceUptimes(this.props.service.id, since, "days").then((days) => {
            this.setState({ requesting: false, days });
        }).catch(() => {
            this.setState({ requesting: false, info: <Info>Un problème est survenu !</Info> });
        });

        this.updateDisplayedDays();
        window.addEventListener("resize", this.updateDisplayedDays.bind(this));
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updateDisplayedDays.bind(this));
    }

    updateDisplayedDays() {
        this.setState({ displayedDays: window.innerWidth < 768 ? 30 : (window.innerWidth < 992 ? 60 : 90) });
    }

    render() {

        const uptimeDays = this.state.days ? this.state.days.slice(-this.state.displayedDays).filter((day) => day.uptime !== null) : null;
        const averageUptime = this.state.days && uptimeDays.length > 0 ? Math.round(uptimeDays.reduce((acc, uptime) => acc + uptime.uptime, 0) / uptimeDays.length * 100) / 100 : null;

        return <div className="service">
            <Link to={"/" + this.props.page.shortName + "/" + this.props.service.id + this.props.back} className="title link-container">
                <span className="link">{this.props.service.displayName || this.props.service.name}</span>
                <span>{this.props.service.disabled ? "Désactivé" : (this.props.service.online ? "En ligne" : "En panne")}</span>
            </Link>
            {this.state.requesting ? <Loading /> : null}
            {this.state.info}
            {this.state.days ? <>
                {averageUptime !== null ? <div>En ligne à {averageUptime}% ces {this.state.displayedDays} derniers jours :</div> : <div>Aucune données ces {this.state.displayedDays} derniers jours :</div>}
                <div className="uptime">{this.state.days.slice(-this.state.displayedDays).map((day) =>
                    <div key={day.day} style={{ backgroundColor: day.uptime < 0 ? "gray" : (day.uptime < 95 ? "red" : (day.uptime < 100 ? "orange" : "green")) }} className="day">
                        <div className="tooltip">
                            <div>{moment(day.day * 24 * 60 * 60 * 1000).format("DD/MM/YYYY")}</div>
                            {day.uptime !== null ? <div>En ligne à {day.uptime}%</div> : <div>Aucune données</div>}
                        </div>
                    </div>
                )}</div>
            </> : null}
        </div>;
    }
}

// eslint-disable-next-line
export default (props) => <PageClass {...props} params={useParams()} location={useLocation()} />;

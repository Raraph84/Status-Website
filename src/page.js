import { Component } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Info, Loading } from "./other";
import { getPage, getServiceUptimes } from "./api";
import { countServices } from "./utils";
import moment from "moment";

import "./styles/page.scss";

class PageClass extends Component {

    constructor(props) {

        super(props);

        this.state = { requesting: false, info: null, page: null };
    }

    componentDidMount() {

        this.setState({ requesting: true, info: null, page: null });
        getPage(this.props.params.pageShortName || window.location.hostname, ["subpages", "subpages.subpage", "services", "services.service", "services.service.online"]).then((page) => {
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

        const backParams = new URLSearchParams();
        backParams.set("back", this.props.location.pathname + this.props.location.search);
        const back = "?" + backParams.toString();

        const params = new URLSearchParams(this.props.location.search);

        const services = this.state.page ? countServices(this.state.page) : null;

        return <div className="page">

            {this.state.page && <Helmet>
                <title>{this.state.page.title} - Statut</title>
                <link rel="icon" href={this.state.page.logoUrl} />
            </Helmet>}

            {this.state.requesting && <Loading />}
            {this.state.info}

            {this.state.page && <>

                <div className="header">
                    <img src={this.state.page.logoUrl} alt="Logo" />
                    <div className="links">
                        <a href={this.state.page.url} className="link">{this.state.page.title} ({services.online}/{services.total})</a>
                        {params.has("back") && <Link to={params.get("back")} className="link back"><i className="fa-solid fa-arrow-left" />Retour</Link>}
                    </div>
                </div>

                {this.state.page.subPages.length > 0 && <div className="subPages">
                    {this.state.page.subPages.map((subPage) => <SubPage key={subPage.subPage.shortName} subPage={subPage} back={back} />)}
                </div>}

                {this.state.page.services.length > 0 && <div className="services">
                    {this.state.page.services.sort((a, b) => a.position - b.position).map((service) => <Service key={service.service.id} service={service} page={this.state.page} back={back} />)}
                </div>}

            </>}

        </div>;
    }
}

class SubPage extends Component {
    render() {
        const services = this.props.subPage ? countServices(this.props.subPage.subPage) : null;
        return <Link to={"/" + this.props.subPage.subPage.shortName + this.props.back} className="subPage link-container">
            <img src={this.props.subPage.subPage.logoUrl} alt="Logo" />
            <span className="link">{this.props.subPage.subPage.title} ({services.online}/{services.total})</span>
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
        getServiceUptimes(this.props.service.service.id, since, "days").then((days) => {
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
        const averageUptime = this.state.days && uptimeDays.length > 0 ? Math.round(uptimeDays.reduce((acc, uptime) => acc + uptime.uptime, 0) / uptimeDays.length * 1000) / 1000 : null;

        return <div className="service">

            <Link to={"/" + this.props.page.shortName + "/" + this.props.service.service.id + this.props.back} className="title link-container">
                <span className="link">{this.props.service.displayName || this.props.service.service.name}</span>
                <span>{this.props.service.service.disabled ? "Désactivé" : (this.props.service.service.online ? "En ligne" : "En panne")}</span>
            </Link>

            {this.state.requesting && <Loading />}
            {this.state.info}

            {this.state.days && <>

                {averageUptime !== null ? <div>En ligne à {averageUptime.toFixed(3)}% ces {this.state.displayedDays} derniers jours :</div> : <div>Aucune données ces {this.state.displayedDays} derniers jours :</div>}

                <div className="uptime">{this.state.days.slice(-this.state.displayedDays).map((day) =>
                    <div key={day.day} style={{ backgroundColor: day.uptime === null ? "gray" : (day.uptime < 95 ? "red" : (day.uptime < 100 ? "orange" : "green")) }} className="day">
                        <div className="tooltip">
                            <div>{moment(day.day * 24 * 60 * 60 * 1000).format("DD/MM/YYYY")}</div>
                            {day.uptime !== null ? <div>En ligne à {day.uptime.toFixed(3)}%</div> : <div>Aucune données</div>}
                        </div>
                    </div>
                )}</div>

            </>}
        </div>;
    }
}

// eslint-disable-next-line
export default (props) => <PageClass {...props} params={useParams()} location={useLocation()} />;

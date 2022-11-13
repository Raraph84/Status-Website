import { Component } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Info, Loading } from "./other";
import { getNodeUptime, getPage } from "./api";
import moment from "moment";

import "./styles/page.scss";

class PageClass extends Component {

    constructor(props) {

        super(props);

        this.state = { requesting: false, info: null, page: null };
    }

    componentDidMount() {

        this.setState({ requesting: true, info: null, page: null });
        getPage(this.props.params.pageShortName).then((page) => {
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

        document.title = this.state.page ? "Statut - " + this.state.page.title : "Statut - Chargement";
        document.getElementById("favicon").href = this.state.page ? this.state.page.logoUrl : "/favicon.png";

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
                        <a href={this.state.page.url} className="link">{this.state.page.title}</a>
                        {params.has("back") ? <Link to={params.get("back")} className="link back"><i className="fa-solid fa-arrow-left" />Retour</Link> : null}
                    </div>
                </div>

                {this.state.page.subPages.length > 0 ? <div className="subPages">
                    {this.state.page.subPages.map((subPage) => <SubPage key={subPage.shortName} subPage={subPage} back={back} />)}
                </div> : null}

                {this.state.page.nodes.length > 0 ? <div className="nodes">
                    {this.state.page.nodes.sort((a, b) => a.position - b.position).map((node) => <Node key={node.id} node={node} page={this.state.page} back={back} />)}
                </div> : null}

            </> : null}

        </div>;
    }
}

class SubPage extends Component {
    render() {
        return <Link to={"/" + this.props.subPage.shortName + this.props.back} className="subPage link-container">
            <img src={this.props.subPage.logoUrl} alt="Logo" />
            <span className="link">{this.props.subPage.title} ({this.props.subPage.onlineNodes}/{this.props.subPage.totalNodes})</span>
        </Link>;
    }
}

class Node extends Component {

    constructor(props) {

        super(props);

        this.state = { requesting: false, info: null, days: null, displayedDays: 90 };
    }

    componentDidMount() {

        const since = Date.UTC(new Date().getFullYear(), new Date().getMonth() - 3, new Date().getDate());

        this.setState({ requesting: true });
        getNodeUptime(this.props.node.id, since, "days").then((days) => {
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

        const totalUptime = this.state.days ? Math.round(this.state.days.slice(-this.state.displayedDays).filter((day) => day.uptime >= 0).reduce((acc, uptime) => acc + uptime.uptime, 0) / this.state.days.slice(-this.state.displayedDays).filter((day) => day.uptime >= 0).length * 100) / 100 : 0;

        return <div className="node">
            <Link to={"/" + this.props.page.shortName + "/" + this.props.node.id + this.props.back} className="title link-container">
                <span className="link">{this.props.node.name}</span>
                <span>{this.props.node.online ? "En ligne" : "En panne"}</span>
            </Link>
            {this.state.requesting ? <Loading /> : null}
            {this.state.info}
            {this.state.days ? <>
                <div>En ligne à {totalUptime}% ces {this.state.displayedDays} derniers jours :</div>
                <div className="uptime">{this.state.days.slice(-this.state.displayedDays).map((day) =>
                    <div key={day.day} style={{ backgroundColor: day.uptime < 0 ? "gray" : (day.uptime < 95 ? "red" : (day.uptime < 100 ? "orange" : "green")) }} className="day">
                        <div className="tooltip">
                            <div>{moment(day.day * 24 * 60 * 60 * 1000).format("DD/MM/YYYY")}</div>
                            {day.uptime >= 0 ? <div>En ligne à {day.uptime}%</div> : <div>Aucune donnée</div>}
                        </div>
                    </div>
                )}</div>
            </> : null}
        </div>;
    }
}

// eslint-disable-next-line
export default (props) => <PageClass {...props} params={useParams()} location={useLocation()} />;

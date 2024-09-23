const HOST = process.env.NODE_ENV === "production" ? "https://api.status.polycube.fr" : "http://" + document.location.hostname + ":8080";

export const getService = async (id, includes = []) => new Promise((resolve, reject) => {

    const params = new URLSearchParams();
    if (includes) params.set("includes", includes.join(","));

    fetch(HOST + "/services/" + id + (includes.length > 0 ? "?" + params.toString() : ""), { method: "GET" }).then(async (res) => {
        if (res.ok) res.json().then((res) => { delete res.code; resolve(res); }).catch((error) => reject(error));
        else res.json().then((res) => reject(res.message)).catch((error) => reject(error));
    }).catch((error) => reject(error));
});

export const getServiceUptimes = async (serviceId) => new Promise((resolve, reject) => {

    fetch(HOST + "/services/" + serviceId + "/uptimes", { method: "GET" }).then(async (res) => {
        if (res.ok) res.json().then((res) => resolve(res.uptimes)).catch((error) => reject(error));
        else res.json().then((res) => reject(res.message)).catch((error) => reject(error));
    }).catch((error) => reject(error));
});

export const getServiceResponseTimes = async (serviceId) => new Promise((resolve, reject) => {

    fetch(HOST + "/services/" + serviceId + "/responseTimes", { method: "GET" }).then(async (res) => {
        if (res.ok) res.json().then((res) => resolve(res.responseTimes)).catch((error) => reject(error));
        else res.json().then((res) => reject(res.message)).catch((error) => reject(error));
    }).catch((error) => reject(error));
});

export const getPage = async (shortName, includes = []) => new Promise((resolve, reject) => {

    const params = new URLSearchParams();
    if (includes) params.set("includes", includes.join(","));

    fetch(HOST + "/pages/" + shortName + (includes.length > 0 ? "?" + params.toString() : ""), { method: "GET" }).then(async (res) => {
        if (res.ok) res.json().then((res) => { delete res.code; resolve(res); }).catch((error) => reject(error));
        else res.json().then((res) => reject(res.message)).catch((error) => reject(error));
    }).catch((error) => reject(error));
});

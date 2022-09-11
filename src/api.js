const HOST = process.env.NODE_ENV === "production" ? "https://api.status.raraph.fr" : "http://192.168.1.12:8080";

export const getPage = async (shortName) => new Promise((resolve, reject) => {

    fetch(HOST + "/pages/" + shortName, { method: "GET" }).then(async (res) => {
        if (res.ok) res.json().then((res) => {
            const page = { ...res };
            delete page.code;
            resolve(page);
        }).catch((error) => reject(error));
        else res.json().then((res) => reject(res.message)).catch((error) => reject(error));
    }).catch((error) => reject(error));
});

export const getNodeUptime = async (nodeId, since, unit) => new Promise((resolve, reject) => {

    fetch(HOST + "/nodes/" + nodeId + "/uptime", { method: "GET" }).then(async (res) => {
        if (res.ok) res.json().then((res) => resolve(res.uptime)).catch((error) => reject(error));
        else res.json().then((res) => reject(res.message)).catch((error) => reject(error));
    }).catch((error) => reject(error));
});

export const countServices = (page) => {
    let online = 0;
    let total = 0;

    for (const service of page.services) {
        if (service.service.disabled) continue;
        if (service.service.online) online++;
        total++;
    }

    for (const subPage of page.subPages) {
        const { online: subOnline, total: subTotal } = countServices(subPage.subPage);
        online += subOnline;
        total += subTotal;
    }

    return { online, total };
};

export const formatDuration = (time) => {
    const units = [
        {
            timeInSeconds: 60 * 60,
            shortName: "h"
        },
        {
            timeInSeconds: 60,
            shortName: "m"
        },
        {
            timeInSeconds: 1,
            shortName: "s"
        }
    ];

    units.sort((a, b) => b.timeInSeconds - a.timeInSeconds);
    time /= 1000;

    let result = units.map((unit) => {
        let amount = 0;
        while (time >= unit.timeInSeconds) {
            amount++;
            time -= unit.timeInSeconds;
        }
        return amount > 0 ? amount + unit.shortName : null;
    }).filter((amount) => amount).join("");

    return result || "Moins d'une seconde";
};

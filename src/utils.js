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

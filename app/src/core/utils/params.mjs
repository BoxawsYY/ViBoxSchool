export const params = {
    get: (param) => {
        const foundParams = new URLSearchParams(location.search);
        return foundParams.get(param);
    },
    set: (param, value) => {
        history.pushState(null, null, `?${param}=${value}`);
    },
    has: (param) => {
        const foundParams = new URLSearchParams(location.search);
        return foundParams.has(param);
    },
    delete: (param) => {
        const foundParams = new URLSearchParams(location.search);
        foundParams.delete(param);
        history.pushState(null, null, `?${foundParams}`);
    },
    clear: () => {
        history.pushState(null, null, '?');
    }
};

export default params;
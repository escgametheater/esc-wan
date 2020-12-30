function formatTime(t) {
    t = t || Date.now();
    t -= new Date().getTimezoneOffset()*1000*60;
    return new Date(t).toISOString().slice(11,23);
}

module.exports = {
    formatTime
};

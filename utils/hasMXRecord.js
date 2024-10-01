const dns = require("node:dns");

const hasMXRecord = async (email) => {
    const domain = email.split("@")[1];
    return new Promise((resolve, reject) => {
        dns.resolveMx(domain, (err, records) => {
            if (err) {
                reject(false);
            }
            if(records && records.length > 0) resolve(true);
            else reject(false);

        });
    });
};


module.exports = hasMXRecord
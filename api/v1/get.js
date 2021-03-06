const helpers = require("../helpers.js")




// ...
function user (req, res, next) {
    helpers.db
        .one("SELECT * FROM users WHERE id = ${id}", {
            id: req.params.id,
        })
        .then((dbData) => {
            res.status(200).json({
                status: "success",
                data: dbData,
            })
        })
        .catch((error) => {
            return next(error.message)
        })
}




// ...
function account (req, res, next) {
    helpers.db
        .one("SELECT * FROM accounts WHERE user_id = ${user_id}", {
            user_id: req.params.user_id,
        })
        .then((dbData) => {
            res.status(200).json({
                status: "success",
                data: dbData,
            })
        })
        .catch((error) => {
            return next(error.message)
        })
}




// ...
function emailMD5 (req, res, _next) {
    helpers.db
        .any(
            "SELECT " +
                "users.first_name, " +
                "users.last_name, " +
                "users.email, " +
                "accounts.alias, " +
                "accounts.domain, " +
                "accounts.email_md5 " +
            "FROM accounts " +
                "INNER JOIN users ON accounts.user_id = users.id " +
            "WHERE accounts.pubkey = ${pubkey}",
            {
                pubkey: req.params.pubkey,
            }
        )
        .then((dbData) => {
            res.status(200).json({
                status: "success",
                first_name: dbData[0].first_name,
                last_name: dbData[0].last_name,
                email: dbData[0].email,
                md5: dbData[0].email_md5,
                alias: dbData[0].alias,
                domain: dbData[0].domain,
            })
        })
        .catch((_error) => {
            res.status(404).json({
                error: "Not found.",
            })
        })
}




// ...
function latestCurrency (req, res, next) {
    helpers.db
        .any("SELECT * FROM ticker WHERE currency = ${currency}", {
            currency: req.params.currency,
        })
        .then((dbData) => {
            // no data available - update
            if (dbData.length === 0) {
                return helpers
                    .fetchCMC(undefined, req.params.currency)
                    .then((response) => {
                        helpers.db
                            .none(
                                "INSERT INTO " +
                                    "ticker(currency, data, updated_at) " +
                                    "VALUES(${currency}, ${data}, ${updated_at})",
                                {
                                    currency: req.params.currency,
                                    data: response.data,
                                    updated_at: new Date(),
                                }
                            )
                            .then((_result) => {
                                res.status(200).json({
                                    status: "success",
                                    data: response.data,
                                })
                            })
                            .catch((error) => {
                                return next(error.message)
                            })
                    })
                    .catch((error) => {
                        res.status(JSON.parse(error.message).status).json({
                            statusText: JSON.parse(error.message).statusText,
                        })
                    })
            }
            // data too stale - update
            if (
                new Date(dbData[0].updated_at).getTime() <
                new Date().getTime() - 1000 * 60
            ) {
                return helpers
                    .fetchCMC(undefined, req.params.currency)
                    .then((response) => {
                        helpers.db
                            .none(
                                "UPDATE ticker SET " +
                                    "data = $1, " +
                                    "updated_at = $2 " +
                                "WHERE currency = $3",
                                [
                                    response.data,
                                    new Date(),
                                    req.params.currency,
                                ]
                            )
                            .then((_result) => {
                                res.status(200).json({
                                    status: "success",
                                    data: response.data,
                                })
                            })
                            .catch((error) => {
                                return next(error.message)
                            })
                    })
                    .catch((error) => {
                        res.status(JSON.parse(error.message).status).json({
                            statusText: JSON.parse(error.message).statusText,
                        })
                    })
            }
            // otherwise return stale data within 1 minute window
            res.status(200).json({
                status: "success",
                data: dbData[0].data,
            })
        })
        .catch((error) => {
            return next(error.message)
        })
}




// ...
module.exports = {
    latestCurrency: latestCurrency,
    user: user,
    account: account,
    emailMD5,
}

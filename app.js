#!/usr/bin/env node
const GETAPI = require("./api/v1/get.js")
const POSTAPI = require("./api/v1/post.js")
const express = require("express")
const app = express()
const bodyParser = require("body-parser")




// ...
app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
)
app.use(function (_req, res, next) {
    express.json()
    res.header("Access-Control-Allow-Origin", "*")
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    )
    next()
})




/*
 *********************
 ***** GET CALLS *****
 *********************
*/
app.get("/api/v1", (_req, res) => res.send("Deneb - REST API. v.0.1.x"))
app.get("/api/v1/ticker/latest/:currency", GETAPI.latestCurrency)
app.get("/api/v1/user/:id", GETAPI.user)
app.get("/api/v1/account/:user_id", GETAPI.account)
app.get("/api/v1/user/md5/:pubkey", GETAPI.emailMD5)




/*
 **********************
 ***** POST CALLS *****
 **********************
*/
app.post("/api/v1/user/create/", POSTAPI.createUser)
app.post("/api/v1/user/update/:id", POSTAPI.updateUser)
app.post("/api/v1/user/authenticate/", POSTAPI.authenticate)
app.post("/api/v1/account/create/:user_id/:pubkey", POSTAPI.createAccount)
app.post("/api/v1/account/update/:user_id", POSTAPI.updateAccount)
app.post("/api/v1/user/ledgerauth/:pubkey/:path", POSTAPI.issueToken)




// ...
app.listen(
    4001,
    // eslint-disable-next-line no-console
    () => console.log("Deneb::4001")
)

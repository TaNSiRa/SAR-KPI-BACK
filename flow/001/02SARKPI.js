const express = require("express");
const router = express.Router();
var mssql = require('../../function/mssql');
var mssqlR = require('../../function/mssqlR');
var mongodb = require('../../function/mongodb');
var httpreq = require('../../function/axios');
var axios = require('axios');


router.get('/02SARKPI/TEST', async (req, res) => {
    // console.log(mssql.qurey())
    return res.json("SARKPI V0.1");
});

router.post('/02SARKPI/KPISumary', async (req, res) => {
    //-------------------------------------
    console.log("--MKTKPI/KPISumary--");
    //-------------------------------------
    let output = [];
    let query = `SELECT * From [SARKPI].[dbo].[KPISumary] `
    let db = await mssql.qurey(query);
    if (db["recordsets"].length > 0) {
        let buffer = db["recordsets"][0];
        let uniqueData = Array.from(new Map(buffer.map(item => [item['CustShort'], item])).values());
        output = uniqueData;
    }
    //-------------------------------------
    return res.json(output);
});


module.exports = router;
const express = require("express");
const router = express.Router();
var mssql = require('../../function/mssql');
var mongodb = require('../../function/mongodb');
var httpreq = require('../../function/axios');
var axios = require('axios');


router.get('/TEST', async (req, res) => {
  // console.log(mssql.qurey())
  res.json("TEST");
})

router.post('/MKTKPI/test', async (req, res) => {
  //-------------------------------------
  console.log("--MKTKPI/test--");
  console.log(req.body);
  let input = req.body;
  //-------------------------------------


  //-------------------------------------
  return res.json(input);
});

router.post('/MKTKPI/getdata', async (req, res) => {
  //-------------------------------------
  console.log("--MKTKPI/getdata--");
  console.log(req.body);
  let input = req.body;
  //-------------------------------------
  let output = [];
  let query = `SELECT * FROM [SAR].[dbo].[Routine_MasterPatternTS] order by "CustId" desc`

  // console.log(query)
  let db = await mssql.qurey(query);
  if(db["recordsets"].length >0 ){
    let buffer = db["recordsets"][0];
    let uniqueData = Array.from(new Map(buffer.map(item => [item['CustShort'], item])).values());
    output = uniqueData;
  }

  //const


  //-------------------------------------
  return res.json(output);
});

router.post('/MKTKPI/UPDATETYPEGROUP', async (req, res) => {
  //-------------------------------------
  console.log("--MKTKPI/getdata--");
  console.log(req.body);
  let input = req.body;
  //-------------------------------------
  let output = 'OK';
  let query = `UPDATE  [SAR].[dbo].[Routine_MasterPatternTS] SET [TYPE] ='${input["TYPE"]}' , [GROUP] ='${input["GROUP"]}' WHERE [Id]=${input["Id"]}`

  console.log(query)
  let db = await mssql.qurey(query);
  // if(db["recordsets"].length >0 ){
  //   let buffer = db["recordsets"][0];
  //   let uniqueData = Array.from(new Map(buffer.map(item => [item['CustShort'], item])).values());
  //   output = uniqueData;
  // }

  //const


  //-------------------------------------
  return res.json(output);
});



module.exports = router;

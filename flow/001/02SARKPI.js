const express = require("express");
const router = express.Router();
var mssql = require('../../function/mssql');
var mssqlR = require('../../function/mssqlR');
var mongodb = require('../../function/mongodb');
var httpreq = require('../../function/axios');
var axios = require('axios');
const e = require("express");


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

        output = buffer;
    }
    //-------------------------------------
    return res.json(output);
});

router.post('/02SARKPI/Service', async (req, res) => {
    console.log("--02SARKPI/Service--");
    let input = req.body;
    console.log(input);

    let SET01 = [];
    let output = [];

    if (input['MKTGROUP'] != undefined) {
        const year = input['YEAR'];
        const month = input['MONTH'];
        const mktGroup = input['MKTGROUP'];

        const queryMasterPattern = `
            SELECT * From [SAR].[dbo].[Routine_MasterPatternTS] 
            WHERE MKTGROUP = '${mktGroup}' AND FRE != '' AND FRE >= 1
            ORDER BY CustShort;
        `;
        const dbMaster = await mssql.qurey(queryMasterPattern);

        const queryRequestLab = `
            SELECT * From [SAR].[dbo].[Routine_RequestLab] 
            WHERE MONTH(SamplingDate) = '${month}' 
            AND YEAR(SamplingDate) = '${year}'
            AND RequestStatus != 'CANCEL REQUEST'
            ORDER BY CustShort, SamplingDate;
        `;
        const dbRequestLab = await mssql.qurey(queryRequestLab);

        if (dbMaster.recordsets.length > 0 && dbRequestLab.recordsets.length > 0) {
            const masterRecords = dbMaster.recordsets[0];
            const requestRecords = dbRequestLab.recordsets[0];

            const requestRecordsMap = {};
            for (let i = 0; i < requestRecords.length; i++) {
                const req = requestRecords[i];
                const custShort = req.CustShort?.trim();
                if (custShort) {
                    if (!requestRecordsMap[custShort]) {
                        requestRecordsMap[custShort] = [];
                    }
                    requestRecordsMap[custShort].push(req);
                }
            };

            SET01 = masterRecords.map(record => ({
                "DateInsert": "",
                "Type": record['TYPE'],
                "MKTGroup": record['MKTGROUP'],
                "Group": record['GROUP'],
                "Customer": record['CustFull'],
                "CustShort": record['CustShort'].trim(),
                "Frequency": record['FRE'],
                "Incharge": record['Incharge'].trim(),
                "KPIServ": record['GROUP'] === 'KAC' ? '100' : (record['GROUP'] === 'MEDIUM' ? '95' : record['KPIServ']),
                "KPIPeriod": record['TYPE'] === 'A' ? '12' : (record['TYPE'] === 'B' ? '10' : record['KPIPERIOD']),
                "RepItems": record['REPORTITEMS'],
                "Month": "",
                "Year": "",
                "ReqNo1": "",
                "Freq1": "",
                "Evaluation1": "",
                "PlanSam1": "",
                "ActSam1": "",
                "RepDue1": "",
                "SentRep1": "",
                "RepDays1": "",
                "Request1": "",
                "TTCResult1": "",
                "IssueDate1": "",
                "Sublead1": "",
                "GL1": "",
                "MGR1": "",
                "JP1": "",
                "Revise1_1": "",
                "Sublead1_1": "",
                "GL1_1": "",
                "MGR1_1": "",
                "JP1_1": "",
                "Revise1_2": "",
                "Sublead1_2": "",
                "GL1_2": "",
                "MGR1_2": "",
                "JP1_2": "",
                "Revise1_3": "",
                "Sublead1_3": "",
                "GL1_3": "",
                "MGR1_3": "",
                "JP1_3": "",
                "BDPrepare1": "",
                "BDTTC1": "",
                "BDIssue1": "",
                "BDSublead1": "",
                "BDGL1": "",
                "BDMGR1": "",
                "BDJP1": "",
                "BDRevise1_1": "",
                "BDSublead1_1": "",
                "BDGL1_1": "",
                "BDMGR1_1": "",
                "BDJP1_1": "",
                "BDRevise1_2": "",
                "BDSublead1_2": "",
                "BDGL1_2": "",
                "BDMGR1_2": "",
                "BDJP1_2": "",
                "BDRevise1_3": "",
                "BDSublead1_3": "",
                "BDGL1_3": "",
                "BDMGR1_3": "",
                "BDJP1_3": "",
                "BDSent1": "",
                "Reason1": "",
                "ReqNo2": "",
                "Freq2": "",
                "Evaluation2": "",
                "PlanSam2": "",
                "ActSam2": "",
                "RepDue2": "",
                "SentRep2": "",
                "RepDays2": "",
                "Request2": "",
                "TTCResult2": "",
                "IssueDate2": "",
                "Sublead2": "",
                "GL2": "",
                "MGR2": "",
                "JP2": "",
                "Revise2_1": "",
                "Sublead2_1": "",
                "GL2_1": "",
                "MGR2_1": "",
                "JP2_1": "",
                "Revise2_2": "",
                "Sublead2_2": "",
                "GL2_2": "",
                "MGR2_2": "",
                "JP2_2": "",
                "Revise2_3": "",
                "Sublead2_3": "",
                "GL2_3": "",
                "MGR2_3": "",
                "JP2_3": "",
                "BDPrepare2": "",
                "BDTTC2": "",
                "BDIssue2": "",
                "BDSublead2": "",
                "BDGL2": "",
                "BDMGR2": "",
                "BDJP2": "",
                "BDRevise2_1": "",
                "BDSublead2_1": "",
                "BDGL2_1": "",
                "BDMGR2_1": "",
                "BDJP2_1": "",
                "BDRevise2_2": "",
                "BDSublead2_2": "",
                "BDGL2_2": "",
                "BDMGR2_2": "",
                "BDJP2_2": "",
                "BDRevise2_3": "",
                "BDSublead2_3": "",
                "BDGL2_3": "",
                "BDMGR2_3": "",
                "BDJP2_3": "",
                "BDSent2": "",
                "Reason2": "",
                "ReqNo3": "",
                "Freq3": "",
                "Evaluation3": "",
                "PlanSam3": "",
                "ActSam3": "",
                "RepDue3": "",
                "SentRep3": "",
                "RepDays3": "",
                "Request3": "",
                "TTCResult3": "",
                "IssueDate3": "",
                "Sublead3": "",
                "GL3": "",
                "MGR3": "",
                "JP3": "",
                "Revise3_1": "",
                "Sublead3_1": "",
                "GL3_1": "",
                "MGR3_1": "",
                "JP3_1": "",
                "Revise3_2": "",
                "Sublead3_2": "",
                "GL3_2": "",
                "MGR3_2": "",
                "JP3_2": "",
                "Revise3_3": "",
                "Sublead3_3": "",
                "GL3_3": "",
                "MGR3_3": "",
                "JP3_3": "",
                "BDPrepare3": "",
                "BDTTC3": "",
                "BDIssue3": "",
                "BDSublead3": "",
                "BDGL3": "",
                "BDMGR3": "",
                "BDJP3": "",
                "BDRevise3_1": "",
                "BDSublead3_1": "",
                "BDGL3_1": "",
                "BDMGR3_1": "",
                "BDJP3_1": "",
                "BDRevise3_2": "",
                "BDSublead3_2": "",
                "BDGL3_2": "",
                "BDMGR3_2": "",
                "BDJP3_2": "",
                "BDRevise3_3": "",
                "BDSublead3_3": "",
                "BDGL3_3": "",
                "BDMGR3_3": "",
                "BDJP3_3": "",
                "BDSent3": "",
                "Reason3": "",
                "ReqNo4": "",
                "Freq4": "",
                "Evaluation4": "",
                "PlanSam4": "",
                "ActSam4": "",
                "RepDue4": "",
                "SentRep4": "",
                "RepDays4": "",
                "Request4": "",
                "TTCResult4": "",
                "IssueDate4": "",
                "Sublead4": "",
                "GL4": "",
                "MGR4": "",
                "JP4": "",
                "Revise4_1": "",
                "Sublead4_1": "",
                "GL4_1": "",
                "MGR4_1": "",
                "JP4_1": "",
                "Revise4_2": "",
                "Sublead4_2": "",
                "GL4_2": "",
                "MGR4_2": "",
                "JP4_2": "",
                "Revise4_3": "",
                "Sublead4_3": "",
                "GL4_3": "",
                "MGR4_3": "",
                "JP4_3": "",
                "BDPrepare4": "",
                "BDTTC4": "",
                "BDIssue4": "",
                "BDSublead4": "",
                "BDGL4": "",
                "BDMGR4": "",
                "BDJP4": "",
                "BDRevise4_1": "",
                "BDSublead4_1": "",
                "BDGL4_1": "",
                "BDMGR4_1": "",
                "BDJP4_1": "",
                "BDRevise4_2": "",
                "BDSublead4_2": "",
                "BDGL4_2": "",
                "BDMGR4_2": "",
                "BDJP4_2": "",
                "BDRevise4_3": "",
                "BDSublead4_3": "",
                "BDGL4_3": "",
                "BDMGR4_3": "",
                "BDJP4_3": "",
                "BDSent4": "",
                "Reason4": ""
            }));
            console.log("AllCustomer: " + SET01.length)

            let lastcustshort = "";
            let lastreqno = "";

            for (let i = 0; i < SET01.length; i++) {
                const entry = SET01[i];
                const custShort = entry.CustShort;
                const matchingRequests = requestRecordsMap[custShort] || [];
                let lastWeek = 0;

                for (let j = 0; j < matchingRequests.length; j++) {
                    const req = matchingRequests[j];
                    const samplingDate = new Date(req.SamplingDate);
                    const dayOfMonth = samplingDate.getDate();
                    const monthString = samplingDate.toLocaleString('en-US', { month: '2-digit' });
                    const yearString = samplingDate.getFullYear().toString();
                    const kpiPeriod = entry.KPIPeriod;
                    const RepDue = await calculateRepDue(samplingDate, kpiPeriod);
                    const sentRepDate = new Date(req.SentRep);
                    const RepDays = await calculateBusinessDays(samplingDate, sentRepDate);
                    const reqNo = req.ReqNo;
                    const custshort = req.CustShort;
                    const CloseLine = req.RequestStatus;
                    // console.log("custshort: " + custshort);
                    // console.log("lastcustshort: " + lastcustshort);
                    // console.log("reqNo: " + reqNo);
                    // console.log("lastreqno: " + lastreqno);
                    // console.log("lastWeek: " + lastWeek);
                    const queryEvaluation = `
                    SELECT * FROM [SAR].[dbo].[Routine_KACReport] 
                    WHERE ReqNo = '${reqNo}';
                    `;
                    const dbevaluation = await mssql.qurey(queryEvaluation);

                    const evaluationResults = dbevaluation.recordset;

                    const countEvaluation = evaluationResults.length === 0
                        ? ''
                        : evaluationResults.reduce((acc, row) => {
                            if (['LOW', 'HIGH', 'NOT PASS', 'NG'].includes(row.Evaluation)) {
                                return acc + 1;
                            }
                            return acc;
                        }, 0);

                    // console.log('Total count of evaluations (LOW, HIGH, NOT PASS, NG):', countEvaluation);

                    let week = 0;
                    if (dayOfMonth >= 1 && dayOfMonth <= 8) {
                        week = 1;
                    } else if (dayOfMonth >= 9 && dayOfMonth <= 16) {
                        week = 2;
                    } else if (dayOfMonth >= 17 && dayOfMonth <= 24) {
                        week = 3;
                    } else if (dayOfMonth >= 25 && dayOfMonth <= 31) {
                        week = 4;
                    }

                    if (custshort == lastcustshort && reqNo == lastreqno) {
                        if (week < lastWeek) {
                            week = lastWeek;
                        }
                    }
                    if (custshort == lastcustshort && reqNo != lastreqno) {
                        if (week == lastWeek) {
                            week = lastWeek + 1;
                        }
                    }

                    // console.log("week: " + week);
                    switch (week) {
                        case 1:
                            if (CloseLine == "CLOSE LINE") {
                                entry["ReqNo1"] = reqNo;
                                entry["Freq1"] = "CLOSE LINE";
                                entry["Evaluation1"] = "CLOSE LINE";
                                entry["PlanSam1"] = "CLOSE LINE";
                                entry["ActSam1"] = "CLOSE LINE";
                                entry["RepDue1"] = "CLOSE LINE";
                                entry["SentRep1"] = "CLOSE LINE";
                                entry["RepDays1"] = "CLOSE LINE";
                                break;
                            } else {
                                entry["ReqNo1"] = reqNo;
                                entry["Freq1"] = "1";
                                entry["Evaluation1"] = countEvaluation;
                                entry["PlanSam1"] = formatDate(samplingDate);
                                entry["ActSam1"] = formatDate(samplingDate);
                                entry["RepDue1"] = RepDue.RepDue;
                                entry["SentRep1"] = formatDate(sentRepDate);
                                entry["RepDays1"] = RepDays;
                                break;
                            }
                        case 2:
                            if (CloseLine == "CLOSE LINE") {
                                entry["ReqNo2"] = reqNo;
                                entry["Freq2"] = "CLOSE LINE";
                                entry["Evaluation2"] = "CLOSE LINE";
                                entry["PlanSam2"] = "CLOSE LINE";
                                entry["ActSam2"] = "CLOSE LINE";
                                entry["RepDue2"] = "CLOSE LINE";
                                entry["SentRep2"] = "CLOSE LINE";
                                entry["RepDays2"] = "CLOSE LINE";
                                break;
                            } else {
                                entry["ReqNo2"] = reqNo;
                                entry["Freq2"] = "1";
                                entry["Evaluation2"] = countEvaluation;
                                entry["PlanSam2"] = formatDate(samplingDate);
                                entry["ActSam2"] = formatDate(samplingDate);
                                entry["RepDue2"] = RepDue.RepDue;
                                entry["SentRep2"] = formatDate(sentRepDate);
                                entry["RepDays2"] = RepDays;
                                break;
                            }
                        case 3:
                            if (CloseLine == "CLOSE LINE") {
                                entry["ReqNo3"] = reqNo;
                                entry["Freq3"] = "CLOSE LINE";
                                entry["Evaluation3"] = "CLOSE LINE";
                                entry["PlanSam3"] = "CLOSE LINE";
                                entry["ActSam3"] = "CLOSE LINE";
                                entry["RepDue3"] = "CLOSE LINE";
                                entry["SentRep3"] = "CLOSE LINE";
                                entry["RepDays3"] = "CLOSE LINE";
                                break;
                            } else {
                                entry["ReqNo3"] = reqNo;
                                entry["Freq3"] = "1";
                                entry["Evaluation3"] = countEvaluation;
                                entry["PlanSam3"] = formatDate(samplingDate);
                                entry["ActSam3"] = formatDate(samplingDate);
                                entry["RepDue3"] = RepDue.RepDue;
                                entry["SentRep3"] = formatDate(sentRepDate);
                                entry["RepDays3"] = RepDays;
                                break;
                            }
                        case 4:
                            if (CloseLine == "CLOSE LINE") {
                                entry["ReqNo4"] = reqNo;
                                entry["Freq4"] = "CLOSE LINE";
                                entry["Evaluation4"] = "CLOSE LINE";
                                entry["PlanSam4"] = "CLOSE LINE";
                                entry["ActSam4"] = "CLOSE LINE";
                                entry["RepDue4"] = "CLOSE LINE";
                                entry["SentRep4"] = "CLOSE LINE";
                                entry["RepDays4"] = "CLOSE LINE";
                                break;
                            } else {
                                entry["ReqNo4"] = reqNo;
                                entry["Freq4"] = "1";
                                entry["Evaluation4"] = countEvaluation;
                                entry["PlanSam4"] = formatDate(samplingDate);
                                entry["ActSam4"] = formatDate(samplingDate);
                                entry["RepDue4"] = RepDue.RepDue;
                                entry["SentRep4"] = formatDate(sentRepDate);
                                entry["RepDays4"] = RepDays;
                                break;
                            }
                    }
                    entry["Month"] = monthString;
                    entry["Year"] = yearString;
                    lastWeek = week;
                    lastcustshort = custshort;
                    lastreqno = reqNo;
                }
            }
            try {
                var queryDelete = `Delete from [KPI_Service];`;
                var queryInsert = `INSERT INTO KPI_Service 
            ([Type], [MKTGroup], [Group], [Customer], [CustShort], [Frequency]) 
            values `;

                for (i = 0; i < SET01.length; i++) {
                    queryInsert =
                        queryInsert +
                        `( '${SET01[i].Type}'
                      ,'${SET01[i].MKTGroup}'
                      ,'${SET01[i].Group}'
                      ,'${SET01[i].Customer}'
                      ,'${SET01[i].CustShort}'
                      ,'${SET01[i].Frequency}'
                    )`;
                    if (i !== SET01.length - 1) {
                        queryInsert = queryInsert + ",";
                    }
                }
                query = queryDelete + queryInsert + ";";
                console.log(query);
                await mssql.qurey(query);
            } catch (err) {
                console.error('Error executing SQL query:', err);
                res.status(500).send('Internal Server Error');
            }
            output = SET01;
        }
    }
    return res.json(output);
});
// async function insertDataToKPIService(SET01) {
//     try {

//         // คำสั่ง DELETE ข้อมูลทั้งหมดในตาราง KPI_Service
//         let query = `DELETE FROM [KPI_Service];`;

//         // คำสั่ง INSERT ข้อมูลใหม่
//         let queryInsert = `INSERT INTO KPI_Service 
// ([Type], [MKTGroup], [Group], [Customer], [CustShort], [Frequency]) 
// VALUES `;

//         for (let i = 0; i < SET01.length; i++) {
//             queryInsert += `(
//     '${SET01[i].Type}',
//     '${SET01[i].MKTGroup}',
//     '${SET01[i].Group}',
//     '${SET01[i].Customer}',
//     '${SET01[i].CustShort}',
//     '${SET01[i].Frequency}'
// )`;

//             if (i !== SET01.length - 1) {
//                 queryInsert += ",";
//             }
//         }

//         // รวมคำสั่ง DELETE และ INSERT เข้าด้วยกัน
//         query += queryInsert + ";";

//         console.log(query);  // ตรวจสอบคำสั่ง SQL ที่จะรัน

//         // รันคำสั่ง SQL
//         await mssql.qurey(query);  // เรียกใช้งาน query function จาก mssql

//         console.log('Delete and Insert Completed');
//     } catch (err) {
//         console.error('Error deleting and inserting data:', err);
//     } finally {
//     }
// }

// insertDataToKPIService(SET01).catch(err => console.error(err));
router.post('/02SARKPI/Overdue', async (req, res) => {
    console.log("--02SARKPI/Overdue--");
    let input = req.body;
    console.log(input);

    let SET01 = [];
    let output = [];

    if (input['MKTGROUP'] != undefined) {
        const mktGroup = input['MKTGROUP'];
        const year = input['YEAR'];
        const month = input['MONTH'];

        const queryMasterPattern = `
            SELECT * From [SAR].[dbo].[Routine_MasterPatternTS] 
            WHERE MKTGROUP = '${mktGroup}' AND FRE != '' AND FRE >= 1
            ORDER BY CustShort;
        `;
        const dbMaster = await mssql.qurey(queryMasterPattern);

        const queryRequestLab = `
            SELECT * From [SAR].[dbo].[Routine_RequestLab] 
            WHERE MONTH(SamplingDate) = '${month}' 
            AND YEAR(SamplingDate) = '${year}'
            ORDER BY CustShort, SamplingDate;
        `;
        const dbRequestLab = await mssql.qurey(queryRequestLab);

        if (dbMaster.recordsets.length > 0 && dbRequestLab.recordsets.length > 0) {
            const masterRecords = dbMaster.recordsets[0];
            const requestRecords = dbRequestLab.recordsets[0];

            const requestRecordsMap = {};
            for (let i = 0; i < requestRecords.length; i++) {
                const req = requestRecords[i];
                const custShort = req.CustShort?.trim();
                if (custShort) {
                    if (!requestRecordsMap[custShort]) {
                        requestRecordsMap[custShort] = [];
                    }
                    requestRecordsMap[custShort].push(req);
                }
            };

            SET01 = masterRecords.map(record => ({
                "DateInsert": "",
                "Type": record['TYPE'],
                "MKTGroup": record['MKTGROUP'],
                "Group": record['GROUP'],
                "Customer": record['CustFull'],
                "CustShort": record['CustShort'].trim(),
                "Frequency": record['FRE'],
                "Incharge": record['Incharge'].trim(),
                "KPIServ": record['GROUP'] === 'KAC' ? '100' : (record['GROUP'] === 'MEDIUM' ? '95' : record['KPIServ']),
                "KPIPeriod": record['TYPE'] === 'A' ? '12' : (record['TYPE'] === 'B' ? '10' : record['KPIPERIOD']),
                "RepItems": record['REPORTITEMS'],
                "Month": "",
                "Year": "",
                "ReqNo1": "",
                "Freq1": "",
                "PlanSam1": "",
                "ActSam1": "",
                "RepDue1": "",
                "SentRep1": "",
                "RepDays1": "",
                "Request1": "",
                "TTCResult1": "",
                "IssueDate1": "",
                "Sublead1": "",
                "GL1": "",
                "MGR1": "",
                "JP1": "",
                "Revise1_1": "",
                "Sublead1_1": "",
                "GL1_1": "",
                "MGR1_1": "",
                "JP1_1": "",
                "Revise1_2": "",
                "Sublead1_2": "",
                "GL1_2": "",
                "MGR1_2": "",
                "JP1_2": "",
                "Revise1_3": "",
                "Sublead1_3": "",
                "GL1_3": "",
                "MGR1_3": "",
                "JP1_3": "",
                "BDPrepare1": "",
                "BDTTC1": "",
                "BDIssue1": "",
                "BDSublead1": "",
                "BDGL1": "",
                "BDMGR1": "",
                "BDJP1": "",
                "BDRevise1_1": "",
                "BDSublead1_1": "",
                "BDGL1_1": "",
                "BDMGR1_1": "",
                "BDJP1_1": "",
                "BDRevise1_2": "",
                "BDSublead1_2": "",
                "BDGL1_2": "",
                "BDMGR1_2": "",
                "BDJP1_2": "",
                "BDRevise1_3": "",
                "BDSublead1_3": "",
                "BDGL1_3": "",
                "BDMGR1_3": "",
                "BDJP1_3": "",
                "BDSent1": "",
                "Reason1": "",
                "ReqNo2": "",
                "Freq2": "",
                "PlanSam2": "",
                "ActSam2": "",
                "RepDue2": "",
                "SentRep2": "",
                "RepDays2": "",
                "Request2": "",
                "TTCResult2": "",
                "IssueDate2": "",
                "Sublead2": "",
                "GL2": "",
                "MGR2": "",
                "JP2": "",
                "Revise2_1": "",
                "Sublead2_1": "",
                "GL2_1": "",
                "MGR2_1": "",
                "JP2_1": "",
                "Revise2_2": "",
                "Sublead2_2": "",
                "GL2_2": "",
                "MGR2_2": "",
                "JP2_2": "",
                "Revise2_3": "",
                "Sublead2_3": "",
                "GL2_3": "",
                "MGR2_3": "",
                "JP2_3": "",
                "BDPrepare2": "",
                "BDTTC2": "",
                "BDIssue2": "",
                "BDSublead2": "",
                "BDGL2": "",
                "BDMGR2": "",
                "BDJP2": "",
                "BDRevise2_1": "",
                "BDSublead2_1": "",
                "BDGL2_1": "",
                "BDMGR2_1": "",
                "BDJP2_1": "",
                "BDRevise2_2": "",
                "BDSublead2_2": "",
                "BDGL2_2": "",
                "BDMGR2_2": "",
                "BDJP2_2": "",
                "BDRevise2_3": "",
                "BDSublead2_3": "",
                "BDGL2_3": "",
                "BDMGR2_3": "",
                "BDJP2_3": "",
                "BDSent2": "",
                "Reason2": "",
                "ReqNo3": "",
                "Freq3": "",
                "PlanSam3": "",
                "ActSam3": "",
                "RepDue3": "",
                "SentRep3": "",
                "RepDays3": "",
                "Request3": "",
                "TTCResult3": "",
                "IssueDate3": "",
                "Sublead3": "",
                "GL3": "",
                "MGR3": "",
                "JP3": "",
                "Revise3_1": "",
                "Sublead3_1": "",
                "GL3_1": "",
                "MGR3_1": "",
                "JP3_1": "",
                "Revise3_2": "",
                "Sublead3_2": "",
                "GL3_2": "",
                "MGR3_2": "",
                "JP3_2": "",
                "Revise3_3": "",
                "Sublead3_3": "",
                "GL3_3": "",
                "MGR3_3": "",
                "JP3_3": "",
                "BDPrepare3": "",
                "BDTTC3": "",
                "BDIssue3": "",
                "BDSublead3": "",
                "BDGL3": "",
                "BDMGR3": "",
                "BDJP3": "",
                "BDRevise3_1": "",
                "BDSublead3_1": "",
                "BDGL3_1": "",
                "BDMGR3_1": "",
                "BDJP3_1": "",
                "BDRevise3_2": "",
                "BDSublead3_2": "",
                "BDGL3_2": "",
                "BDMGR3_2": "",
                "BDJP3_2": "",
                "BDRevise3_3": "",
                "BDSublead3_3": "",
                "BDGL3_3": "",
                "BDMGR3_3": "",
                "BDJP3_3": "",
                "BDSent3": "",
                "Reason3": "",
                "ReqNo4": "",
                "Freq4": "",
                "PlanSam4": "",
                "ActSam4": "",
                "RepDue4": "",
                "SentRep4": "",
                "RepDays4": "",
                "Request4": "",
                "TTCResult4": "",
                "IssueDate4": "",
                "Sublead4": "",
                "GL4": "",
                "MGR4": "",
                "JP4": "",
                "Revise4_1": "",
                "Sublead4_1": "",
                "GL4_1": "",
                "MGR4_1": "",
                "JP4_1": "",
                "Revise4_2": "",
                "Sublead4_2": "",
                "GL4_2": "",
                "MGR4_2": "",
                "JP4_2": "",
                "Revise4_3": "",
                "Sublead4_3": "",
                "GL4_3": "",
                "MGR4_3": "",
                "JP4_3": "",
                "BDPrepare4": "",
                "BDTTC4": "",
                "BDIssue4": "",
                "BDSublead4": "",
                "BDGL4": "",
                "BDMGR4": "",
                "BDJP4": "",
                "BDRevise4_1": "",
                "BDSublead4_1": "",
                "BDGL4_1": "",
                "BDMGR4_1": "",
                "BDJP4_1": "",
                "BDRevise4_2": "",
                "BDSublead4_2": "",
                "BDGL4_2": "",
                "BDMGR4_2": "",
                "BDJP4_2": "",
                "BDRevise4_3": "",
                "BDSublead4_3": "",
                "BDGL4_3": "",
                "BDMGR4_3": "",
                "BDJP4_3": "",
                "BDSent4": "",
                "Reason4": ""
            }));

            console.log("AllCustomer: " + SET01.length)

            let lastcustshort = "";
            let lastreqno = "";

            for (let i = 0; i < SET01.length; i++) {
                const entry = SET01[i];
                const custShort = entry.CustShort;
                const matchingRequests = requestRecordsMap[custShort] || [];
                let lastWeek = 0;

                for (let j = 0; j < matchingRequests.length; j++) {
                    const req = matchingRequests[j];
                    const samplingDate = new Date(req.SamplingDate);
                    const dayOfMonth = samplingDate.getDate();
                    const monthString = samplingDate.toLocaleString('en-US', { month: '2-digit' });
                    const yearString = samplingDate.getFullYear().toString();
                    const kpiPeriod = entry.KPIPeriod;
                    const sentRepDate = new Date(req.SentRep);
                    const RepDue = await calculateRepDue(samplingDate, kpiPeriod);
                    const RepDays = await calculateBusinessDays(samplingDate, sentRepDate);
                    const reqNo = req.ReqNo;
                    const custshort = req.CustShort;

                    const maxSendDate = matchingRequests
                        .filter(record => record['ReqNo'] === reqNo)
                        .reduce((maxDate, record) => {
                            const currentSendDate = new Date(record['SendDate']);
                            return currentSendDate > maxDate ? currentSendDate : maxDate;
                        }, new Date(req.SendDate));

                    const maxResultApproveDate = matchingRequests
                        .filter(record => record['ReqNo'] === reqNo)
                        .reduce((maxDate, record) => {
                            const currentResultApproveDate = new Date(record['ResultApproveDate']);
                            return currentResultApproveDate > maxDate ? currentResultApproveDate : maxDate;
                        }, new Date(req.ResultApproveDate));

                    const queryIssueDate = `
                    SELECT * FROM [SAR].[dbo].[Routine_KACReport] 
                    WHERE ReqNo = '${reqNo}';
                    `;
                    const dbIssueDate = await mssql.qurey(queryIssueDate);

                    const issueData = dbIssueDate["recordsets"].length > 0 && dbIssueDate["recordsets"][0].length > 0
                        ? dbIssueDate["recordsets"][0][0]
                        : {};
                    const issueDate = issueData['CreateReportDate'] ? new Date(issueData['CreateReportDate']) : null;
                    const Sublead = issueData['SubLeaderTime_0'] ? new Date(issueData['SubLeaderTime_0']) : null;
                    const GL = issueData['GLTime_0'] ? new Date(issueData['GLTime_0']) : null;
                    const MGR = issueData['DGMTime_0'] ? new Date(issueData['DGMTime_0']) : null;
                    const JP = issueData['JPTime_0'] ? new Date(issueData['JPTime_0']) : null;
                    const Revise1 = issueData['InchargeTime_1'] ? new Date(issueData['InchargeTime_1']) : null;
                    const Sublead1 = issueData['SubLeaderTime_1'] ? new Date(issueData['SubLeaderTime_1']) : null;
                    const GL1 = issueData['GLTime_1'] ? new Date(issueData['GLTime_1']) : null;
                    const MGR1 = issueData['DGMTime_1'] ? new Date(issueData['DGMTime_1']) : null;
                    const JP1 = issueData['JPTime_1'] ? new Date(issueData['JPTime_1']) : null;
                    const Revise2 = issueData['InchargeTime_2'] ? new Date(issueData['InchargeTime_2']) : null;
                    const Sublead2 = issueData['SubLeaderTime_2'] ? new Date(issueData['SubLeaderTime_2']) : null;
                    const GL2 = issueData['GLTime_2'] ? new Date(issueData['GLTime_2']) : null;
                    const MGR2 = issueData['DGMTime_2'] ? new Date(issueData['DGMTime_2']) : null;
                    const JP2 = issueData['JPTime_2'] ? new Date(issueData['JPTime_2']) : null;
                    const Revise3 = issueData['InchargeTime_3'] ? new Date(issueData['InchargeTime_3']) : null;
                    const Sublead3 = issueData['SubLeaderTime_3'] ? new Date(issueData['SubLeaderTime_3']) : null;
                    const GL3 = issueData['GLTime_3'] ? new Date(issueData['GLTime_3']) : null;
                    const MGR3 = issueData['DGMTime_3'] ? new Date(issueData['DGMTime_3']) : null;
                    const JP3 = issueData['JPTime_3'] ? new Date(issueData['JPTime_3']) : null;
                    const BDPrepare = await calculateBusinessDays(samplingDate, maxSendDate);
                    const BDTTC = await calculateBusinessDays(maxSendDate, maxResultApproveDate);
                    const BDIssue = await calculateBusinessDays(maxResultApproveDate, issueDate);
                    const isValidDate = (date) => date && date.getTime() !== 0;
                    const BDSublead = await calculateBusinessDays(issueDate, Sublead);
                    const BDGL = isValidDate(Sublead) && isValidDate(GL) ? await calculateBusinessDays(Sublead, GL)
                        : (isValidDate(issueDate) && isValidDate(GL) ? await calculateBusinessDays(issueDate, GL) : null);
                    const BDMGR = isValidDate(GL) && isValidDate(MGR) ? await calculateBusinessDays(GL, MGR)
                        : (isValidDate(Sublead) && isValidDate(MGR) ? await calculateBusinessDays(Sublead, MGR)
                            : (isValidDate(issueDate) && isValidDate(MGR) ? await calculateBusinessDays(issueDate, MGR) : null));
                    const BDJP = isValidDate(MGR) && isValidDate(JP) ? await calculateBusinessDays(MGR, JP)
                        : (isValidDate(GL) && isValidDate(JP) ? await calculateBusinessDays(GL, JP)
                            : (isValidDate(Sublead) && isValidDate(JP) ? await calculateBusinessDays(Sublead, JP) : null));
                    const CheckSignerForBDRevise1 = isValidDate(JP) ? JP
                        : isValidDate(MGR) ? MGR
                            : isValidDate(GL) ? GL
                                : isValidDate(Sublead) ? Sublead
                                    : null;
                    const BDRevise1 = CheckSignerForBDRevise1 ? await calculateBusinessDays(CheckSignerForBDRevise1, Revise1) : null;
                    const BDSublead1 = await calculateBusinessDays(Revise1, Sublead1);
                    const BDGL1 = isValidDate(Sublead1) && isValidDate(GL1) ? await calculateBusinessDays(Sublead1, GL1)
                        : (isValidDate(Revise1) && isValidDate(GL1) ? await calculateBusinessDays(Revise1, GL1) : null);
                    const BDMGR1 = isValidDate(GL1) && isValidDate(MGR1) ? await calculateBusinessDays(GL1, MGR1)
                        : (isValidDate(Sublead1) && isValidDate(MGR1) ? await calculateBusinessDays(Sublead1, MGR1)
                            : (isValidDate(Revise1) && isValidDate(MGR1) ? await calculateBusinessDays(Revise1, MGR1) : null));
                    const BDJP1 = isValidDate(MGR1) && isValidDate(JP1) ? await calculateBusinessDays(MGR1, JP1)
                        : (isValidDate(GL1) && isValidDate(JP1) ? await calculateBusinessDays(GL1, JP1)
                            : (isValidDate(Sublead1) && isValidDate(JP1) ? await calculateBusinessDays(Sublead1, JP1) : null));
                    const CheckSignerForBDRevise2 = isValidDate(JP1) ? JP1
                        : isValidDate(MGR1) ? MGR1
                            : isValidDate(GL1) ? GL1
                                : isValidDate(Sublead1) ? Sublead1
                                    : null;
                    const BDRevise2 = CheckSignerForBDRevise2 ? await calculateBusinessDays(CheckSignerForBDRevise2, Revise2) : null;
                    const BDSublead2 = await calculateBusinessDays(Revise2, Sublead2);
                    const BDGL2 = isValidDate(Sublead2) && isValidDate(GL2) ? await calculateBusinessDays(Sublead2, GL2)
                        : (isValidDate(Revise2) && isValidDate(GL2) ? await calculateBusinessDays(Revise2, GL2) : null);
                    const BDMGR2 = isValidDate(GL2) && isValidDate(MGR2) ? await calculateBusinessDays(GL2, MGR2)
                        : (isValidDate(Sublead2) && isValidDate(MGR2) ? await calculateBusinessDays(Sublead2, MGR2)
                            : (isValidDate(Revise2) && isValidDate(MGR2) ? await calculateBusinessDays(Revise2, MGR2) : null));
                    const BDJP2 = isValidDate(MGR2) && isValidDate(JP2) ? await calculateBusinessDays(MGR2, JP2)
                        : (isValidDate(GL2) && isValidDate(JP2) ? await calculateBusinessDays(GL2, JP2)
                            : (isValidDate(Sublead2) && isValidDate(JP2) ? await calculateBusinessDays(Sublead2, JP2) : null));
                    const CheckSignerForBDRevise3 = isValidDate(JP2) ? JP2
                        : isValidDate(MGR2) ? MGR2
                            : isValidDate(GL2) ? GL2
                                : isValidDate(Sublead2) ? Sublead2
                                    : null;
                    const BDRevise3 = CheckSignerForBDRevise3 ? await calculateBusinessDays(CheckSignerForBDRevise3, Revise3) : null;
                    const BDSublead3 = await calculateBusinessDays(Revise3, Sublead3);
                    const BDGL3 = isValidDate(Sublead3) && isValidDate(GL3) ? await calculateBusinessDays(Sublead3, GL3)
                        : (isValidDate(Revise3) && isValidDate(GL3) ? await calculateBusinessDays(Revise3, GL3) : null);
                    const BDMGR3 = isValidDate(GL3) && isValidDate(MGR3) ? await calculateBusinessDays(GL3, MGR3)
                        : (isValidDate(Sublead3) && isValidDate(MGR3) ? await calculateBusinessDays(Sublead3, MGR3)
                            : (isValidDate(Revise3) && isValidDate(MGR3) ? await calculateBusinessDays(Revise3, MGR3) : null));
                    const BDJP3 = isValidDate(MGR3) && isValidDate(JP3) ? await calculateBusinessDays(MGR3, JP3)
                        : (isValidDate(GL3) && isValidDate(JP3) ? await calculateBusinessDays(GL3, JP3)
                            : (isValidDate(Sublead3) && isValidDate(JP3) ? await calculateBusinessDays(Sublead3, JP3) : null));
                    const CheckSignerForBDSent = isValidDate(JP3) ? JP3
                        : isValidDate(MGR3) ? MGR3
                            : isValidDate(GL3) ? GL3
                                : isValidDate(Sublead3) ? Sublead3
                                    : isValidDate(JP2) ? JP2
                                        : isValidDate(MGR2) ? MGR2
                                            : isValidDate(GL2) ? GL2
                                                : isValidDate(Sublead2) ? Sublead2
                                                    : isValidDate(JP1) ? JP1
                                                        : isValidDate(MGR1) ? MGR1
                                                            : isValidDate(GL1) ? GL1
                                                                : isValidDate(Sublead1) ? Sublead1
                                                                    : isValidDate(JP) ? JP
                                                                        : isValidDate(MGR) ? MGR
                                                                            : isValidDate(GL) ? GL
                                                                                : isValidDate(Sublead) ? Sublead
                                                                                    : null;

                    const BDSent = CheckSignerForBDSent ? await calculateBusinessDays(CheckSignerForBDSent, sentRepDate) : null;
                    const Reason = req.Reason;

                    let week = 0;
                    if (dayOfMonth >= 1 && dayOfMonth <= 8) {
                        week = 1;
                    } else if (dayOfMonth >= 9 && dayOfMonth <= 16) {
                        week = 2;
                    } else if (dayOfMonth >= 17 && dayOfMonth <= 24) {
                        week = 3;
                    } else if (dayOfMonth >= 25 && dayOfMonth <= 31) {
                        week = 4;
                    }

                    if (custshort == lastcustshort && reqNo == lastreqno) {
                        if (week < lastWeek) {
                            week = lastWeek;
                        }
                    }
                    if (custshort == lastcustshort && reqNo != lastreqno) {
                        if (week == lastWeek) {
                            week = lastWeek + 1;
                        }
                    }

                    switch (week) {
                        case 1:
                            entry["ReqNo1"] = reqNo;
                            entry["Freq1"] = "1";
                            entry["PlanSam1"] = formatDate(samplingDate);
                            entry["ActSam1"] = formatDate(samplingDate);
                            entry["RepDue1"] = RepDue.RepDue;
                            entry["SentRep1"] = formatDate(sentRepDate);
                            entry["RepDays1"] = RepDays;
                            entry["Request1"] = formatDate(maxSendDate);
                            entry["TTCResult1"] = formatDate(maxResultApproveDate);
                            entry["IssueDate1"] = formatDate(issueDate);
                            entry["Sublead1"] = formatDate(Sublead);
                            entry["GL1"] = formatDate(GL);
                            entry["MGR1"] = formatDate(MGR);
                            entry["JP1"] = formatDate(JP);
                            entry["Revise1_1"] = formatDate(Revise1);
                            entry["Sublead1_1"] = formatDate(Sublead1);
                            entry["GL1_1"] = formatDate(GL1);
                            entry["MGR1_1"] = formatDate(MGR1);
                            entry["JP1_1"] = formatDate(JP1);
                            entry["Revise1_2"] = formatDate(Revise2);
                            entry["Sublead1_2"] = formatDate(Sublead2);
                            entry["GL1_2"] = formatDate(GL2);
                            entry["MGR1_2"] = formatDate(MGR2);
                            entry["JP1_2"] = formatDate(JP2);
                            entry["Revise1_3"] = formatDate(Revise3);
                            entry["Sublead1_3"] = formatDate(Sublead3);
                            entry["GL1_3"] = formatDate(GL3);
                            entry["MGR1_3"] = formatDate(MGR3);
                            entry["JP1_3"] = formatDate(JP3);
                            entry["BDPrepare1"] = BDPrepare;
                            entry["BDTTC1"] = BDTTC;
                            entry["BDIssue1"] = BDIssue;
                            entry["BDSublead1"] = BDSublead;
                            entry["BDGL1"] = BDGL;
                            entry["BDMGR1"] = BDMGR;
                            entry["BDJP1"] = BDJP;
                            entry["BDRevise1_1"] = BDRevise1;
                            entry["BDSublead1_1"] = BDSublead1;
                            entry["BDGL1_1"] = BDGL1;
                            entry["BDMGR1_1"] = BDMGR1;
                            entry["BDJP1_1"] = BDJP1;
                            entry["BDRevise1_2"] = BDRevise2;
                            entry["BDSublead1_2"] = BDSublead2;
                            entry["BDGL1_2"] = BDGL2;
                            entry["BDMGR1_2"] = BDMGR2;
                            entry["BDJP1_2"] = BDJP2;
                            entry["BDRevise1_3"] = BDRevise3;
                            entry["BDSublead1_3"] = BDSublead3;
                            entry["BDGL1_3"] = BDGL3;
                            entry["BDMGR1_3"] = BDMGR3;
                            entry["BDJP1_3"] = BDJP3;
                            entry["BDSent1"] = BDSent;
                            entry["Reason1"] = Reason;
                            break;
                        case 2:
                            entry["ReqNo2"] = reqNo;
                            entry["Freq2"] = "1";
                            entry["PlanSam2"] = formatDate(samplingDate);
                            entry["ActSam2"] = formatDate(samplingDate);
                            entry["RepDue2"] = RepDue.RepDue;
                            entry["SentRep2"] = formatDate(sentRepDate);
                            entry["RepDays2"] = RepDays;
                            entry["Request2"] = formatDate(maxSendDate);
                            entry["TTCResult2"] = formatDate(maxResultApproveDate);
                            entry["IssueDate2"] = formatDate(issueDate);
                            entry["Sublead2"] = formatDate(Sublead);
                            entry["GL2"] = formatDate(GL);
                            entry["MGR2"] = formatDate(MGR);
                            entry["JP2"] = formatDate(JP);
                            entry["Revise2_1"] = formatDate(Revise1);
                            entry["Sublead2_1"] = formatDate(Sublead1);
                            entry["GL2_1"] = formatDate(GL1);
                            entry["MGR2_1"] = formatDate(MGR1);
                            entry["JP2_1"] = formatDate(JP1);
                            entry["Revise2_2"] = formatDate(Revise2);
                            entry["Sublead2_2"] = formatDate(Sublead2);
                            entry["GL2_2"] = formatDate(GL2);
                            entry["MGR2_2"] = formatDate(MGR2);
                            entry["JP2_2"] = formatDate(JP2);
                            entry["Revise2_3"] = formatDate(Revise3);
                            entry["Sublead2_3"] = formatDate(Sublead3);
                            entry["GL2_3"] = formatDate(GL3);
                            entry["MGR2_3"] = formatDate(MGR3);
                            entry["JP2_3"] = formatDate(JP3);
                            entry["BDPrepare2"] = BDPrepare;
                            entry["BDTTC2"] = BDTTC;
                            entry["BDIssue2"] = BDIssue;
                            entry["BDSublead2"] = BDSublead;
                            entry["BDGL2"] = BDGL;
                            entry["BDMGR2"] = BDMGR;
                            entry["BDJP2"] = BDJP;
                            entry["BDRevise2_1"] = BDRevise1;
                            entry["BDSublead2_1"] = BDSublead1;
                            entry["BDGL2_1"] = BDGL1;
                            entry["BDMGR2_1"] = BDMGR1;
                            entry["BDJP2_1"] = BDJP1;
                            entry["BDRevise2_2"] = BDRevise2;
                            entry["BDSublead2_2"] = BDSublead2;
                            entry["BDGL2_2"] = BDGL2;
                            entry["BDMGR2_2"] = BDMGR2;
                            entry["BDJP2_2"] = BDJP2;
                            entry["BDRevise2_3"] = BDRevise3;
                            entry["BDSublead2_3"] = BDSublead3;
                            entry["BDGL2_3"] = BDGL3;
                            entry["BDMGR2_3"] = BDMGR3;
                            entry["BDJP2_3"] = BDJP3;
                            entry["BDSent2"] = BDSent;
                            entry["Reason2"] = Reason;
                            break;
                        case 3:
                            entry["ReqNo3"] = reqNo;
                            entry["Freq3"] = "1";
                            entry["PlanSam3"] = formatDate(samplingDate);
                            entry["ActSam3"] = formatDate(samplingDate);
                            entry["RepDue3"] = RepDue.RepDue;
                            entry["SentRep3"] = formatDate(sentRepDate);
                            entry["RepDays3"] = RepDays;
                            entry["Request3"] = formatDate(maxSendDate);
                            entry["TTCResult3"] = formatDate(maxResultApproveDate);
                            entry["IssueDate3"] = formatDate(issueDate);
                            entry["Sublead3"] = formatDate(Sublead);
                            entry["GL3"] = formatDate(GL);
                            entry["MGR3"] = formatDate(MGR);
                            entry["JP3"] = formatDate(JP);
                            entry["Revise3_1"] = formatDate(Revise1);
                            entry["Sublead3_1"] = formatDate(Sublead1);
                            entry["GL3_1"] = formatDate(GL1);
                            entry["MGR3_1"] = formatDate(MGR1);
                            entry["JP3_1"] = formatDate(JP1);
                            entry["Revise3_2"] = formatDate(Revise2);
                            entry["Sublead3_2"] = formatDate(Sublead2);
                            entry["GL3_2"] = formatDate(GL2);
                            entry["MGR3_2"] = formatDate(MGR2);
                            entry["JP3_2"] = formatDate(JP2);
                            entry["Revise3_3"] = formatDate(Revise3);
                            entry["Sublead3_3"] = formatDate(Sublead3);
                            entry["GL3_3"] = formatDate(GL3);
                            entry["MGR3_3"] = formatDate(MGR3);
                            entry["JP3_3"] = formatDate(JP3);
                            entry["BDPrepare3"] = BDPrepare;
                            entry["BDTTC3"] = BDTTC;
                            entry["BDIssue3"] = BDIssue;
                            entry["BDSublead3"] = BDSublead;
                            entry["BDGL3"] = BDGL;
                            entry["BDMGR3"] = BDMGR;
                            entry["BDJP3"] = BDJP;
                            entry["BDRevise3_1"] = BDRevise1;
                            entry["BDSublead3_1"] = BDSublead1;
                            entry["BDGL3_1"] = BDGL1;
                            entry["BDMGR3_1"] = BDMGR1;
                            entry["BDJP3_1"] = BDJP1;
                            entry["BDRevise3_2"] = BDRevise2;
                            entry["BDSublead3_2"] = BDSublead2;
                            entry["BDGL3_2"] = BDGL2;
                            entry["BDMGR3_2"] = BDMGR2;
                            entry["BDJP3_2"] = BDJP2;
                            entry["BDRevise3_3"] = BDRevise3;
                            entry["BDSublead3_3"] = BDSublead3;
                            entry["BDGL3_3"] = BDGL3;
                            entry["BDMGR3_3"] = BDMGR3;
                            entry["BDJP3_3"] = BDJP3;
                            entry["BDSent3"] = BDSent;
                            entry["Reason3"] = Reason;
                            break;
                        case 4:
                            entry["ReqNo4"] = reqNo;
                            entry["Freq4"] = "1";
                            entry["PlanSam4"] = formatDate(samplingDate);
                            entry["ActSam4"] = formatDate(samplingDate);
                            entry["RepDue4"] = RepDue.RepDue;
                            entry["SentRep4"] = formatDate(sentRepDate);
                            entry["RepDays4"] = RepDays;
                            entry["Request4"] = formatDate(maxSendDate);
                            entry["TTCResult4"] = formatDate(maxResultApproveDate);
                            entry["IssueDate4"] = formatDate(issueDate);
                            entry["Sublead4"] = formatDate(Sublead);
                            entry["GL4"] = formatDate(GL);
                            entry["MGR4"] = formatDate(MGR);
                            entry["JP4"] = formatDate(JP);
                            entry["Revise4_1"] = formatDate(Revise1);
                            entry["Sublead4_1"] = formatDate(Sublead1);
                            entry["GL4_1"] = formatDate(GL1);
                            entry["MGR4_1"] = formatDate(MGR1);
                            entry["JP4_1"] = formatDate(JP1);
                            entry["Revise4_2"] = formatDate(Revise2);
                            entry["Sublead4_2"] = formatDate(Sublead2);
                            entry["GL4_2"] = formatDate(GL2);
                            entry["MGR4_2"] = formatDate(MGR2);
                            entry["JP4_2"] = formatDate(JP2);
                            entry["Revise4_3"] = formatDate(Revise3);
                            entry["Sublead4_3"] = formatDate(Sublead3);
                            entry["GL4_3"] = formatDate(GL3);
                            entry["MGR4_3"] = formatDate(MGR3);
                            entry["JP4_3"] = formatDate(JP3);
                            entry["BDPrepare4"] = BDPrepare;
                            entry["BDTTC4"] = BDTTC;
                            entry["BDIssue4"] = BDIssue;
                            entry["BDSublead4"] = BDSublead;
                            entry["BDGL4"] = BDGL;
                            entry["BDMGR4"] = BDMGR;
                            entry["BDJP4"] = BDJP;
                            entry["BDRevise4_1"] = BDRevise1;
                            entry["BDSublead4_1"] = BDSublead1;
                            entry["BDGL4_1"] = BDGL1;
                            entry["BDMGR4_1"] = BDMGR1;
                            entry["BDJP4_1"] = BDJP1;
                            entry["BDRevise4_2"] = BDRevise2;
                            entry["BDSublead4_2"] = BDSublead2;
                            entry["BDGL4_2"] = BDGL2;
                            entry["BDMGR4_2"] = BDMGR2;
                            entry["BDJP4_2"] = BDJP2;
                            entry["BDRevise4_3"] = BDRevise3;
                            entry["BDSublead4_3"] = BDSublead3;
                            entry["BDGL4_3"] = BDGL3;
                            entry["BDMGR4_3"] = BDMGR3;
                            entry["BDJP4_3"] = BDJP3;
                            entry["BDSent4"] = BDSent;
                            entry["Reason4"] = Reason;
                            break;
                    }
                    entry["Month"] = monthString;
                    entry["Year"] = yearString;
                    lastWeek = week;
                    lastcustshort = custshort;
                    lastreqno = reqNo;
                }
            }
            output = SET01;
        }
    }
    return res.json(output);
});

router.post('/02SARKPI/CustServiceChart', async (req, res) => {
    console.log("--02SARKPI/CustServiceChart--");
    let input = req.body;
    console.log(input);

    let SET01 = [];
    let output = [];
    let previousReqNo = null;

    if (input['YEAR'] != undefined) {
        const year = input['YEAR'];
        const lastYear = year - 1;

        const queryRequestLab = `
        SELECT * FROM [SAR].[dbo].[Routine_RequestLab]
        WHERE YEAR(SamplingDate) IN (${year}, ${lastYear})
        AND RequestStatus != 'CANCEL REQUEST'
        ORDER BY ReqNo;
        `;
        const dbRequestLab = await mssql.qurey(queryRequestLab);
        const requestRecords = dbRequestLab.recordsets[0];
        console.log("requestRecords " + requestRecords.length);

        const queryMasterPattern = `
        SELECT CustShort, [Group], FRE
        FROM [SAR].[dbo].[Routine_MasterPatternTS]
        WHERE TYPE != 'NULL' AND TYPE != '';
        `;
        const dbMasterPattern = await mssql.qurey(queryMasterPattern);
        const masterRecords = dbMasterPattern.recordsets[0];

        const groupMap = {};
        for (let i = 0; i < masterRecords.length; i++) {
            const record = masterRecords[i];
            groupMap[record.CustShort] = {
                GROUP: record.Group,
                Frequency: record.FRE,
            };
        };

        for (let i = 0; i < requestRecords.length; i++) {
            const req = requestRecords[i];
            const samplingDate = new Date(req.SamplingDate);
            const dayOfMonth = samplingDate.getDate();
            const monthString = samplingDate.toLocaleString('en-US', { month: '2-digit' });
            const yearString = samplingDate.getFullYear().toString();
            const reqNo = req.ReqNo;
            const CloseLine = req.RequestStatus;

            if (reqNo === previousReqNo) {
                // console.log("Jump");
                continue;
            } else {
                // console.log(reqNo)
            }

            previousReqNo = reqNo;

            let entry = {
                "DateInsert": "",
                "Type": "",
                "MKTGroup": "",
                "Group": groupMap[req.CustShort] ? groupMap[req.CustShort].GROUP || "" : "",
                "Customer": req.CustFull,
                "CustShort": req.CustShort,
                "Frequency": groupMap[req.CustShort] ? groupMap[req.CustShort].Frequency || "" : "",
                "Incharge": "",
                "KPIServ": "",
                "KPIPeriod": "",
                "RepItems": "",
                "Month": monthString,
                "Year": yearString,
                "ReqNo1": "",
                "Freq1": "",
                "PlanSam1": "",
                "ActSam1": "",
                "RepDue1": "",
                "SentRep1": "",
                "RepDays1": "",
                "Request1": "",
                "TTCResult1": "",
                "IssueDate1": "",
                "Sublead1": "",
                "GL1": "",
                "MGR1": "",
                "JP1": "",
                "Revise1_1": "",
                "Sublead1_1": "",
                "GL1_1": "",
                "MGR1_1": "",
                "JP1_1": "",
                "Revise1_2": "",
                "Sublead1_2": "",
                "GL1_2": "",
                "MGR1_2": "",
                "JP1_2": "",
                "Revise1_3": "",
                "Sublead1_3": "",
                "GL1_3": "",
                "MGR1_3": "",
                "JP1_3": "",
                "BDPrepare1": "",
                "BDTTC1": "",
                "BDIssue1": "",
                "BDSublead1": "",
                "BDGL1": "",
                "BDMGR1": "",
                "BDJP1": "",
                "BDRevise1_1": "",
                "BDSublead1_1": "",
                "BDGL1_1": "",
                "BDMGR1_1": "",
                "BDJP1_1": "",
                "BDRevise1_2": "",
                "BDSublead1_2": "",
                "BDGL1_2": "",
                "BDMGR1_2": "",
                "BDJP1_2": "",
                "BDRevise1_3": "",
                "BDSublead1_3": "",
                "BDGL1_3": "",
                "BDMGR1_3": "",
                "BDJP1_3": "",
                "BDSent1": "",
                "Reason1": "",
                "ReqNo2": "",
                "Freq2": "",
                "PlanSam2": "",
                "ActSam2": "",
                "RepDue2": "",
                "SentRep2": "",
                "RepDays2": "",
                "Request2": "",
                "TTCResult2": "",
                "IssueDate2": "",
                "Sublead2": "",
                "GL2": "",
                "MGR2": "",
                "JP2": "",
                "Revise2_1": "",
                "Sublead2_1": "",
                "GL2_1": "",
                "MGR2_1": "",
                "JP2_1": "",
                "Revise2_2": "",
                "Sublead2_2": "",
                "GL2_2": "",
                "MGR2_2": "",
                "JP2_2": "",
                "Revise2_3": "",
                "Sublead2_3": "",
                "GL2_3": "",
                "MGR2_3": "",
                "JP2_3": "",
                "BDPrepare2": "",
                "BDTTC2": "",
                "BDIssue2": "",
                "BDSublead2": "",
                "BDGL2": "",
                "BDMGR2": "",
                "BDJP2": "",
                "BDRevise2_1": "",
                "BDSublead2_1": "",
                "BDGL2_1": "",
                "BDMGR2_1": "",
                "BDJP2_1": "",
                "BDRevise2_2": "",
                "BDSublead2_2": "",
                "BDGL2_2": "",
                "BDMGR2_2": "",
                "BDJP2_2": "",
                "BDRevise2_3": "",
                "BDSublead2_3": "",
                "BDGL2_3": "",
                "BDMGR2_3": "",
                "BDJP2_3": "",
                "BDSent2": "",
                "Reason2": "",
                "ReqNo3": "",
                "Freq3": "",
                "PlanSam3": "",
                "ActSam3": "",
                "RepDue3": "",
                "SentRep3": "",
                "RepDays3": "",
                "Request3": "",
                "TTCResult3": "",
                "IssueDate3": "",
                "Sublead3": "",
                "GL3": "",
                "MGR3": "",
                "JP3": "",
                "Revise3_1": "",
                "Sublead3_1": "",
                "GL3_1": "",
                "MGR3_1": "",
                "JP3_1": "",
                "Revise3_2": "",
                "Sublead3_2": "",
                "GL3_2": "",
                "MGR3_2": "",
                "JP3_2": "",
                "Revise3_3": "",
                "Sublead3_3": "",
                "GL3_3": "",
                "MGR3_3": "",
                "JP3_3": "",
                "BDPrepare3": "",
                "BDTTC3": "",
                "BDIssue3": "",
                "BDSublead3": "",
                "BDGL3": "",
                "BDMGR3": "",
                "BDJP3": "",
                "BDRevise3_1": "",
                "BDSublead3_1": "",
                "BDGL3_1": "",
                "BDMGR3_1": "",
                "BDJP3_1": "",
                "BDRevise3_2": "",
                "BDSublead3_2": "",
                "BDGL3_2": "",
                "BDMGR3_2": "",
                "BDJP3_2": "",
                "BDRevise3_3": "",
                "BDSublead3_3": "",
                "BDGL3_3": "",
                "BDMGR3_3": "",
                "BDJP3_3": "",
                "BDSent3": "",
                "Reason3": "",
                "ReqNo4": "",
                "Freq4": "",
                "PlanSam4": "",
                "ActSam4": "",
                "RepDue4": "",
                "SentRep4": "",
                "RepDays4": "",
                "Request4": "",
                "TTCResult4": "",
                "IssueDate4": "",
                "Sublead4": "",
                "GL4": "",
                "MGR4": "",
                "JP4": "",
                "Revise4_1": "",
                "Sublead4_1": "",
                "GL4_1": "",
                "MGR4_1": "",
                "JP4_1": "",
                "Revise4_2": "",
                "Sublead4_2": "",
                "GL4_2": "",
                "MGR4_2": "",
                "JP4_2": "",
                "Revise4_3": "",
                "Sublead4_3": "",
                "GL4_3": "",
                "MGR4_3": "",
                "JP4_3": "",
                "BDPrepare4": "",
                "BDTTC4": "",
                "BDIssue4": "",
                "BDSublead4": "",
                "BDGL4": "",
                "BDMGR4": "",
                "BDJP4": "",
                "BDRevise4_1": "",
                "BDSublead4_1": "",
                "BDGL4_1": "",
                "BDMGR4_1": "",
                "BDJP4_1": "",
                "BDRevise4_2": "",
                "BDSublead4_2": "",
                "BDGL4_2": "",
                "BDMGR4_2": "",
                "BDJP4_2": "",
                "BDRevise4_3": "",
                "BDSublead4_3": "",
                "BDGL4_3": "",
                "BDMGR4_3": "",
                "BDJP4_3": "",
                "BDSent4": "",
                "Reason4": ""
            };
            let week = 0;
            if (dayOfMonth >= 1 && dayOfMonth <= 8) {
                week = 1;
            } else if (dayOfMonth >= 9 && dayOfMonth <= 16) {
                week = 2;
            } else if (dayOfMonth >= 17 && dayOfMonth <= 24) {
                week = 3;
            } else if (dayOfMonth >= 25 && dayOfMonth <= 31) {
                week = 4;
            }

            // console.log("week: " + week);
            switch (week) {
                case 1:
                    if (CloseLine == "CLOSE LINE") {
                        entry["ReqNo1"] = reqNo;
                        entry["Freq1"] = "CLOSE LINE";
                        entry["ActSam1"] = "CLOSE LINE";
                        break;
                    } else {
                        entry["ReqNo1"] = reqNo;
                        entry["Freq1"] = "1";
                        entry["ActSam1"] = formatDate(samplingDate);
                        break;
                    }
                case 2:
                    if (CloseLine == "CLOSE LINE") {
                        entry["ReqNo2"] = reqNo;
                        entry["Freq2"] = "CLOSE LINE";
                        entry["ActSam2"] = "CLOSE LINE";
                        break;
                    } else {
                        entry["ReqNo2"] = reqNo;
                        entry["Freq2"] = "1";
                        entry["ActSam2"] = formatDate(samplingDate);
                        break;
                    }
                case 3:
                    if (CloseLine == "CLOSE LINE") {
                        entry["ReqNo3"] = reqNo;
                        entry["Freq3"] = "CLOSE LINE";
                        entry["ActSam3"] = "CLOSE LINE";
                        break;
                    } else {
                        entry["ReqNo3"] = reqNo;
                        entry["Freq3"] = "1";
                        entry["ActSam3"] = formatDate(samplingDate);
                        break;
                    }
                case 4:
                    if (CloseLine == "CLOSE LINE") {
                        entry["ReqNo4"] = reqNo;
                        entry["Freq4"] = "CLOSE LINE";
                        entry["ActSam4"] = "CLOSE LINE";
                        break;
                    } else {
                        entry["ReqNo4"] = reqNo;
                        entry["Freq4"] = "1";
                        entry["ActSam4"] = formatDate(samplingDate);
                        break;
                    }
            }
            SET01.push(entry);
        };
        console.log("SET01 " + SET01.length);
        output = SET01;
    }
    return res.json(output);
});

router.post('/02SARKPI/ReportOverKPIChart', async (req, res) => {
    console.log("--02SARKPI/ReportOverKPIChart--");
    let input = req.body;
    console.log(input);

    let SET01 = [];
    let output = [];

    if (input['TYPE'] != undefined && input['YEAR'] != undefined && input['MONTH'] != undefined) {
        const type = input['TYPE'];
        const year = input['YEAR'];
        const month = input['MONTH'];

        const queryMasterPattern = `
            SELECT * From [SAR].[dbo].[Routine_MasterPatternTS] 
            WHERE TYPE = '${type}'
            ORDER BY CustShort;
        `;
        const dbMaster = await mssql.qurey(queryMasterPattern);

        const queryRequestLab = `
            SELECT * From [SAR].[dbo].[Routine_RequestLab] 
            WHERE MONTH(SamplingDate) = '${month}' 
            AND YEAR(SamplingDate) = '${year}'
            ORDER BY CustShort, SamplingDate;
        `;
        const dbRequestLab = await mssql.qurey(queryRequestLab);

        if (dbMaster.recordsets.length > 0 && dbRequestLab.recordsets.length > 0) {
            const masterRecords = dbMaster.recordsets[0];
            const requestRecords = dbRequestLab.recordsets[0];

            const requestRecordsMap = {};
            for (let i = 0; i < requestRecords.length; i++) {
                const req = requestRecords[i];
                const custShort = req.CustShort?.trim();
                if (custShort) {
                    if (!requestRecordsMap[custShort]) {
                        requestRecordsMap[custShort] = [];
                    }
                    requestRecordsMap[custShort].push(req);
                }
            };

            SET01 = masterRecords.map(record => ({
                "DateInsert": "",
                "Type": record['TYPE'],
                "MKTGroup": record['MKTGROUP'],
                "Group": record['GROUP'],
                "Customer": record['CustFull'],
                "CustShort": record['CustShort'].trim(),
                "Frequency": record['FRE'],
                "Incharge": record['Incharge'].trim(),
                "KPIServ": record['GROUP'] === 'KAC' ? '100' : (record['GROUP'] === 'MEDIUM' ? '95' : record['KPIServ']),
                "KPIPeriod": record['TYPE'] === 'A' ? '12' : (record['TYPE'] === 'B' ? '10' : record['KPIPERIOD']),
                "RepItems": record['REPORTITEMS'],
                "Month": "",
                "Year": "",
                "ReqNo1": "",
                "Freq1": "",
                "Evaluation1": "",
                "PlanSam1": "",
                "ActSam1": "",
                "RepDue1": "",
                "SentRep1": "",
                "RepDays1": "",
                "Request1": "",
                "TTCResult1": "",
                "IssueDate1": "",
                "Sublead1": "",
                "GL1": "",
                "MGR1": "",
                "JP1": "",
                "Revise1_1": "",
                "Sublead1_1": "",
                "GL1_1": "",
                "MGR1_1": "",
                "JP1_1": "",
                "Revise1_2": "",
                "Sublead1_2": "",
                "GL1_2": "",
                "MGR1_2": "",
                "JP1_2": "",
                "Revise1_3": "",
                "Sublead1_3": "",
                "GL1_3": "",
                "MGR1_3": "",
                "JP1_3": "",
                "BDPrepare1": "",
                "BDTTC1": "",
                "BDIssue1": "",
                "BDSublead1": "",
                "BDGL1": "",
                "BDMGR1": "",
                "BDJP1": "",
                "BDRevise1_1": "",
                "BDSublead1_1": "",
                "BDGL1_1": "",
                "BDMGR1_1": "",
                "BDJP1_1": "",
                "BDRevise1_2": "",
                "BDSublead1_2": "",
                "BDGL1_2": "",
                "BDMGR1_2": "",
                "BDJP1_2": "",
                "BDRevise1_3": "",
                "BDSublead1_3": "",
                "BDGL1_3": "",
                "BDMGR1_3": "",
                "BDJP1_3": "",
                "BDSent1": "",
                "Reason1": "",
                "ReqNo2": "",
                "Freq2": "",
                "Evaluation2": "",
                "PlanSam2": "",
                "ActSam2": "",
                "RepDue2": "",
                "SentRep2": "",
                "RepDays2": "",
                "Request2": "",
                "TTCResult2": "",
                "IssueDate2": "",
                "Sublead2": "",
                "GL2": "",
                "MGR2": "",
                "JP2": "",
                "Revise2_1": "",
                "Sublead2_1": "",
                "GL2_1": "",
                "MGR2_1": "",
                "JP2_1": "",
                "Revise2_2": "",
                "Sublead2_2": "",
                "GL2_2": "",
                "MGR2_2": "",
                "JP2_2": "",
                "Revise2_3": "",
                "Sublead2_3": "",
                "GL2_3": "",
                "MGR2_3": "",
                "JP2_3": "",
                "BDPrepare2": "",
                "BDTTC2": "",
                "BDIssue2": "",
                "BDSublead2": "",
                "BDGL2": "",
                "BDMGR2": "",
                "BDJP2": "",
                "BDRevise2_1": "",
                "BDSublead2_1": "",
                "BDGL2_1": "",
                "BDMGR2_1": "",
                "BDJP2_1": "",
                "BDRevise2_2": "",
                "BDSublead2_2": "",
                "BDGL2_2": "",
                "BDMGR2_2": "",
                "BDJP2_2": "",
                "BDRevise2_3": "",
                "BDSublead2_3": "",
                "BDGL2_3": "",
                "BDMGR2_3": "",
                "BDJP2_3": "",
                "BDSent2": "",
                "Reason2": "",
                "ReqNo3": "",
                "Freq3": "",
                "Evaluation3": "",
                "PlanSam3": "",
                "ActSam3": "",
                "RepDue3": "",
                "SentRep3": "",
                "RepDays3": "",
                "Request3": "",
                "TTCResult3": "",
                "IssueDate3": "",
                "Sublead3": "",
                "GL3": "",
                "MGR3": "",
                "JP3": "",
                "Revise3_1": "",
                "Sublead3_1": "",
                "GL3_1": "",
                "MGR3_1": "",
                "JP3_1": "",
                "Revise3_2": "",
                "Sublead3_2": "",
                "GL3_2": "",
                "MGR3_2": "",
                "JP3_2": "",
                "Revise3_3": "",
                "Sublead3_3": "",
                "GL3_3": "",
                "MGR3_3": "",
                "JP3_3": "",
                "BDPrepare3": "",
                "BDTTC3": "",
                "BDIssue3": "",
                "BDSublead3": "",
                "BDGL3": "",
                "BDMGR3": "",
                "BDJP3": "",
                "BDRevise3_1": "",
                "BDSublead3_1": "",
                "BDGL3_1": "",
                "BDMGR3_1": "",
                "BDJP3_1": "",
                "BDRevise3_2": "",
                "BDSublead3_2": "",
                "BDGL3_2": "",
                "BDMGR3_2": "",
                "BDJP3_2": "",
                "BDRevise3_3": "",
                "BDSublead3_3": "",
                "BDGL3_3": "",
                "BDMGR3_3": "",
                "BDJP3_3": "",
                "BDSent3": "",
                "Reason3": "",
                "ReqNo4": "",
                "Freq4": "",
                "Evaluation4": "",
                "PlanSam4": "",
                "ActSam4": "",
                "RepDue4": "",
                "SentRep4": "",
                "RepDays4": "",
                "Request4": "",
                "TTCResult4": "",
                "IssueDate4": "",
                "Sublead4": "",
                "GL4": "",
                "MGR4": "",
                "JP4": "",
                "Revise4_1": "",
                "Sublead4_1": "",
                "GL4_1": "",
                "MGR4_1": "",
                "JP4_1": "",
                "Revise4_2": "",
                "Sublead4_2": "",
                "GL4_2": "",
                "MGR4_2": "",
                "JP4_2": "",
                "Revise4_3": "",
                "Sublead4_3": "",
                "GL4_3": "",
                "MGR4_3": "",
                "JP4_3": "",
                "BDPrepare4": "",
                "BDTTC4": "",
                "BDIssue4": "",
                "BDSublead4": "",
                "BDGL4": "",
                "BDMGR4": "",
                "BDJP4": "",
                "BDRevise4_1": "",
                "BDSublead4_1": "",
                "BDGL4_1": "",
                "BDMGR4_1": "",
                "BDJP4_1": "",
                "BDRevise4_2": "",
                "BDSublead4_2": "",
                "BDGL4_2": "",
                "BDMGR4_2": "",
                "BDJP4_2": "",
                "BDRevise4_3": "",
                "BDSublead4_3": "",
                "BDGL4_3": "",
                "BDMGR4_3": "",
                "BDJP4_3": "",
                "BDSent4": "",
                "Reason4": ""
            }));

            console.log("AllCustomer: " + SET01.length)

            let lastcustshort = "";
            let lastreqno = "";

            for (let i = 0; i < SET01.length; i++) {
                const entry = SET01[i];
                const custShort = entry.CustShort;
                const matchingRequests = requestRecordsMap[custShort] || [];
                let lastWeek = 0;

                for (let j = 0; j < matchingRequests.length; j++) {
                    const req = matchingRequests[j];
                    const samplingDate = new Date(req.SamplingDate);
                    const dayOfMonth = samplingDate.getDate();
                    const monthString = samplingDate.toLocaleString('en-US', { month: '2-digit' });
                    const yearString = samplingDate.getFullYear().toString();
                    const kpiPeriod = entry.KPIPeriod;
                    const sentRepDate = new Date(req.SentRep);
                    const RepDue = await calculateRepDue(samplingDate, kpiPeriod);
                    const RepDays = await calculateBusinessDays(samplingDate, sentRepDate);
                    const reqNo = req.ReqNo;
                    const custshort = req.CustShort;

                    const maxSendDate = matchingRequests
                        .filter(record => record['ReqNo'] === reqNo)
                        .reduce((maxDate, record) => {
                            const currentSendDate = new Date(record['SendDate']);
                            return currentSendDate > maxDate ? currentSendDate : maxDate;
                        }, new Date(req.SendDate));

                    const maxResultApproveDate = matchingRequests
                        .filter(record => record['ReqNo'] === reqNo)
                        .reduce((maxDate, record) => {
                            const currentResultApproveDate = new Date(record['ResultApproveDate']);
                            return currentResultApproveDate > maxDate ? currentResultApproveDate : maxDate;
                        }, new Date(req.ResultApproveDate));

                    const queryIssueDate = `
                    SELECT * FROM [SAR].[dbo].[Routine_KACReport] 
                    WHERE ReqNo = '${reqNo}';
                    `;
                    const dbIssueDate = await mssql.qurey(queryIssueDate);

                    const issueData = dbIssueDate["recordsets"].length > 0 && dbIssueDate["recordsets"][0].length > 0
                        ? dbIssueDate["recordsets"][0][0]
                        : {};
                    const issueDate = issueData['CreateReportDate'] ? new Date(issueData['CreateReportDate']) : null;
                    const Sublead = issueData['SubLeaderTime_0'] ? new Date(issueData['SubLeaderTime_0']) : null;
                    const GL = issueData['GLTime_0'] ? new Date(issueData['GLTime_0']) : null;
                    const MGR = issueData['DGMTime_0'] ? new Date(issueData['DGMTime_0']) : null;
                    const JP = issueData['JPTime_0'] ? new Date(issueData['JPTime_0']) : null;
                    const Revise1 = issueData['InchargeTime_1'] ? new Date(issueData['InchargeTime_1']) : null;
                    const Sublead1 = issueData['SubLeaderTime_1'] ? new Date(issueData['SubLeaderTime_1']) : null;
                    const GL1 = issueData['GLTime_1'] ? new Date(issueData['GLTime_1']) : null;
                    const MGR1 = issueData['DGMTime_1'] ? new Date(issueData['DGMTime_1']) : null;
                    const JP1 = issueData['JPTime_1'] ? new Date(issueData['JPTime_1']) : null;
                    const Revise2 = issueData['InchargeTime_2'] ? new Date(issueData['InchargeTime_2']) : null;
                    const Sublead2 = issueData['SubLeaderTime_2'] ? new Date(issueData['SubLeaderTime_2']) : null;
                    const GL2 = issueData['GLTime_2'] ? new Date(issueData['GLTime_2']) : null;
                    const MGR2 = issueData['DGMTime_2'] ? new Date(issueData['DGMTime_2']) : null;
                    const JP2 = issueData['JPTime_2'] ? new Date(issueData['JPTime_2']) : null;
                    const Revise3 = issueData['InchargeTime_3'] ? new Date(issueData['InchargeTime_3']) : null;
                    const Sublead3 = issueData['SubLeaderTime_3'] ? new Date(issueData['SubLeaderTime_3']) : null;
                    const GL3 = issueData['GLTime_3'] ? new Date(issueData['GLTime_3']) : null;
                    const MGR3 = issueData['DGMTime_3'] ? new Date(issueData['DGMTime_3']) : null;
                    const JP3 = issueData['JPTime_3'] ? new Date(issueData['JPTime_3']) : null;
                    const BDPrepare = await calculateBusinessDays(samplingDate, maxSendDate);
                    const BDTTC = await calculateBusinessDays(maxSendDate, maxResultApproveDate);
                    const BDIssue = await calculateBusinessDays(maxResultApproveDate, issueDate);
                    const isValidDate = (date) => date && date.getTime() !== 0;
                    const BDSublead = await calculateBusinessDays(issueDate, Sublead);
                    const BDGL = isValidDate(Sublead) && isValidDate(GL) ? await calculateBusinessDays(Sublead, GL)
                        : (isValidDate(issueDate) && isValidDate(GL) ? await calculateBusinessDays(issueDate, GL) : null);
                    const BDMGR = isValidDate(GL) && isValidDate(MGR) ? await calculateBusinessDays(GL, MGR)
                        : (isValidDate(Sublead) && isValidDate(MGR) ? await calculateBusinessDays(Sublead, MGR)
                            : (isValidDate(issueDate) && isValidDate(MGR) ? await calculateBusinessDays(issueDate, MGR) : null));
                    const BDJP = isValidDate(MGR) && isValidDate(JP) ? await calculateBusinessDays(MGR, JP)
                        : (isValidDate(GL) && isValidDate(JP) ? await calculateBusinessDays(GL, JP)
                            : (isValidDate(Sublead) && isValidDate(JP) ? await calculateBusinessDays(Sublead, JP) : null));
                    const CheckSignerForBDRevise1 = isValidDate(JP) ? JP
                        : isValidDate(MGR) ? MGR
                            : isValidDate(GL) ? GL
                                : isValidDate(Sublead) ? Sublead
                                    : null;
                    const BDRevise1 = CheckSignerForBDRevise1 ? await calculateBusinessDays(CheckSignerForBDRevise1, Revise1) : null;
                    const BDSublead1 = await calculateBusinessDays(Revise1, Sublead1);
                    const BDGL1 = isValidDate(Sublead1) && isValidDate(GL1) ? await calculateBusinessDays(Sublead1, GL1)
                        : (isValidDate(Revise1) && isValidDate(GL1) ? await calculateBusinessDays(Revise1, GL1) : null);
                    const BDMGR1 = isValidDate(GL1) && isValidDate(MGR1) ? await calculateBusinessDays(GL1, MGR1)
                        : (isValidDate(Sublead1) && isValidDate(MGR1) ? await calculateBusinessDays(Sublead1, MGR1)
                            : (isValidDate(Revise1) && isValidDate(MGR1) ? await calculateBusinessDays(Revise1, MGR1) : null));
                    const BDJP1 = isValidDate(MGR1) && isValidDate(JP1) ? await calculateBusinessDays(MGR1, JP1)
                        : (isValidDate(GL1) && isValidDate(JP1) ? await calculateBusinessDays(GL1, JP1)
                            : (isValidDate(Sublead1) && isValidDate(JP1) ? await calculateBusinessDays(Sublead1, JP1) : null));
                    const CheckSignerForBDRevise2 = isValidDate(JP1) ? JP1
                        : isValidDate(MGR1) ? MGR1
                            : isValidDate(GL1) ? GL1
                                : isValidDate(Sublead1) ? Sublead1
                                    : null;
                    const BDRevise2 = CheckSignerForBDRevise2 ? await calculateBusinessDays(CheckSignerForBDRevise2, Revise2) : null;
                    const BDSublead2 = await calculateBusinessDays(Revise2, Sublead2);
                    const BDGL2 = isValidDate(Sublead2) && isValidDate(GL2) ? await calculateBusinessDays(Sublead2, GL2)
                        : (isValidDate(Revise2) && isValidDate(GL2) ? await calculateBusinessDays(Revise2, GL2) : null);
                    const BDMGR2 = isValidDate(GL2) && isValidDate(MGR2) ? await calculateBusinessDays(GL2, MGR2)
                        : (isValidDate(Sublead2) && isValidDate(MGR2) ? await calculateBusinessDays(Sublead2, MGR2)
                            : (isValidDate(Revise2) && isValidDate(MGR2) ? await calculateBusinessDays(Revise2, MGR2) : null));
                    const BDJP2 = isValidDate(MGR2) && isValidDate(JP2) ? await calculateBusinessDays(MGR2, JP2)
                        : (isValidDate(GL2) && isValidDate(JP2) ? await calculateBusinessDays(GL2, JP2)
                            : (isValidDate(Sublead2) && isValidDate(JP2) ? await calculateBusinessDays(Sublead2, JP2) : null));
                    const CheckSignerForBDRevise3 = isValidDate(JP2) ? JP2
                        : isValidDate(MGR2) ? MGR2
                            : isValidDate(GL2) ? GL2
                                : isValidDate(Sublead2) ? Sublead2
                                    : null;
                    const BDRevise3 = CheckSignerForBDRevise3 ? await calculateBusinessDays(CheckSignerForBDRevise3, Revise3) : null;
                    const BDSublead3 = await calculateBusinessDays(Revise3, Sublead3);
                    const BDGL3 = isValidDate(Sublead3) && isValidDate(GL3) ? await calculateBusinessDays(Sublead3, GL3)
                        : (isValidDate(Revise3) && isValidDate(GL3) ? await calculateBusinessDays(Revise3, GL3) : null);
                    const BDMGR3 = isValidDate(GL3) && isValidDate(MGR3) ? await calculateBusinessDays(GL3, MGR3)
                        : (isValidDate(Sublead3) && isValidDate(MGR3) ? await calculateBusinessDays(Sublead3, MGR3)
                            : (isValidDate(Revise3) && isValidDate(MGR3) ? await calculateBusinessDays(Revise3, MGR3) : null));
                    const BDJP3 = isValidDate(MGR3) && isValidDate(JP3) ? await calculateBusinessDays(MGR3, JP3)
                        : (isValidDate(GL3) && isValidDate(JP3) ? await calculateBusinessDays(GL3, JP3)
                            : (isValidDate(Sublead3) && isValidDate(JP3) ? await calculateBusinessDays(Sublead3, JP3) : null));
                    const CheckSignerForBDSent = isValidDate(JP3) ? JP3
                        : isValidDate(MGR3) ? MGR3
                            : isValidDate(GL3) ? GL3
                                : isValidDate(Sublead3) ? Sublead3
                                    : isValidDate(JP2) ? JP2
                                        : isValidDate(MGR2) ? MGR2
                                            : isValidDate(GL2) ? GL2
                                                : isValidDate(Sublead2) ? Sublead2
                                                    : isValidDate(JP1) ? JP1
                                                        : isValidDate(MGR1) ? MGR1
                                                            : isValidDate(GL1) ? GL1
                                                                : isValidDate(Sublead1) ? Sublead1
                                                                    : isValidDate(JP) ? JP
                                                                        : isValidDate(MGR) ? MGR
                                                                            : isValidDate(GL) ? GL
                                                                                : isValidDate(Sublead) ? Sublead
                                                                                    : null;
                    const BDSent = CheckSignerForBDSent ? await calculateBusinessDays(CheckSignerForBDSent, sentRepDate) : null;
                    const Reason = req.Reason;

                    let week = 0;
                    if (dayOfMonth >= 1 && dayOfMonth <= 8) {
                        week = 1;
                    } else if (dayOfMonth >= 9 && dayOfMonth <= 16) {
                        week = 2;
                    } else if (dayOfMonth >= 17 && dayOfMonth <= 24) {
                        week = 3;
                    } else if (dayOfMonth >= 25 && dayOfMonth <= 31) {
                        week = 4;
                    }

                    if (custshort == lastcustshort && reqNo == lastreqno) {
                        if (week < lastWeek) {
                            week = lastWeek;
                        }
                    }
                    if (custshort == lastcustshort && reqNo != lastreqno) {
                        if (week == lastWeek) {
                            week = lastWeek + 1;
                        }
                    }

                    switch (week) {
                        case 1:
                            entry["ReqNo1"] = reqNo;
                            entry["RepDays1"] = RepDays;
                            entry["BDPrepare1"] = BDPrepare;
                            entry["BDTTC1"] = BDTTC;
                            entry["BDIssue1"] = BDIssue;
                            entry["BDSublead1"] = BDSublead;
                            entry["BDGL1"] = BDGL;
                            entry["BDMGR1"] = BDMGR;
                            entry["BDJP1"] = BDJP;
                            entry["BDRevise1_1"] = BDRevise1;
                            entry["BDSublead1_1"] = BDSublead1;
                            entry["BDGL1_1"] = BDGL1;
                            entry["BDMGR1_1"] = BDMGR1;
                            entry["BDJP1_1"] = BDJP1;
                            entry["BDRevise1_2"] = BDRevise2;
                            entry["BDSublead1_2"] = BDSublead2;
                            entry["BDGL1_2"] = BDGL2;
                            entry["BDMGR1_2"] = BDMGR2;
                            entry["BDJP1_2"] = BDJP2;
                            entry["BDRevise1_3"] = BDRevise3;
                            entry["BDSublead1_3"] = BDSublead3;
                            entry["BDGL1_3"] = BDGL3;
                            entry["BDMGR1_3"] = BDMGR3;
                            entry["BDJP1_3"] = BDJP3;
                            entry["BDSent1"] = BDSent;
                            break;
                        case 2:
                            entry["ReqNo2"] = reqNo;
                            entry["RepDays2"] = RepDays;
                            entry["BDPrepare2"] = BDPrepare;
                            entry["BDTTC2"] = BDTTC;
                            entry["BDIssue2"] = BDIssue;
                            entry["BDSublead2"] = BDSublead;
                            entry["BDGL2"] = BDGL;
                            entry["BDMGR2"] = BDMGR;
                            entry["BDJP2"] = BDJP;
                            entry["BDRevise2_1"] = BDRevise1;
                            entry["BDSublead2_1"] = BDSublead1;
                            entry["BDGL2_1"] = BDGL1;
                            entry["BDMGR2_1"] = BDMGR1;
                            entry["BDJP2_1"] = BDJP1;
                            entry["BDRevise2_2"] = BDRevise2;
                            entry["BDSublead2_2"] = BDSublead2;
                            entry["BDGL2_2"] = BDGL2;
                            entry["BDMGR2_2"] = BDMGR2;
                            entry["BDJP2_2"] = BDJP2;
                            entry["BDRevise2_3"] = BDRevise3;
                            entry["BDSublead2_3"] = BDSublead3;
                            entry["BDGL2_3"] = BDGL3;
                            entry["BDMGR2_3"] = BDMGR3;
                            entry["BDJP2_3"] = BDJP3;
                            entry["BDSent2"] = BDSent;
                            break;
                        case 3:
                            entry["ReqNo3"] = reqNo;
                            entry["RepDays3"] = RepDays;
                            entry["BDPrepare3"] = BDPrepare;
                            entry["BDTTC3"] = BDTTC;
                            entry["BDIssue3"] = BDIssue;
                            entry["BDSublead3"] = BDSublead;
                            entry["BDGL3"] = BDGL;
                            entry["BDMGR3"] = BDMGR;
                            entry["BDJP3"] = BDJP;
                            entry["BDRevise3_1"] = BDRevise1;
                            entry["BDSublead3_1"] = BDSublead1;
                            entry["BDGL3_1"] = BDGL1;
                            entry["BDMGR3_1"] = BDMGR1;
                            entry["BDJP3_1"] = BDJP1;
                            entry["BDRevise3_2"] = BDRevise2;
                            entry["BDSublead3_2"] = BDSublead2;
                            entry["BDGL3_2"] = BDGL2;
                            entry["BDMGR3_2"] = BDMGR2;
                            entry["BDJP3_2"] = BDJP2;
                            entry["BDRevise3_3"] = BDRevise3;
                            entry["BDSublead3_3"] = BDSublead3;
                            entry["BDGL3_3"] = BDGL3;
                            entry["BDMGR3_3"] = BDMGR3;
                            entry["BDJP3_3"] = BDJP3;
                            entry["BDSent3"] = BDSent;
                            break;
                        case 4:
                            entry["ReqNo4"] = reqNo;
                            entry["RepDays4"] = RepDays;
                            entry["BDPrepare4"] = BDPrepare;
                            entry["BDTTC4"] = BDTTC;
                            entry["BDIssue4"] = BDIssue;
                            entry["BDSublead4"] = BDSublead;
                            entry["BDGL4"] = BDGL;
                            entry["BDMGR4"] = BDMGR;
                            entry["BDJP4"] = BDJP;
                            entry["BDRevise4_1"] = BDRevise1;
                            entry["BDSublead4_1"] = BDSublead1;
                            entry["BDGL4_1"] = BDGL1;
                            entry["BDMGR4_1"] = BDMGR1;
                            entry["BDJP4_1"] = BDJP1;
                            entry["BDRevise4_2"] = BDRevise2;
                            entry["BDSublead4_2"] = BDSublead2;
                            entry["BDGL4_2"] = BDGL2;
                            entry["BDMGR4_2"] = BDMGR2;
                            entry["BDJP4_2"] = BDJP2;
                            entry["BDRevise4_3"] = BDRevise3;
                            entry["BDSublead4_3"] = BDSublead3;
                            entry["BDGL4_3"] = BDGL3;
                            entry["BDMGR4_3"] = BDMGR3;
                            entry["BDJP4_3"] = BDJP3;
                            entry["BDSent4"] = BDSent;
                            break;
                    }
                    entry["Month"] = monthString;
                    entry["Year"] = yearString;
                    lastWeek = week;
                    lastcustshort = custshort;
                    lastreqno = reqNo;
                }
            }
            output = SET01;
        }
    }
    return res.json(output);
});

router.post('/02SARKPI/AchievedCustomer', async (req, res) => {
    console.log("--02SARKPI/AchievedCustomer--");
    let input = req.body;
    console.log(input);

    let SET01 = [];
    let output = [];
    let previousReqNo = null;

    if (input['TYPE'] != undefined && input['YEAR'] != undefined) {
        const type = input['TYPE'];
        const year = input['YEAR'];
        const lastYear = year - 1;

        const queryRequestLab = `
            SELECT * FROM [SAR].[dbo].[Routine_RequestLab]
            WHERE YEAR(SamplingDate) IN (${year}, ${lastYear})
            AND RequestStatus != 'CANCEL REQUEST'
            ORDER BY CustShort, SamplingDate;
        `;
        const dbRequestLab = await mssql.qurey(queryRequestLab);
        const requestRecords = dbRequestLab.recordsets[0];
        console.log("requestRecords " + requestRecords.length);

        const queryMasterPattern = `
            SELECT * From [SAR].[dbo].[Routine_MasterPatternTS] 
            WHERE TYPE = '${type}'
            ORDER BY CustShort;
        `;
        const dbMasterPattern = await mssql.qurey(queryMasterPattern);
        const masterRecords = dbMasterPattern.recordsets[0];

        const groupMap = {};
        for (let i = 0; i < masterRecords.length; i++) {
            const record = masterRecords[i];
            groupMap[record.CustShort] = {
                TYPE: record.TYPE,
                MKTGROUP: record.MKTGROUP,
                GROUP: record.GROUP,
                RepItems: record.REPORTITEMS
            };
        };

        for (let i = 0; i < requestRecords.length; i++) {
            const req = requestRecords[i];
            const samplingDate = new Date(req.SamplingDate);
            const dayOfMonth = samplingDate.getDate();
            const monthString = samplingDate.toLocaleString('en-US', { month: '2-digit' });
            const yearString = samplingDate.getFullYear().toString();

            let entry = {
                "DateInsert": "",
                "Type": groupMap[req.CustShort] ? groupMap[req.CustShort].TYPE || "" : "",
                "MKTGroup": groupMap[req.CustShort] ? groupMap[req.CustShort].MKTGROUP || "" : "",
                "Group": groupMap[req.CustShort] ? groupMap[req.CustShort].GROUP || "" : "",
                "Customer": req.CustFull,
                "CustShort": req.CustShort,
                "Frequency": "",
                "Incharge": "",
                "KPIServ": groupMap[req.CustShort]
                    ? (groupMap[req.CustShort].GROUP === 'KAC' ? '100'
                        : (groupMap[req.CustShort].GROUP === 'MEDIUM' ? '95' : ''))
                    : '',
                "KPIPeriod": groupMap[req.CustShort]
                    ? (groupMap[req.CustShort].TYPE === 'A' ? '12'
                        : (groupMap[req.CustShort].TYPE === 'B' ? '10' : ''))
                    : '',
                "RepItems": groupMap[req.CustShort] ? groupMap[req.CustShort].RepItems || "" : "",
                "Month": monthString,
                "Year": yearString,
                "ReqNo1": "",
                "Freq1": "",
                "PlanSam1": "",
                "ActSam1": "",
                "RepDue1": "",
                "SentRep1": "",
                "RepDays1": "",
                "Request1": "",
                "TTCResult1": "",
                "IssueDate1": "",
                "Sublead1": "",
                "GL1": "",
                "MGR1": "",
                "JP1": "",
                "Revise1_1": "",
                "Sublead1_1": "",
                "GL1_1": "",
                "MGR1_1": "",
                "JP1_1": "",
                "Revise1_2": "",
                "Sublead1_2": "",
                "GL1_2": "",
                "MGR1_2": "",
                "JP1_2": "",
                "Revise1_3": "",
                "Sublead1_3": "",
                "GL1_3": "",
                "MGR1_3": "",
                "JP1_3": "",
                "BDPrepare1": "",
                "BDTTC1": "",
                "BDIssue1": "",
                "BDSublead1": "",
                "BDGL1": "",
                "BDMGR1": "",
                "BDJP1": "",
                "BDRevise1_1": "",
                "BDSublead1_1": "",
                "BDGL1_1": "",
                "BDMGR1_1": "",
                "BDJP1_1": "",
                "BDRevise1_2": "",
                "BDSublead1_2": "",
                "BDGL1_2": "",
                "BDMGR1_2": "",
                "BDJP1_2": "",
                "BDRevise1_3": "",
                "BDSublead1_3": "",
                "BDGL1_3": "",
                "BDMGR1_3": "",
                "BDJP1_3": "",
                "BDSent1": "",
                "Reason1": "",
                "ReqNo2": "",
                "Freq2": "",
                "PlanSam2": "",
                "ActSam2": "",
                "RepDue2": "",
                "SentRep2": "",
                "RepDays2": "",
                "Request2": "",
                "TTCResult2": "",
                "IssueDate2": "",
                "Sublead2": "",
                "GL2": "",
                "MGR2": "",
                "JP2": "",
                "Revise2_1": "",
                "Sublead2_1": "",
                "GL2_1": "",
                "MGR2_1": "",
                "JP2_1": "",
                "Revise2_2": "",
                "Sublead2_2": "",
                "GL2_2": "",
                "MGR2_2": "",
                "JP2_2": "",
                "Revise2_3": "",
                "Sublead2_3": "",
                "GL2_3": "",
                "MGR2_3": "",
                "JP2_3": "",
                "BDPrepare2": "",
                "BDTTC2": "",
                "BDIssue2": "",
                "BDSublead2": "",
                "BDGL2": "",
                "BDMGR2": "",
                "BDJP2": "",
                "BDRevise2_1": "",
                "BDSublead2_1": "",
                "BDGL2_1": "",
                "BDMGR2_1": "",
                "BDJP2_1": "",
                "BDRevise2_2": "",
                "BDSublead2_2": "",
                "BDGL2_2": "",
                "BDMGR2_2": "",
                "BDJP2_2": "",
                "BDRevise2_3": "",
                "BDSublead2_3": "",
                "BDGL2_3": "",
                "BDMGR2_3": "",
                "BDJP2_3": "",
                "BDSent2": "",
                "Reason2": "",
                "ReqNo3": "",
                "Freq3": "",
                "PlanSam3": "",
                "ActSam3": "",
                "RepDue3": "",
                "SentRep3": "",
                "RepDays3": "",
                "Request3": "",
                "TTCResult3": "",
                "IssueDate3": "",
                "Sublead3": "",
                "GL3": "",
                "MGR3": "",
                "JP3": "",
                "Revise3_1": "",
                "Sublead3_1": "",
                "GL3_1": "",
                "MGR3_1": "",
                "JP3_1": "",
                "Revise3_2": "",
                "Sublead3_2": "",
                "GL3_2": "",
                "MGR3_2": "",
                "JP3_2": "",
                "Revise3_3": "",
                "Sublead3_3": "",
                "GL3_3": "",
                "MGR3_3": "",
                "JP3_3": "",
                "BDPrepare3": "",
                "BDTTC3": "",
                "BDIssue3": "",
                "BDSublead3": "",
                "BDGL3": "",
                "BDMGR3": "",
                "BDJP3": "",
                "BDRevise3_1": "",
                "BDSublead3_1": "",
                "BDGL3_1": "",
                "BDMGR3_1": "",
                "BDJP3_1": "",
                "BDRevise3_2": "",
                "BDSublead3_2": "",
                "BDGL3_2": "",
                "BDMGR3_2": "",
                "BDJP3_2": "",
                "BDRevise3_3": "",
                "BDSublead3_3": "",
                "BDGL3_3": "",
                "BDMGR3_3": "",
                "BDJP3_3": "",
                "BDSent3": "",
                "Reason3": "",
                "ReqNo4": "",
                "Freq4": "",
                "PlanSam4": "",
                "ActSam4": "",
                "RepDue4": "",
                "SentRep4": "",
                "RepDays4": "",
                "Request4": "",
                "TTCResult4": "",
                "IssueDate4": "",
                "Sublead4": "",
                "GL4": "",
                "MGR4": "",
                "JP4": "",
                "Revise4_1": "",
                "Sublead4_1": "",
                "GL4_1": "",
                "MGR4_1": "",
                "JP4_1": "",
                "Revise4_2": "",
                "Sublead4_2": "",
                "GL4_2": "",
                "MGR4_2": "",
                "JP4_2": "",
                "Revise4_3": "",
                "Sublead4_3": "",
                "GL4_3": "",
                "MGR4_3": "",
                "JP4_3": "",
                "BDPrepare4": "",
                "BDTTC4": "",
                "BDIssue4": "",
                "BDSublead4": "",
                "BDGL4": "",
                "BDMGR4": "",
                "BDJP4": "",
                "BDRevise4_1": "",
                "BDSublead4_1": "",
                "BDGL4_1": "",
                "BDMGR4_1": "",
                "BDJP4_1": "",
                "BDRevise4_2": "",
                "BDSublead4_2": "",
                "BDGL4_2": "",
                "BDMGR4_2": "",
                "BDJP4_2": "",
                "BDRevise4_3": "",
                "BDSublead4_3": "",
                "BDGL4_3": "",
                "BDMGR4_3": "",
                "BDJP4_3": "",
                "BDSent4": "",
                "Reason4": ""
            };

            const kpiPeriod = entry.KPIPeriod;
            const sentRepDate = new Date(req.SentRep);
            const RepDue = await calculateRepDue(samplingDate, kpiPeriod);
            const RepDays = await calculateBusinessDays(samplingDate, sentRepDate);
            const reqNo = req.ReqNo;
            const CloseLine = req.RequestStatus;

            if (reqNo === previousReqNo) {
                console.log("Jump");
                continue;
            } else {
                console.log(reqNo)
            }

            previousReqNo = reqNo;

            let week = 0;
            if (dayOfMonth >= 1 && dayOfMonth <= 8) {
                week = 1;
            } else if (dayOfMonth >= 9 && dayOfMonth <= 16) {
                week = 2;
            } else if (dayOfMonth >= 17 && dayOfMonth <= 24) {
                week = 3;
            } else if (dayOfMonth >= 25 && dayOfMonth <= 31) {
                week = 4;
            }

            // console.log("week: " + week);
            switch (week) {
                case 1:
                    if (CloseLine == "CLOSE LINE") {
                        entry["ReqNo1"] = reqNo;
                        entry["Freq1"] = "CLOSE LINE";
                        entry["PlanSam1"] = "CLOSE LINE";
                        entry["ActSam1"] = "CLOSE LINE";
                        entry["RepDue1"] = "CLOSE LINE";
                        entry["SentRep1"] = "CLOSE LINE";
                        entry["RepDays1"] = "CLOSE LINE";
                        break;
                    } else {
                        entry["ReqNo1"] = reqNo;
                        entry["Freq1"] = "1";
                        entry["PlanSam1"] = formatDate(samplingDate);
                        entry["ActSam1"] = formatDate(samplingDate);
                        entry["RepDue1"] = RepDue.RepDue;
                        entry["SentRep1"] = formatDate(sentRepDate);
                        entry["RepDays1"] = RepDays;
                        break;
                    }
                case 2:
                    if (CloseLine == "CLOSE LINE") {
                        entry["ReqNo2"] = reqNo;
                        entry["Freq2"] = "CLOSE LINE";
                        entry["PlanSam2"] = "CLOSE LINE";
                        entry["ActSam2"] = "CLOSE LINE";
                        entry["RepDue2"] = "CLOSE LINE";
                        entry["SentRep2"] = "CLOSE LINE";
                        entry["RepDays2"] = "CLOSE LINE";
                        break;
                    } else {
                        entry["ReqNo2"] = reqNo;
                        entry["Freq2"] = "1";
                        entry["PlanSam2"] = formatDate(samplingDate);
                        entry["ActSam2"] = formatDate(samplingDate);
                        entry["RepDue2"] = RepDue.RepDue;
                        entry["SentRep2"] = formatDate(sentRepDate);
                        entry["RepDays2"] = RepDays;
                        break;
                    }
                case 3:
                    if (CloseLine == "CLOSE LINE") {
                        entry["ReqNo3"] = reqNo;
                        entry["Freq3"] = "CLOSE LINE";
                        entry["PlanSam3"] = "CLOSE LINE";
                        entry["ActSam3"] = "CLOSE LINE";
                        entry["RepDue3"] = "CLOSE LINE";
                        entry["SentRep3"] = "CLOSE LINE";
                        entry["RepDays3"] = "CLOSE LINE";
                        break;
                    } else {
                        entry["ReqNo3"] = reqNo;
                        entry["Freq3"] = "1";
                        entry["PlanSam3"] = formatDate(samplingDate);
                        entry["ActSam3"] = formatDate(samplingDate);
                        entry["RepDue3"] = RepDue.RepDue;
                        entry["SentRep3"] = formatDate(sentRepDate);
                        entry["RepDays3"] = RepDays;
                        break;
                    }
                case 4:
                    if (CloseLine == "CLOSE LINE") {
                        entry["ReqNo4"] = reqNo;
                        entry["Freq4"] = "CLOSE LINE";
                        entry["PlanSam4"] = "CLOSE LINE";
                        entry["ActSam4"] = "CLOSE LINE";
                        entry["RepDue4"] = "CLOSE LINE";
                        entry["SentRep4"] = "CLOSE LINE";
                        entry["RepDays4"] = "CLOSE LINE";
                        break;
                    } else {
                        entry["ReqNo4"] = reqNo;
                        entry["Freq4"] = "1";
                        entry["PlanSam4"] = formatDate(samplingDate);
                        entry["ActSam4"] = formatDate(samplingDate);
                        entry["RepDue4"] = RepDue.RepDue;
                        entry["SentRep4"] = formatDate(sentRepDate);
                        entry["RepDays4"] = RepDays;
                        break;
                    }
            }
            SET01.push(entry);
        };
        console.log("SET01 " + SET01.length);
        output = SET01;
    }
    return res.json(output);
});

async function calculateRepDue(startDate, addDays) {
    let output = { "RepDue": null };
    let date = new Date(startDate);
    let addedDays = 0;

    if (addDays === null) {
        return { "RepDue": "" };
    }

    while (addedDays < addDays) {
        let query = `SELECT * FROM [SAR].[dbo].[Master_Holiday] WHERE HolidayDate = '${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}'`;
        let db = await mssql.qurey(query);
        let isHoliday = db["recordsets"][0].length > 0;

        if (!isHoliday) {
            addedDays++;
        }
        date.setDate(date.getDate() + 1);
    }

    output['RepDue'] = formatDate(date);
    return output;
}

async function calculateBusinessDays(startDate, endDate) {
    let count = 0;
    let SetstartDate = new Date(startDate);
    SetstartDate.setHours(0, 0, 0, 0);
    let SetendDate = new Date(endDate);
    SetendDate.setHours(0, 0, 0, 0);

    if (startDate === null || startDate.getTime() === 0 || endDate === null || endDate.getTime() === 0) {
        return "";
    }

    while (SetstartDate < SetendDate) {
        let query = `
        SELECT * FROM [SAR].[dbo].[Master_Holiday] 
        WHERE HolidayDate = '${SetstartDate.getFullYear()}-${SetstartDate.getMonth() + 1}-${SetstartDate.getDate()}'
        `;
        let db = await mssql.qurey(query);
        let isHoliday = db["recordsets"][0].length > 0;

        if (!isHoliday) {
            count++;
        }
        SetstartDate.setDate(SetstartDate.getDate() + 1);
    }
    if (count < 0) {
        count = 0;
    }
    return count;
}

const formatDate = (date) => {
    if (!date || date.getTime() === 0) {
        return "";
    }
    let day = String(date.getUTCDate()).padStart(2, '0');
    let month = String(date.getUTCMonth() + 1).padStart(2, '0');
    let year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
};

module.exports = router;
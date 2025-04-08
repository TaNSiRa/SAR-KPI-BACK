const express = require("express");
const router = express.Router();
var mssql = require('../../function/mssql');
var mssqlR = require('../../function/mssqlR');
var mongodb = require('../../function/mongodb');
var httpreq = require('../../function/axios');
var axios = require('axios');
const e = require("express");
const schedule = require("node-schedule");

router.get('/02SARKPI/TEST', async (req, res) => {
    // console.log(mssql.qurey())
    return res.json("SARKPI V0.1");
});

// router.post('/02SARKPI/KPISumary', async (req, res) => {
//     //-------------------------------------
//     console.log("--MKTKPI/KPISumary--");
//     //-------------------------------------
//     let output = [];
//     let query = `SELECT * From [SARKPI].[dbo].[KPISumary] `
//     let db = await mssql.qurey(query);
//     if (db["recordsets"].length > 0) {
//         let buffer = db["recordsets"][0];

//         output = buffer;
//     }
//     //-------------------------------------
//     return res.json(output);
// });

// router.post('/02SARKPI/ServiceSelect', async (req, res) => {
//     //-------------------------------------
//     console.log("--MKTKPI/ServiceSelect--");
//     //-------------------------------------
//     let output = [];
//     let query = `SELECT * From [SARKPI].[dbo].[KPI_Service] `
//     let db = await mssql.qurey(query);
//     if (db["recordsets"].length > 0) {
//         let buffer = db["recordsets"][0];
//         console.log("Alldata: " + buffer.length);
//         output = buffer;
//     }
//     //-------------------------------------
//     return res.json(output);
// });

let cachedServiceData = [];

async function fetchServiceData() {
    console.log("-- Fetching Service Data --");
    try {
        let query = `SELECT * FROM [SARKPI].[dbo].[KPI_Service]`;
        let db = await mssql.qurey(query);
        if (db["recordsets"].length > 0) {
            cachedServiceData = db["recordsets"][0];
            console.log("Data fetched at:", new Date().toLocaleString());
        }
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function scheduleDataFetch() {
    const now = new Date();
    const nextFetch = new Date();
    nextFetch.setHours(6, 0, 0, 0);

    if (now > nextFetch) {
        nextFetch.setDate(nextFetch.getDate() + 1);
    }

    const timeUntilNextFetch = nextFetch - now;
    setTimeout(() => {
        fetchServiceData(); // ดึงข้อมูลครั้งแรก
        setInterval(fetchServiceData, 24 * 60 * 60 * 1000);
    }, timeUntilNextFetch);
}

scheduleDataFetch();
fetchServiceData();

router.post('/02SARKPI/ServiceSelectCache', (req, res) => {
    console.log("--02SARKPI/ServiceSelectCache--");
    res.json(cachedServiceData);
});

router.post('/02SARKPI/ServiceSelectRefresh', async (req, res) => {

    let data = await fetchServiceData();
    // res.json({ message: "Data refreshed successfully", data: cachedServiceData });
    // res.json(cachedServiceData);
    return res.json("TEST2");
});

// router.post('/02SARKPI/OverdueSelect', async (req, res) => {
//     //-------------------------------------
//     console.log("--MKTKPI/OverdueSelect--");
//     //-------------------------------------
//     let output = [];
//     let query = `SELECT * From [SARKPI].[dbo].[KPI_Overdue] `
//     let db = await mssql.qurey(query);
//     if (db["recordsets"].length > 0) {
//         let buffer = db["recordsets"][0];
//         console.log("Alldata: " + buffer.length);
//         output = buffer;
//     }
//     //-------------------------------------
//     return res.json(output);
// });

// router.post('/02SARKPI/CustServiceSelect', async (req, res) => {
//     //-------------------------------------
//     console.log("--MKTKPI/CustServiceSelect--");
//     //-------------------------------------
//     let output = [];
//     let query = `SELECT * From [SARKPI].[dbo].[KPI_CustService] `
//     let db = await mssql.qurey(query);
//     if (db["recordsets"].length > 0) {
//         let buffer = db["recordsets"][0];
//         console.log("Alldata: " + buffer.length);
//         output = buffer;
//     }
//     //-------------------------------------
//     return res.json(output);
// });

// router.post('/02SARKPI/ReportOverKPISelect', async (req, res) => {
//     //-------------------------------------
//     console.log("--MKTKPI/ReportOverKPISelect--");
//     //-------------------------------------
//     let output = [];
//     let query = `SELECT * From [SARKPI].[dbo].[KPI_ReportOverKPI] `
//     let db = await mssql.qurey(query);
//     if (db["recordsets"].length > 0) {
//         let buffer = db["recordsets"][0];
//         console.log("Alldata: " + buffer.length);
//         output = buffer;
//     }
//     //-------------------------------------
//     return res.json(output);
// });

// router.post('/02SARKPI/AchievedCustomerSelect', async (req, res) => {
//     //-------------------------------------
//     console.log("--MKTKPI/AchievedCustomerSelect--");
//     //-------------------------------------
//     let output = [];
//     let query = `SELECT * From [SARKPI].[dbo].[KPI_AchievedCust] `
//     let db = await mssql.qurey(query);
//     if (db["recordsets"].length > 0) {
//         let buffer = db["recordsets"][0];
//         console.log("Alldata: " + buffer.length);
//         output = buffer;
//     }
//     //-------------------------------------
//     return res.json(output);
// });

router.post('/02SARKPI/Service', async (req, res) => {
    let input = req.body;
    console.log("--02SARKPI/Service--");
    console.log(input);
    console.log("Start " + formatDateTime(new Date().toISOString()));

    let SET01 = [];
    let output = [];
    await loadRoutineKACReport();
    await loadHolidays();
    if (input['YEAR'] != undefined) {
        // const queryDelete = `DELETE FROM [SARKPI].[dbo].[KPI_Service] WHERE Year = ${input['YEAR']}`;
        // await mssql.qurey(queryDelete);
        for (let a = 0; a < 2; a++) {
            const year = input['YEAR'] - a;

            for (let p = 0; p < 12; p++) {
                let Round = (p + 1).toString().padStart(2, '0');
                // const currentMonth = new Date().getMonth() + 1;
                // const month3 = currentMonth.toString().padStart(2, '0');
                // const month2 = ((currentMonth - 1 + 12) % 12 || 12).toString().padStart(2, '0');
                // const month1 = ((currentMonth - 2 + 12) % 12 || 12).toString().padStart(2, '0');

                // const year2 = currentMonth === 1 ? year - 1 : year;
                // const year1 = currentMonth <= 2 ? year - 1 : year;
                // const month = input['MONTH'];
                // const mktGroup = input['MKTGROUP'];

                // const queryMasterPattern = `
                //     SELECT * From [SAR].[dbo].[Routine_MasterPatternTS]
                //     WHERE MKTGROUP = '${mktGroup}' AND FRE != '' AND FRE >= 1
                //     ORDER BY CustShort;
                // `;
                const queryMasterPattern = `
            SELECT * From [SAR].[dbo].[Routine_MasterPatternTS]
            WHERE FRE != '' AND FRE != '1<'
            ORDER BY CustShort;
            `;
                const dbMaster = await mssql.qurey(queryMasterPattern);

                // const queryRequestLab = `
                //     SELECT * From [SAR].[dbo].[Routine_RequestLab] 
                //     WHERE MONTH(SamplingDate) = '${month}' 
                //     AND YEAR(SamplingDate) = '${year}'
                //     AND RequestStatus != 'CANCEL REQUEST'
                //     ORDER BY CustShort, SamplingDate;
                // `;
                const queryRequestLab = `
            SELECT * From [SAR].[dbo].[Routine_RequestLab] 
            WHERE MONTH(SamplingDate) = '${Round}' 
            AND YEAR(SamplingDate) = '${year}'
            AND RequestStatus != 'CANCEL REQUEST'
            ORDER BY CustShort, SamplingDate;
            `;
                // const queryRequestLab = `
                // SELECT * FROM [SAR].[dbo].[Routine_RequestLab] 
                // WHERE (MONTH(SamplingDate) = '${month3}' AND YEAR(SamplingDate) = '${year}')
                // OR (MONTH(SamplingDate) = '${month2}' AND YEAR(SamplingDate) = '${year2}')
                // OR (MONTH(SamplingDate) = '${month1}' AND YEAR(SamplingDate) = '${year1}')
                // AND RequestStatus != 'CANCEL REQUEST'
                // ORDER BY CustShort, SamplingDate;
                // `;
                const dbRequestLab = await mssql.qurey(queryRequestLab);

                if (dbMaster.recordsets.length > 0 && dbRequestLab.recordsets.length > 0) {
                    const masterRecords = dbMaster.recordsets[0];
                    const requestRecords = dbRequestLab.recordsets[0];

                    const requestRecordsMap = {};
                    for (let i = 0; i < requestRecords.length; i++) {
                        const req = requestRecords[i];
                        const custShort = req.CustShort;
                        if (custShort) {
                            if (!requestRecordsMap[custShort]) {
                                requestRecordsMap[custShort] = [];
                            }
                            requestRecordsMap[custShort].push(req);
                        }
                    };

                    SET01 = masterRecords.map(record => ({
                        "ID": "",
                        "Type": record['TYPE'],
                        "MKTGroup": record['MKTGROUP'],
                        "Group": record['GROUP'],
                        "Customer": record['CustFull'],
                        "CustShort": record['CustShort'],
                        "Frequency": record['FRE'],
                        "Incharge": record['Incharge'],
                        "KPIServ": record['GROUP'] === 'KAC' ? '100' : (record['GROUP'] === 'MEDIUM' ? '95' : record['KPIServ']),
                        "KPIPeriod": record['TYPE'] === 'A' ? '12' : (record['TYPE'] === 'B' ? '10' : record['KPIPERIOD']),
                        "RepItems": record['REPORTITEMS'],
                        "Month": Round,
                        "Year": year,
                        "ReqNo1": "",
                        "Freq1": "",
                        "Evaluation1": "",
                        "PlanSam1": "",
                        "ActSam1": "",
                        "RepDue1": "",
                        "SentRep1": "",
                        "RepDays1": "",
                        "TS_Send1": "",
                        "TTC_Receive1": "",
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
                        "Stage1": "",
                        "Reason1": "",
                        "ReqNo2": "",
                        "Freq2": "",
                        "Evaluation2": "",
                        "PlanSam2": "",
                        "ActSam2": "",
                        "RepDue2": "",
                        "SentRep2": "",
                        "RepDays2": "",
                        "TS_Send2": "",
                        "TTC_Receive2": "",
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
                        "Stage2": "",
                        "Reason2": "",
                        "ReqNo3": "",
                        "Freq3": "",
                        "Evaluation3": "",
                        "PlanSam3": "",
                        "ActSam3": "",
                        "RepDue3": "",
                        "SentRep3": "",
                        "RepDays3": "",
                        "TS_Send3": "",
                        "TTC_Receive3": "",
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
                        "Stage3": "",
                        "Reason3": "",
                        "ReqNo4": "",
                        "Freq4": "",
                        "Evaluation4": "",
                        "PlanSam4": "",
                        "ActSam4": "",
                        "RepDue4": "",
                        "SentRep4": "",
                        "RepDays4": "",
                        "TS_Send4": "",
                        "TTC_Receive4": "",
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
                        "Stage4": "",
                        "Reason4": "",

                    }));
                    console.log('Year ' + year + ' Month ' + (p + 1) + " AllCustomer: " + SET01.length)
                    console.log("On process...");

                    let lastcustshort = "";
                    let lastreqno = "";

                    for (let i = 0; i < SET01.length; i++) {
                        const entry = SET01[i];
                        const custShort = entry.CustShort;
                        const matchingRequests = requestRecordsMap[custShort] || [];
                        let lastWeek = 0;
                        // console.log('Requests: ' + matchingRequests.length);
                        for (let j = 0; j < matchingRequests.length; j++) {
                            // console.log(j);
                            const req = matchingRequests[j];
                            const samplingDate = new Date(req.SamplingDate);
                            const samplingDate1 = adjust7Hours(new Date(req.SamplingDate));
                            const dayOfMonth = samplingDate.getDate();
                            const monthString = samplingDate.toLocaleString('en-US', { month: '2-digit' });
                            const yearString = samplingDate.getFullYear().toString();
                            const kpiPeriod = entry.KPIPeriod;
                            const RepDue = await calculateRepDue(samplingDate, kpiPeriod) ?? "";
                            const sentRepDate = adjust7Hours(new Date(req.SentRep));
                            const RepDays = await calculateBusinessDays(samplingDate, sentRepDate) ?? "";
                            const reqNo = req.ReqNo;
                            const custshort = req.CustShort;

                            // if (custshort === "CYCM#WASH") {
                            //     console.log("--------------------------------------------");
                            //     console.log("SamplingDate: " + samplingDate);
                            //     console.log("samplingDate1: " + samplingDate1);
                            //     console.log("custshort: " + custshort);
                            //     console.log("sentRepDate: " + sentRepDate);
                            //     console.log("FormatDate: " + formatDate(samplingDate));
                            //     console.log("FormatDate1: " + formatDate(samplingDate1));
                            // }

                            const CloseLine = req.RequestStatus;
                            const maxTSSendDate = matchingRequests
                                .filter(record => record['ReqNo'] === reqNo)
                                .reduce((maxDate, record) => {
                                    const currentSendDate = adjust7Hours(new Date(record['SendDate']));
                                    return currentSendDate > maxDate ? currentSendDate : maxDate;
                                }, isNaN(new Date(req.SendDate).getTime()) || new Date(req.SendDate).getTime() === 0 ? samplingDate : adjust7Hours(new Date(req.SendDate)));
                            // console.log("custshort: " + custshort);
                            // console.log("lastcustshort: " + lastcustshort);
                            // console.log("reqNo: " + reqNo);
                            // console.log("lastreqno: " + lastreqno);
                            // console.log("lastWeek: " + lastWeek);
                            const maxSendDate = matchingRequests
                                .filter(record => record['ReqNo'] === reqNo)
                                .reduce((maxDate, record) => {
                                    const currentSendDate = adjust7Hours(new Date(record['ReceiveDate']));
                                    return currentSendDate > maxDate ? currentSendDate : maxDate;
                                }, isNaN(new Date(req.ReceiveDate).getTime()) || new Date(req.ReceiveDate).getTime() === 0 ? samplingDate : adjust7Hours(new Date(req.ReceiveDate)));

                            const maxResultApproveDate = matchingRequests
                                .filter(record => record['ReqNo'] === reqNo)
                                .reduce((maxDate, record) => {
                                    const currentResultApproveDate = (new Date(record['ResultApproveDate']));
                                    return currentResultApproveDate > maxDate ? currentResultApproveDate : maxDate;
                                }, isNaN(new Date(req.ResultApproveDate).getTime()) || new Date(req.ResultApproveDate).getTime() === 0 ? samplingDate : adjust7Hours(new Date(req.ResultApproveDate)));
                            const filteredResults = routineKACData.filter(row => row.ReqNo === reqNo);

                            const countEvaluation = filteredResults.length === 0
                                ? ''
                                : filteredResults.reduce((acc, row) => {
                                    if (['LOW', 'HIGH', 'NOT PASS', 'NG'].includes(row.Evaluation)) {
                                        return acc + 1;
                                    }
                                    return acc;
                                }, 0);
                            // const queryEvaluation = `
                            // SELECT * FROM [SAR].[dbo].[Routine_KACReport] 
                            // WHERE ReqNo = '${reqNo}';
                            // `;
                            // const dbevaluation = await mssql.qurey(queryEvaluation);

                            // const evaluationResults = dbevaluation.recordset;

                            // const countEvaluation = evaluationResults.length === 0
                            //     ? ''
                            //     : evaluationResults.reduce((acc, row) => {
                            //         if (['LOW', 'HIGH', 'NOT PASS', 'NG'].includes(row.Evaluation)) {
                            //             return acc + 1;
                            //         }
                            //         return acc;
                            //     }, 0);

                            // console.log('Total count of evaluations (LOW, HIGH, NOT PASS, NG):', countEvaluation);
                            const issueData = filteredResults.length > 0 ? filteredResults[0] : {};
                            //     const queryIssueDate = `
                            // SELECT * FROM [SAR].[dbo].[Routine_KACReport] 
                            // WHERE ReqNo = '${reqNo}';
                            // `;
                            //     const dbIssueDate = await mssql.qurey(queryIssueDate);

                            //     const issueData = dbIssueDate["recordsets"].length > 0 && dbIssueDate["recordsets"][0].length > 0
                            //         ? dbIssueDate["recordsets"][0][0]
                            //         : {};

                            // const issueDate = issueData['CreateReportDate'] ? (new Date(issueData['CreateReportDate'])) : null;
                            const issueDate = isNaN(new Date(issueData['CreateReportDate']).getTime()) ||
                                new Date(issueData['CreateReportDate']).getTime() === 0
                                ? samplingDate
                                : adjust7Hours(new Date(issueData['CreateReportDate']));


                            if (custshort === "CYCM#WASH") {
                                console.log("--------------------------------------------");
                                console.log("issueData: " + issueData['CreateReportDate']);
                                console.log("issueData1: " + new Date(issueData['CreateReportDate']));
                                console.log("issueData2: " + adjust7Hours(new Date(issueData['CreateReportDate'])));
                            }
                            const Sublead = issueData['SubLeaderTime_0'] ? (new Date(issueData['SubLeaderTime_0'])) : null;
                            const GL = issueData['GLTime_0'] ? (new Date(issueData['GLTime_0'])) : null;
                            const MGR = issueData['DGMTime_0'] ? (new Date(issueData['DGMTime_0'])) : null;
                            const JP = issueData['JPTime_0'] ? (new Date(issueData['JPTime_0'])) : null;
                            const Revise1 = issueData['InchargeTime_1'] ? (new Date(issueData['InchargeTime_1'])) : null;
                            const Sublead1 = issueData['SubLeaderTime_1'] ? (new Date(issueData['SubLeaderTime_1'])) : null;
                            const GL1 = issueData['GLTime_1'] ? (new Date(issueData['GLTime_1'])) : null;
                            const MGR1 = issueData['DGMTime_1'] ? (new Date(issueData['DGMTime_1'])) : null;
                            const JP1 = issueData['JPTime_1'] ? (new Date(issueData['JPTime_1'])) : null;
                            const Revise2 = issueData['InchargeTime_2'] ? (new Date(issueData['InchargeTime_2'])) : null;
                            const Sublead2 = issueData['SubLeaderTime_2'] ? (new Date(issueData['SubLeaderTime_2'])) : null;
                            const GL2 = issueData['GLTime_2'] ? (new Date(issueData['GLTime_2'])) : null;
                            const MGR2 = issueData['DGMTime_2'] ? (new Date(issueData['DGMTime_2'])) : null;
                            const JP2 = issueData['JPTime_2'] ? (new Date(issueData['JPTime_2'])) : null;
                            const Revise3 = issueData['InchargeTime_3'] ? (new Date(issueData['InchargeTime_3'])) : null;
                            const Sublead3 = issueData['SubLeaderTime_3'] ? (new Date(issueData['SubLeaderTime_3'])) : null;
                            const GL3 = issueData['GLTime_3'] ? (new Date(issueData['GLTime_3'])) : null;
                            const MGR3 = issueData['DGMTime_3'] ? (new Date(issueData['DGMTime_3'])) : null;
                            const JP3 = issueData['JPTime_3'] ? (new Date(issueData['JPTime_3'])) : null;
                            const BDPrepare = await calculateBusinessDays(samplingDate, maxSendDate) ?? "";
                            const BDTTC = await calculateBusinessDays(maxSendDate, maxResultApproveDate) ?? "";
                            const BDIssue = await calculateBusinessDays(maxResultApproveDate, issueDate) ?? "";
                            const isValidDate = (date) => date && date.getTime() !== 0;
                            const BDSublead = await calculateBusinessDays(issueDate, Sublead) ?? "";
                            const BDGL = isValidDate(Sublead) && isValidDate(GL) ? await calculateBusinessDays(Sublead, GL)
                                : (isValidDate(issueDate) && isValidDate(GL) ? await calculateBusinessDays(issueDate, GL) : null) ?? "";
                            const BDMGR = isValidDate(GL) && isValidDate(MGR) ? await calculateBusinessDays(GL, MGR)
                                : (isValidDate(Sublead) && isValidDate(MGR) ? await calculateBusinessDays(Sublead, MGR)
                                    : (isValidDate(issueDate) && isValidDate(MGR) ? await calculateBusinessDays(issueDate, MGR) : null)) ?? "";
                            const BDJP = isValidDate(MGR) && isValidDate(JP) ? await calculateBusinessDays(MGR, JP)
                                : (isValidDate(GL) && isValidDate(JP) ? await calculateBusinessDays(GL, JP)
                                    : (isValidDate(Sublead) && isValidDate(JP) ? await calculateBusinessDays(Sublead, JP) : null)) ?? "";
                            const CheckSignerForBDRevise1 = isValidDate(JP) ? JP
                                : isValidDate(MGR) ? MGR
                                    : isValidDate(GL) ? GL
                                        : isValidDate(Sublead) ? Sublead
                                            : null ?? "";
                            const BDRevise1 = CheckSignerForBDRevise1 ? await calculateBusinessDays(CheckSignerForBDRevise1, Revise1) : null ?? "";
                            const BDSublead1 = await calculateBusinessDays(Revise1, Sublead1) ?? "";
                            const BDGL1 = isValidDate(Sublead1) && isValidDate(GL1) ? await calculateBusinessDays(Sublead1, GL1)
                                : (isValidDate(Revise1) && isValidDate(GL1) ? await calculateBusinessDays(Revise1, GL1) : null) ?? "";
                            const BDMGR1 = isValidDate(GL1) && isValidDate(MGR1) ? await calculateBusinessDays(GL1, MGR1)
                                : (isValidDate(Sublead1) && isValidDate(MGR1) ? await calculateBusinessDays(Sublead1, MGR1)
                                    : (isValidDate(Revise1) && isValidDate(MGR1) ? await calculateBusinessDays(Revise1, MGR1) : null)) ?? "";
                            const BDJP1 = isValidDate(MGR1) && isValidDate(JP1) ? await calculateBusinessDays(MGR1, JP1)
                                : (isValidDate(GL1) && isValidDate(JP1) ? await calculateBusinessDays(GL1, JP1)
                                    : (isValidDate(Sublead1) && isValidDate(JP1) ? await calculateBusinessDays(Sublead1, JP1) : null)) ?? "";
                            const CheckSignerForBDRevise2 = isValidDate(JP1) ? JP1
                                : isValidDate(MGR1) ? MGR1
                                    : isValidDate(GL1) ? GL1
                                        : isValidDate(Sublead1) ? Sublead1
                                            : null ?? "";
                            const BDRevise2 = CheckSignerForBDRevise2 ? await calculateBusinessDays(CheckSignerForBDRevise2, Revise2) : null ?? "";
                            const BDSublead2 = await calculateBusinessDays(Revise2, Sublead2) ?? "";
                            const BDGL2 = isValidDate(Sublead2) && isValidDate(GL2) ? await calculateBusinessDays(Sublead2, GL2)
                                : (isValidDate(Revise2) && isValidDate(GL2) ? await calculateBusinessDays(Revise2, GL2) : null) ?? "";
                            const BDMGR2 = isValidDate(GL2) && isValidDate(MGR2) ? await calculateBusinessDays(GL2, MGR2)
                                : (isValidDate(Sublead2) && isValidDate(MGR2) ? await calculateBusinessDays(Sublead2, MGR2)
                                    : (isValidDate(Revise2) && isValidDate(MGR2) ? await calculateBusinessDays(Revise2, MGR2) : null)) ?? "";
                            const BDJP2 = isValidDate(MGR2) && isValidDate(JP2) ? await calculateBusinessDays(MGR2, JP2)
                                : (isValidDate(GL2) && isValidDate(JP2) ? await calculateBusinessDays(GL2, JP2)
                                    : (isValidDate(Sublead2) && isValidDate(JP2) ? await calculateBusinessDays(Sublead2, JP2) : null)) ?? "";
                            const CheckSignerForBDRevise3 = isValidDate(JP2) ? JP2
                                : isValidDate(MGR2) ? MGR2
                                    : isValidDate(GL2) ? GL2
                                        : isValidDate(Sublead2) ? Sublead2
                                            : null ?? "";
                            const BDRevise3 = CheckSignerForBDRevise3 ? await calculateBusinessDays(CheckSignerForBDRevise3, Revise3) : null ?? "";
                            const BDSublead3 = await calculateBusinessDays(Revise3, Sublead3) ?? "";
                            const BDGL3 = isValidDate(Sublead3) && isValidDate(GL3) ? await calculateBusinessDays(Sublead3, GL3)
                                : (isValidDate(Revise3) && isValidDate(GL3) ? await calculateBusinessDays(Revise3, GL3) : null) ?? "";
                            const BDMGR3 = isValidDate(GL3) && isValidDate(MGR3) ? await calculateBusinessDays(GL3, MGR3)
                                : (isValidDate(Sublead3) && isValidDate(MGR3) ? await calculateBusinessDays(Sublead3, MGR3)
                                    : (isValidDate(Revise3) && isValidDate(MGR3) ? await calculateBusinessDays(Revise3, MGR3) : null)) ?? "";
                            const BDJP3 = isValidDate(MGR3) && isValidDate(JP3) ? await calculateBusinessDays(MGR3, JP3)
                                : (isValidDate(GL3) && isValidDate(JP3) ? await calculateBusinessDays(GL3, JP3)
                                    : (isValidDate(Sublead3) && isValidDate(JP3) ? await calculateBusinessDays(Sublead3, JP3) : null)) ?? "";
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
                                                                                            : null ?? "";

                            const BDSent = CheckSignerForBDSent ? await calculateBusinessDays(CheckSignerForBDSent, sentRepDate, custshort) : null ?? "";
                            const Reason = req.Reason ?? "";

                            let week = 0;
                            if (dayOfMonth >= 1 && dayOfMonth <= 12) {
                                week = 1;
                            } else if (dayOfMonth >= 13 && dayOfMonth <= 23) {
                                week = 2;
                            } else if (dayOfMonth >= 24 && dayOfMonth <= 31) {
                                week = 3;
                            }

                            if (custshort == lastcustshort && reqNo == lastreqno) {
                                if (week < lastWeek) {
                                    week = lastWeek;
                                }
                            }
                            if (custshort == lastcustshort && reqNo != lastreqno) {
                                if (week < lastWeek) {
                                    week = week + 1;
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
                                        entry["TS_Send1"] = formatDate(maxTSSendDate);
                                        entry["TTC_Receive1"] = formatDate(maxSendDate);
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
                                        entry["TS_Send2"] = formatDate(maxTSSendDate);
                                        entry["TTC_Receive2"] = formatDate(maxSendDate);
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
                                        entry["TS_Send3"] = formatDate(maxTSSendDate);
                                        entry["TTC_Receive3"] = formatDate(maxSendDate);
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
                                        entry["TS_Send4"] = formatDate(maxTSSendDate);
                                        entry["TTC_Receive4"] = formatDate(maxSendDate);
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
                            }
                            entry["Month"] = monthString;
                            entry["Year"] = yearString;
                            if (entry["Month"] == null || entry["Month"] == "") {
                                entry["Month"] = Round;
                            } else {

                            }
                            if (entry["Year"] == null || entry["Year"] == "") {
                                entry["Year"] = year;
                            } else {

                            }
                            lastWeek = week;
                            lastcustshort = custshort;
                            lastreqno = reqNo;
                        }
                    }
                    // if (Round == "01") {
                    //     var queryDelete = `Delete from [SARKPI].[dbo].[KPI_Service];`;
                    // } else {
                    //     var queryDelete = ` `;
                    // }
                    try {
                        // for (let i = 0; i < SET01.length; i++) {
                        //     // const queryCheck = `SELECT COUNT(*) AS count FROM [SARKPI].[dbo].[KPI_Service]
                        //     //     WHERE [CustShort] = '${SET01[i].CustShort}' 
                        //     //     AND [Month] = '${SET01[i].Month}' 
                        //     //     AND [Year] = '${SET01[i].Year}'`;
                        //     // const result = await mssql.qurey(queryCheck);
                        //     // if (result.recordset[0].count > 0) {
                        //     //     const queryUpdate = `UPDATE [SARKPI].[dbo].[KPI_Service]
                        //     //          SET [Type] = '${SET01[i].Type}', 
                        //     //             [MKTGroup] = '${SET01[i].MKTGroup}', 
                        //     //             [Group] = '${SET01[i].Group}', 
                        //     //             [Customer] = '${SET01[i].Customer}', 
                        //     //             [CustShort] = '${SET01[i].CustShort}', 
                        //     //             [Frequency] = '${SET01[i].Frequency}', 
                        //     //             [Incharge] = '${SET01[i].Incharge}', 
                        //     //             [KPIServ] = '${SET01[i].KPIServ}', 
                        //     //             [KPIPeriod] = '${SET01[i].KPIPeriod}', 
                        //     //             [RepItems] = '${SET01[i].RepItems}', 
                        //     //             [Month] = '${SET01[i].Month}', 
                        //     //             [Year] = '${SET01[i].Year}', 
                        //     //             [ReqNo1] = '${SET01[i].ReqNo1}', 
                        //     //             [Freq1] = '${SET01[i].Freq1}', 
                        //     //             [Evaluation1] = '${SET01[i].Evaluation1}', 
                        //     //             [PlanSam1] = '${SET01[i].PlanSam1}', 
                        //     //             [ActSam1] = '${SET01[i].ActSam1}', 
                        //     //             [RepDue1] = '${SET01[i].RepDue1}', 
                        //     //             [SentRep1] = '${SET01[i].SentRep1}', 
                        //     //             [RepDays1] = '${SET01[i].RepDays1}', 
                        //     //             [Request1] = '${SET01[i].Request1}', 
                        //     //             [TTCResult1] = '${SET01[i].TTCResult1}', 
                        //     //             [IssueDate1] = '${SET01[i].IssueDate1}', 
                        //     //             [Sublead1] = '${SET01[i].Sublead1}', 
                        //     //             [GL1] = '${SET01[i].GL1}', 
                        //     //             [MGR1] = '${SET01[i].MGR1}', 
                        //     //             [JP1] = '${SET01[i].JP1}', 
                        //     //             [Revise1_1] = '${SET01[i].Revise1_1}', 
                        //     //             [Sublead1_1] = '${SET01[i].Sublead1_1}', 
                        //     //             [GL1_1] = '${SET01[i].GL1_1}', 
                        //     //             [MGR1_1] = '${SET01[i].MGR1_1}', 
                        //     //             [JP1_1] = '${SET01[i].JP1_1}', 
                        //     //             [Revise1_2] = '${SET01[i].Revise1_2}', 
                        //     //             [Sublead1_2] = '${SET01[i].Sublead1_2}', 
                        //     //             [GL1_2] = '${SET01[i].GL1_2}', 
                        //     //             [MGR1_2] = '${SET01[i].MGR1_2}', 
                        //     //             [JP1_2] = '${SET01[i].JP1_2}', 
                        //     //             [Revise1_3] = '${SET01[i].Revise1_3}', 
                        //     //             [Sublead1_3] = '${SET01[i].Sublead1_3}', 
                        //     //             [GL1_3] = '${SET01[i].GL1_3}', 
                        //     //             [MGR1_3] = '${SET01[i].MGR1_3}', 
                        //     //             [JP1_3] = '${SET01[i].JP1_3}', 
                        //     //             [BDPrepare1] = '${SET01[i].BDPrepare1}', 
                        //     //             [BDTTC1] = '${SET01[i].BDTTC1}', 
                        //     //             [BDIssue1] = '${SET01[i].BDIssue1}', 
                        //     //             [BDSublead1] = '${SET01[i].BDSublead1}', 
                        //     //             [BDGL1] = '${SET01[i].BDGL1}', 
                        //     //             [BDMGR1] = '${SET01[i].BDMGR1}', 
                        //     //             [BDJP1] = '${SET01[i].BDJP1}', 
                        //     //             [BDRevise1_1] = '${SET01[i].BDRevise1_1}', 
                        //     //             [BDSublead1_1] = '${SET01[i].BDSublead1_1}', 
                        //     //             [BDGL1_1] = '${SET01[i].BDGL1_1}', 
                        //     //             [BDMGR1_1] = '${SET01[i].BDMGR1_1}', 
                        //     //             [BDJP1_1] = '${SET01[i].BDJP1_1}', 
                        //     //             [BDRevise1_2] = '${SET01[i].BDRevise1_2}', 
                        //     //             [BDSublead1_2] = '${SET01[i].BDSublead1_2}', 
                        //     //             [BDGL1_2] = '${SET01[i].BDGL1_2}', 
                        //     //             [BDMGR1_2] = '${SET01[i].BDMGR1_2}', 
                        //     //             [BDJP1_2] = '${SET01[i].BDJP1_2}', 
                        //     //             [BDRevise1_3] = '${SET01[i].BDRevise1_3}', 
                        //     //             [BDSublead1_3] = '${SET01[i].BDSublead1_3}', 
                        //     //             [BDGL1_3] = '${SET01[i].BDGL1_3}', 
                        //     //             [BDMGR1_3] = '${SET01[i].BDMGR1_3}', 
                        //     //             [BDJP1_3] = '${SET01[i].BDJP1_3}', 
                        //     //             [BDSent1] = '${SET01[i].BDSent1}', 
                        //     //             [Stage1] = '${SET01[i].Stage1}',
                        //     //             [Reason1] = '${SET01[i].Reason1}', 
                        //     //             [ReqNo2] = '${SET01[i].ReqNo2}', 
                        //     //             [Freq2] = '${SET01[i].Freq2}', 
                        //     //             [Evaluation2] = '${SET01[i].Evaluation2}', 
                        //     //             [PlanSam2] = '${SET01[i].PlanSam2}', 
                        //     //             [ActSam2] = '${SET01[i].ActSam2}', 
                        //     //             [RepDue2] = '${SET01[i].RepDue2}', 
                        //     //             [SentRep2] = '${SET01[i].SentRep2}', 
                        //     //             [RepDays2] = '${SET01[i].RepDays2}', 
                        //     //             [Request2] = '${SET01[i].Request2}', 
                        //     //             [TTCResult2] = '${SET01[i].TTCResult2}', 
                        //     //             [IssueDate2] = '${SET01[i].IssueDate2}', 
                        //     //             [Sublead2] = '${SET01[i].Sublead2}', 
                        //     //             [GL2] = '${SET01[i].GL2}', 
                        //     //             [MGR2] = '${SET01[i].MGR2}', 
                        //     //             [JP2] = '${SET01[i].JP2}', 
                        //     //             [Revise2_1] = '${SET01[i].Revise2_1}', 
                        //     //             [Sublead2_1] = '${SET01[i].Sublead2_1}', 
                        //     //             [GL2_1] = '${SET01[i].GL2_1}', 
                        //     //             [MGR2_1] = '${SET01[i].MGR2_1}', 
                        //     //             [JP2_1] = '${SET01[i].JP2_1}', 
                        //     //             [Revise2_2] = '${SET01[i].Revise2_2}', 
                        //     //             [Sublead2_2] = '${SET01[i].Sublead2_2}', 
                        //     //             [GL2_2] = '${SET01[i].GL2_2}', 
                        //     //             [MGR2_2] = '${SET01[i].MGR2_2}', 
                        //     //             [JP2_2] = '${SET01[i].JP2_2}', 
                        //     //             [Revise2_3] = '${SET01[i].Revise2_3}', 
                        //     //             [Sublead2_3] = '${SET01[i].Sublead2_3}', 
                        //     //             [GL2_3] = '${SET01[i].GL2_3}', 
                        //     //             [MGR2_3] = '${SET01[i].MGR2_3}', 
                        //     //             [JP2_3] = '${SET01[i].JP2_3}', 
                        //     //             [BDPrepare2] = '${SET01[i].BDPrepare2}', 
                        //     //             [BDTTC2] = '${SET01[i].BDTTC2}', 
                        //     //             [BDIssue2] = '${SET01[i].BDIssue2}', 
                        //     //             [BDSublead2] = '${SET01[i].BDSublead2}', 
                        //     //             [BDGL2] = '${SET01[i].BDGL2}', 
                        //     //             [BDMGR2] = '${SET01[i].BDMGR2}', 
                        //     //             [BDJP2] = '${SET01[i].BDJP2}', 
                        //     //             [BDRevise2_1] = '${SET01[i].BDRevise2_1}', 
                        //     //             [BDSublead2_1] = '${SET01[i].BDSublead2_1}', 
                        //     //             [BDGL2_1] = '${SET01[i].BDGL2_1}', 
                        //     //             [BDMGR2_1] = '${SET01[i].BDMGR2_1}', 
                        //     //             [BDJP2_1] = '${SET01[i].BDJP2_1}', 
                        //     //             [BDRevise2_2] = '${SET01[i].BDRevise2_2}', 
                        //     //             [BDSublead2_2] = '${SET01[i].BDSublead2_2}', 
                        //     //             [BDGL2_2] = '${SET01[i].BDGL2_2}', 
                        //     //             [BDMGR2_2] = '${SET01[i].BDMGR2_2}', 
                        //     //             [BDJP2_2] = '${SET01[i].BDJP2_2}', 
                        //     //             [BDRevise2_3] = '${SET01[i].BDRevise2_3}', 
                        //     //             [BDSublead2_3] = '${SET01[i].BDSublead2_3}', 
                        //     //             [BDGL2_3] = '${SET01[i].BDGL2_3}', 
                        //     //             [BDMGR2_3] = '${SET01[i].BDMGR2_3}', 
                        //     //             [BDJP2_3] = '${SET01[i].BDJP2_3}', 
                        //     //             [BDSent2] = '${SET01[i].BDSent2}', 
                        //     //             [Stage2] = '${SET01[i].Stage2}',
                        //     //             [Reason2] = '${SET01[i].Reason2}', 
                        //     //             [ReqNo3] = '${SET01[i].ReqNo3}', 
                        //     //             [Freq3] = '${SET01[i].Freq3}', 
                        //     //             [Evaluation3] = '${SET01[i].Evaluation3}', 
                        //     //             [PlanSam3] = '${SET01[i].PlanSam3}', 
                        //     //             [ActSam3] = '${SET01[i].ActSam3}', 
                        //     //             [RepDue3] = '${SET01[i].RepDue3}', 
                        //     //             [SentRep3] = '${SET01[i].SentRep3}', 
                        //     //             [RepDays3] = '${SET01[i].RepDays3}', 
                        //     //             [Request3] = '${SET01[i].Request3}', 
                        //     //             [TTCResult3] = '${SET01[i].TTCResult3}', 
                        //     //             [IssueDate3] = '${SET01[i].IssueDate3}', 
                        //     //             [Sublead3] = '${SET01[i].Sublead3}', 
                        //     //             [GL3] = '${SET01[i].GL3}', 
                        //     //             [MGR3] = '${SET01[i].MGR3}', 
                        //     //             [JP3] = '${SET01[i].JP3}', 
                        //     //             [Revise3_1] = '${SET01[i].Revise3_1}', 
                        //     //             [Sublead3_1] = '${SET01[i].Sublead3_1}', 
                        //     //             [GL3_1] = '${SET01[i].GL3_1}', 
                        //     //             [MGR3_1] = '${SET01[i].MGR3_1}', 
                        //     //             [JP3_1] = '${SET01[i].JP3_1}', 
                        //     //             [Revise3_2] = '${SET01[i].Revise3_2}', 
                        //     //             [Sublead3_2] = '${SET01[i].Sublead3_2}', 
                        //     //             [GL3_2] = '${SET01[i].GL3_2}', 
                        //     //             [MGR3_2] = '${SET01[i].MGR3_2}', 
                        //     //             [JP3_2] = '${SET01[i].JP3_2}', 
                        //     //             [Revise3_3] = '${SET01[i].Revise3_3}', 
                        //     //             [Sublead3_3] = '${SET01[i].Sublead3_3}', 
                        //     //             [GL3_3] = '${SET01[i].GL3_3}', 
                        //     //             [MGR3_3] = '${SET01[i].MGR3_3}', 
                        //     //             [JP3_3] = '${SET01[i].JP3_3}', 
                        //     //             [BDPrepare3] = '${SET01[i].BDPrepare3}', 
                        //     //             [BDTTC3] = '${SET01[i].BDTTC3}', 
                        //     //             [BDIssue3] = '${SET01[i].BDIssue3}', 
                        //     //             [BDSublead3] = '${SET01[i].BDSublead3}', 
                        //     //             [BDGL3] = '${SET01[i].BDGL3}', 
                        //     //             [BDMGR3] = '${SET01[i].BDMGR3}', 
                        //     //             [BDJP3] = '${SET01[i].BDJP3}', 
                        //     //             [BDRevise3_1] = '${SET01[i].BDRevise3_1}', 
                        //     //             [BDSublead3_1] = '${SET01[i].BDSublead3_1}', 
                        //     //             [BDGL3_1] = '${SET01[i].BDGL3_1}', 
                        //     //             [BDMGR3_1] = '${SET01[i].BDMGR3_1}', 
                        //     //             [BDJP3_1] = '${SET01[i].BDJP3_1}', 
                        //     //             [BDRevise3_2] = '${SET01[i].BDRevise3_2}', 
                        //     //             [BDSublead3_2] = '${SET01[i].BDSublead3_2}', 
                        //     //             [BDGL3_2] = '${SET01[i].BDGL3_2}', 
                        //     //             [BDMGR3_2] = '${SET01[i].BDMGR3_2}', 
                        //     //             [BDJP3_2] = '${SET01[i].BDJP3_2}', 
                        //     //             [BDRevise3_3] = '${SET01[i].BDRevise3_3}', 
                        //     //             [BDSublead3_3] = '${SET01[i].BDSublead3_3}', 
                        //     //             [BDGL3_3] = '${SET01[i].BDGL3_3}', 
                        //     //             [BDMGR3_3] = '${SET01[i].BDMGR3_3}', 
                        //     //             [BDJP3_3] = '${SET01[i].BDJP3_3}', 
                        //     //             [BDSent3] = '${SET01[i].BDSent3}', 
                        //     //             [Stage3] = '${SET01[i].Stage3}',
                        //     //             [Reason3] = '${SET01[i].Reason3}', 
                        //     //             [ReqNo4] = '${SET01[i].ReqNo4}', 
                        //     //             [Freq4] = '${SET01[i].Freq4}', 
                        //     //             [Evaluation4] = '${SET01[i].Evaluation4}', 
                        //     //             [PlanSam4] = '${SET01[i].PlanSam4}', 
                        //     //             [ActSam4] = '${SET01[i].ActSam4}', 
                        //     //             [RepDue4] = '${SET01[i].RepDue4}', 
                        //     //             [SentRep4] = '${SET01[i].SentRep4}', 
                        //     //             [RepDays4] = '${SET01[i].RepDays4}', 
                        //     //             [Request4] = '${SET01[i].Request4}', 
                        //     //             [TTCResult4] = '${SET01[i].TTCResult4}', 
                        //     //             [IssueDate4] = '${SET01[i].IssueDate4}', 
                        //     //             [Sublead4] = '${SET01[i].Sublead4}', 
                        //     //             [GL4] = '${SET01[i].GL4}', 
                        //     //             [MGR4] = '${SET01[i].MGR4}', 
                        //     //             [JP4] = '${SET01[i].JP4}', 
                        //     //             [Revise4_1] = '${SET01[i].Revise4_1}', 
                        //     //             [Sublead4_1] = '${SET01[i].Sublead4_1}', 
                        //     //             [GL4_1] = '${SET01[i].GL4_1}', 
                        //     //             [MGR4_1] = '${SET01[i].MGR4_1}', 
                        //     //             [JP4_1] = '${SET01[i].JP4_1}', 
                        //     //             [Revise4_2] = '${SET01[i].Revise4_2}', 
                        //     //             [Sublead4_2] = '${SET01[i].Sublead4_2}', 
                        //     //             [GL4_2] = '${SET01[i].GL4_2}', 
                        //     //             [MGR4_2] = '${SET01[i].MGR4_2}', 
                        //     //             [JP4_2] = '${SET01[i].JP4_2}', 
                        //     //             [Revise4_3] = '${SET01[i].Revise4_3}', 
                        //     //             [Sublead4_3] = '${SET01[i].Sublead4_3}', 
                        //     //             [GL4_3] = '${SET01[i].GL4_3}', 
                        //     //             [MGR4_3] = '${SET01[i].MGR4_3}', 
                        //     //             [JP4_3] = '${SET01[i].JP4_3}', 
                        //     //             [BDPrepare4] = '${SET01[i].BDPrepare4}', 
                        //     //             [BDTTC4] = '${SET01[i].BDTTC4}', 
                        //     //             [BDIssue4] = '${SET01[i].BDIssue4}', 
                        //     //             [BDSublead4] = '${SET01[i].BDSublead4}', 
                        //     //             [BDGL4] = '${SET01[i].BDGL4}', 
                        //     //             [BDMGR4] = '${SET01[i].BDMGR4}', 
                        //     //             [BDJP4] = '${SET01[i].BDJP4}', 
                        //     //             [BDRevise4_1] = '${SET01[i].BDRevise4_1}', 
                        //     //             [BDSublead4_1] = '${SET01[i].BDSublead4_1}', 
                        //     //             [BDGL4_1] = '${SET01[i].BDGL4_1}', 
                        //     //             [BDMGR4_1] = '${SET01[i].BDMGR4_1}', 
                        //     //             [BDJP4_1] = '${SET01[i].BDJP4_1}', 
                        //     //             [BDRevise4_2] = '${SET01[i].BDRevise4_2}', 
                        //     //             [BDSublead4_2] = '${SET01[i].BDSublead4_2}', 
                        //     //             [BDGL4_2] = '${SET01[i].BDGL4_2}', 
                        //     //             [BDMGR4_2] = '${SET01[i].BDMGR4_2}', 
                        //     //             [BDJP4_2] = '${SET01[i].BDJP4_2}', 
                        //     //             [BDRevise4_3] = '${SET01[i].BDRevise4_3}', 
                        //     //             [BDSublead4_3] = '${SET01[i].BDSublead4_3}', 
                        //     //             [BDGL4_3] = '${SET01[i].GL4_3}', 
                        //     //             [BDMGR4_3] = '${SET01[i].BDMGR4_3}', 
                        //     //             [BDJP4_3] = '${SET01[i].BDJP4_3}', 
                        //     //             [BDSent4] = '${SET01[i].BDSent4}',
                        //     //             [Stage4] = '${SET01[i].Stage4}', 
                        //     //             [Reason4] = '${SET01[i].Reason4}'
                        //     //             WHERE [CustShort] = '${SET01[i].CustShort}' 
                        //     //             AND [Month] = '${SET01[i].Month}' 
                        //     //             AND [Year] = '${SET01[i].Year}'
                        //     //             AND [ReqNo1] = '${SET01[i].ReqNo1}'
                        //     //             AND [ReqNo2] = '${SET01[i].ReqNo2}'
                        //     //             AND [ReqNo3] = '${SET01[i].ReqNo3}'
                        //     //             AND [ReqNo4] = '${SET01[i].ReqNo4}';`;
                        //     //     await mssql.qurey(queryUpdate);
                        //     //     // console.log(queryUpdate);
                        //     //     // console.log("Update Complete " + i);
                        //     // } else {
                        //     var queryInsert = `INSERT INTO [SARKPI].[dbo].[KPI_Service] 
                        //     ([Type], [MKTGroup], [Group], [Customer], [CustShort], [Frequency], [Incharge], [KPIServ], [KPIPeriod], [RepItems], [Month], [Year], [ReqNo1], [Freq1], [Evaluation1], [PlanSam1], [ActSam1], [RepDue1], [SentRep1], [RepDays1], [Request1], [TTCResult1], 
                        //     [IssueDate1], [Sublead1], [GL1], [MGR1], [JP1], [Revise1_1], [Sublead1_1], [GL1_1], [MGR1_1], [JP1_1], [Revise1_2], [Sublead1_2], [GL1_2], [MGR1_2], [JP1_2], [Revise1_3], [Sublead1_3], [GL1_3], [MGR1_3], [JP1_3], [BDPrepare1], [BDTTC1], [BDIssue1], [BDSublead1], [BDGL1], 
                        //     [BDMGR1], [BDJP1], [BDRevise1_1], [BDSublead1_1], [BDGL1_1], [BDMGR1_1], [BDJP1_1], [BDRevise1_2], [BDSublead1_2], [BDGL1_2], [BDMGR1_2], [BDJP1_2], [BDRevise1_3], [BDSublead1_3], [BDGL1_3], [BDMGR1_3], [BDJP1_3], [BDSent1], [Stage1], [Reason1], [ReqNo2], 
                        //     [Freq2], [Evaluation2], [PlanSam2], [ActSam2], [RepDue2], [SentRep2], [RepDays2], [Request2], [TTCResult2], [IssueDate2], [Sublead2], [GL2], [MGR2], [JP2], [Revise2_1], [Sublead2_1], [GL2_1], [MGR2_1], [JP2_1], [Revise2_2], [Sublead2_2], [GL2_2], [MGR2_2], [JP2_2], 
                        //     [Revise2_3], [Sublead2_3], [GL2_3], [MGR2_3], [JP2_3], [BDPrepare2], [BDTTC2], [BDIssue2], [BDSublead2], [BDGL2], [BDMGR2], [BDJP2], [BDRevise2_1], [BDSublead2_1], [BDGL2_1], [BDMGR2_1], [BDJP2_1], [BDRevise2_2], [BDSublead2_2], [BDGL2_2], [BDMGR2_2], 
                        //     [BDJP2_2], [BDRevise2_3], [BDSublead2_3], [BDGL2_3], [BDMGR2_3], [BDJP2_3], [BDSent2], [Stage2], [Reason2], [ReqNo3], [Freq3], [Evaluation3], [PlanSam3], [ActSam3], [RepDue3], [SentRep3], [RepDays3], [Request3], [TTCResult3], [IssueDate3], [Sublead3], [GL3], [MGR3], [JP3], 
                        //     [Revise3_1], [Sublead3_1], [GL3_1], [MGR3_1], [JP3_1], [Revise3_2], [Sublead3_2], [GL3_2], [MGR3_2], [JP3_2], [Revise3_3], [Sublead3_3], [GL3_3], [MGR3_3], [JP3_3], [BDPrepare3], [BDTTC3], [BDIssue3], [BDSublead3], [BDGL3], [BDMGR3], [BDJP3], [BDRevise3_1], 
                        //     [BDSublead3_1], [BDGL3_1], [BDMGR3_1], [BDJP3_1], [BDRevise3_2], [BDSublead3_2], [BDGL3_2], [BDMGR3_2], [BDJP3_2], [BDRevise3_3], [BDSublead3_3], [BDGL3_3], [BDMGR3_3], [BDJP3_3], [BDSent3], [Stage3], [Reason3], [ReqNo4], [Freq4], [Evaluation4], [PlanSam4], 
                        //     [ActSam4], [RepDue4], [SentRep4], [RepDays4], [Request4], [TTCResult4], [IssueDate4], [Sublead4], [GL4], [MGR4], [JP4], [Revise4_1], [Sublead4_1], [GL4_1], [MGR4_1], [JP4_1], [Revise4_2], [Sublead4_2], [GL4_2], [MGR4_2], [JP4_2], [Revise4_3], [Sublead4_3], [GL4_3], 
                        //     [MGR4_3], [JP4_3], [BDPrepare4], [BDTTC4], [BDIssue4], [BDSublead4], [BDGL4], [BDMGR4], [BDJP4], [BDRevise4_1], [BDSublead4_1], [BDGL4_1], [BDMGR4_1], [BDJP4_1], [BDRevise4_2], [BDSublead4_2], [BDGL4_2], [BDMGR4_2], [BDJP4_2], [BDRevise4_3], 
                        //     [BDSublead4_3], [BDGL4_3], [BDMGR4_3], [BDJP4_3], [BDSent4], [Stage4], [Reason4]) 
                        //     values `;

                        //     for (i = 0; i < SET01.length; i++) {
                        //         queryInsert =
                        //             queryInsert +
                        //             `( '${SET01[i].Type}'
                        //             ,'${SET01[i].MKTGroup}'
                        //             ,'${SET01[i].Group}'
                        //             ,'${SET01[i].Customer}'
                        //             ,'${SET01[i].CustShort}'
                        //             ,'${SET01[i].Frequency}'
                        //             ,'${SET01[i].Incharge}'
                        //             ,'${SET01[i].KPIServ}'
                        //             ,'${SET01[i].KPIPeriod}'
                        //             ,'${SET01[i].RepItems}'
                        //             ,'${SET01[i].Month}'
                        //             ,'${SET01[i].Year}'
                        //             ,'${SET01[i].ReqNo1}'
                        //             ,'${SET01[i].Freq1}'
                        //             ,'${SET01[i].Evaluation1}'
                        //             ,'${SET01[i].PlanSam1}'
                        //             ,'${SET01[i].ActSam1}'
                        //             ,'${SET01[i].RepDue1}'
                        //             ,'${SET01[i].SentRep1}'
                        //             ,'${SET01[i].RepDays1}'
                        //             ,'${SET01[i].Request1}'
                        //             ,'${SET01[i].TTCResult1}'
                        //             ,'${SET01[i].IssueDate1}'
                        //             ,'${SET01[i].Sublead1}'
                        //             ,'${SET01[i].GL1}'
                        //             ,'${SET01[i].MGR1}'
                        //             ,'${SET01[i].JP1}'
                        //             ,'${SET01[i].Revise1_1}'
                        //             ,'${SET01[i].Sublead1_1}'
                        //             ,'${SET01[i].GL1_1}'
                        //             ,'${SET01[i].MGR1_1}'
                        //             ,'${SET01[i].JP1_1}'
                        //             ,'${SET01[i].Revise1_2}'
                        //             ,'${SET01[i].Sublead1_2}'
                        //             ,'${SET01[i].GL1_2}'
                        //             ,'${SET01[i].MGR1_2}'
                        //             ,'${SET01[i].JP1_2}'
                        //             ,'${SET01[i].Revise1_3}'
                        //             ,'${SET01[i].Sublead1_3}'
                        //             ,'${SET01[i].GL1_3}'
                        //             ,'${SET01[i].MGR1_3}'
                        //             ,'${SET01[i].JP1_3}'
                        //             ,'${SET01[i].BDPrepare1}'
                        //             ,'${SET01[i].BDTTC1}'
                        //             ,'${SET01[i].BDIssue1}'
                        //             ,'${SET01[i].BDSublead1}'
                        //             ,'${SET01[i].BDGL1}'
                        //             ,'${SET01[i].BDMGR1}'
                        //             ,'${SET01[i].BDJP1}'
                        //             ,'${SET01[i].BDRevise1_1}'
                        //             ,'${SET01[i].BDSublead1_1}'
                        //             ,'${SET01[i].BDGL1_1}'
                        //             ,'${SET01[i].BDMGR1_1}'
                        //             ,'${SET01[i].BDJP1_1}'
                        //             ,'${SET01[i].BDRevise1_2}'
                        //             ,'${SET01[i].BDSublead1_2}'
                        //             ,'${SET01[i].BDGL1_2}'
                        //             ,'${SET01[i].BDMGR1_2}'
                        //             ,'${SET01[i].BDJP1_2}'          
                        //             ,'${SET01[i].BDRevise1_3}'
                        //             ,'${SET01[i].BDSublead1_3}'
                        //             ,'${SET01[i].BDGL1_3}'
                        //             ,'${SET01[i].BDMGR1_3}'
                        //             ,'${SET01[i].BDJP1_3}'
                        //             ,'${SET01[i].BDSent1}'
                        //             ,'${SET01[i].Stage1}'  
                        //             ,'${SET01[i].Reason1}'  
                        //             ,'${SET01[i].ReqNo2}'
                        //             ,'${SET01[i].Freq2}'
                        //             ,'${SET01[i].Evaluation2}'
                        //             ,'${SET01[i].PlanSam2}'
                        //             ,'${SET01[i].ActSam2}'
                        //             ,'${SET01[i].RepDue2}'
                        //             ,'${SET01[i].SentRep2}'
                        //             ,'${SET01[i].RepDays2}'
                        //             ,'${SET01[i].Request2}'
                        //             ,'${SET01[i].TTCResult2}'
                        //             ,'${SET01[i].IssueDate2}'
                        //             ,'${SET01[i].Sublead2}'
                        //             ,'${SET01[i].GL2}'
                        //             ,'${SET01[i].MGR2}'
                        //             ,'${SET01[i].JP2}'
                        //             ,'${SET01[i].Revise2_1}'
                        //             ,'${SET01[i].Sublead2_1}'
                        //             ,'${SET01[i].GL2_1}'
                        //             ,'${SET01[i].MGR2_1}'
                        //             ,'${SET01[i].JP2_1}'
                        //             ,'${SET01[i].Revise2_2}'
                        //             ,'${SET01[i].Sublead2_2}'
                        //             ,'${SET01[i].GL2_2}'
                        //             ,'${SET01[i].MGR2_2}'
                        //             ,'${SET01[i].JP2_2}'
                        //             ,'${SET01[i].Revise2_3}'
                        //             ,'${SET01[i].Sublead2_3}'
                        //             ,'${SET01[i].GL2_3}'
                        //             ,'${SET01[i].MGR2_3}'
                        //             ,'${SET01[i].JP2_3}'
                        //             ,'${SET01[i].BDPrepare2}'
                        //             ,'${SET01[i].BDTTC2}'
                        //             ,'${SET01[i].BDIssue2}'
                        //             ,'${SET01[i].BDSublead2}'
                        //             ,'${SET01[i].BDGL2}'
                        //             ,'${SET01[i].BDMGR2}'
                        //             ,'${SET01[i].BDJP2}'
                        //             ,'${SET01[i].BDRevise2_1}'
                        //             ,'${SET01[i].BDSublead2_1}'
                        //             ,'${SET01[i].BDGL2_1}'
                        //             ,'${SET01[i].BDMGR2_1}'
                        //             ,'${SET01[i].BDJP2_1}'
                        //             ,'${SET01[i].BDRevise2_2}'
                        //             ,'${SET01[i].BDSublead2_2}'
                        //             ,'${SET01[i].BDGL2_2}'
                        //             ,'${SET01[i].BDMGR2_2}'
                        //             ,'${SET01[i].BDJP2_2}'
                        //             ,'${SET01[i].BDRevise2_3}'
                        //             ,'${SET01[i].BDSublead2_3}'
                        //             ,'${SET01[i].BDGL2_3}'  
                        //             ,'${SET01[i].BDMGR2_3}'
                        //             ,'${SET01[i].BDJP2_3}'
                        //             ,'${SET01[i].BDSent2}'
                        //             ,'${SET01[i].Stage2}'
                        //             ,'${SET01[i].Reason2}'
                        //             ,'${SET01[i].ReqNo3}'
                        //             ,'${SET01[i].Freq3}'
                        //             ,'${SET01[i].Evaluation3}'
                        //             ,'${SET01[i].PlanSam3}'
                        //             ,'${SET01[i].ActSam3}'
                        //             ,'${SET01[i].RepDue3}'  
                        //             ,'${SET01[i].SentRep3}'
                        //             ,'${SET01[i].RepDays3}'
                        //             ,'${SET01[i].Request3}'
                        //             ,'${SET01[i].TTCResult3}'
                        //             ,'${SET01[i].IssueDate3}'
                        //             ,'${SET01[i].Sublead3}'
                        //             ,'${SET01[i].GL3}'
                        //             ,'${SET01[i].MGR3}'
                        //             ,'${SET01[i].JP3}'
                        //             ,'${SET01[i].Revise3_1}'
                        //             ,'${SET01[i].Sublead3_1}'
                        //             ,'${SET01[i].GL3_1}'
                        //             ,'${SET01[i].MGR3_1}'
                        //             ,'${SET01[i].JP3_1}'
                        //             ,'${SET01[i].Revise3_2}'
                        //             ,'${SET01[i].Sublead3_2}'
                        //             ,'${SET01[i].GL3_2}'
                        //             ,'${SET01[i].MGR3_2}'
                        //             ,'${SET01[i].JP3_2}'
                        //             ,'${SET01[i].Revise3_3}'
                        //             ,'${SET01[i].Sublead3_3}'
                        //             ,'${SET01[i].GL3_3}'
                        //             ,'${SET01[i].MGR3_3}'
                        //             ,'${SET01[i].JP3_3}'
                        //             ,'${SET01[i].BDPrepare3}'
                        //             ,'${SET01[i].BDTTC3}'
                        //             ,'${SET01[i].BDIssue3}'
                        //             ,'${SET01[i].BDSublead3}'
                        //             ,'${SET01[i].BDGL3}'
                        //             ,'${SET01[i].BDMGR3}'
                        //             ,'${SET01[i].BDJP3}'
                        //             ,'${SET01[i].BDRevise3_1}'
                        //             ,'${SET01[i].BDSublead3_1}'
                        //             ,'${SET01[i].BDGL3_1}'
                        //             ,'${SET01[i].BDMGR3_1}'
                        //             ,'${SET01[i].BDJP3_1}'
                        //             ,'${SET01[i].BDRevise3_2}'
                        //             ,'${SET01[i].BDSublead3_2}'
                        //             ,'${SET01[i].BDGL3_2}'
                        //             ,'${SET01[i].BDMGR3_2}'
                        //             ,'${SET01[i].BDJP3_2}'
                        //             ,'${SET01[i].BDRevise3_3}'
                        //             ,'${SET01[i].BDSublead3_3}'
                        //             ,'${SET01[i].BDGL3_3}'
                        //             ,'${SET01[i].BDMGR3_3}'
                        //             ,'${SET01[i].BDJP3_3}'
                        //             ,'${SET01[i].BDSent3}'
                        //             ,'${SET01[i].Stage3}'
                        //             ,'${SET01[i].Reason3}'
                        //             ,'${SET01[i].ReqNo4}'
                        //             ,'${SET01[i].Freq4}'
                        //             ,'${SET01[i].Evaluation4}'
                        //             ,'${SET01[i].PlanSam4}'
                        //             ,'${SET01[i].ActSam4}'
                        //             ,'${SET01[i].RepDue4}'
                        //             ,'${SET01[i].SentRep4}'
                        //             ,'${SET01[i].RepDays4}'
                        //             ,'${SET01[i].Request4}'
                        //             ,'${SET01[i].TTCResult4}'
                        //             ,'${SET01[i].IssueDate4}'
                        //             ,'${SET01[i].Sublead4}'
                        //             ,'${SET01[i].GL4}'
                        //             ,'${SET01[i].MGR4}'
                        //             ,'${SET01[i].JP4}'
                        //             ,'${SET01[i].Revise4_1}'
                        //             ,'${SET01[i].Sublead4_1}'
                        //             ,'${SET01[i].GL4_1}'
                        //             ,'${SET01[i].MGR4_1}'
                        //             ,'${SET01[i].JP4_1}'
                        //             ,'${SET01[i].Revise4_2}'
                        //             ,'${SET01[i].Sublead4_2}'
                        //             ,'${SET01[i].GL4_2}'
                        //             ,'${SET01[i].MGR4_2}'
                        //             ,'${SET01[i].JP4_2}'
                        //             ,'${SET01[i].Revise4_3}'
                        //             ,'${SET01[i].Sublead4_3}'
                        //             ,'${SET01[i].GL4_3}'
                        //             ,'${SET01[i].MGR4_3}'
                        //             ,'${SET01[i].JP4_3}'
                        //             ,'${SET01[i].BDPrepare4}'
                        //             ,'${SET01[i].BDTTC4}'
                        //             ,'${SET01[i].BDIssue4}' 
                        //             ,'${SET01[i].BDSublead4}'
                        //             ,'${SET01[i].BDGL4}'
                        //             ,'${SET01[i].BDMGR4}'
                        //             ,'${SET01[i].BDJP4}'
                        //             ,'${SET01[i].BDRevise4_1}'
                        //             ,'${SET01[i].BDSublead4_1}'
                        //             ,'${SET01[i].BDGL4_1}'
                        //             ,'${SET01[i].BDMGR4_1}'
                        //             ,'${SET01[i].BDJP4_1}'
                        //             ,'${SET01[i].BDRevise4_2}'
                        //             ,'${SET01[i].BDSublead4_2}'
                        //             ,'${SET01[i].BDGL4_2}'
                        //             ,'${SET01[i].BDMGR4_2}'
                        //             ,'${SET01[i].BDJP4_2}'
                        //             ,'${SET01[i].BDRevise4_3}'
                        //             ,'${SET01[i].BDSublead4_3}'
                        //             ,'${SET01[i].BDGL4_3}'
                        //             ,'${SET01[i].BDMGR4_3}'
                        //             ,'${SET01[i].BDJP4_3}'
                        //             ,'${SET01[i].BDSent4}'
                        //             ,'${SET01[i].Stage4}'
                        //             ,'${SET01[i].Reason4}'
                        //         )`;
                        //         if (i !== SET01.length - 1) {
                        //             queryInsert = queryInsert + ",";
                        //         }
                        //     }
                        //     query = queryInsert + ";";
                        //     // query = queryDelete + queryInsert + ";";
                        //     await mssql.qurey(query);
                        //     // console.log(query);
                        //     // console.log("Insert Complete " + i);
                        //     // }
                        // }
                        for (let i = 0; i < SET01.length; i++) {
                            if (SET01[i].Month != '' && SET01[i].Year != '' && SET01[i].Month != null && SET01[i].Year != null) {
                                const queryCheck = `SELECT COUNT(*) AS count FROM [SARKPI].[dbo].[KPI_Service] 
                                WHERE [CustShort] = '${SET01[i].CustShort}' 
                                AND [Month] = '${SET01[i].Month}' 
                                AND [Year] = '${SET01[i].Year}'`;
                                const result = await mssql.qurey(queryCheck);
                                // console.log('result:' + result.recordset[0].count + ' ' + SET01[i].CustShort);
                                // console.log(SET01[i].CustShort + ' ' + queryCheck);
                                if (result.recordset[0].count > 0) {
                                    const queryUpdate = `UPDATE [SARKPI].[dbo].[KPI_Service]
                                 SET [Type] = '${SET01[i].Type}', 
                                    [MKTGroup] = '${SET01[i].MKTGroup}', 
                                    [Group] = '${SET01[i].Group}', 
                                    [Customer] = '${SET01[i].Customer}', 
                                    [CustShort] = '${SET01[i].CustShort}', 
                                    [Frequency] = '${SET01[i].Frequency}', 
                                    [Incharge] = '${SET01[i].Incharge}', 
                                    [KPIServ] = '${SET01[i].KPIServ}', 
                                    [KPIPeriod] = '${SET01[i].KPIPeriod}', 
                                    [RepItems] = '${SET01[i].RepItems}', 
                                    [Month] = '${SET01[i].Month}', 
                                    [Year] = '${SET01[i].Year}', 
                                    [ReqNo1] = '${SET01[i].ReqNo1}', 
                                    [Freq1] = '${SET01[i].Freq1}', 
                                    [Evaluation1] = '${SET01[i].Evaluation1}', 
                                    [PlanSam1] = '${SET01[i].PlanSam1}', 
                                    [ActSam1] = '${SET01[i].ActSam1}', 
                                    [RepDue1] = '${SET01[i].RepDue1}', 
                                    [SentRep1] = '${SET01[i].SentRep1}', 
                                    [RepDays1] = '${SET01[i].RepDays1}',
                                    [TS_Send1] = '${SET01[i].TS_Send1}',
                                    [TTC_Receive1] = '${SET01[i].TTC_Receive1}', 
                                    [Request1] = '${SET01[i].Request1}', 
                                    [TTCResult1] = '${SET01[i].TTCResult1}', 
                                    [IssueDate1] = '${SET01[i].IssueDate1}', 
                                    [Sublead1] = '${SET01[i].Sublead1}', 
                                    [GL1] = '${SET01[i].GL1}', 
                                    [MGR1] = '${SET01[i].MGR1}', 
                                    [JP1] = '${SET01[i].JP1}', 
                                    [Revise1_1] = '${SET01[i].Revise1_1}', 
                                    [Sublead1_1] = '${SET01[i].Sublead1_1}', 
                                    [GL1_1] = '${SET01[i].GL1_1}', 
                                    [MGR1_1] = '${SET01[i].MGR1_1}', 
                                    [JP1_1] = '${SET01[i].JP1_1}', 
                                    [Revise1_2] = '${SET01[i].Revise1_2}', 
                                    [Sublead1_2] = '${SET01[i].Sublead1_2}', 
                                    [GL1_2] = '${SET01[i].GL1_2}', 
                                    [MGR1_2] = '${SET01[i].MGR1_2}', 
                                    [JP1_2] = '${SET01[i].JP1_2}', 
                                    [Revise1_3] = '${SET01[i].Revise1_3}', 
                                    [Sublead1_3] = '${SET01[i].Sublead1_3}', 
                                    [GL1_3] = '${SET01[i].GL1_3}', 
                                    [MGR1_3] = '${SET01[i].MGR1_3}', 
                                    [JP1_3] = '${SET01[i].JP1_3}', 
                                    [BDPrepare1] = '${SET01[i].BDPrepare1}', 
                                    [BDTTC1] = '${SET01[i].BDTTC1}', 
                                    [BDIssue1] = '${SET01[i].BDIssue1}', 
                                    [BDSublead1] = '${SET01[i].BDSublead1}', 
                                    [BDGL1] = '${SET01[i].BDGL1}', 
                                    [BDMGR1] = '${SET01[i].BDMGR1}', 
                                    [BDJP1] = '${SET01[i].BDJP1}', 
                                    [BDRevise1_1] = '${SET01[i].BDRevise1_1}', 
                                    [BDSublead1_1] = '${SET01[i].BDSublead1_1}', 
                                    [BDGL1_1] = '${SET01[i].BDGL1_1}', 
                                    [BDMGR1_1] = '${SET01[i].BDMGR1_1}', 
                                    [BDJP1_1] = '${SET01[i].BDJP1_1}', 
                                    [BDRevise1_2] = '${SET01[i].BDRevise1_2}', 
                                    [BDSublead1_2] = '${SET01[i].BDSublead1_2}', 
                                    [BDGL1_2] = '${SET01[i].BDGL1_2}', 
                                    [BDMGR1_2] = '${SET01[i].BDMGR1_2}', 
                                    [BDJP1_2] = '${SET01[i].BDJP1_2}', 
                                    [BDRevise1_3] = '${SET01[i].BDRevise1_3}', 
                                    [BDSublead1_3] = '${SET01[i].BDSublead1_3}', 
                                    [BDGL1_3] = '${SET01[i].BDGL1_3}', 
                                    [BDMGR1_3] = '${SET01[i].BDMGR1_3}', 
                                    [BDJP1_3] = '${SET01[i].BDJP1_3}', 
                                    [BDSent1] = '${SET01[i].BDSent1}',
                                    [ReqNo2] = '${SET01[i].ReqNo2}', 
                                    [Freq2] = '${SET01[i].Freq2}', 
                                    [Evaluation2] = '${SET01[i].Evaluation2}', 
                                    [PlanSam2] = '${SET01[i].PlanSam2}', 
                                    [ActSam2] = '${SET01[i].ActSam2}', 
                                    [RepDue2] = '${SET01[i].RepDue2}', 
                                    [SentRep2] = '${SET01[i].SentRep2}', 
                                    [RepDays2] = '${SET01[i].RepDays2}', 
                                    [TS_Send2] = '${SET01[i].TS_Send2}',
                                    [TTC_Receive2] = '${SET01[i].TTC_Receive2}',
                                    [Request2] = '${SET01[i].Request2}', 
                                    [TTCResult2] = '${SET01[i].TTCResult2}', 
                                    [IssueDate2] = '${SET01[i].IssueDate2}', 
                                    [Sublead2] = '${SET01[i].Sublead2}', 
                                    [GL2] = '${SET01[i].GL2}', 
                                    [MGR2] = '${SET01[i].MGR2}', 
                                    [JP2] = '${SET01[i].JP2}', 
                                    [Revise2_1] = '${SET01[i].Revise2_1}', 
                                    [Sublead2_1] = '${SET01[i].Sublead2_1}', 
                                    [GL2_1] = '${SET01[i].GL2_1}', 
                                    [MGR2_1] = '${SET01[i].MGR2_1}', 
                                    [JP2_1] = '${SET01[i].JP2_1}', 
                                    [Revise2_2] = '${SET01[i].Revise2_2}', 
                                    [Sublead2_2] = '${SET01[i].Sublead2_2}', 
                                    [GL2_2] = '${SET01[i].GL2_2}', 
                                    [MGR2_2] = '${SET01[i].MGR2_2}', 
                                    [JP2_2] = '${SET01[i].JP2_2}', 
                                    [Revise2_3] = '${SET01[i].Revise2_3}', 
                                    [Sublead2_3] = '${SET01[i].Sublead2_3}', 
                                    [GL2_3] = '${SET01[i].GL2_3}', 
                                    [MGR2_3] = '${SET01[i].MGR2_3}', 
                                    [JP2_3] = '${SET01[i].JP2_3}', 
                                    [BDPrepare2] = '${SET01[i].BDPrepare2}', 
                                    [BDTTC2] = '${SET01[i].BDTTC2}', 
                                    [BDIssue2] = '${SET01[i].BDIssue2}', 
                                    [BDSublead2] = '${SET01[i].BDSublead2}', 
                                    [BDGL2] = '${SET01[i].BDGL2}', 
                                    [BDMGR2] = '${SET01[i].BDMGR2}', 
                                    [BDJP2] = '${SET01[i].BDJP2}', 
                                    [BDRevise2_1] = '${SET01[i].BDRevise2_1}', 
                                    [BDSublead2_1] = '${SET01[i].BDSublead2_1}', 
                                    [BDGL2_1] = '${SET01[i].BDGL2_1}', 
                                    [BDMGR2_1] = '${SET01[i].BDMGR2_1}', 
                                    [BDJP2_1] = '${SET01[i].BDJP2_1}', 
                                    [BDRevise2_2] = '${SET01[i].BDRevise2_2}', 
                                    [BDSublead2_2] = '${SET01[i].BDSublead2_2}', 
                                    [BDGL2_2] = '${SET01[i].BDGL2_2}', 
                                    [BDMGR2_2] = '${SET01[i].BDMGR2_2}', 
                                    [BDJP2_2] = '${SET01[i].BDJP2_2}', 
                                    [BDRevise2_3] = '${SET01[i].BDRevise2_3}', 
                                    [BDSublead2_3] = '${SET01[i].BDSublead2_3}', 
                                    [BDGL2_3] = '${SET01[i].BDGL2_3}', 
                                    [BDMGR2_3] = '${SET01[i].BDMGR2_3}', 
                                    [BDJP2_3] = '${SET01[i].BDJP2_3}', 
                                    [BDSent2] = '${SET01[i].BDSent2}',
                                    [ReqNo3] = '${SET01[i].ReqNo3}', 
                                    [Freq3] = '${SET01[i].Freq3}', 
                                    [Evaluation3] = '${SET01[i].Evaluation3}', 
                                    [PlanSam3] = '${SET01[i].PlanSam3}', 
                                    [ActSam3] = '${SET01[i].ActSam3}', 
                                    [RepDue3] = '${SET01[i].RepDue3}', 
                                    [SentRep3] = '${SET01[i].SentRep3}', 
                                    [RepDays3] = '${SET01[i].RepDays3}', 
                                    [TS_Send3] = '${SET01[i].TS_Send3}',
                                    [TTC_Receive3] = '${SET01[i].TTC_Receive3}',
                                    [Request3] = '${SET01[i].Request3}', 
                                    [TTCResult3] = '${SET01[i].TTCResult3}', 
                                    [IssueDate3] = '${SET01[i].IssueDate3}', 
                                    [Sublead3] = '${SET01[i].Sublead3}', 
                                    [GL3] = '${SET01[i].GL3}', 
                                    [MGR3] = '${SET01[i].MGR3}', 
                                    [JP3] = '${SET01[i].JP3}', 
                                    [Revise3_1] = '${SET01[i].Revise3_1}', 
                                    [Sublead3_1] = '${SET01[i].Sublead3_1}', 
                                    [GL3_1] = '${SET01[i].GL3_1}', 
                                    [MGR3_1] = '${SET01[i].MGR3_1}', 
                                    [JP3_1] = '${SET01[i].JP3_1}', 
                                    [Revise3_2] = '${SET01[i].Revise3_2}', 
                                    [Sublead3_2] = '${SET01[i].Sublead3_2}', 
                                    [GL3_2] = '${SET01[i].GL3_2}', 
                                    [MGR3_2] = '${SET01[i].MGR3_2}', 
                                    [JP3_2] = '${SET01[i].JP3_2}', 
                                    [Revise3_3] = '${SET01[i].Revise3_3}', 
                                    [Sublead3_3] = '${SET01[i].Sublead3_3}', 
                                    [GL3_3] = '${SET01[i].GL3_3}', 
                                    [MGR3_3] = '${SET01[i].MGR3_3}', 
                                    [JP3_3] = '${SET01[i].JP3_3}', 
                                    [BDPrepare3] = '${SET01[i].BDPrepare3}', 
                                    [BDTTC3] = '${SET01[i].BDTTC3}', 
                                    [BDIssue3] = '${SET01[i].BDIssue3}', 
                                    [BDSublead3] = '${SET01[i].BDSublead3}', 
                                    [BDGL3] = '${SET01[i].BDGL3}', 
                                    [BDMGR3] = '${SET01[i].BDMGR3}', 
                                    [BDJP3] = '${SET01[i].BDJP3}', 
                                    [BDRevise3_1] = '${SET01[i].BDRevise3_1}', 
                                    [BDSublead3_1] = '${SET01[i].BDSublead3_1}', 
                                    [BDGL3_1] = '${SET01[i].BDGL3_1}', 
                                    [BDMGR3_1] = '${SET01[i].BDMGR3_1}', 
                                    [BDJP3_1] = '${SET01[i].BDJP3_1}', 
                                    [BDRevise3_2] = '${SET01[i].BDRevise3_2}', 
                                    [BDSublead3_2] = '${SET01[i].BDSublead3_2}', 
                                    [BDGL3_2] = '${SET01[i].BDGL3_2}', 
                                    [BDMGR3_2] = '${SET01[i].BDMGR3_2}', 
                                    [BDJP3_2] = '${SET01[i].BDJP3_2}', 
                                    [BDRevise3_3] = '${SET01[i].BDRevise3_3}', 
                                    [BDSublead3_3] = '${SET01[i].BDSublead3_3}', 
                                    [BDGL3_3] = '${SET01[i].BDGL3_3}', 
                                    [BDMGR3_3] = '${SET01[i].BDMGR3_3}', 
                                    [BDJP3_3] = '${SET01[i].BDJP3_3}', 
                                    [BDSent3] = '${SET01[i].BDSent3}',
                                    [ReqNo4] = '${SET01[i].ReqNo4}', 
                                    [Freq4] = '${SET01[i].Freq4}', 
                                    [Evaluation4] = '${SET01[i].Evaluation4}', 
                                    [PlanSam4] = '${SET01[i].PlanSam4}', 
                                    [ActSam4] = '${SET01[i].ActSam4}', 
                                    [RepDue4] = '${SET01[i].RepDue4}', 
                                    [SentRep4] = '${SET01[i].SentRep4}', 
                                    [RepDays4] = '${SET01[i].RepDays4}', 
                                    [TS_Send4] = '${SET01[i].TS_Send4}',
                                    [TTC_Receive4] = '${SET01[i].TTC_Receive4}',
                                    [Request4] = '${SET01[i].Request4}', 
                                    [TTCResult4] = '${SET01[i].TTCResult4}', 
                                    [IssueDate4] = '${SET01[i].IssueDate4}', 
                                    [Sublead4] = '${SET01[i].Sublead4}', 
                                    [GL4] = '${SET01[i].GL4}', 
                                    [MGR4] = '${SET01[i].MGR4}', 
                                    [JP4] = '${SET01[i].JP4}', 
                                    [Revise4_1] = '${SET01[i].Revise4_1}', 
                                    [Sublead4_1] = '${SET01[i].Sublead4_1}', 
                                    [GL4_1] = '${SET01[i].GL4_1}', 
                                    [MGR4_1] = '${SET01[i].MGR4_1}', 
                                    [JP4_1] = '${SET01[i].JP4_1}', 
                                    [Revise4_2] = '${SET01[i].Revise4_2}', 
                                    [Sublead4_2] = '${SET01[i].Sublead4_2}', 
                                    [GL4_2] = '${SET01[i].GL4_2}', 
                                    [MGR4_2] = '${SET01[i].MGR4_2}', 
                                    [JP4_2] = '${SET01[i].JP4_2}', 
                                    [Revise4_3] = '${SET01[i].Revise4_3}', 
                                    [Sublead4_3] = '${SET01[i].Sublead4_3}', 
                                    [GL4_3] = '${SET01[i].GL4_3}', 
                                    [MGR4_3] = '${SET01[i].MGR4_3}', 
                                    [JP4_3] = '${SET01[i].JP4_3}', 
                                    [BDPrepare4] = '${SET01[i].BDPrepare4}', 
                                    [BDTTC4] = '${SET01[i].BDTTC4}', 
                                    [BDIssue4] = '${SET01[i].BDIssue4}', 
                                    [BDSublead4] = '${SET01[i].BDSublead4}', 
                                    [BDGL4] = '${SET01[i].BDGL4}', 
                                    [BDMGR4] = '${SET01[i].BDMGR4}', 
                                    [BDJP4] = '${SET01[i].BDJP4}', 
                                    [BDRevise4_1] = '${SET01[i].BDRevise4_1}', 
                                    [BDSublead4_1] = '${SET01[i].BDSublead4_1}', 
                                    [BDGL4_1] = '${SET01[i].BDGL4_1}', 
                                    [BDMGR4_1] = '${SET01[i].BDMGR4_1}', 
                                    [BDJP4_1] = '${SET01[i].BDJP4_1}', 
                                    [BDRevise4_2] = '${SET01[i].BDRevise4_2}', 
                                    [BDSublead4_2] = '${SET01[i].BDSublead4_2}', 
                                    [BDGL4_2] = '${SET01[i].BDGL4_2}', 
                                    [BDMGR4_2] = '${SET01[i].BDMGR4_2}', 
                                    [BDJP4_2] = '${SET01[i].BDJP4_2}', 
                                    [BDRevise4_3] = '${SET01[i].BDRevise4_3}', 
                                    [BDSublead4_3] = '${SET01[i].BDSublead4_3}', 
                                    [BDGL4_3] = '${SET01[i].GL4_3}', 
                                    [BDMGR4_3] = '${SET01[i].BDMGR4_3}', 
                                    [BDJP4_3] = '${SET01[i].BDJP4_3}', 
                                    [BDSent4] = '${SET01[i].BDSent4}'
                                    WHERE [CustShort] = '${SET01[i].CustShort}' 
                                    AND [Month] = '${SET01[i].Month}' 
                                    AND [Year] = '${SET01[i].Year}';`;
                                    await mssql.qurey(queryUpdate);
                                    // console.log(queryUpdate);
                                    // console.log("Update Complete " + i);
                                } else {
                                    var queryInsert = `INSERT INTO [SARKPI].[dbo].[KPI_Service]
                                ([Type], [MKTGroup], [Group], [Customer], [CustShort], [Frequency], [Incharge], [KPIServ], [KPIPeriod], [RepItems], [Month], [Year], [ReqNo1], [Freq1], [Evaluation1], [PlanSam1], [ActSam1], [RepDue1], [SentRep1], [RepDays1], [TS_Send1], [TTC_Receive1],[Request1], [TTCResult1], 
                                [IssueDate1], [Sublead1], [GL1], [MGR1], [JP1], [Revise1_1], [Sublead1_1], [GL1_1], [MGR1_1], [JP1_1], [Revise1_2], [Sublead1_2], [GL1_2], [MGR1_2], [JP1_2], [Revise1_3], [Sublead1_3], [GL1_3], [MGR1_3], [JP1_3], [BDPrepare1], [BDTTC1], [BDIssue1], [BDSublead1], [BDGL1], 
                                [BDMGR1], [BDJP1], [BDRevise1_1], [BDSublead1_1], [BDGL1_1], [BDMGR1_1], [BDJP1_1], [BDRevise1_2], [BDSublead1_2], [BDGL1_2], [BDMGR1_2], [BDJP1_2], [BDRevise1_3], [BDSublead1_3], [BDGL1_3], [BDMGR1_3], [BDJP1_3], [BDSent1], [Stage1], [Reason1], [ReqNo2], 
                                [Freq2], [Evaluation2], [PlanSam2], [ActSam2], [RepDue2], [SentRep2], [RepDays2], [TS_Send2], [TTC_Receive2],[Request2], [TTCResult2], [IssueDate2], [Sublead2], [GL2], [MGR2], [JP2], [Revise2_1], [Sublead2_1], [GL2_1], [MGR2_1], [JP2_1], [Revise2_2], [Sublead2_2], [GL2_2], [MGR2_2], [JP2_2], 
                                [Revise2_3], [Sublead2_3], [GL2_3], [MGR2_3], [JP2_3], [BDPrepare2], [BDTTC2], [BDIssue2], [BDSublead2], [BDGL2], [BDMGR2], [BDJP2], [BDRevise2_1], [BDSublead2_1], [BDGL2_1], [BDMGR2_1], [BDJP2_1], [BDRevise2_2], [BDSublead2_2], [BDGL2_2], [BDMGR2_2], 
                                [BDJP2_2], [BDRevise2_3], [BDSublead2_3], [BDGL2_3], [BDMGR2_3], [BDJP2_3], [BDSent2], [Stage2], [Reason2], [ReqNo3], [Freq3], [Evaluation3], [PlanSam3], [ActSam3], [RepDue3], [SentRep3], [RepDays3], [TS_Send3], [TTC_Receive3],[Request3], [TTCResult3], [IssueDate3], [Sublead3], [GL3], [MGR3], [JP3], 
                                [Revise3_1], [Sublead3_1], [GL3_1], [MGR3_1], [JP3_1], [Revise3_2], [Sublead3_2], [GL3_2], [MGR3_2], [JP3_2], [Revise3_3], [Sublead3_3], [GL3_3], [MGR3_3], [JP3_3], [BDPrepare3], [BDTTC3], [BDIssue3], [BDSublead3], [BDGL3], [BDMGR3], [BDJP3], [BDRevise3_1], 
                                [BDSublead3_1], [BDGL3_1], [BDMGR3_1], [BDJP3_1], [BDRevise3_2], [BDSublead3_2], [BDGL3_2], [BDMGR3_2], [BDJP3_2], [BDRevise3_3], [BDSublead3_3], [BDGL3_3], [BDMGR3_3], [BDJP3_3], [BDSent3], [Stage3], [Reason3], [ReqNo4], [Freq4], [Evaluation4], [PlanSam4], 
                                [ActSam4], [RepDue4], [SentRep4], [RepDays4], [TS_Send4], [TTC_Receive4],[Request4], [TTCResult4], [IssueDate4], [Sublead4], [GL4], [MGR4], [JP4], [Revise4_1], [Sublead4_1], [GL4_1], [MGR4_1], [JP4_1], [Revise4_2], [Sublead4_2], [GL4_2], [MGR4_2], [JP4_2], [Revise4_3], [Sublead4_3], [GL4_3], 
                                [MGR4_3], [JP4_3], [BDPrepare4], [BDTTC4], [BDIssue4], [BDSublead4], [BDGL4], [BDMGR4], [BDJP4], [BDRevise4_1], [BDSublead4_1], [BDGL4_1], [BDMGR4_1], [BDJP4_1], [BDRevise4_2], [BDSublead4_2], [BDGL4_2], [BDMGR4_2], [BDJP4_2], [BDRevise4_3], 
                                [BDSublead4_3], [BDGL4_3], [BDMGR4_3], [BDJP4_3], [BDSent4], [Stage4], [Reason4]) 
                                 values `;

                                    // for (i = 0; i < SET01.length; i++) {
                                    queryInsert =
                                        queryInsert +
                                        `( '${SET01[i].Type}'
                                ,'${SET01[i].MKTGroup}'
                                ,'${SET01[i].Group}'
                                ,'${SET01[i].Customer}'
                                ,'${SET01[i].CustShort}'
                                ,'${SET01[i].Frequency}'
                                ,'${SET01[i].Incharge}'
                                ,'${SET01[i].KPIServ}'
                                ,'${SET01[i].KPIPeriod}'
                                ,'${SET01[i].RepItems}'
                                ,'${SET01[i].Month}'
                                ,'${SET01[i].Year}'
                                ,'${SET01[i].ReqNo1}'
                                ,'${SET01[i].Freq1}'
                                ,'${SET01[i].Evaluation1}'
                                ,'${SET01[i].PlanSam1}'
                                ,'${SET01[i].ActSam1}'
                                ,'${SET01[i].RepDue1}'
                                ,'${SET01[i].SentRep1}'
                                ,'${SET01[i].RepDays1}'
                                ,'${SET01[i].TS_Send1}'
                                ,'${SET01[i].TTC_Receive1}'
                                ,'${SET01[i].Request1}'
                                ,'${SET01[i].TTCResult1}'
                                ,'${SET01[i].IssueDate1}'
                                ,'${SET01[i].Sublead1}'
                                ,'${SET01[i].GL1}'
                                ,'${SET01[i].MGR1}'
                                ,'${SET01[i].JP1}'
                                ,'${SET01[i].Revise1_1}'
                                ,'${SET01[i].Sublead1_1}'
                                ,'${SET01[i].GL1_1}'
                                ,'${SET01[i].MGR1_1}'
                                ,'${SET01[i].JP1_1}'
                                ,'${SET01[i].Revise1_2}'
                                ,'${SET01[i].Sublead1_2}'
                                ,'${SET01[i].GL1_2}'
                                ,'${SET01[i].MGR1_2}'
                                ,'${SET01[i].JP1_2}'
                                ,'${SET01[i].Revise1_3}'
                                ,'${SET01[i].Sublead1_3}'
                                ,'${SET01[i].GL1_3}'
                                ,'${SET01[i].MGR1_3}'
                                ,'${SET01[i].JP1_3}'
                                ,'${SET01[i].BDPrepare1}'
                                ,'${SET01[i].BDTTC1}'
                                ,'${SET01[i].BDIssue1}'
                                ,'${SET01[i].BDSublead1}'
                                ,'${SET01[i].BDGL1}'
                                ,'${SET01[i].BDMGR1}'
                                ,'${SET01[i].BDJP1}'
                                ,'${SET01[i].BDRevise1_1}'
                                ,'${SET01[i].BDSublead1_1}'
                                ,'${SET01[i].BDGL1_1}'
                                ,'${SET01[i].BDMGR1_1}'
                                ,'${SET01[i].BDJP1_1}'
                                ,'${SET01[i].BDRevise1_2}'
                                ,'${SET01[i].BDSublead1_2}'
                                ,'${SET01[i].BDGL1_2}'
                                ,'${SET01[i].BDMGR1_2}'
                                ,'${SET01[i].BDJP1_2}'          
                                ,'${SET01[i].BDRevise1_3}'
                                ,'${SET01[i].BDSublead1_3}'
                                ,'${SET01[i].BDGL1_3}'
                                ,'${SET01[i].BDMGR1_3}'
                                ,'${SET01[i].BDJP1_3}'
                                ,'${SET01[i].BDSent1}'
                                ,'${SET01[i].Stage1}'  
                                ,'${SET01[i].Reason1}'  
                                ,'${SET01[i].ReqNo2}'
                                ,'${SET01[i].Freq2}'
                                ,'${SET01[i].Evaluation2}'
                                ,'${SET01[i].PlanSam2}'
                                ,'${SET01[i].ActSam2}'
                                ,'${SET01[i].RepDue2}'
                                ,'${SET01[i].SentRep2}'
                                ,'${SET01[i].RepDays2}'
                                ,'${SET01[i].TS_Send2}'
                                ,'${SET01[i].TTC_Receive2}'
                                ,'${SET01[i].Request2}'
                                ,'${SET01[i].TTCResult2}'
                                ,'${SET01[i].IssueDate2}'
                                ,'${SET01[i].Sublead2}'
                                ,'${SET01[i].GL2}'
                                ,'${SET01[i].MGR2}'
                                ,'${SET01[i].JP2}'
                                ,'${SET01[i].Revise2_1}'
                                ,'${SET01[i].Sublead2_1}'
                                ,'${SET01[i].GL2_1}'
                                ,'${SET01[i].MGR2_1}'
                                ,'${SET01[i].JP2_1}'
                                ,'${SET01[i].Revise2_2}'
                                ,'${SET01[i].Sublead2_2}'
                                ,'${SET01[i].GL2_2}'
                                ,'${SET01[i].MGR2_2}'
                                ,'${SET01[i].JP2_2}'
                                ,'${SET01[i].Revise2_3}'
                                ,'${SET01[i].Sublead2_3}'
                                ,'${SET01[i].GL2_3}'
                                ,'${SET01[i].MGR2_3}'
                                ,'${SET01[i].JP2_3}'
                                ,'${SET01[i].BDPrepare2}'
                                ,'${SET01[i].BDTTC2}'
                                ,'${SET01[i].BDIssue2}'
                                ,'${SET01[i].BDSublead2}'
                                ,'${SET01[i].BDGL2}'
                                ,'${SET01[i].BDMGR2}'
                                ,'${SET01[i].BDJP2}'
                                ,'${SET01[i].BDRevise2_1}'
                                ,'${SET01[i].BDSublead2_1}'
                                ,'${SET01[i].BDGL2_1}'
                                ,'${SET01[i].BDMGR2_1}'
                                ,'${SET01[i].BDJP2_1}'
                                ,'${SET01[i].BDRevise2_2}'
                                ,'${SET01[i].BDSublead2_2}'
                                ,'${SET01[i].BDGL2_2}'
                                ,'${SET01[i].BDMGR2_2}'
                                ,'${SET01[i].BDJP2_2}'
                                ,'${SET01[i].BDRevise2_3}'
                                ,'${SET01[i].BDSublead2_3}'
                                ,'${SET01[i].BDGL2_3}'  
                                ,'${SET01[i].BDMGR2_3}'
                                ,'${SET01[i].BDJP2_3}'
                                ,'${SET01[i].BDSent2}'
                                ,'${SET01[i].Stage2}'
                                ,'${SET01[i].Reason2}'
                                ,'${SET01[i].ReqNo3}'
                                ,'${SET01[i].Freq3}'
                                ,'${SET01[i].Evaluation3}'
                                ,'${SET01[i].PlanSam3}'
                                ,'${SET01[i].ActSam3}'
                                ,'${SET01[i].RepDue3}'  
                                ,'${SET01[i].SentRep3}'
                                ,'${SET01[i].RepDays3}'
                                ,'${SET01[i].TS_Send3}'
                                ,'${SET01[i].TTC_Receive3}'
                                ,'${SET01[i].Request3}'
                                ,'${SET01[i].TTCResult3}'
                                ,'${SET01[i].IssueDate3}'
                                ,'${SET01[i].Sublead3}'
                                ,'${SET01[i].GL3}'
                                ,'${SET01[i].MGR3}'
                                ,'${SET01[i].JP3}'
                                ,'${SET01[i].Revise3_1}'
                                ,'${SET01[i].Sublead3_1}'
                                ,'${SET01[i].GL3_1}'
                                ,'${SET01[i].MGR3_1}'
                                ,'${SET01[i].JP3_1}'
                                ,'${SET01[i].Revise3_2}'
                                ,'${SET01[i].Sublead3_2}'
                                ,'${SET01[i].GL3_2}'
                                ,'${SET01[i].MGR3_2}'
                                ,'${SET01[i].JP3_2}'
                                ,'${SET01[i].Revise3_3}'
                                ,'${SET01[i].Sublead3_3}'
                                ,'${SET01[i].GL3_3}'
                                ,'${SET01[i].MGR3_3}'
                                ,'${SET01[i].JP3_3}'
                                ,'${SET01[i].BDPrepare3}'
                                ,'${SET01[i].BDTTC3}'
                                ,'${SET01[i].BDIssue3}'
                                ,'${SET01[i].BDSublead3}'
                                ,'${SET01[i].BDGL3}'
                                ,'${SET01[i].BDMGR3}'
                                ,'${SET01[i].BDJP3}'
                                ,'${SET01[i].BDRevise3_1}'
                                ,'${SET01[i].BDSublead3_1}'
                                ,'${SET01[i].BDGL3_1}'
                                ,'${SET01[i].BDMGR3_1}'
                                ,'${SET01[i].BDJP3_1}'
                                ,'${SET01[i].BDRevise3_2}'
                                ,'${SET01[i].BDSublead3_2}'
                                ,'${SET01[i].BDGL3_2}'
                                ,'${SET01[i].BDMGR3_2}'
                                ,'${SET01[i].BDJP3_2}'
                                ,'${SET01[i].BDRevise3_3}'
                                ,'${SET01[i].BDSublead3_3}'
                                ,'${SET01[i].BDGL3_3}'
                                ,'${SET01[i].BDMGR3_3}'
                                ,'${SET01[i].BDJP3_3}'
                                ,'${SET01[i].BDSent3}'
                                ,'${SET01[i].Stage3}'
                                ,'${SET01[i].Reason3}'
                                ,'${SET01[i].ReqNo4}'
                                ,'${SET01[i].Freq4}'
                                ,'${SET01[i].Evaluation4}'
                                ,'${SET01[i].PlanSam4}'
                                ,'${SET01[i].ActSam4}'
                                ,'${SET01[i].RepDue4}'
                                ,'${SET01[i].SentRep4}'
                                ,'${SET01[i].RepDays4}'
                                ,'${SET01[i].TS_Send4}'
                                ,'${SET01[i].TTC_Receive4}'
                                ,'${SET01[i].Request4}'
                                ,'${SET01[i].TTCResult4}'
                                ,'${SET01[i].IssueDate4}'
                                ,'${SET01[i].Sublead4}'
                                ,'${SET01[i].GL4}'
                                ,'${SET01[i].MGR4}'
                                ,'${SET01[i].JP4}'
                                ,'${SET01[i].Revise4_1}'
                                ,'${SET01[i].Sublead4_1}'
                                ,'${SET01[i].GL4_1}'
                                ,'${SET01[i].MGR4_1}'
                                ,'${SET01[i].JP4_1}'
                                ,'${SET01[i].Revise4_2}'
                                ,'${SET01[i].Sublead4_2}'
                                ,'${SET01[i].GL4_2}'
                                ,'${SET01[i].MGR4_2}'
                                ,'${SET01[i].JP4_2}'
                                ,'${SET01[i].Revise4_3}'
                                ,'${SET01[i].Sublead4_3}'
                                ,'${SET01[i].GL4_3}'
                                ,'${SET01[i].MGR4_3}'
                                ,'${SET01[i].JP4_3}'
                                ,'${SET01[i].BDPrepare4}'
                                ,'${SET01[i].BDTTC4}'
                                ,'${SET01[i].BDIssue4}' 
                                ,'${SET01[i].BDSublead4}'
                                ,'${SET01[i].BDGL4}'
                                ,'${SET01[i].BDMGR4}'
                                ,'${SET01[i].BDJP4}'
                                ,'${SET01[i].BDRevise4_1}'
                                ,'${SET01[i].BDSublead4_1}'
                                ,'${SET01[i].BDGL4_1}'
                                ,'${SET01[i].BDMGR4_1}'
                                ,'${SET01[i].BDJP4_1}'
                                ,'${SET01[i].BDRevise4_2}'
                                ,'${SET01[i].BDSublead4_2}'
                                ,'${SET01[i].BDGL4_2}'
                                ,'${SET01[i].BDMGR4_2}'
                                ,'${SET01[i].BDJP4_2}'
                                ,'${SET01[i].BDRevise4_3}'
                                ,'${SET01[i].BDSublead4_3}'
                                ,'${SET01[i].BDGL4_3}'
                                ,'${SET01[i].BDMGR4_3}'
                                ,'${SET01[i].BDJP4_3}'
                                ,'${SET01[i].BDSent4}'
                                ,'${SET01[i].Stage4}'
                                ,'${SET01[i].Reason4}'
                                )`;
                                    // if (i !== SET01.length - 1) {
                                    //     queryInsert = queryInsert + ",";
                                    // }
                                    // }
                                    query = queryInsert + ";";
                                    // query = queryDelete + queryInsert + ";";
                                    await mssql.qurey(query);
                                    // console.log(query);
                                    // console.log("Insert Complete " + i);
                                }
                            } else { }
                        }
                    } catch (err) {
                        console.error('Error executing SQL query:', err.message);
                        res.status(500).send('Internal Server Error');
                    }
                    console.log('Year ' + year + ' Month ' + (p + 1) + " Complete " + formatDateTime(new Date().toISOString()))
                    output = SET01;
                }
            }
        }
    }
    return res.json(output);
});

// router.post('/02SARKPI/Overdue', async (req, res) => {
//     let input = req.body;
//     console.log("--02SARKPI/Overdue--");
//     console.log(input);
//     console.log("Start " + formatDateTime(new Date().toISOString()));

//     let SET01 = [];
//     let output = [];
//     await loadRoutineKACReport();
//     await loadHolidays();
//     if (input['YEAR'] != undefined) {
//         // const queryDelete = `DELETE FROM [SARKPI].[dbo].[KPI_Overdue] WHERE Year = ${input['YEAR']}`;
//         // await mssql.qurey(queryDelete);
//         for (let p = 0; p < 12; p++) {
//             let Round = (p + 1).toString().padStart(2, '0');
//             const currentMonth = new Date().getMonth() + 1;
//             const month3 = currentMonth.toString().padStart(2, '0');
//             const month2 = ((currentMonth - 1 + 12) % 12 || 12).toString().padStart(2, '0');
//             const month1 = ((currentMonth - 2 + 12) % 12 || 12).toString().padStart(2, '0');
//             const year = input['YEAR'];
//             const year2 = currentMonth === 1 ? year - 1 : year;
//             const year1 = currentMonth <= 2 ? year - 1 : year;
//             const month = input['MONTH'];
//             const mktGroup = input['MKTGROUP'];

//             // const queryMasterPattern = `
//             //     SELECT * From [SAR].[dbo].[Routine_MasterPatternTS]
//             //     WHERE MKTGROUP = '${mktGroup}' AND FRE != '' AND FRE >= 1
//             //     ORDER BY CustShort;
//             // `;
//             const queryMasterPattern = `
//                 SELECT * From [SAR].[dbo].[Routine_MasterPatternTS]
//                 WHERE FRE != '' AND FRE != '1<'
//                 ORDER BY CustShort;
//             `;
//             const dbMaster = await mssql.qurey(queryMasterPattern);

//             // const queryRequestLab = `
//             //     SELECT * From [SAR].[dbo].[Routine_RequestLab] 
//             //     WHERE MONTH(SamplingDate) = '${month}' 
//             //     AND YEAR(SamplingDate) = '${year}'
//             //     AND RequestStatus != 'CANCEL REQUEST'
//             //     ORDER BY CustShort, SamplingDate;
//             // `;
//             const queryRequestLab = `
//             SELECT * From [SAR].[dbo].[Routine_RequestLab] 
//             WHERE MONTH(SamplingDate) = '${Round}' 
//             AND YEAR(SamplingDate) = '${year}'
//             AND RequestStatus != 'CANCEL REQUEST'
//             ORDER BY CustShort, SamplingDate;
//             `;
//             // const queryRequestLab = `
//             // SELECT * FROM [SAR].[dbo].[Routine_RequestLab] 
//             // WHERE (MONTH(SamplingDate) = '${month3}' AND YEAR(SamplingDate) = '${year}')
//             // OR (MONTH(SamplingDate) = '${month2}' AND YEAR(SamplingDate) = '${year2}')
//             // OR (MONTH(SamplingDate) = '${month1}' AND YEAR(SamplingDate) = '${year1}')
//             // AND RequestStatus != 'CANCEL REQUEST'
//             // ORDER BY CustShort, SamplingDate;
//             // `;
//             const dbRequestLab = await mssql.qurey(queryRequestLab);

//             if (dbMaster.recordsets.length > 0 && dbRequestLab.recordsets.length > 0) {
//                 const masterRecords = dbMaster.recordsets[0];
//                 const requestRecords = dbRequestLab.recordsets[0];

//                 const requestRecordsMap = {};
//                 for (let i = 0; i < requestRecords.length; i++) {
//                     const req = requestRecords[i];
//                     const custShort = req.CustShort;
//                     if (custShort) {
//                         if (!requestRecordsMap[custShort]) {
//                             requestRecordsMap[custShort] = [];
//                         }
//                         requestRecordsMap[custShort].push(req);
//                     }
//                 };

//                 SET01 = masterRecords.map(record => ({
//                     "ID": "",
//                     "Type": record['TYPE'],
//                     "MKTGroup": record['MKTGROUP'],
//                     "Group": record['GROUP'],
//                     "Customer": record['CustFull'],
//                     "CustShort": record['CustShort'],
//                     "Frequency": record['FRE'],
//                     "Incharge": record['Incharge'],
//                     "KPIServ": record['GROUP'] === 'KAC' ? '100' : (record['GROUP'] === 'MEDIUM' ? '95' : record['KPIServ']),
//                     "KPIPeriod": record['TYPE'] === 'A' ? '12' : (record['TYPE'] === 'B' ? '10' : record['KPIPERIOD']),
//                     "RepItems": record['REPORTITEMS'],
//                     "Month": "",
//                     "Year": "",
//                     "ReqNo1": "",
//                     "Freq1": "",
//                     "Evaluation1": "",
//                     "PlanSam1": "",
//                     "ActSam1": "",
//                     "RepDue1": "",
//                     "SentRep1": "",
//                     "RepDays1": "",
//                     "Request1": "",
//                     "TTCResult1": "",
//                     "IssueDate1": "",
//                     "Sublead1": "",
//                     "GL1": "",
//                     "MGR1": "",
//                     "JP1": "",
//                     "Revise1_1": "",
//                     "Sublead1_1": "",
//                     "GL1_1": "",
//                     "MGR1_1": "",
//                     "JP1_1": "",
//                     "Revise1_2": "",
//                     "Sublead1_2": "",
//                     "GL1_2": "",
//                     "MGR1_2": "",
//                     "JP1_2": "",
//                     "Revise1_3": "",
//                     "Sublead1_3": "",
//                     "GL1_3": "",
//                     "MGR1_3": "",
//                     "JP1_3": "",
//                     "BDPrepare1": "",
//                     "BDTTC1": "",
//                     "BDIssue1": "",
//                     "BDSublead1": "",
//                     "BDGL1": "",
//                     "BDMGR1": "",
//                     "BDJP1": "",
//                     "BDRevise1_1": "",
//                     "BDSublead1_1": "",
//                     "BDGL1_1": "",
//                     "BDMGR1_1": "",
//                     "BDJP1_1": "",
//                     "BDRevise1_2": "",
//                     "BDSublead1_2": "",
//                     "BDGL1_2": "",
//                     "BDMGR1_2": "",
//                     "BDJP1_2": "",
//                     "BDRevise1_3": "",
//                     "BDSublead1_3": "",
//                     "BDGL1_3": "",
//                     "BDMGR1_3": "",
//                     "BDJP1_3": "",
//                     "BDSent1": "",
//                     "Stage1": "",
//                     "Reason1": "",
//                     "ReqNo2": "",
//                     "Freq2": "",
//                     "Evaluation2": "",
//                     "PlanSam2": "",
//                     "ActSam2": "",
//                     "RepDue2": "",
//                     "SentRep2": "",
//                     "RepDays2": "",
//                     "Request2": "",
//                     "TTCResult2": "",
//                     "IssueDate2": "",
//                     "Sublead2": "",
//                     "GL2": "",
//                     "MGR2": "",
//                     "JP2": "",
//                     "Revise2_1": "",
//                     "Sublead2_1": "",
//                     "GL2_1": "",
//                     "MGR2_1": "",
//                     "JP2_1": "",
//                     "Revise2_2": "",
//                     "Sublead2_2": "",
//                     "GL2_2": "",
//                     "MGR2_2": "",
//                     "JP2_2": "",
//                     "Revise2_3": "",
//                     "Sublead2_3": "",
//                     "GL2_3": "",
//                     "MGR2_3": "",
//                     "JP2_3": "",
//                     "BDPrepare2": "",
//                     "BDTTC2": "",
//                     "BDIssue2": "",
//                     "BDSublead2": "",
//                     "BDGL2": "",
//                     "BDMGR2": "",
//                     "BDJP2": "",
//                     "BDRevise2_1": "",
//                     "BDSublead2_1": "",
//                     "BDGL2_1": "",
//                     "BDMGR2_1": "",
//                     "BDJP2_1": "",
//                     "BDRevise2_2": "",
//                     "BDSublead2_2": "",
//                     "BDGL2_2": "",
//                     "BDMGR2_2": "",
//                     "BDJP2_2": "",
//                     "BDRevise2_3": "",
//                     "BDSublead2_3": "",
//                     "BDGL2_3": "",
//                     "BDMGR2_3": "",
//                     "BDJP2_3": "",
//                     "BDSent2": "",
//                     "Stage2": "",
//                     "Reason2": "",
//                     "ReqNo3": "",
//                     "Freq3": "",
//                     "Evaluation3": "",
//                     "PlanSam3": "",
//                     "ActSam3": "",
//                     "RepDue3": "",
//                     "SentRep3": "",
//                     "RepDays3": "",
//                     "Request3": "",
//                     "TTCResult3": "",
//                     "IssueDate3": "",
//                     "Sublead3": "",
//                     "GL3": "",
//                     "MGR3": "",
//                     "JP3": "",
//                     "Revise3_1": "",
//                     "Sublead3_1": "",
//                     "GL3_1": "",
//                     "MGR3_1": "",
//                     "JP3_1": "",
//                     "Revise3_2": "",
//                     "Sublead3_2": "",
//                     "GL3_2": "",
//                     "MGR3_2": "",
//                     "JP3_2": "",
//                     "Revise3_3": "",
//                     "Sublead3_3": "",
//                     "GL3_3": "",
//                     "MGR3_3": "",
//                     "JP3_3": "",
//                     "BDPrepare3": "",
//                     "BDTTC3": "",
//                     "BDIssue3": "",
//                     "BDSublead3": "",
//                     "BDGL3": "",
//                     "BDMGR3": "",
//                     "BDJP3": "",
//                     "BDRevise3_1": "",
//                     "BDSublead3_1": "",
//                     "BDGL3_1": "",
//                     "BDMGR3_1": "",
//                     "BDJP3_1": "",
//                     "BDRevise3_2": "",
//                     "BDSublead3_2": "",
//                     "BDGL3_2": "",
//                     "BDMGR3_2": "",
//                     "BDJP3_2": "",
//                     "BDRevise3_3": "",
//                     "BDSublead3_3": "",
//                     "BDGL3_3": "",
//                     "BDMGR3_3": "",
//                     "BDJP3_3": "",
//                     "BDSent3": "",
//                     "Stage3": "",
//                     "Reason3": "",
//                     "ReqNo4": "",
//                     "Freq4": "",
//                     "Evaluation4": "",
//                     "PlanSam4": "",
//                     "ActSam4": "",
//                     "RepDue4": "",
//                     "SentRep4": "",
//                     "RepDays4": "",
//                     "Request4": "",
//                     "TTCResult4": "",
//                     "IssueDate4": "",
//                     "Sublead4": "",
//                     "GL4": "",
//                     "MGR4": "",
//                     "JP4": "",
//                     "Revise4_1": "",
//                     "Sublead4_1": "",
//                     "GL4_1": "",
//                     "MGR4_1": "",
//                     "JP4_1": "",
//                     "Revise4_2": "",
//                     "Sublead4_2": "",
//                     "GL4_2": "",
//                     "MGR4_2": "",
//                     "JP4_2": "",
//                     "Revise4_3": "",
//                     "Sublead4_3": "",
//                     "GL4_3": "",
//                     "MGR4_3": "",
//                     "JP4_3": "",
//                     "BDPrepare4": "",
//                     "BDTTC4": "",
//                     "BDIssue4": "",
//                     "BDSublead4": "",
//                     "BDGL4": "",
//                     "BDMGR4": "",
//                     "BDJP4": "",
//                     "BDRevise4_1": "",
//                     "BDSublead4_1": "",
//                     "BDGL4_1": "",
//                     "BDMGR4_1": "",
//                     "BDJP4_1": "",
//                     "BDRevise4_2": "",
//                     "BDSublead4_2": "",
//                     "BDGL4_2": "",
//                     "BDMGR4_2": "",
//                     "BDJP4_2": "",
//                     "BDRevise4_3": "",
//                     "BDSublead4_3": "",
//                     "BDGL4_3": "",
//                     "BDMGR4_3": "",
//                     "BDJP4_3": "",
//                     "BDSent4": "",
//                     "Stage4": "",
//                     "Reason4": ""
//                 }));

//                 console.log('Month ' + (p + 1) + " AllCustomer: " + SET01.length)
//                 console.log("On process...");

//                 let lastcustshort = "";
//                 let lastreqno = "";

//                 for (let i = 0; i < SET01.length; i++) {
//                     const entry = SET01[i];
//                     const custShort = entry.CustShort;
//                     const matchingRequests = requestRecordsMap[custShort] || [];
//                     let lastWeek = 0;

//                     for (let j = 0; j < matchingRequests.length; j++) {
//                         const req = matchingRequests[j];
//                         const samplingDate = new Date(req.SamplingDate);
//                         // console.log('samplingDate: ' + samplingDate);
//                         const dayOfMonth = samplingDate.getDate();
//                         const monthString = samplingDate.toLocaleString('en-US', { month: '2-digit' });
//                         const yearString = samplingDate.getFullYear().toString();
//                         const kpiPeriod = entry.KPIPeriod;
//                         const sentRepDate = new Date(req.SentRep);
//                         const RepDue = await calculateRepDue(samplingDate, kpiPeriod);
//                         const RepDays = await calculateBusinessDays(samplingDate, sentRepDate);
//                         const reqNo = req.ReqNo;
//                         const custshort = req.CustShort;

//                         const maxSendDate = matchingRequests
//                             .filter(record => record['ReqNo'] === reqNo)
//                             .reduce((maxDate, record) => {
//                                 const currentSendDate = new Date(record['SendDate']);
//                                 return currentSendDate > maxDate ? currentSendDate : maxDate;
//                             }, new Date(req.SendDate));

//                         const maxResultApproveDate = matchingRequests
//                             .filter(record => record['ReqNo'] === reqNo)
//                             .reduce((maxDate, record) => {
//                                 const currentResultApproveDate = new Date(record['ResultApproveDate']);
//                                 return currentResultApproveDate > maxDate ? currentResultApproveDate : maxDate;
//                             }, new Date(req.ResultApproveDate));

//                         // const queryIssueDate = `
//                         //     SELECT * FROM [SAR].[dbo].[Routine_KACReport] 
//                         //     WHERE ReqNo = '${reqNo}';
//                         // `;

//                         // const dbIssueDate = await mssql.qurey(queryIssueDate);

//                         // const issueData = dbIssueDate &&
//                         //     dbIssueDate.recordsets &&
//                         //     dbIssueDate.recordsets.length > 0 &&
//                         //     dbIssueDate.recordsets[0].length > 0
//                         //     ? dbIssueDate.recordsets[0][0]
//                         //     : {};
//                         const filteredResults = routineKACData.filter(row => row.ReqNo === reqNo);
//                         const issueData = filteredResults.length > 0 ? filteredResults[0] : {};
//                         //     const queryIssueDate = `
//                         // SELECT * FROM [SAR].[dbo].[Routine_KACReport] 
//                         // WHERE ReqNo = '${reqNo}';
//                         // `;
//                         //     const dbIssueDate = await mssql.qurey(queryIssueDate);

//                         //     const issueData = dbIssueDate["recordsets"].length > 0 && dbIssueDate["recordsets"][0].length > 0
//                         //         ? dbIssueDate["recordsets"][0][0]
//                         //         : {};

//                         const issueDate = issueData['CreateReportDate'] ? new Date(issueData['CreateReportDate']) : null;
//                         const Sublead = issueData['SubLeaderTime_0'] ? new Date(issueData['SubLeaderTime_0']) : null;
//                         const GL = issueData['GLTime_0'] ? new Date(issueData['GLTime_0']) : null;
//                         const MGR = issueData['DGMTime_0'] ? new Date(issueData['DGMTime_0']) : null;
//                         const JP = issueData['JPTime_0'] ? new Date(issueData['JPTime_0']) : null;
//                         const Revise1 = issueData['InchargeTime_1'] ? new Date(issueData['InchargeTime_1']) : null;
//                         const Sublead1 = issueData['SubLeaderTime_1'] ? new Date(issueData['SubLeaderTime_1']) : null;
//                         const GL1 = issueData['GLTime_1'] ? new Date(issueData['GLTime_1']) : null;
//                         const MGR1 = issueData['DGMTime_1'] ? new Date(issueData['DGMTime_1']) : null;
//                         const JP1 = issueData['JPTime_1'] ? new Date(issueData['JPTime_1']) : null;
//                         const Revise2 = issueData['InchargeTime_2'] ? new Date(issueData['InchargeTime_2']) : null;
//                         const Sublead2 = issueData['SubLeaderTime_2'] ? new Date(issueData['SubLeaderTime_2']) : null;
//                         const GL2 = issueData['GLTime_2'] ? new Date(issueData['GLTime_2']) : null;
//                         const MGR2 = issueData['DGMTime_2'] ? new Date(issueData['DGMTime_2']) : null;
//                         const JP2 = issueData['JPTime_2'] ? new Date(issueData['JPTime_2']) : null;
//                         const Revise3 = issueData['InchargeTime_3'] ? new Date(issueData['InchargeTime_3']) : null;
//                         const Sublead3 = issueData['SubLeaderTime_3'] ? new Date(issueData['SubLeaderTime_3']) : null;
//                         const GL3 = issueData['GLTime_3'] ? new Date(issueData['GLTime_3']) : null;
//                         const MGR3 = issueData['DGMTime_3'] ? new Date(issueData['DGMTime_3']) : null;
//                         const JP3 = issueData['JPTime_3'] ? new Date(issueData['JPTime_3']) : null;
//                         const BDPrepare = await calculateBusinessDays(samplingDate, maxSendDate);
//                         const BDTTC = await calculateBusinessDays(maxSendDate, maxResultApproveDate);
//                         const BDIssue = await calculateBusinessDays(maxResultApproveDate, issueDate);
//                         const isValidDate = (date) => date && date.getTime() !== 0;
//                         const BDSublead = await calculateBusinessDays(issueDate, Sublead);
//                         const BDGL = isValidDate(Sublead) && isValidDate(GL) ? await calculateBusinessDays(Sublead, GL)
//                             : (isValidDate(issueDate) && isValidDate(GL) ? await calculateBusinessDays(issueDate, GL) : null);
//                         const BDMGR = isValidDate(GL) && isValidDate(MGR) ? await calculateBusinessDays(GL, MGR)
//                             : (isValidDate(Sublead) && isValidDate(MGR) ? await calculateBusinessDays(Sublead, MGR)
//                                 : (isValidDate(issueDate) && isValidDate(MGR) ? await calculateBusinessDays(issueDate, MGR) : null));
//                         const BDJP = isValidDate(MGR) && isValidDate(JP) ? await calculateBusinessDays(MGR, JP)
//                             : (isValidDate(GL) && isValidDate(JP) ? await calculateBusinessDays(GL, JP)
//                                 : (isValidDate(Sublead) && isValidDate(JP) ? await calculateBusinessDays(Sublead, JP) : null));
//                         const CheckSignerForBDRevise1 = isValidDate(JP) ? JP
//                             : isValidDate(MGR) ? MGR
//                                 : isValidDate(GL) ? GL
//                                     : isValidDate(Sublead) ? Sublead
//                                         : null;
//                         const BDRevise1 = CheckSignerForBDRevise1 ? await calculateBusinessDays(CheckSignerForBDRevise1, Revise1) : null;
//                         const BDSublead1 = await calculateBusinessDays(Revise1, Sublead1);
//                         const BDGL1 = isValidDate(Sublead1) && isValidDate(GL1) ? await calculateBusinessDays(Sublead1, GL1)
//                             : (isValidDate(Revise1) && isValidDate(GL1) ? await calculateBusinessDays(Revise1, GL1) : null);
//                         const BDMGR1 = isValidDate(GL1) && isValidDate(MGR1) ? await calculateBusinessDays(GL1, MGR1)
//                             : (isValidDate(Sublead1) && isValidDate(MGR1) ? await calculateBusinessDays(Sublead1, MGR1)
//                                 : (isValidDate(Revise1) && isValidDate(MGR1) ? await calculateBusinessDays(Revise1, MGR1) : null));
//                         const BDJP1 = isValidDate(MGR1) && isValidDate(JP1) ? await calculateBusinessDays(MGR1, JP1)
//                             : (isValidDate(GL1) && isValidDate(JP1) ? await calculateBusinessDays(GL1, JP1)
//                                 : (isValidDate(Sublead1) && isValidDate(JP1) ? await calculateBusinessDays(Sublead1, JP1) : null));
//                         const CheckSignerForBDRevise2 = isValidDate(JP1) ? JP1
//                             : isValidDate(MGR1) ? MGR1
//                                 : isValidDate(GL1) ? GL1
//                                     : isValidDate(Sublead1) ? Sublead1
//                                         : null;
//                         const BDRevise2 = CheckSignerForBDRevise2 ? await calculateBusinessDays(CheckSignerForBDRevise2, Revise2) : null;
//                         const BDSublead2 = await calculateBusinessDays(Revise2, Sublead2);
//                         const BDGL2 = isValidDate(Sublead2) && isValidDate(GL2) ? await calculateBusinessDays(Sublead2, GL2)
//                             : (isValidDate(Revise2) && isValidDate(GL2) ? await calculateBusinessDays(Revise2, GL2) : null);
//                         const BDMGR2 = isValidDate(GL2) && isValidDate(MGR2) ? await calculateBusinessDays(GL2, MGR2)
//                             : (isValidDate(Sublead2) && isValidDate(MGR2) ? await calculateBusinessDays(Sublead2, MGR2)
//                                 : (isValidDate(Revise2) && isValidDate(MGR2) ? await calculateBusinessDays(Revise2, MGR2) : null));
//                         const BDJP2 = isValidDate(MGR2) && isValidDate(JP2) ? await calculateBusinessDays(MGR2, JP2)
//                             : (isValidDate(GL2) && isValidDate(JP2) ? await calculateBusinessDays(GL2, JP2)
//                                 : (isValidDate(Sublead2) && isValidDate(JP2) ? await calculateBusinessDays(Sublead2, JP2) : null));
//                         const CheckSignerForBDRevise3 = isValidDate(JP2) ? JP2
//                             : isValidDate(MGR2) ? MGR2
//                                 : isValidDate(GL2) ? GL2
//                                     : isValidDate(Sublead2) ? Sublead2
//                                         : null;
//                         const BDRevise3 = CheckSignerForBDRevise3 ? await calculateBusinessDays(CheckSignerForBDRevise3, Revise3) : null;
//                         const BDSublead3 = await calculateBusinessDays(Revise3, Sublead3);
//                         const BDGL3 = isValidDate(Sublead3) && isValidDate(GL3) ? await calculateBusinessDays(Sublead3, GL3)
//                             : (isValidDate(Revise3) && isValidDate(GL3) ? await calculateBusinessDays(Revise3, GL3) : null);
//                         const BDMGR3 = isValidDate(GL3) && isValidDate(MGR3) ? await calculateBusinessDays(GL3, MGR3)
//                             : (isValidDate(Sublead3) && isValidDate(MGR3) ? await calculateBusinessDays(Sublead3, MGR3)
//                                 : (isValidDate(Revise3) && isValidDate(MGR3) ? await calculateBusinessDays(Revise3, MGR3) : null));
//                         const BDJP3 = isValidDate(MGR3) && isValidDate(JP3) ? await calculateBusinessDays(MGR3, JP3)
//                             : (isValidDate(GL3) && isValidDate(JP3) ? await calculateBusinessDays(GL3, JP3)
//                                 : (isValidDate(Sublead3) && isValidDate(JP3) ? await calculateBusinessDays(Sublead3, JP3) : null));
//                         const CheckSignerForBDSent = isValidDate(JP3) ? JP3
//                             : isValidDate(MGR3) ? MGR3
//                                 : isValidDate(GL3) ? GL3
//                                     : isValidDate(Sublead3) ? Sublead3
//                                         : isValidDate(JP2) ? JP2
//                                             : isValidDate(MGR2) ? MGR2
//                                                 : isValidDate(GL2) ? GL2
//                                                     : isValidDate(Sublead2) ? Sublead2
//                                                         : isValidDate(JP1) ? JP1
//                                                             : isValidDate(MGR1) ? MGR1
//                                                                 : isValidDate(GL1) ? GL1
//                                                                     : isValidDate(Sublead1) ? Sublead1
//                                                                         : isValidDate(JP) ? JP
//                                                                             : isValidDate(MGR) ? MGR
//                                                                                 : isValidDate(GL) ? GL
//                                                                                     : isValidDate(Sublead) ? Sublead
//                                                                                         : null;

//                         const BDSent = CheckSignerForBDSent ? await calculateBusinessDays(CheckSignerForBDSent, sentRepDate) : null;
//                         const Reason = req.Reason;

//                         let week = 0;
//                         if (dayOfMonth >= 1 && dayOfMonth <= 12) {
//                             week = 1;
//                         } else if (dayOfMonth >= 13 && dayOfMonth <= 23) {
//                             week = 2;
//                         } else if (dayOfMonth >= 24 && dayOfMonth <= 31) {
//                             week = 3;
//                         }

//                         if (custshort == lastcustshort && reqNo == lastreqno) {
//                             if (week < lastWeek) {
//                                 week = lastWeek;
//                             }
//                         }
//                         if (custshort == lastcustshort && reqNo != lastreqno) {
//                             if (week < lastWeek) {
//                                 week = week + 1;
//                             }
//                         }
//                         if (custshort == lastcustshort && reqNo != lastreqno) {
//                             if (week == lastWeek) {
//                                 week = lastWeek + 1;
//                             }
//                         }

//                         switch (week) {
//                             case 1:
//                                 entry["ReqNo1"] = reqNo;
//                                 entry["Freq1"] = "1";
//                                 entry["PlanSam1"] = formatDate(samplingDate);
//                                 entry["ActSam1"] = formatDate(samplingDate);
//                                 entry["RepDue1"] = RepDue.RepDue;
//                                 entry["SentRep1"] = formatDate(sentRepDate);
//                                 entry["RepDays1"] = RepDays;
//                                 entry["Request1"] = formatDate(maxSendDate);
//                                 entry["TTCResult1"] = formatDate(maxResultApproveDate);
//                                 entry["IssueDate1"] = formatDate(issueDate);
//                                 entry["Sublead1"] = formatDate(Sublead);
//                                 entry["GL1"] = formatDate(GL);
//                                 entry["MGR1"] = formatDate(MGR);
//                                 entry["JP1"] = formatDate(JP);
//                                 entry["Revise1_1"] = formatDate(Revise1);
//                                 entry["Sublead1_1"] = formatDate(Sublead1);
//                                 entry["GL1_1"] = formatDate(GL1);
//                                 entry["MGR1_1"] = formatDate(MGR1);
//                                 entry["JP1_1"] = formatDate(JP1);
//                                 entry["Revise1_2"] = formatDate(Revise2);
//                                 entry["Sublead1_2"] = formatDate(Sublead2);
//                                 entry["GL1_2"] = formatDate(GL2);
//                                 entry["MGR1_2"] = formatDate(MGR2);
//                                 entry["JP1_2"] = formatDate(JP2);
//                                 entry["Revise1_3"] = formatDate(Revise3);
//                                 entry["Sublead1_3"] = formatDate(Sublead3);
//                                 entry["GL1_3"] = formatDate(GL3);
//                                 entry["MGR1_3"] = formatDate(MGR3);
//                                 entry["JP1_3"] = formatDate(JP3);
//                                 entry["BDPrepare1"] = BDPrepare;
//                                 entry["BDTTC1"] = BDTTC;
//                                 entry["BDIssue1"] = BDIssue;
//                                 entry["BDSublead1"] = BDSublead;
//                                 entry["BDGL1"] = BDGL;
//                                 entry["BDMGR1"] = BDMGR;
//                                 entry["BDJP1"] = BDJP;
//                                 entry["BDRevise1_1"] = BDRevise1;
//                                 entry["BDSublead1_1"] = BDSublead1;
//                                 entry["BDGL1_1"] = BDGL1;
//                                 entry["BDMGR1_1"] = BDMGR1;
//                                 entry["BDJP1_1"] = BDJP1;
//                                 entry["BDRevise1_2"] = BDRevise2;
//                                 entry["BDSublead1_2"] = BDSublead2;
//                                 entry["BDGL1_2"] = BDGL2;
//                                 entry["BDMGR1_2"] = BDMGR2;
//                                 entry["BDJP1_2"] = BDJP2;
//                                 entry["BDRevise1_3"] = BDRevise3;
//                                 entry["BDSublead1_3"] = BDSublead3;
//                                 entry["BDGL1_3"] = BDGL3;
//                                 entry["BDMGR1_3"] = BDMGR3;
//                                 entry["BDJP1_3"] = BDJP3;
//                                 entry["BDSent1"] = BDSent;
//                                 entry["Reason1"] = Reason;
//                                 break;
//                             case 2:
//                                 entry["ReqNo2"] = reqNo;
//                                 entry["Freq2"] = "1";
//                                 entry["PlanSam2"] = formatDate(samplingDate);
//                                 entry["ActSam2"] = formatDate(samplingDate);
//                                 entry["RepDue2"] = RepDue.RepDue;
//                                 entry["SentRep2"] = formatDate(sentRepDate);
//                                 entry["RepDays2"] = RepDays;
//                                 entry["Request2"] = formatDate(maxSendDate);
//                                 entry["TTCResult2"] = formatDate(maxResultApproveDate);
//                                 entry["IssueDate2"] = formatDate(issueDate);
//                                 entry["Sublead2"] = formatDate(Sublead);
//                                 entry["GL2"] = formatDate(GL);
//                                 entry["MGR2"] = formatDate(MGR);
//                                 entry["JP2"] = formatDate(JP);
//                                 entry["Revise2_1"] = formatDate(Revise1);
//                                 entry["Sublead2_1"] = formatDate(Sublead1);
//                                 entry["GL2_1"] = formatDate(GL1);
//                                 entry["MGR2_1"] = formatDate(MGR1);
//                                 entry["JP2_1"] = formatDate(JP1);
//                                 entry["Revise2_2"] = formatDate(Revise2);
//                                 entry["Sublead2_2"] = formatDate(Sublead2);
//                                 entry["GL2_2"] = formatDate(GL2);
//                                 entry["MGR2_2"] = formatDate(MGR2);
//                                 entry["JP2_2"] = formatDate(JP2);
//                                 entry["Revise2_3"] = formatDate(Revise3);
//                                 entry["Sublead2_3"] = formatDate(Sublead3);
//                                 entry["GL2_3"] = formatDate(GL3);
//                                 entry["MGR2_3"] = formatDate(MGR3);
//                                 entry["JP2_3"] = formatDate(JP3);
//                                 entry["BDPrepare2"] = BDPrepare;
//                                 entry["BDTTC2"] = BDTTC;
//                                 entry["BDIssue2"] = BDIssue;
//                                 entry["BDSublead2"] = BDSublead;
//                                 entry["BDGL2"] = BDGL;
//                                 entry["BDMGR2"] = BDMGR;
//                                 entry["BDJP2"] = BDJP;
//                                 entry["BDRevise2_1"] = BDRevise1;
//                                 entry["BDSublead2_1"] = BDSublead1;
//                                 entry["BDGL2_1"] = BDGL1;
//                                 entry["BDMGR2_1"] = BDMGR1;
//                                 entry["BDJP2_1"] = BDJP1;
//                                 entry["BDRevise2_2"] = BDRevise2;
//                                 entry["BDSublead2_2"] = BDSublead2;
//                                 entry["BDGL2_2"] = BDGL2;
//                                 entry["BDMGR2_2"] = BDMGR2;
//                                 entry["BDJP2_2"] = BDJP2;
//                                 entry["BDRevise2_3"] = BDRevise3;
//                                 entry["BDSublead2_3"] = BDSublead3;
//                                 entry["BDGL2_3"] = BDGL3;
//                                 entry["BDMGR2_3"] = BDMGR3;
//                                 entry["BDJP2_3"] = BDJP3;
//                                 entry["BDSent2"] = BDSent;
//                                 entry["Reason2"] = Reason;
//                                 break;
//                             case 3:
//                                 entry["ReqNo3"] = reqNo;
//                                 entry["Freq3"] = "1";
//                                 entry["PlanSam3"] = formatDate(samplingDate);
//                                 entry["ActSam3"] = formatDate(samplingDate);
//                                 entry["RepDue3"] = RepDue.RepDue;
//                                 entry["SentRep3"] = formatDate(sentRepDate);
//                                 entry["RepDays3"] = RepDays;
//                                 entry["Request3"] = formatDate(maxSendDate);
//                                 entry["TTCResult3"] = formatDate(maxResultApproveDate);
//                                 entry["IssueDate3"] = formatDate(issueDate);
//                                 entry["Sublead3"] = formatDate(Sublead);
//                                 entry["GL3"] = formatDate(GL);
//                                 entry["MGR3"] = formatDate(MGR);
//                                 entry["JP3"] = formatDate(JP);
//                                 entry["Revise3_1"] = formatDate(Revise1);
//                                 entry["Sublead3_1"] = formatDate(Sublead1);
//                                 entry["GL3_1"] = formatDate(GL1);
//                                 entry["MGR3_1"] = formatDate(MGR1);
//                                 entry["JP3_1"] = formatDate(JP1);
//                                 entry["Revise3_2"] = formatDate(Revise2);
//                                 entry["Sublead3_2"] = formatDate(Sublead2);
//                                 entry["GL3_2"] = formatDate(GL2);
//                                 entry["MGR3_2"] = formatDate(MGR2);
//                                 entry["JP3_2"] = formatDate(JP2);
//                                 entry["Revise3_3"] = formatDate(Revise3);
//                                 entry["Sublead3_3"] = formatDate(Sublead3);
//                                 entry["GL3_3"] = formatDate(GL3);
//                                 entry["MGR3_3"] = formatDate(MGR3);
//                                 entry["JP3_3"] = formatDate(JP3);
//                                 entry["BDPrepare3"] = BDPrepare;
//                                 entry["BDTTC3"] = BDTTC;
//                                 entry["BDIssue3"] = BDIssue;
//                                 entry["BDSublead3"] = BDSublead;
//                                 entry["BDGL3"] = BDGL;
//                                 entry["BDMGR3"] = BDMGR;
//                                 entry["BDJP3"] = BDJP;
//                                 entry["BDRevise3_1"] = BDRevise1;
//                                 entry["BDSublead3_1"] = BDSublead1;
//                                 entry["BDGL3_1"] = BDGL1;
//                                 entry["BDMGR3_1"] = BDMGR1;
//                                 entry["BDJP3_1"] = BDJP1;
//                                 entry["BDRevise3_2"] = BDRevise2;
//                                 entry["BDSublead3_2"] = BDSublead2;
//                                 entry["BDGL3_2"] = BDGL2;
//                                 entry["BDMGR3_2"] = BDMGR2;
//                                 entry["BDJP3_2"] = BDJP2;
//                                 entry["BDRevise3_3"] = BDRevise3;
//                                 entry["BDSublead3_3"] = BDSublead3;
//                                 entry["BDGL3_3"] = BDGL3;
//                                 entry["BDMGR3_3"] = BDMGR3;
//                                 entry["BDJP3_3"] = BDJP3;
//                                 entry["BDSent3"] = BDSent;
//                                 entry["Reason3"] = Reason;
//                                 break;
//                             case 4:
//                                 entry["ReqNo4"] = reqNo;
//                                 entry["Freq4"] = "1";
//                                 entry["PlanSam4"] = formatDate(samplingDate);
//                                 entry["ActSam4"] = formatDate(samplingDate);
//                                 entry["RepDue4"] = RepDue.RepDue;
//                                 entry["SentRep4"] = formatDate(sentRepDate);
//                                 entry["RepDays4"] = RepDays;
//                                 entry["Request4"] = formatDate(maxSendDate);
//                                 entry["TTCResult4"] = formatDate(maxResultApproveDate);
//                                 entry["IssueDate4"] = formatDate(issueDate);
//                                 entry["Sublead4"] = formatDate(Sublead);
//                                 entry["GL4"] = formatDate(GL);
//                                 entry["MGR4"] = formatDate(MGR);
//                                 entry["JP4"] = formatDate(JP);
//                                 entry["Revise4_1"] = formatDate(Revise1);
//                                 entry["Sublead4_1"] = formatDate(Sublead1);
//                                 entry["GL4_1"] = formatDate(GL1);
//                                 entry["MGR4_1"] = formatDate(MGR1);
//                                 entry["JP4_1"] = formatDate(JP1);
//                                 entry["Revise4_2"] = formatDate(Revise2);
//                                 entry["Sublead4_2"] = formatDate(Sublead2);
//                                 entry["GL4_2"] = formatDate(GL2);
//                                 entry["MGR4_2"] = formatDate(MGR2);
//                                 entry["JP4_2"] = formatDate(JP2);
//                                 entry["Revise4_3"] = formatDate(Revise3);
//                                 entry["Sublead4_3"] = formatDate(Sublead3);
//                                 entry["GL4_3"] = formatDate(GL3);
//                                 entry["MGR4_3"] = formatDate(MGR3);
//                                 entry["JP4_3"] = formatDate(JP3);
//                                 entry["BDPrepare4"] = BDPrepare;
//                                 entry["BDTTC4"] = BDTTC;
//                                 entry["BDIssue4"] = BDIssue;
//                                 entry["BDSublead4"] = BDSublead;
//                                 entry["BDGL4"] = BDGL;
//                                 entry["BDMGR4"] = BDMGR;
//                                 entry["BDJP4"] = BDJP;
//                                 entry["BDRevise4_1"] = BDRevise1;
//                                 entry["BDSublead4_1"] = BDSublead1;
//                                 entry["BDGL4_1"] = BDGL1;
//                                 entry["BDMGR4_1"] = BDMGR1;
//                                 entry["BDJP4_1"] = BDJP1;
//                                 entry["BDRevise4_2"] = BDRevise2;
//                                 entry["BDSublead4_2"] = BDSublead2;
//                                 entry["BDGL4_2"] = BDGL2;
//                                 entry["BDMGR4_2"] = BDMGR2;
//                                 entry["BDJP4_2"] = BDJP2;
//                                 entry["BDRevise4_3"] = BDRevise3;
//                                 entry["BDSublead4_3"] = BDSublead3;
//                                 entry["BDGL4_3"] = BDGL3;
//                                 entry["BDMGR4_3"] = BDMGR3;
//                                 entry["BDJP4_3"] = BDJP3;
//                                 entry["BDSent4"] = BDSent;
//                                 entry["Reason4"] = Reason;
//                                 break;
//                         }
//                         entry["Month"] = monthString;
//                         entry["Year"] = yearString;
//                         if (entry["Month"] == null || entry["Month"] == "") {
//                             entry["Month"] = Round;
//                         } else {

//                         }
//                         if (entry["Year"] == null || entry["Year"] == "") {
//                             entry["Year"] = year;
//                         } else {

//                         }
//                         lastWeek = week;
//                         lastcustshort = custshort;
//                         lastreqno = reqNo;
//                     }
//                 }
//                 try {
//                     for (let i = 0; i < SET01.length; i++) {
//                         if (SET01[i].Month != '' && SET01[i].Year != '' && SET01[i].Month != null && SET01[i].Year != null) {
//                             const queryCheck = `SELECT COUNT(*) AS count FROM [SARKPI].[dbo].[KPI_Overdue] 
//                             WHERE [CustShort] = '${SET01[i].CustShort}' 
//                             AND [Month] = '${SET01[i].Month}' 
//                             AND [Year] = '${SET01[i].Year}'`;
//                             const result = await mssql.qurey(queryCheck);
//                             // console.log('result:' + result.recordset[0].count + ' ' + SET01[i].CustShort);
//                             // console.log(SET01[i].CustShort + ' ' + queryCheck);
//                             if (result.recordset[0].count > 0) {
//                                 const queryUpdate = `UPDATE [SARKPI].[dbo].[KPI_Overdue]
//                                  SET [Type] = '${SET01[i].Type}', 
//                                     [MKTGroup] = '${SET01[i].MKTGroup}', 
//                                     [Group] = '${SET01[i].Group}', 
//                                     [Customer] = '${SET01[i].Customer}', 
//                                     [CustShort] = '${SET01[i].CustShort}', 
//                                     [Frequency] = '${SET01[i].Frequency}', 
//                                     [Incharge] = '${SET01[i].Incharge}', 
//                                     [KPIServ] = '${SET01[i].KPIServ}', 
//                                     [KPIPeriod] = '${SET01[i].KPIPeriod}', 
//                                     [RepItems] = '${SET01[i].RepItems}', 
//                                     [Month] = '${SET01[i].Month}', 
//                                     [Year] = '${SET01[i].Year}', 
//                                     [ReqNo1] = '${SET01[i].ReqNo1}', 
//                                     [Freq1] = '${SET01[i].Freq1}', 
//                                     [Evaluation1] = '${SET01[i].Evaluation1}', 
//                                     [PlanSam1] = '${SET01[i].PlanSam1}', 
//                                     [ActSam1] = '${SET01[i].ActSam1}', 
//                                     [RepDue1] = '${SET01[i].RepDue1}', 
//                                     [SentRep1] = '${SET01[i].SentRep1}', 
//                                     [RepDays1] = '${SET01[i].RepDays1}', 
//                                     [Request1] = '${SET01[i].Request1}', 
//                                     [TTCResult1] = '${SET01[i].TTCResult1}', 
//                                     [IssueDate1] = '${SET01[i].IssueDate1}', 
//                                     [Sublead1] = '${SET01[i].Sublead1}', 
//                                     [GL1] = '${SET01[i].GL1}', 
//                                     [MGR1] = '${SET01[i].MGR1}', 
//                                     [JP1] = '${SET01[i].JP1}', 
//                                     [Revise1_1] = '${SET01[i].Revise1_1}', 
//                                     [Sublead1_1] = '${SET01[i].Sublead1_1}', 
//                                     [GL1_1] = '${SET01[i].GL1_1}', 
//                                     [MGR1_1] = '${SET01[i].MGR1_1}', 
//                                     [JP1_1] = '${SET01[i].JP1_1}', 
//                                     [Revise1_2] = '${SET01[i].Revise1_2}', 
//                                     [Sublead1_2] = '${SET01[i].Sublead1_2}', 
//                                     [GL1_2] = '${SET01[i].GL1_2}', 
//                                     [MGR1_2] = '${SET01[i].MGR1_2}', 
//                                     [JP1_2] = '${SET01[i].JP1_2}', 
//                                     [Revise1_3] = '${SET01[i].Revise1_3}', 
//                                     [Sublead1_3] = '${SET01[i].Sublead1_3}', 
//                                     [GL1_3] = '${SET01[i].GL1_3}', 
//                                     [MGR1_3] = '${SET01[i].MGR1_3}', 
//                                     [JP1_3] = '${SET01[i].JP1_3}', 
//                                     [BDPrepare1] = '${SET01[i].BDPrepare1}', 
//                                     [BDTTC1] = '${SET01[i].BDTTC1}', 
//                                     [BDIssue1] = '${SET01[i].BDIssue1}', 
//                                     [BDSublead1] = '${SET01[i].BDSublead1}', 
//                                     [BDGL1] = '${SET01[i].BDGL1}', 
//                                     [BDMGR1] = '${SET01[i].BDMGR1}', 
//                                     [BDJP1] = '${SET01[i].BDJP1}', 
//                                     [BDRevise1_1] = '${SET01[i].BDRevise1_1}', 
//                                     [BDSublead1_1] = '${SET01[i].BDSublead1_1}', 
//                                     [BDGL1_1] = '${SET01[i].BDGL1_1}', 
//                                     [BDMGR1_1] = '${SET01[i].BDMGR1_1}', 
//                                     [BDJP1_1] = '${SET01[i].BDJP1_1}', 
//                                     [BDRevise1_2] = '${SET01[i].BDRevise1_2}', 
//                                     [BDSublead1_2] = '${SET01[i].BDSublead1_2}', 
//                                     [BDGL1_2] = '${SET01[i].BDGL1_2}', 
//                                     [BDMGR1_2] = '${SET01[i].BDMGR1_2}', 
//                                     [BDJP1_2] = '${SET01[i].BDJP1_2}', 
//                                     [BDRevise1_3] = '${SET01[i].BDRevise1_3}', 
//                                     [BDSublead1_3] = '${SET01[i].BDSublead1_3}', 
//                                     [BDGL1_3] = '${SET01[i].BDGL1_3}', 
//                                     [BDMGR1_3] = '${SET01[i].BDMGR1_3}', 
//                                     [BDJP1_3] = '${SET01[i].BDJP1_3}', 
//                                     [BDSent1] = '${SET01[i].BDSent1}',
//                                     [ReqNo2] = '${SET01[i].ReqNo2}', 
//                                     [Freq2] = '${SET01[i].Freq2}', 
//                                     [Evaluation2] = '${SET01[i].Evaluation2}', 
//                                     [PlanSam2] = '${SET01[i].PlanSam2}', 
//                                     [ActSam2] = '${SET01[i].ActSam2}', 
//                                     [RepDue2] = '${SET01[i].RepDue2}', 
//                                     [SentRep2] = '${SET01[i].SentRep2}', 
//                                     [RepDays2] = '${SET01[i].RepDays2}', 
//                                     [Request2] = '${SET01[i].Request2}', 
//                                     [TTCResult2] = '${SET01[i].TTCResult2}', 
//                                     [IssueDate2] = '${SET01[i].IssueDate2}', 
//                                     [Sublead2] = '${SET01[i].Sublead2}', 
//                                     [GL2] = '${SET01[i].GL2}', 
//                                     [MGR2] = '${SET01[i].MGR2}', 
//                                     [JP2] = '${SET01[i].JP2}', 
//                                     [Revise2_1] = '${SET01[i].Revise2_1}', 
//                                     [Sublead2_1] = '${SET01[i].Sublead2_1}', 
//                                     [GL2_1] = '${SET01[i].GL2_1}', 
//                                     [MGR2_1] = '${SET01[i].MGR2_1}', 
//                                     [JP2_1] = '${SET01[i].JP2_1}', 
//                                     [Revise2_2] = '${SET01[i].Revise2_2}', 
//                                     [Sublead2_2] = '${SET01[i].Sublead2_2}', 
//                                     [GL2_2] = '${SET01[i].GL2_2}', 
//                                     [MGR2_2] = '${SET01[i].MGR2_2}', 
//                                     [JP2_2] = '${SET01[i].JP2_2}', 
//                                     [Revise2_3] = '${SET01[i].Revise2_3}', 
//                                     [Sublead2_3] = '${SET01[i].Sublead2_3}', 
//                                     [GL2_3] = '${SET01[i].GL2_3}', 
//                                     [MGR2_3] = '${SET01[i].MGR2_3}', 
//                                     [JP2_3] = '${SET01[i].JP2_3}', 
//                                     [BDPrepare2] = '${SET01[i].BDPrepare2}', 
//                                     [BDTTC2] = '${SET01[i].BDTTC2}', 
//                                     [BDIssue2] = '${SET01[i].BDIssue2}', 
//                                     [BDSublead2] = '${SET01[i].BDSublead2}', 
//                                     [BDGL2] = '${SET01[i].BDGL2}', 
//                                     [BDMGR2] = '${SET01[i].BDMGR2}', 
//                                     [BDJP2] = '${SET01[i].BDJP2}', 
//                                     [BDRevise2_1] = '${SET01[i].BDRevise2_1}', 
//                                     [BDSublead2_1] = '${SET01[i].BDSublead2_1}', 
//                                     [BDGL2_1] = '${SET01[i].BDGL2_1}', 
//                                     [BDMGR2_1] = '${SET01[i].BDMGR2_1}', 
//                                     [BDJP2_1] = '${SET01[i].BDJP2_1}', 
//                                     [BDRevise2_2] = '${SET01[i].BDRevise2_2}', 
//                                     [BDSublead2_2] = '${SET01[i].BDSublead2_2}', 
//                                     [BDGL2_2] = '${SET01[i].BDGL2_2}', 
//                                     [BDMGR2_2] = '${SET01[i].BDMGR2_2}', 
//                                     [BDJP2_2] = '${SET01[i].BDJP2_2}', 
//                                     [BDRevise2_3] = '${SET01[i].BDRevise2_3}', 
//                                     [BDSublead2_3] = '${SET01[i].BDSublead2_3}', 
//                                     [BDGL2_3] = '${SET01[i].BDGL2_3}', 
//                                     [BDMGR2_3] = '${SET01[i].BDMGR2_3}', 
//                                     [BDJP2_3] = '${SET01[i].BDJP2_3}', 
//                                     [BDSent2] = '${SET01[i].BDSent2}',
//                                     [ReqNo3] = '${SET01[i].ReqNo3}', 
//                                     [Freq3] = '${SET01[i].Freq3}', 
//                                     [Evaluation3] = '${SET01[i].Evaluation3}', 
//                                     [PlanSam3] = '${SET01[i].PlanSam3}', 
//                                     [ActSam3] = '${SET01[i].ActSam3}', 
//                                     [RepDue3] = '${SET01[i].RepDue3}', 
//                                     [SentRep3] = '${SET01[i].SentRep3}', 
//                                     [RepDays3] = '${SET01[i].RepDays3}', 
//                                     [Request3] = '${SET01[i].Request3}', 
//                                     [TTCResult3] = '${SET01[i].TTCResult3}', 
//                                     [IssueDate3] = '${SET01[i].IssueDate3}', 
//                                     [Sublead3] = '${SET01[i].Sublead3}', 
//                                     [GL3] = '${SET01[i].GL3}', 
//                                     [MGR3] = '${SET01[i].MGR3}', 
//                                     [JP3] = '${SET01[i].JP3}', 
//                                     [Revise3_1] = '${SET01[i].Revise3_1}', 
//                                     [Sublead3_1] = '${SET01[i].Sublead3_1}', 
//                                     [GL3_1] = '${SET01[i].GL3_1}', 
//                                     [MGR3_1] = '${SET01[i].MGR3_1}', 
//                                     [JP3_1] = '${SET01[i].JP3_1}', 
//                                     [Revise3_2] = '${SET01[i].Revise3_2}', 
//                                     [Sublead3_2] = '${SET01[i].Sublead3_2}', 
//                                     [GL3_2] = '${SET01[i].GL3_2}', 
//                                     [MGR3_2] = '${SET01[i].MGR3_2}', 
//                                     [JP3_2] = '${SET01[i].JP3_2}', 
//                                     [Revise3_3] = '${SET01[i].Revise3_3}', 
//                                     [Sublead3_3] = '${SET01[i].Sublead3_3}', 
//                                     [GL3_3] = '${SET01[i].GL3_3}', 
//                                     [MGR3_3] = '${SET01[i].MGR3_3}', 
//                                     [JP3_3] = '${SET01[i].JP3_3}', 
//                                     [BDPrepare3] = '${SET01[i].BDPrepare3}', 
//                                     [BDTTC3] = '${SET01[i].BDTTC3}', 
//                                     [BDIssue3] = '${SET01[i].BDIssue3}', 
//                                     [BDSublead3] = '${SET01[i].BDSublead3}', 
//                                     [BDGL3] = '${SET01[i].BDGL3}', 
//                                     [BDMGR3] = '${SET01[i].BDMGR3}', 
//                                     [BDJP3] = '${SET01[i].BDJP3}', 
//                                     [BDRevise3_1] = '${SET01[i].BDRevise3_1}', 
//                                     [BDSublead3_1] = '${SET01[i].BDSublead3_1}', 
//                                     [BDGL3_1] = '${SET01[i].BDGL3_1}', 
//                                     [BDMGR3_1] = '${SET01[i].BDMGR3_1}', 
//                                     [BDJP3_1] = '${SET01[i].BDJP3_1}', 
//                                     [BDRevise3_2] = '${SET01[i].BDRevise3_2}', 
//                                     [BDSublead3_2] = '${SET01[i].BDSublead3_2}', 
//                                     [BDGL3_2] = '${SET01[i].BDGL3_2}', 
//                                     [BDMGR3_2] = '${SET01[i].BDMGR3_2}', 
//                                     [BDJP3_2] = '${SET01[i].BDJP3_2}', 
//                                     [BDRevise3_3] = '${SET01[i].BDRevise3_3}', 
//                                     [BDSublead3_3] = '${SET01[i].BDSublead3_3}', 
//                                     [BDGL3_3] = '${SET01[i].BDGL3_3}', 
//                                     [BDMGR3_3] = '${SET01[i].BDMGR3_3}', 
//                                     [BDJP3_3] = '${SET01[i].BDJP3_3}', 
//                                     [BDSent3] = '${SET01[i].BDSent3}',
//                                     [ReqNo4] = '${SET01[i].ReqNo4}', 
//                                     [Freq4] = '${SET01[i].Freq4}', 
//                                     [Evaluation4] = '${SET01[i].Evaluation4}', 
//                                     [PlanSam4] = '${SET01[i].PlanSam4}', 
//                                     [ActSam4] = '${SET01[i].ActSam4}', 
//                                     [RepDue4] = '${SET01[i].RepDue4}', 
//                                     [SentRep4] = '${SET01[i].SentRep4}', 
//                                     [RepDays4] = '${SET01[i].RepDays4}', 
//                                     [Request4] = '${SET01[i].Request4}', 
//                                     [TTCResult4] = '${SET01[i].TTCResult4}', 
//                                     [IssueDate4] = '${SET01[i].IssueDate4}', 
//                                     [Sublead4] = '${SET01[i].Sublead4}', 
//                                     [GL4] = '${SET01[i].GL4}', 
//                                     [MGR4] = '${SET01[i].MGR4}', 
//                                     [JP4] = '${SET01[i].JP4}', 
//                                     [Revise4_1] = '${SET01[i].Revise4_1}', 
//                                     [Sublead4_1] = '${SET01[i].Sublead4_1}', 
//                                     [GL4_1] = '${SET01[i].GL4_1}', 
//                                     [MGR4_1] = '${SET01[i].MGR4_1}', 
//                                     [JP4_1] = '${SET01[i].JP4_1}', 
//                                     [Revise4_2] = '${SET01[i].Revise4_2}', 
//                                     [Sublead4_2] = '${SET01[i].Sublead4_2}', 
//                                     [GL4_2] = '${SET01[i].GL4_2}', 
//                                     [MGR4_2] = '${SET01[i].MGR4_2}', 
//                                     [JP4_2] = '${SET01[i].JP4_2}', 
//                                     [Revise4_3] = '${SET01[i].Revise4_3}', 
//                                     [Sublead4_3] = '${SET01[i].Sublead4_3}', 
//                                     [GL4_3] = '${SET01[i].GL4_3}', 
//                                     [MGR4_3] = '${SET01[i].MGR4_3}', 
//                                     [JP4_3] = '${SET01[i].JP4_3}', 
//                                     [BDPrepare4] = '${SET01[i].BDPrepare4}', 
//                                     [BDTTC4] = '${SET01[i].BDTTC4}', 
//                                     [BDIssue4] = '${SET01[i].BDIssue4}', 
//                                     [BDSublead4] = '${SET01[i].BDSublead4}', 
//                                     [BDGL4] = '${SET01[i].BDGL4}', 
//                                     [BDMGR4] = '${SET01[i].BDMGR4}', 
//                                     [BDJP4] = '${SET01[i].BDJP4}', 
//                                     [BDRevise4_1] = '${SET01[i].BDRevise4_1}', 
//                                     [BDSublead4_1] = '${SET01[i].BDSublead4_1}', 
//                                     [BDGL4_1] = '${SET01[i].BDGL4_1}', 
//                                     [BDMGR4_1] = '${SET01[i].BDMGR4_1}', 
//                                     [BDJP4_1] = '${SET01[i].BDJP4_1}', 
//                                     [BDRevise4_2] = '${SET01[i].BDRevise4_2}', 
//                                     [BDSublead4_2] = '${SET01[i].BDSublead4_2}', 
//                                     [BDGL4_2] = '${SET01[i].BDGL4_2}', 
//                                     [BDMGR4_2] = '${SET01[i].BDMGR4_2}', 
//                                     [BDJP4_2] = '${SET01[i].BDJP4_2}', 
//                                     [BDRevise4_3] = '${SET01[i].BDRevise4_3}', 
//                                     [BDSublead4_3] = '${SET01[i].BDSublead4_3}', 
//                                     [BDGL4_3] = '${SET01[i].GL4_3}', 
//                                     [BDMGR4_3] = '${SET01[i].BDMGR4_3}', 
//                                     [BDJP4_3] = '${SET01[i].BDJP4_3}', 
//                                     [BDSent4] = '${SET01[i].BDSent4}'
//                                     WHERE [CustShort] = '${SET01[i].CustShort}' 
//                                     AND [Month] = '${SET01[i].Month}' 
//                                     AND [Year] = '${SET01[i].Year}';`;
//                                 await mssql.qurey(queryUpdate);
//                                 // console.log(queryUpdate);
//                                 // console.log("Update Complete " + i);
//                             } else {
//                                 var queryInsert = `INSERT INTO [SARKPI].[dbo].[KPI_Overdue] 
//                         ([Type], [MKTGroup], [Group], [Customer], [CustShort], [Frequency], [Incharge], [KPIServ], [KPIPeriod], [RepItems], [Month], [Year], [ReqNo1], [Freq1], [Evaluation1], [PlanSam1], [ActSam1], [RepDue1], [SentRep1], [RepDays1], [Request1], [TTCResult1], 
//                         [IssueDate1], [Sublead1], [GL1], [MGR1], [JP1], [Revise1_1], [Sublead1_1], [GL1_1], [MGR1_1], [JP1_1], [Revise1_2], [Sublead1_2], [GL1_2], [MGR1_2], [JP1_2], [Revise1_3], [Sublead1_3], [GL1_3], [MGR1_3], [JP1_3], [BDPrepare1], [BDTTC1], [BDIssue1], [BDSublead1], [BDGL1], 
//                         [BDMGR1], [BDJP1], [BDRevise1_1], [BDSublead1_1], [BDGL1_1], [BDMGR1_1], [BDJP1_1], [BDRevise1_2], [BDSublead1_2], [BDGL1_2], [BDMGR1_2], [BDJP1_2], [BDRevise1_3], [BDSublead1_3], [BDGL1_3], [BDMGR1_3], [BDJP1_3], [BDSent1], [Stage1], [Reason1], [ReqNo2], 
//                         [Freq2], [Evaluation2], [PlanSam2], [ActSam2], [RepDue2], [SentRep2], [RepDays2], [Request2], [TTCResult2], [IssueDate2], [Sublead2], [GL2], [MGR2], [JP2], [Revise2_1], [Sublead2_1], [GL2_1], [MGR2_1], [JP2_1], [Revise2_2], [Sublead2_2], [GL2_2], [MGR2_2], [JP2_2], 
//                         [Revise2_3], [Sublead2_3], [GL2_3], [MGR2_3], [JP2_3], [BDPrepare2], [BDTTC2], [BDIssue2], [BDSublead2], [BDGL2], [BDMGR2], [BDJP2], [BDRevise2_1], [BDSublead2_1], [BDGL2_1], [BDMGR2_1], [BDJP2_1], [BDRevise2_2], [BDSublead2_2], [BDGL2_2], [BDMGR2_2], 
//                         [BDJP2_2], [BDRevise2_3], [BDSublead2_3], [BDGL2_3], [BDMGR2_3], [BDJP2_3], [BDSent2], [Stage2], [Reason2], [ReqNo3], [Freq3], [Evaluation3], [PlanSam3], [ActSam3], [RepDue3], [SentRep3], [RepDays3], [Request3], [TTCResult3], [IssueDate3], [Sublead3], [GL3], [MGR3], [JP3], 
//                         [Revise3_1], [Sublead3_1], [GL3_1], [MGR3_1], [JP3_1], [Revise3_2], [Sublead3_2], [GL3_2], [MGR3_2], [JP3_2], [Revise3_3], [Sublead3_3], [GL3_3], [MGR3_3], [JP3_3], [BDPrepare3], [BDTTC3], [BDIssue3], [BDSublead3], [BDGL3], [BDMGR3], [BDJP3], [BDRevise3_1], 
//                         [BDSublead3_1], [BDGL3_1], [BDMGR3_1], [BDJP3_1], [BDRevise3_2], [BDSublead3_2], [BDGL3_2], [BDMGR3_2], [BDJP3_2], [BDRevise3_3], [BDSublead3_3], [BDGL3_3], [BDMGR3_3], [BDJP3_3], [BDSent3], [Stage3], [Reason3], [ReqNo4], [Freq4], [Evaluation4], [PlanSam4], 
//                         [ActSam4], [RepDue4], [SentRep4], [RepDays4], [Request4], [TTCResult4], [IssueDate4], [Sublead4], [GL4], [MGR4], [JP4], [Revise4_1], [Sublead4_1], [GL4_1], [MGR4_1], [JP4_1], [Revise4_2], [Sublead4_2], [GL4_2], [MGR4_2], [JP4_2], [Revise4_3], [Sublead4_3], [GL4_3], 
//                         [MGR4_3], [JP4_3], [BDPrepare4], [BDTTC4], [BDIssue4], [BDSublead4], [BDGL4], [BDMGR4], [BDJP4], [BDRevise4_1], [BDSublead4_1], [BDGL4_1], [BDMGR4_1], [BDJP4_1], [BDRevise4_2], [BDSublead4_2], [BDGL4_2], [BDMGR4_2], [BDJP4_2], [BDRevise4_3], 
//                         [BDSublead4_3], [BDGL4_3], [BDMGR4_3], [BDJP4_3], [BDSent4], [Stage4], [Reason4]) 
//                         values `;

//                                 // for (i = 0; i < SET01.length; i++) {
//                                 queryInsert =
//                                     queryInsert +
//                                     `( '${SET01[i].Type}'
//                                 ,'${SET01[i].MKTGroup}'
//                                 ,'${SET01[i].Group}'
//                                 ,'${SET01[i].Customer}'
//                                 ,'${SET01[i].CustShort}'
//                                 ,'${SET01[i].Frequency}'
//                                 ,'${SET01[i].Incharge}'
//                                 ,'${SET01[i].KPIServ}'
//                                 ,'${SET01[i].KPIPeriod}'
//                                 ,'${SET01[i].RepItems}'
//                                 ,'${SET01[i].Month}'
//                                 ,'${SET01[i].Year}'
//                                 ,'${SET01[i].ReqNo1}'
//                                 ,'${SET01[i].Freq1}'
//                                 ,'${SET01[i].Evaluation1}'
//                                 ,'${SET01[i].PlanSam1}'
//                                 ,'${SET01[i].ActSam1}'
//                                 ,'${SET01[i].RepDue1}'
//                                 ,'${SET01[i].SentRep1}'
//                                 ,'${SET01[i].RepDays1}'
//                                 ,'${SET01[i].Request1}'
//                                 ,'${SET01[i].TTCResult1}'
//                                 ,'${SET01[i].IssueDate1}'
//                                 ,'${SET01[i].Sublead1}'
//                                 ,'${SET01[i].GL1}'
//                                 ,'${SET01[i].MGR1}'
//                                 ,'${SET01[i].JP1}'
//                                 ,'${SET01[i].Revise1_1}'
//                                 ,'${SET01[i].Sublead1_1}'
//                                 ,'${SET01[i].GL1_1}'
//                                 ,'${SET01[i].MGR1_1}'
//                                 ,'${SET01[i].JP1_1}'
//                                 ,'${SET01[i].Revise1_2}'
//                                 ,'${SET01[i].Sublead1_2}'
//                                 ,'${SET01[i].GL1_2}'
//                                 ,'${SET01[i].MGR1_2}'
//                                 ,'${SET01[i].JP1_2}'
//                                 ,'${SET01[i].Revise1_3}'
//                                 ,'${SET01[i].Sublead1_3}'
//                                 ,'${SET01[i].GL1_3}'
//                                 ,'${SET01[i].MGR1_3}'
//                                 ,'${SET01[i].JP1_3}'
//                                 ,'${SET01[i].BDPrepare1}'
//                                 ,'${SET01[i].BDTTC1}'
//                                 ,'${SET01[i].BDIssue1}'
//                                 ,'${SET01[i].BDSublead1}'
//                                 ,'${SET01[i].BDGL1}'
//                                 ,'${SET01[i].BDMGR1}'
//                                 ,'${SET01[i].BDJP1}'
//                                 ,'${SET01[i].BDRevise1_1}'
//                                 ,'${SET01[i].BDSublead1_1}'
//                                 ,'${SET01[i].BDGL1_1}'
//                                 ,'${SET01[i].BDMGR1_1}'
//                                 ,'${SET01[i].BDJP1_1}'
//                                 ,'${SET01[i].BDRevise1_2}'
//                                 ,'${SET01[i].BDSublead1_2}'
//                                 ,'${SET01[i].BDGL1_2}'
//                                 ,'${SET01[i].BDMGR1_2}'
//                                 ,'${SET01[i].BDJP1_2}'          
//                                 ,'${SET01[i].BDRevise1_3}'
//                                 ,'${SET01[i].BDSublead1_3}'
//                                 ,'${SET01[i].BDGL1_3}'
//                                 ,'${SET01[i].BDMGR1_3}'
//                                 ,'${SET01[i].BDJP1_3}'
//                                 ,'${SET01[i].BDSent1}'
//                                 ,'${SET01[i].Stage1}'  
//                                 ,'${SET01[i].Reason1}'  
//                                 ,'${SET01[i].ReqNo2}'
//                                 ,'${SET01[i].Freq2}'
//                                 ,'${SET01[i].Evaluation2}'
//                                 ,'${SET01[i].PlanSam2}'
//                                 ,'${SET01[i].ActSam2}'
//                                 ,'${SET01[i].RepDue2}'
//                                 ,'${SET01[i].SentRep2}'
//                                 ,'${SET01[i].RepDays2}'
//                                 ,'${SET01[i].Request2}'
//                                 ,'${SET01[i].TTCResult2}'
//                                 ,'${SET01[i].IssueDate2}'
//                                 ,'${SET01[i].Sublead2}'
//                                 ,'${SET01[i].GL2}'
//                                 ,'${SET01[i].MGR2}'
//                                 ,'${SET01[i].JP2}'
//                                 ,'${SET01[i].Revise2_1}'
//                                 ,'${SET01[i].Sublead2_1}'
//                                 ,'${SET01[i].GL2_1}'
//                                 ,'${SET01[i].MGR2_1}'
//                                 ,'${SET01[i].JP2_1}'
//                                 ,'${SET01[i].Revise2_2}'
//                                 ,'${SET01[i].Sublead2_2}'
//                                 ,'${SET01[i].GL2_2}'
//                                 ,'${SET01[i].MGR2_2}'
//                                 ,'${SET01[i].JP2_2}'
//                                 ,'${SET01[i].Revise2_3}'
//                                 ,'${SET01[i].Sublead2_3}'
//                                 ,'${SET01[i].GL2_3}'
//                                 ,'${SET01[i].MGR2_3}'
//                                 ,'${SET01[i].JP2_3}'
//                                 ,'${SET01[i].BDPrepare2}'
//                                 ,'${SET01[i].BDTTC2}'
//                                 ,'${SET01[i].BDIssue2}'
//                                 ,'${SET01[i].BDSublead2}'
//                                 ,'${SET01[i].BDGL2}'
//                                 ,'${SET01[i].BDMGR2}'
//                                 ,'${SET01[i].BDJP2}'
//                                 ,'${SET01[i].BDRevise2_1}'
//                                 ,'${SET01[i].BDSublead2_1}'
//                                 ,'${SET01[i].BDGL2_1}'
//                                 ,'${SET01[i].BDMGR2_1}'
//                                 ,'${SET01[i].BDJP2_1}'
//                                 ,'${SET01[i].BDRevise2_2}'
//                                 ,'${SET01[i].BDSublead2_2}'
//                                 ,'${SET01[i].BDGL2_2}'
//                                 ,'${SET01[i].BDMGR2_2}'
//                                 ,'${SET01[i].BDJP2_2}'
//                                 ,'${SET01[i].BDRevise2_3}'
//                                 ,'${SET01[i].BDSublead2_3}'
//                                 ,'${SET01[i].BDGL2_3}'  
//                                 ,'${SET01[i].BDMGR2_3}'
//                                 ,'${SET01[i].BDJP2_3}'
//                                 ,'${SET01[i].BDSent2}'
//                                 ,'${SET01[i].Stage2}'
//                                 ,'${SET01[i].Reason2}'
//                                 ,'${SET01[i].ReqNo3}'
//                                 ,'${SET01[i].Freq3}'
//                                 ,'${SET01[i].Evaluation3}'
//                                 ,'${SET01[i].PlanSam3}'
//                                 ,'${SET01[i].ActSam3}'
//                                 ,'${SET01[i].RepDue3}'  
//                                 ,'${SET01[i].SentRep3}'
//                                 ,'${SET01[i].RepDays3}'
//                                 ,'${SET01[i].Request3}'
//                                 ,'${SET01[i].TTCResult3}'
//                                 ,'${SET01[i].IssueDate3}'
//                                 ,'${SET01[i].Sublead3}'
//                                 ,'${SET01[i].GL3}'
//                                 ,'${SET01[i].MGR3}'
//                                 ,'${SET01[i].JP3}'
//                                 ,'${SET01[i].Revise3_1}'
//                                 ,'${SET01[i].Sublead3_1}'
//                                 ,'${SET01[i].GL3_1}'
//                                 ,'${SET01[i].MGR3_1}'
//                                 ,'${SET01[i].JP3_1}'
//                                 ,'${SET01[i].Revise3_2}'
//                                 ,'${SET01[i].Sublead3_2}'
//                                 ,'${SET01[i].GL3_2}'
//                                 ,'${SET01[i].MGR3_2}'
//                                 ,'${SET01[i].JP3_2}'
//                                 ,'${SET01[i].Revise3_3}'
//                                 ,'${SET01[i].Sublead3_3}'
//                                 ,'${SET01[i].GL3_3}'
//                                 ,'${SET01[i].MGR3_3}'
//                                 ,'${SET01[i].JP3_3}'
//                                 ,'${SET01[i].BDPrepare3}'
//                                 ,'${SET01[i].BDTTC3}'
//                                 ,'${SET01[i].BDIssue3}'
//                                 ,'${SET01[i].BDSublead3}'
//                                 ,'${SET01[i].BDGL3}'
//                                 ,'${SET01[i].BDMGR3}'
//                                 ,'${SET01[i].BDJP3}'
//                                 ,'${SET01[i].BDRevise3_1}'
//                                 ,'${SET01[i].BDSublead3_1}'
//                                 ,'${SET01[i].BDGL3_1}'
//                                 ,'${SET01[i].BDMGR3_1}'
//                                 ,'${SET01[i].BDJP3_1}'
//                                 ,'${SET01[i].BDRevise3_2}'
//                                 ,'${SET01[i].BDSublead3_2}'
//                                 ,'${SET01[i].BDGL3_2}'
//                                 ,'${SET01[i].BDMGR3_2}'
//                                 ,'${SET01[i].BDJP3_2}'
//                                 ,'${SET01[i].BDRevise3_3}'
//                                 ,'${SET01[i].BDSublead3_3}'
//                                 ,'${SET01[i].BDGL3_3}'
//                                 ,'${SET01[i].BDMGR3_3}'
//                                 ,'${SET01[i].BDJP3_3}'
//                                 ,'${SET01[i].BDSent3}'
//                                 ,'${SET01[i].Stage3}'
//                                 ,'${SET01[i].Reason3}'
//                                 ,'${SET01[i].ReqNo4}'
//                                 ,'${SET01[i].Freq4}'
//                                 ,'${SET01[i].Evaluation4}'
//                                 ,'${SET01[i].PlanSam4}'
//                                 ,'${SET01[i].ActSam4}'
//                                 ,'${SET01[i].RepDue4}'
//                                 ,'${SET01[i].SentRep4}'
//                                 ,'${SET01[i].RepDays4}'
//                                 ,'${SET01[i].Request4}'
//                                 ,'${SET01[i].TTCResult4}'
//                                 ,'${SET01[i].IssueDate4}'
//                                 ,'${SET01[i].Sublead4}'
//                                 ,'${SET01[i].GL4}'
//                                 ,'${SET01[i].MGR4}'
//                                 ,'${SET01[i].JP4}'
//                                 ,'${SET01[i].Revise4_1}'
//                                 ,'${SET01[i].Sublead4_1}'
//                                 ,'${SET01[i].GL4_1}'
//                                 ,'${SET01[i].MGR4_1}'
//                                 ,'${SET01[i].JP4_1}'
//                                 ,'${SET01[i].Revise4_2}'
//                                 ,'${SET01[i].Sublead4_2}'
//                                 ,'${SET01[i].GL4_2}'
//                                 ,'${SET01[i].MGR4_2}'
//                                 ,'${SET01[i].JP4_2}'
//                                 ,'${SET01[i].Revise4_3}'
//                                 ,'${SET01[i].Sublead4_3}'
//                                 ,'${SET01[i].GL4_3}'
//                                 ,'${SET01[i].MGR4_3}'
//                                 ,'${SET01[i].JP4_3}'
//                                 ,'${SET01[i].BDPrepare4}'
//                                 ,'${SET01[i].BDTTC4}'
//                                 ,'${SET01[i].BDIssue4}' 
//                                 ,'${SET01[i].BDSublead4}'
//                                 ,'${SET01[i].BDGL4}'
//                                 ,'${SET01[i].BDMGR4}'
//                                 ,'${SET01[i].BDJP4}'
//                                 ,'${SET01[i].BDRevise4_1}'
//                                 ,'${SET01[i].BDSublead4_1}'
//                                 ,'${SET01[i].BDGL4_1}'
//                                 ,'${SET01[i].BDMGR4_1}'
//                                 ,'${SET01[i].BDJP4_1}'
//                                 ,'${SET01[i].BDRevise4_2}'
//                                 ,'${SET01[i].BDSublead4_2}'
//                                 ,'${SET01[i].BDGL4_2}'
//                                 ,'${SET01[i].BDMGR4_2}'
//                                 ,'${SET01[i].BDJP4_2}'
//                                 ,'${SET01[i].BDRevise4_3}'
//                                 ,'${SET01[i].BDSublead4_3}'
//                                 ,'${SET01[i].BDGL4_3}'
//                                 ,'${SET01[i].BDMGR4_3}'
//                                 ,'${SET01[i].BDJP4_3}'
//                                 ,'${SET01[i].BDSent4}'
//                                 ,'${SET01[i].Stage4}'
//                                 ,'${SET01[i].Reason4}'
//                                 )`;
//                                 // if (i !== SET01.length - 1) {
//                                 //     queryInsert = queryInsert + ",";
//                                 // }
//                                 // }
//                                 query = queryInsert + ";";
//                                 // query = queryDelete + queryInsert + ";";
//                                 await mssql.qurey(query);
//                                 // console.log(query);
//                                 // console.log("Insert Complete " + i);
//                             }
//                         } else { }
//                     }
//                 } catch (err) {
//                     console.error('Error executing SQL query:', err.message);
//                     res.status(500).send('Internal Server Error');
//                 }
//                 console.log('Month ' + (p + 1) + " Complete " + formatDateTime(new Date().toISOString()))
//                 output = SET01;
//             }
//         }
//     }
//     return res.json(output);
// });

// router.post('/02SARKPI/CustServiceChart', async (req, res) => {
//     let input = req.body;
//     console.log("--02SARKPI/CustServiceChart--");
//     console.log(input);
//     console.log("Start " + formatDateTime(new Date().toISOString()));
//     console.log("On process...");

//     let SET01 = [];
//     let output = [];
//     let previousReqNo = null;

//     if (input['YEAR'] != undefined) {
//         const year = input['YEAR'];
//         const lastYear = year - 1;
//         const queryDelete = `DELETE FROM [SARKPI].[dbo].[KPI_CustService] WHERE Year IN (${year}, ${lastYear})`;
//         await mssql.qurey(queryDelete);

//         const queryRequestLab = `
//         SELECT * FROM [SAR].[dbo].[Routine_RequestLab]
//         WHERE YEAR(SamplingDate) IN (${year}, ${lastYear})
//         AND RequestStatus != 'CANCEL REQUEST'
//         ORDER BY ReqNo;
//         `;
//         const dbRequestLab = await mssql.qurey(queryRequestLab);
//         const requestRecords = dbRequestLab.recordsets[0];
//         // console.log("requestRecords " + requestRecords.length);

//         const queryMasterPattern = `
//         SELECT CustShort, [Group], FRE
//         FROM [SAR].[dbo].[Routine_MasterPatternTS]
//         WHERE TYPE != 'NULL' AND TYPE != '' AND FRE != 'NULL' AND FRE != '';
//         `;
//         const dbMasterPattern = await mssql.qurey(queryMasterPattern);
//         const masterRecords = dbMasterPattern.recordsets[0];

//         const groupMap = {};
//         for (let i = 0; i < masterRecords.length; i++) {
//             const record = masterRecords[i];
//             groupMap[record.CustShort] = {
//                 GROUP: record.Group,
//                 Frequency: record.FRE,
//             };
//         };

//         for (let i = 0; i < requestRecords.length; i++) {
//             const req = requestRecords[i];
//             const samplingDate = new Date(req.SamplingDate);
//             const dayOfMonth = samplingDate.getDate();
//             const monthString = samplingDate.toLocaleString('en-US', { month: '2-digit' });
//             const yearString = samplingDate.getFullYear().toString();
//             const reqNo = req.ReqNo;
//             const CloseLine = req.RequestStatus;

//             if (reqNo === previousReqNo) {
//                 // console.log("Jump");
//                 continue;
//             } else {
//                 // console.log(reqNo)
//             }

//             previousReqNo = reqNo;

//             let entry = {
//                 "ID": "",
//                 "Type": "",
//                 "MKTGroup": "",
//                 "Group": groupMap[req.CustShort] ? groupMap[req.CustShort].GROUP || "" : "",
//                 "Customer": req.CustFull,
//                 "CustShort": req.CustShort,
//                 "Frequency": groupMap[req.CustShort] ? groupMap[req.CustShort].Frequency || "" : "",
//                 "Incharge": "",
//                 "KPIServ": "",
//                 "KPIPeriod": "",
//                 "RepItems": "",
//                 "Month": monthString,
//                 "Year": yearString,
//                 "ReqNo1": "",
//                 "Freq1": "",
//                 "Evaluation1": "",
//                 "PlanSam1": "",
//                 "ActSam1": "",
//                 "RepDue1": "",
//                 "SentRep1": "",
//                 "RepDays1": "",
//                 "Request1": "",
//                 "TTCResult1": "",
//                 "IssueDate1": "",
//                 "Sublead1": "",
//                 "GL1": "",
//                 "MGR1": "",
//                 "JP1": "",
//                 "Revise1_1": "",
//                 "Sublead1_1": "",
//                 "GL1_1": "",
//                 "MGR1_1": "",
//                 "JP1_1": "",
//                 "Revise1_2": "",
//                 "Sublead1_2": "",
//                 "GL1_2": "",
//                 "MGR1_2": "",
//                 "JP1_2": "",
//                 "Revise1_3": "",
//                 "Sublead1_3": "",
//                 "GL1_3": "",
//                 "MGR1_3": "",
//                 "JP1_3": "",
//                 "BDPrepare1": "",
//                 "BDTTC1": "",
//                 "BDIssue1": "",
//                 "BDSublead1": "",
//                 "BDGL1": "",
//                 "BDMGR1": "",
//                 "BDJP1": "",
//                 "BDRevise1_1": "",
//                 "BDSublead1_1": "",
//                 "BDGL1_1": "",
//                 "BDMGR1_1": "",
//                 "BDJP1_1": "",
//                 "BDRevise1_2": "",
//                 "BDSublead1_2": "",
//                 "BDGL1_2": "",
//                 "BDMGR1_2": "",
//                 "BDJP1_2": "",
//                 "BDRevise1_3": "",
//                 "BDSublead1_3": "",
//                 "BDGL1_3": "",
//                 "BDMGR1_3": "",
//                 "BDJP1_3": "",
//                 "BDSent1": "",
//                 "Stage1": "",
//                 "Reason1": "",
//                 "ReqNo2": "",
//                 "Freq2": "",
//                 "Evaluation2": "",
//                 "PlanSam2": "",
//                 "ActSam2": "",
//                 "RepDue2": "",
//                 "SentRep2": "",
//                 "RepDays2": "",
//                 "Request2": "",
//                 "TTCResult2": "",
//                 "IssueDate2": "",
//                 "Sublead2": "",
//                 "GL2": "",
//                 "MGR2": "",
//                 "JP2": "",
//                 "Revise2_1": "",
//                 "Sublead2_1": "",
//                 "GL2_1": "",
//                 "MGR2_1": "",
//                 "JP2_1": "",
//                 "Revise2_2": "",
//                 "Sublead2_2": "",
//                 "GL2_2": "",
//                 "MGR2_2": "",
//                 "JP2_2": "",
//                 "Revise2_3": "",
//                 "Sublead2_3": "",
//                 "GL2_3": "",
//                 "MGR2_3": "",
//                 "JP2_3": "",
//                 "BDPrepare2": "",
//                 "BDTTC2": "",
//                 "BDIssue2": "",
//                 "BDSublead2": "",
//                 "BDGL2": "",
//                 "BDMGR2": "",
//                 "BDJP2": "",
//                 "BDRevise2_1": "",
//                 "BDSublead2_1": "",
//                 "BDGL2_1": "",
//                 "BDMGR2_1": "",
//                 "BDJP2_1": "",
//                 "BDRevise2_2": "",
//                 "BDSublead2_2": "",
//                 "BDGL2_2": "",
//                 "BDMGR2_2": "",
//                 "BDJP2_2": "",
//                 "BDRevise2_3": "",
//                 "BDSublead2_3": "",
//                 "BDGL2_3": "",
//                 "BDMGR2_3": "",
//                 "BDJP2_3": "",
//                 "BDSent2": "",
//                 "Stage2": "",
//                 "Reason2": "",
//                 "ReqNo3": "",
//                 "Freq3": "",
//                 "Evaluation3": "",
//                 "PlanSam3": "",
//                 "ActSam3": "",
//                 "RepDue3": "",
//                 "SentRep3": "",
//                 "RepDays3": "",
//                 "Request3": "",
//                 "TTCResult3": "",
//                 "IssueDate3": "",
//                 "Sublead3": "",
//                 "GL3": "",
//                 "MGR3": "",
//                 "JP3": "",
//                 "Revise3_1": "",
//                 "Sublead3_1": "",
//                 "GL3_1": "",
//                 "MGR3_1": "",
//                 "JP3_1": "",
//                 "Revise3_2": "",
//                 "Sublead3_2": "",
//                 "GL3_2": "",
//                 "MGR3_2": "",
//                 "JP3_2": "",
//                 "Revise3_3": "",
//                 "Sublead3_3": "",
//                 "GL3_3": "",
//                 "MGR3_3": "",
//                 "JP3_3": "",
//                 "BDPrepare3": "",
//                 "BDTTC3": "",
//                 "BDIssue3": "",
//                 "BDSublead3": "",
//                 "BDGL3": "",
//                 "BDMGR3": "",
//                 "BDJP3": "",
//                 "BDRevise3_1": "",
//                 "BDSublead3_1": "",
//                 "BDGL3_1": "",
//                 "BDMGR3_1": "",
//                 "BDJP3_1": "",
//                 "BDRevise3_2": "",
//                 "BDSublead3_2": "",
//                 "BDGL3_2": "",
//                 "BDMGR3_2": "",
//                 "BDJP3_2": "",
//                 "BDRevise3_3": "",
//                 "BDSublead3_3": "",
//                 "BDGL3_3": "",
//                 "BDMGR3_3": "",
//                 "BDJP3_3": "",
//                 "BDSent3": "",
//                 "Stage3": "",
//                 "Reason3": "",
//                 "ReqNo4": "",
//                 "Freq4": "",
//                 "Evaluation4": "",
//                 "PlanSam4": "",
//                 "ActSam4": "",
//                 "RepDue4": "",
//                 "SentRep4": "",
//                 "RepDays4": "",
//                 "Request4": "",
//                 "TTCResult4": "",
//                 "IssueDate4": "",
//                 "Sublead4": "",
//                 "GL4": "",
//                 "MGR4": "",
//                 "JP4": "",
//                 "Revise4_1": "",
//                 "Sublead4_1": "",
//                 "GL4_1": "",
//                 "MGR4_1": "",
//                 "JP4_1": "",
//                 "Revise4_2": "",
//                 "Sublead4_2": "",
//                 "GL4_2": "",
//                 "MGR4_2": "",
//                 "JP4_2": "",
//                 "Revise4_3": "",
//                 "Sublead4_3": "",
//                 "GL4_3": "",
//                 "MGR4_3": "",
//                 "JP4_3": "",
//                 "BDPrepare4": "",
//                 "BDTTC4": "",
//                 "BDIssue4": "",
//                 "BDSublead4": "",
//                 "BDGL4": "",
//                 "BDMGR4": "",
//                 "BDJP4": "",
//                 "BDRevise4_1": "",
//                 "BDSublead4_1": "",
//                 "BDGL4_1": "",
//                 "BDMGR4_1": "",
//                 "BDJP4_1": "",
//                 "BDRevise4_2": "",
//                 "BDSublead4_2": "",
//                 "BDGL4_2": "",
//                 "BDMGR4_2": "",
//                 "BDJP4_2": "",
//                 "BDRevise4_3": "",
//                 "BDSublead4_3": "",
//                 "BDGL4_3": "",
//                 "BDMGR4_3": "",
//                 "BDJP4_3": "",
//                 "BDSent4": "",
//                 "Stage4": "",
//                 "Reason4": ""
//             };
//             let week = 0;
//             if (dayOfMonth >= 1 && dayOfMonth <= 8) {
//                 week = 1;
//             } else if (dayOfMonth >= 9 && dayOfMonth <= 16) {
//                 week = 2;
//             } else if (dayOfMonth >= 17 && dayOfMonth <= 24) {
//                 week = 3;
//             } else if (dayOfMonth >= 25 && dayOfMonth <= 31) {
//                 week = 4;
//             }

//             // console.log("week: " + week);
//             switch (week) {
//                 case 1:
//                     if (CloseLine == "CLOSE LINE") {
//                         entry["ReqNo1"] = reqNo;
//                         entry["Freq1"] = "CLOSE LINE";
//                         entry["ActSam1"] = "CLOSE LINE";
//                         break;
//                     } else {
//                         entry["ReqNo1"] = reqNo;
//                         entry["Freq1"] = "1";
//                         entry["ActSam1"] = formatDate(samplingDate);
//                         break;
//                     }
//                 case 2:
//                     if (CloseLine == "CLOSE LINE") {
//                         entry["ReqNo2"] = reqNo;
//                         entry["Freq2"] = "CLOSE LINE";
//                         entry["ActSam2"] = "CLOSE LINE";
//                         break;
//                     } else {
//                         entry["ReqNo2"] = reqNo;
//                         entry["Freq2"] = "1";
//                         entry["ActSam2"] = formatDate(samplingDate);
//                         break;
//                     }
//                 case 3:
//                     if (CloseLine == "CLOSE LINE") {
//                         entry["ReqNo3"] = reqNo;
//                         entry["Freq3"] = "CLOSE LINE";
//                         entry["ActSam3"] = "CLOSE LINE";
//                         break;
//                     } else {
//                         entry["ReqNo3"] = reqNo;
//                         entry["Freq3"] = "1";
//                         entry["ActSam3"] = formatDate(samplingDate);
//                         break;
//                     }
//                 case 4:
//                     if (CloseLine == "CLOSE LINE") {
//                         entry["ReqNo4"] = reqNo;
//                         entry["Freq4"] = "CLOSE LINE";
//                         entry["ActSam4"] = "CLOSE LINE";
//                         break;
//                     } else {
//                         entry["ReqNo4"] = reqNo;
//                         entry["Freq4"] = "1";
//                         entry["ActSam4"] = formatDate(samplingDate);
//                         break;
//                     }
//             }
//             SET01.push(entry);
//         };
//         console.log("SET01 " + SET01.length);
//         try {
//             for (let i = 0; i < SET01.length; i++) {
//                 // const queryCheck = `SELECT COUNT(*) AS count FROM [SARKPI].[dbo].[KPI_CustService]
//                 //         WHERE [CustShort] = '${SET01[i].CustShort}' 
//                 //         AND [Month] = '${SET01[i].Month}' 
//                 //         AND [Year] = '${SET01[i].Year}'
//                 //         AND ([ReqNo1] = '${SET01[i].ReqNo1}'
//                 //         OR [ReqNo2] = '${SET01[i].ReqNo2}'
//                 //         OR [ReqNo3] = '${SET01[i].ReqNo3}'
//                 //         OR [ReqNo4] = '${SET01[i].ReqNo4}')`;
//                 // const result = await mssql.qurey(queryCheck);
//                 // // console.log('queryCheck:' + queryCheck);
//                 // if (result.recordset[0].count > 0) {
//                 //     const queryUpdate = `UPDATE [SARKPI].[dbo].[KPI_CustService]
//                 //             SET [Type] = '${SET01[i].Type}', 
//                 //                 [MKTGroup] = '${SET01[i].MKTGroup}', 
//                 //                 [Group] = '${SET01[i].Group}', 
//                 //                 [Customer] = '${SET01[i].Customer}', 
//                 //                 [CustShort] = '${SET01[i].CustShort}', 
//                 //                 [Frequency] = '${SET01[i].Frequency}', 
//                 //                 [Incharge] = '${SET01[i].Incharge}', 
//                 //                 [KPIServ] = '${SET01[i].KPIServ}', 
//                 //                 [KPIPeriod] = '${SET01[i].KPIPeriod}', 
//                 //                 [RepItems] = '${SET01[i].RepItems}', 
//                 //                 [Month] = '${SET01[i].Month}', 
//                 //                 [Year] = '${SET01[i].Year}', 
//                 //                 [ReqNo1] = '${SET01[i].ReqNo1}', 
//                 //                 [Freq1] = '${SET01[i].Freq1}', 
//                 //                 [Evaluation1] = '${SET01[i].Evaluation1}', 
//                 //                 [PlanSam1] = '${SET01[i].PlanSam1}', 
//                 //                 [ActSam1] = '${SET01[i].ActSam1}', 
//                 //                 [RepDue1] = '${SET01[i].RepDue1}', 
//                 //                 [SentRep1] = '${SET01[i].SentRep1}', 
//                 //                 [RepDays1] = '${SET01[i].RepDays1}', 
//                 //                 [Request1] = '${SET01[i].Request1}', 
//                 //                 [TTCResult1] = '${SET01[i].TTCResult1}', 
//                 //                 [IssueDate1] = '${SET01[i].IssueDate1}', 
//                 //                 [Sublead1] = '${SET01[i].Sublead1}', 
//                 //                 [GL1] = '${SET01[i].GL1}', 
//                 //                 [MGR1] = '${SET01[i].MGR1}', 
//                 //                 [JP1] = '${SET01[i].JP1}', 
//                 //                 [Revise1_1] = '${SET01[i].Revise1_1}', 
//                 //                 [Sublead1_1] = '${SET01[i].Sublead1_1}', 
//                 //                 [GL1_1] = '${SET01[i].GL1_1}', 
//                 //                 [MGR1_1] = '${SET01[i].MGR1_1}', 
//                 //                 [JP1_1] = '${SET01[i].JP1_1}', 
//                 //                 [Revise1_2] = '${SET01[i].Revise1_2}', 
//                 //                 [Sublead1_2] = '${SET01[i].Sublead1_2}', 
//                 //                 [GL1_2] = '${SET01[i].GL1_2}', 
//                 //                 [MGR1_2] = '${SET01[i].MGR1_2}', 
//                 //                 [JP1_2] = '${SET01[i].JP1_2}', 
//                 //                 [Revise1_3] = '${SET01[i].Revise1_3}', 
//                 //                 [Sublead1_3] = '${SET01[i].Sublead1_3}', 
//                 //                 [GL1_3] = '${SET01[i].GL1_3}', 
//                 //                 [MGR1_3] = '${SET01[i].MGR1_3}', 
//                 //                 [JP1_3] = '${SET01[i].JP1_3}', 
//                 //                 [BDPrepare1] = '${SET01[i].BDPrepare1}', 
//                 //                 [BDTTC1] = '${SET01[i].BDTTC1}', 
//                 //                 [BDIssue1] = '${SET01[i].BDIssue1}', 
//                 //                 [BDSublead1] = '${SET01[i].BDSublead1}', 
//                 //                 [BDGL1] = '${SET01[i].BDGL1}', 
//                 //                 [BDMGR1] = '${SET01[i].BDMGR1}', 
//                 //                 [BDJP1] = '${SET01[i].BDJP1}', 
//                 //                 [BDRevise1_1] = '${SET01[i].BDRevise1_1}', 
//                 //                 [BDSublead1_1] = '${SET01[i].BDSublead1_1}', 
//                 //                 [BDGL1_1] = '${SET01[i].BDGL1_1}', 
//                 //                 [BDMGR1_1] = '${SET01[i].BDMGR1_1}', 
//                 //                 [BDJP1_1] = '${SET01[i].BDJP1_1}', 
//                 //                 [BDRevise1_2] = '${SET01[i].BDRevise1_2}', 
//                 //                 [BDSublead1_2] = '${SET01[i].BDSublead1_2}', 
//                 //                 [BDGL1_2] = '${SET01[i].BDGL1_2}', 
//                 //                 [BDMGR1_2] = '${SET01[i].BDMGR1_2}', 
//                 //                 [BDJP1_2] = '${SET01[i].BDJP1_2}', 
//                 //                 [BDRevise1_3] = '${SET01[i].BDRevise1_3}', 
//                 //                 [BDSublead1_3] = '${SET01[i].BDSublead1_3}', 
//                 //                 [BDGL1_3] = '${SET01[i].BDGL1_3}', 
//                 //                 [BDMGR1_3] = '${SET01[i].BDMGR1_3}', 
//                 //                 [BDJP1_3] = '${SET01[i].BDJP1_3}', 
//                 //                 [BDSent1] = '${SET01[i].BDSent1}', 
//                 //                 [Stage1] = '${SET01[i].Stage1}',
//                 //                 [Reason1] = '${SET01[i].Reason1}', 
//                 //                 [ReqNo2] = '${SET01[i].ReqNo2}', 
//                 //                 [Freq2] = '${SET01[i].Freq2}', 
//                 //                 [Evaluation2] = '${SET01[i].Evaluation2}', 
//                 //                 [PlanSam2] = '${SET01[i].PlanSam2}', 
//                 //                 [ActSam2] = '${SET01[i].ActSam2}', 
//                 //                 [RepDue2] = '${SET01[i].RepDue2}', 
//                 //                 [SentRep2] = '${SET01[i].SentRep2}', 
//                 //                 [RepDays2] = '${SET01[i].RepDays2}', 
//                 //                 [Request2] = '${SET01[i].Request2}', 
//                 //                 [TTCResult2] = '${SET01[i].TTCResult2}', 
//                 //                 [IssueDate2] = '${SET01[i].IssueDate2}', 
//                 //                 [Sublead2] = '${SET01[i].Sublead2}', 
//                 //                 [GL2] = '${SET01[i].GL2}', 
//                 //                 [MGR2] = '${SET01[i].MGR2}', 
//                 //                 [JP2] = '${SET01[i].JP2}', 
//                 //                 [Revise2_1] = '${SET01[i].Revise2_1}', 
//                 //                 [Sublead2_1] = '${SET01[i].Sublead2_1}', 
//                 //                 [GL2_1] = '${SET01[i].GL2_1}', 
//                 //                 [MGR2_1] = '${SET01[i].MGR2_1}', 
//                 //                 [JP2_1] = '${SET01[i].JP2_1}', 
//                 //                 [Revise2_2] = '${SET01[i].Revise2_2}', 
//                 //                 [Sublead2_2] = '${SET01[i].Sublead2_2}', 
//                 //                 [GL2_2] = '${SET01[i].GL2_2}', 
//                 //                 [MGR2_2] = '${SET01[i].MGR2_2}', 
//                 //                 [JP2_2] = '${SET01[i].JP2_2}', 
//                 //                 [Revise2_3] = '${SET01[i].Revise2_3}', 
//                 //                 [Sublead2_3] = '${SET01[i].Sublead2_3}', 
//                 //                 [GL2_3] = '${SET01[i].GL2_3}', 
//                 //                 [MGR2_3] = '${SET01[i].MGR2_3}', 
//                 //                 [JP2_3] = '${SET01[i].JP2_3}', 
//                 //                 [BDPrepare2] = '${SET01[i].BDPrepare2}', 
//                 //                 [BDTTC2] = '${SET01[i].BDTTC2}', 
//                 //                 [BDIssue2] = '${SET01[i].BDIssue2}', 
//                 //                 [BDSublead2] = '${SET01[i].BDSublead2}', 
//                 //                 [BDGL2] = '${SET01[i].BDGL2}', 
//                 //                 [BDMGR2] = '${SET01[i].BDMGR2}', 
//                 //                 [BDJP2] = '${SET01[i].BDJP2}', 
//                 //                 [BDRevise2_1] = '${SET01[i].BDRevise2_1}', 
//                 //                 [BDSublead2_1] = '${SET01[i].BDSublead2_1}', 
//                 //                 [BDGL2_1] = '${SET01[i].BDGL2_1}', 
//                 //                 [BDMGR2_1] = '${SET01[i].BDMGR2_1}', 
//                 //                 [BDJP2_1] = '${SET01[i].BDJP2_1}', 
//                 //                 [BDRevise2_2] = '${SET01[i].BDRevise2_2}', 
//                 //                 [BDSublead2_2] = '${SET01[i].BDSublead2_2}', 
//                 //                 [BDGL2_2] = '${SET01[i].BDGL2_2}', 
//                 //                 [BDMGR2_2] = '${SET01[i].BDMGR2_2}', 
//                 //                 [BDJP2_2] = '${SET01[i].BDJP2_2}', 
//                 //                 [BDRevise2_3] = '${SET01[i].BDRevise2_3}', 
//                 //                 [BDSublead2_3] = '${SET01[i].BDSublead2_3}', 
//                 //                 [BDGL2_3] = '${SET01[i].BDGL2_3}', 
//                 //                 [BDMGR2_3] = '${SET01[i].BDMGR2_3}', 
//                 //                 [BDJP2_3] = '${SET01[i].BDJP2_3}', 
//                 //                 [BDSent2] = '${SET01[i].BDSent2}', 
//                 //                 [Stage2] = '${SET01[i].Stage2}',
//                 //                 [Reason2] = '${SET01[i].Reason2}', 
//                 //                 [ReqNo3] = '${SET01[i].ReqNo3}', 
//                 //                 [Freq3] = '${SET01[i].Freq3}', 
//                 //                 [Evaluation3] = '${SET01[i].Evaluation3}', 
//                 //                 [PlanSam3] = '${SET01[i].PlanSam3}', 
//                 //                 [ActSam3] = '${SET01[i].ActSam3}', 
//                 //                 [RepDue3] = '${SET01[i].RepDue3}', 
//                 //                 [SentRep3] = '${SET01[i].SentRep3}', 
//                 //                 [RepDays3] = '${SET01[i].RepDays3}', 
//                 //                 [Request3] = '${SET01[i].Request3}', 
//                 //                 [TTCResult3] = '${SET01[i].TTCResult3}', 
//                 //                 [IssueDate3] = '${SET01[i].IssueDate3}', 
//                 //                 [Sublead3] = '${SET01[i].Sublead3}', 
//                 //                 [GL3] = '${SET01[i].GL3}', 
//                 //                 [MGR3] = '${SET01[i].MGR3}', 
//                 //                 [JP3] = '${SET01[i].JP3}', 
//                 //                 [Revise3_1] = '${SET01[i].Revise3_1}', 
//                 //                 [Sublead3_1] = '${SET01[i].Sublead3_1}', 
//                 //                 [GL3_1] = '${SET01[i].GL3_1}', 
//                 //                 [MGR3_1] = '${SET01[i].MGR3_1}', 
//                 //                 [JP3_1] = '${SET01[i].JP3_1}', 
//                 //                 [Revise3_2] = '${SET01[i].Revise3_2}', 
//                 //                 [Sublead3_2] = '${SET01[i].Sublead3_2}', 
//                 //                 [GL3_2] = '${SET01[i].GL3_2}', 
//                 //                 [MGR3_2] = '${SET01[i].MGR3_2}', 
//                 //                 [JP3_2] = '${SET01[i].JP3_2}', 
//                 //                 [Revise3_3] = '${SET01[i].Revise3_3}', 
//                 //                 [Sublead3_3] = '${SET01[i].Sublead3_3}', 
//                 //                 [GL3_3] = '${SET01[i].GL3_3}', 
//                 //                 [MGR3_3] = '${SET01[i].MGR3_3}', 
//                 //                 [JP3_3] = '${SET01[i].JP3_3}', 
//                 //                 [BDPrepare3] = '${SET01[i].BDPrepare3}', 
//                 //                 [BDTTC3] = '${SET01[i].BDTTC3}', 
//                 //                 [BDIssue3] = '${SET01[i].BDIssue3}', 
//                 //                 [BDSublead3] = '${SET01[i].BDSublead3}', 
//                 //                 [BDGL3] = '${SET01[i].BDGL3}', 
//                 //                 [BDMGR3] = '${SET01[i].BDMGR3}', 
//                 //                 [BDJP3] = '${SET01[i].BDJP3}', 
//                 //                 [BDRevise3_1] = '${SET01[i].BDRevise3_1}', 
//                 //                 [BDSublead3_1] = '${SET01[i].BDSublead3_1}', 
//                 //                 [BDGL3_1] = '${SET01[i].BDGL3_1}', 
//                 //                 [BDMGR3_1] = '${SET01[i].BDMGR3_1}', 
//                 //                 [BDJP3_1] = '${SET01[i].BDJP3_1}', 
//                 //                 [BDRevise3_2] = '${SET01[i].BDRevise3_2}', 
//                 //                 [BDSublead3_2] = '${SET01[i].BDSublead3_2}', 
//                 //                 [BDGL3_2] = '${SET01[i].BDGL3_2}', 
//                 //                 [BDMGR3_2] = '${SET01[i].BDMGR3_2}', 
//                 //                 [BDJP3_2] = '${SET01[i].BDJP3_2}', 
//                 //                 [BDRevise3_3] = '${SET01[i].BDRevise3_3}', 
//                 //                 [BDSublead3_3] = '${SET01[i].BDSublead3_3}', 
//                 //                 [BDGL3_3] = '${SET01[i].BDGL3_3}', 
//                 //                 [BDMGR3_3] = '${SET01[i].BDMGR3_3}', 
//                 //                 [BDJP3_3] = '${SET01[i].BDJP3_3}', 
//                 //                 [BDSent3] = '${SET01[i].BDSent3}', 
//                 //                 [Stage3] = '${SET01[i].Stage3}',
//                 //                 [Reason3] = '${SET01[i].Reason3}', 
//                 //                 [ReqNo4] = '${SET01[i].ReqNo4}', 
//                 //                 [Freq4] = '${SET01[i].Freq4}', 
//                 //                 [Evaluation4] = '${SET01[i].Evaluation4}', 
//                 //                 [PlanSam4] = '${SET01[i].PlanSam4}', 
//                 //                 [ActSam4] = '${SET01[i].ActSam4}', 
//                 //                 [RepDue4] = '${SET01[i].RepDue4}', 
//                 //                 [SentRep4] = '${SET01[i].SentRep4}', 
//                 //                 [RepDays4] = '${SET01[i].RepDays4}', 
//                 //                 [Request4] = '${SET01[i].Request4}', 
//                 //                 [TTCResult4] = '${SET01[i].TTCResult4}', 
//                 //                 [IssueDate4] = '${SET01[i].IssueDate4}', 
//                 //                 [Sublead4] = '${SET01[i].Sublead4}', 
//                 //                 [GL4] = '${SET01[i].GL4}', 
//                 //                 [MGR4] = '${SET01[i].MGR4}', 
//                 //                 [JP4] = '${SET01[i].JP4}', 
//                 //                 [Revise4_1] = '${SET01[i].Revise4_1}', 
//                 //                 [Sublead4_1] = '${SET01[i].Sublead4_1}', 
//                 //                 [GL4_1] = '${SET01[i].GL4_1}', 
//                 //                 [MGR4_1] = '${SET01[i].MGR4_1}', 
//                 //                 [JP4_1] = '${SET01[i].JP4_1}', 
//                 //                 [Revise4_2] = '${SET01[i].Revise4_2}', 
//                 //                 [Sublead4_2] = '${SET01[i].Sublead4_2}', 
//                 //                 [GL4_2] = '${SET01[i].GL4_2}', 
//                 //                 [MGR4_2] = '${SET01[i].MGR4_2}', 
//                 //                 [JP4_2] = '${SET01[i].JP4_2}', 
//                 //                 [Revise4_3] = '${SET01[i].Revise4_3}', 
//                 //                 [Sublead4_3] = '${SET01[i].Sublead4_3}', 
//                 //                 [GL4_3] = '${SET01[i].GL4_3}', 
//                 //                 [MGR4_3] = '${SET01[i].MGR4_3}', 
//                 //                 [JP4_3] = '${SET01[i].JP4_3}', 
//                 //                 [BDPrepare4] = '${SET01[i].BDPrepare4}', 
//                 //                 [BDTTC4] = '${SET01[i].BDTTC4}', 
//                 //                 [BDIssue4] = '${SET01[i].BDIssue4}', 
//                 //                 [BDSublead4] = '${SET01[i].BDSublead4}', 
//                 //                 [BDGL4] = '${SET01[i].BDGL4}', 
//                 //                 [BDMGR4] = '${SET01[i].BDMGR4}', 
//                 //                 [BDJP4] = '${SET01[i].BDJP4}', 
//                 //                 [BDRevise4_1] = '${SET01[i].BDRevise4_1}', 
//                 //                 [BDSublead4_1] = '${SET01[i].BDSublead4_1}', 
//                 //                 [BDGL4_1] = '${SET01[i].BDGL4_1}', 
//                 //                 [BDMGR4_1] = '${SET01[i].BDMGR4_1}', 
//                 //                 [BDJP4_1] = '${SET01[i].BDJP4_1}', 
//                 //                 [BDRevise4_2] = '${SET01[i].BDRevise4_2}', 
//                 //                 [BDSublead4_2] = '${SET01[i].BDSublead4_2}', 
//                 //                 [BDGL4_2] = '${SET01[i].BDGL4_2}', 
//                 //                 [BDMGR4_2] = '${SET01[i].BDMGR4_2}', 
//                 //                 [BDJP4_2] = '${SET01[i].BDJP4_2}', 
//                 //                 [BDRevise4_3] = '${SET01[i].BDRevise4_3}', 
//                 //                 [BDSublead4_3] = '${SET01[i].BDSublead4_3}', 
//                 //                 [BDGL4_3] = '${SET01[i].GL4_3}', 
//                 //                 [BDMGR4_3] = '${SET01[i].BDMGR4_3}', 
//                 //                 [BDJP4_3] = '${SET01[i].BDJP4_3}', 
//                 //                 [BDSent4] = '${SET01[i].BDSent4}',
//                 //                 [Stage4] = '${SET01[i].Stage4}', 
//                 //                 [Reason4] = '${SET01[i].Reason4}'
//                 //                 WHERE [CustShort] = '${SET01[i].CustShort}' 
//                 //                 AND [Month] = '${SET01[i].Month}' 
//                 //                 AND [Year] = '${SET01[i].Year}'
//                 //                 AND [ReqNo1] = '${SET01[i].ReqNo1}'
//                 //                 AND [ReqNo2] = '${SET01[i].ReqNo2}'
//                 //                 AND [ReqNo3] = '${SET01[i].ReqNo3}'
//                 //                 AND [ReqNo4] = '${SET01[i].ReqNo4}';`;
//                 //     await mssql.qurey(queryUpdate);
//                 //     // console.log('queryUpdate:' + queryUpdate);
//                 //     // console.log("Update Complete " + i);
//                 // } else {
//                 var queryInsert = `INSERT INTO [SARKPI].[dbo].[KPI_CustService] 
//                     ([Type], [MKTGroup], [Group], [Customer], [CustShort], [Frequency], [Incharge], [KPIServ], [KPIPeriod], [RepItems], [Month], [Year], [ReqNo1], [Freq1], [Evaluation1], [PlanSam1], [ActSam1], [RepDue1], [SentRep1], [RepDays1], [Request1], [TTCResult1], 
//                     [IssueDate1], [Sublead1], [GL1], [MGR1], [JP1], [Revise1_1], [Sublead1_1], [GL1_1], [MGR1_1], [JP1_1], [Revise1_2], [Sublead1_2], [GL1_2], [MGR1_2], [JP1_2], [Revise1_3], [Sublead1_3], [GL1_3], [MGR1_3], [JP1_3], [BDPrepare1], [BDTTC1], [BDIssue1], [BDSublead1], [BDGL1], 
//                     [BDMGR1], [BDJP1], [BDRevise1_1], [BDSublead1_1], [BDGL1_1], [BDMGR1_1], [BDJP1_1], [BDRevise1_2], [BDSublead1_2], [BDGL1_2], [BDMGR1_2], [BDJP1_2], [BDRevise1_3], [BDSublead1_3], [BDGL1_3], [BDMGR1_3], [BDJP1_3], [BDSent1], [Stage1], [Reason1], [ReqNo2], 
//                     [Freq2], [Evaluation2], [PlanSam2], [ActSam2], [RepDue2], [SentRep2], [RepDays2], [Request2], [TTCResult2], [IssueDate2], [Sublead2], [GL2], [MGR2], [JP2], [Revise2_1], [Sublead2_1], [GL2_1], [MGR2_1], [JP2_1], [Revise2_2], [Sublead2_2], [GL2_2], [MGR2_2], [JP2_2], 
//                     [Revise2_3], [Sublead2_3], [GL2_3], [MGR2_3], [JP2_3], [BDPrepare2], [BDTTC2], [BDIssue2], [BDSublead2], [BDGL2], [BDMGR2], [BDJP2], [BDRevise2_1], [BDSublead2_1], [BDGL2_1], [BDMGR2_1], [BDJP2_1], [BDRevise2_2], [BDSublead2_2], [BDGL2_2], [BDMGR2_2], 
//                     [BDJP2_2], [BDRevise2_3], [BDSublead2_3], [BDGL2_3], [BDMGR2_3], [BDJP2_3], [BDSent2], [Stage2], [Reason2], [ReqNo3], [Freq3], [Evaluation3], [PlanSam3], [ActSam3], [RepDue3], [SentRep3], [RepDays3], [Request3], [TTCResult3], [IssueDate3], [Sublead3], [GL3], [MGR3], [JP3], 
//                     [Revise3_1], [Sublead3_1], [GL3_1], [MGR3_1], [JP3_1], [Revise3_2], [Sublead3_2], [GL3_2], [MGR3_2], [JP3_2], [Revise3_3], [Sublead3_3], [GL3_3], [MGR3_3], [JP3_3], [BDPrepare3], [BDTTC3], [BDIssue3], [BDSublead3], [BDGL3], [BDMGR3], [BDJP3], [BDRevise3_1], 
//                     [BDSublead3_1], [BDGL3_1], [BDMGR3_1], [BDJP3_1], [BDRevise3_2], [BDSublead3_2], [BDGL3_2], [BDMGR3_2], [BDJP3_2], [BDRevise3_3], [BDSublead3_3], [BDGL3_3], [BDMGR3_3], [BDJP3_3], [BDSent3], [Stage3], [Reason3], [ReqNo4], [Freq4], [Evaluation4], [PlanSam4], 
//                     [ActSam4], [RepDue4], [SentRep4], [RepDays4], [Request4], [TTCResult4], [IssueDate4], [Sublead4], [GL4], [MGR4], [JP4], [Revise4_1], [Sublead4_1], [GL4_1], [MGR4_1], [JP4_1], [Revise4_2], [Sublead4_2], [GL4_2], [MGR4_2], [JP4_2], [Revise4_3], [Sublead4_3], [GL4_3], 
//                     [MGR4_3], [JP4_3], [BDPrepare4], [BDTTC4], [BDIssue4], [BDSublead4], [BDGL4], [BDMGR4], [BDJP4], [BDRevise4_1], [BDSublead4_1], [BDGL4_1], [BDMGR4_1], [BDJP4_1], [BDRevise4_2], [BDSublead4_2], [BDGL4_2], [BDMGR4_2], [BDJP4_2], [BDRevise4_3], 
//                     [BDSublead4_3], [BDGL4_3], [BDMGR4_3], [BDJP4_3], [BDSent4], [Stage4], [Reason4]) 
//                     values `;

//                 // for (i = 0; i < SET01.length; i++) {
//                 queryInsert =
//                     queryInsert +
//                     `( '${SET01[i].Type}'
//                             ,'${SET01[i].MKTGroup}'
//                             ,'${SET01[i].Group}'
//                             ,'${SET01[i].Customer}'
//                             ,'${SET01[i].CustShort}'
//                             ,'${SET01[i].Frequency}'
//                             ,'${SET01[i].Incharge}'
//                             ,'${SET01[i].KPIServ}'
//                             ,'${SET01[i].KPIPeriod}'
//                             ,'${SET01[i].RepItems}'
//                             ,'${SET01[i].Month}'
//                             ,'${SET01[i].Year}'
//                             ,'${SET01[i].ReqNo1}'
//                             ,'${SET01[i].Freq1}'
//                             ,'${SET01[i].Evaluation1}'
//                             ,'${SET01[i].PlanSam1}'
//                             ,'${SET01[i].ActSam1}'
//                             ,'${SET01[i].RepDue1}'
//                             ,'${SET01[i].SentRep1}'
//                             ,'${SET01[i].RepDays1}'
//                             ,'${SET01[i].Request1}'
//                             ,'${SET01[i].TTCResult1}'
//                             ,'${SET01[i].IssueDate1}'
//                             ,'${SET01[i].Sublead1}'
//                             ,'${SET01[i].GL1}'
//                             ,'${SET01[i].MGR1}'
//                             ,'${SET01[i].JP1}'
//                             ,'${SET01[i].Revise1_1}'
//                             ,'${SET01[i].Sublead1_1}'
//                             ,'${SET01[i].GL1_1}'
//                             ,'${SET01[i].MGR1_1}'
//                             ,'${SET01[i].JP1_1}'
//                             ,'${SET01[i].Revise1_2}'
//                             ,'${SET01[i].Sublead1_2}'
//                             ,'${SET01[i].GL1_2}'
//                             ,'${SET01[i].MGR1_2}'
//                             ,'${SET01[i].JP1_2}'
//                             ,'${SET01[i].Revise1_3}'
//                             ,'${SET01[i].Sublead1_3}'
//                             ,'${SET01[i].GL1_3}'
//                             ,'${SET01[i].MGR1_3}'
//                             ,'${SET01[i].JP1_3}'
//                             ,'${SET01[i].BDPrepare1}'
//                             ,'${SET01[i].BDTTC1}'
//                             ,'${SET01[i].BDIssue1}'
//                             ,'${SET01[i].BDSublead1}'
//                             ,'${SET01[i].BDGL1}'
//                             ,'${SET01[i].BDMGR1}'
//                             ,'${SET01[i].BDJP1}'
//                             ,'${SET01[i].BDRevise1_1}'
//                             ,'${SET01[i].BDSublead1_1}'
//                             ,'${SET01[i].BDGL1_1}'
//                             ,'${SET01[i].BDMGR1_1}'
//                             ,'${SET01[i].BDJP1_1}'
//                             ,'${SET01[i].BDRevise1_2}'
//                             ,'${SET01[i].BDSublead1_2}'
//                             ,'${SET01[i].BDGL1_2}'
//                             ,'${SET01[i].BDMGR1_2}'
//                             ,'${SET01[i].BDJP1_2}'          
//                             ,'${SET01[i].BDRevise1_3}'
//                             ,'${SET01[i].BDSublead1_3}'
//                             ,'${SET01[i].BDGL1_3}'
//                             ,'${SET01[i].BDMGR1_3}'
//                             ,'${SET01[i].BDJP1_3}'
//                             ,'${SET01[i].BDSent1}'
//                             ,'${SET01[i].Stage1}'  
//                             ,'${SET01[i].Reason1}'  
//                             ,'${SET01[i].ReqNo2}'
//                             ,'${SET01[i].Freq2}'
//                             ,'${SET01[i].Evaluation2}'
//                             ,'${SET01[i].PlanSam2}'
//                             ,'${SET01[i].ActSam2}'
//                             ,'${SET01[i].RepDue2}'
//                             ,'${SET01[i].SentRep2}'
//                             ,'${SET01[i].RepDays2}'
//                             ,'${SET01[i].Request2}'
//                             ,'${SET01[i].TTCResult2}'
//                             ,'${SET01[i].IssueDate2}'
//                             ,'${SET01[i].Sublead2}'
//                             ,'${SET01[i].GL2}'
//                             ,'${SET01[i].MGR2}'
//                             ,'${SET01[i].JP2}'
//                             ,'${SET01[i].Revise2_1}'
//                             ,'${SET01[i].Sublead2_1}'
//                             ,'${SET01[i].GL2_1}'
//                             ,'${SET01[i].MGR2_1}'
//                             ,'${SET01[i].JP2_1}'
//                             ,'${SET01[i].Revise2_2}'
//                             ,'${SET01[i].Sublead2_2}'
//                             ,'${SET01[i].GL2_2}'
//                             ,'${SET01[i].MGR2_2}'
//                             ,'${SET01[i].JP2_2}'
//                             ,'${SET01[i].Revise2_3}'
//                             ,'${SET01[i].Sublead2_3}'
//                             ,'${SET01[i].GL2_3}'
//                             ,'${SET01[i].MGR2_3}'
//                             ,'${SET01[i].JP2_3}'
//                             ,'${SET01[i].BDPrepare2}'
//                             ,'${SET01[i].BDTTC2}'
//                             ,'${SET01[i].BDIssue2}'
//                             ,'${SET01[i].BDSublead2}'
//                             ,'${SET01[i].BDGL2}'
//                             ,'${SET01[i].BDMGR2}'
//                             ,'${SET01[i].BDJP2}'
//                             ,'${SET01[i].BDRevise2_1}'
//                             ,'${SET01[i].BDSublead2_1}'
//                             ,'${SET01[i].BDGL2_1}'
//                             ,'${SET01[i].BDMGR2_1}'
//                             ,'${SET01[i].BDJP2_1}'
//                             ,'${SET01[i].BDRevise2_2}'
//                             ,'${SET01[i].BDSublead2_2}'
//                             ,'${SET01[i].BDGL2_2}'
//                             ,'${SET01[i].BDMGR2_2}'
//                             ,'${SET01[i].BDJP2_2}'
//                             ,'${SET01[i].BDRevise2_3}'
//                             ,'${SET01[i].BDSublead2_3}'
//                             ,'${SET01[i].BDGL2_3}'  
//                             ,'${SET01[i].BDMGR2_3}'
//                             ,'${SET01[i].BDJP2_3}'
//                             ,'${SET01[i].BDSent2}'
//                             ,'${SET01[i].Stage2}'
//                             ,'${SET01[i].Reason2}'
//                             ,'${SET01[i].ReqNo3}'
//                             ,'${SET01[i].Freq3}'
//                             ,'${SET01[i].Evaluation3}'
//                             ,'${SET01[i].PlanSam3}'
//                             ,'${SET01[i].ActSam3}'
//                             ,'${SET01[i].RepDue3}'  
//                             ,'${SET01[i].SentRep3}'
//                             ,'${SET01[i].RepDays3}'
//                             ,'${SET01[i].Request3}'
//                             ,'${SET01[i].TTCResult3}'
//                             ,'${SET01[i].IssueDate3}'
//                             ,'${SET01[i].Sublead3}'
//                             ,'${SET01[i].GL3}'
//                             ,'${SET01[i].MGR3}'
//                             ,'${SET01[i].JP3}'
//                             ,'${SET01[i].Revise3_1}'
//                             ,'${SET01[i].Sublead3_1}'
//                             ,'${SET01[i].GL3_1}'
//                             ,'${SET01[i].MGR3_1}'
//                             ,'${SET01[i].JP3_1}'
//                             ,'${SET01[i].Revise3_2}'
//                             ,'${SET01[i].Sublead3_2}'
//                             ,'${SET01[i].GL3_2}'
//                             ,'${SET01[i].MGR3_2}'
//                             ,'${SET01[i].JP3_2}'
//                             ,'${SET01[i].Revise3_3}'
//                             ,'${SET01[i].Sublead3_3}'
//                             ,'${SET01[i].GL3_3}'
//                             ,'${SET01[i].MGR3_3}'
//                             ,'${SET01[i].JP3_3}'
//                             ,'${SET01[i].BDPrepare3}'
//                             ,'${SET01[i].BDTTC3}'
//                             ,'${SET01[i].BDIssue3}'
//                             ,'${SET01[i].BDSublead3}'
//                             ,'${SET01[i].BDGL3}'
//                             ,'${SET01[i].BDMGR3}'
//                             ,'${SET01[i].BDJP3}'
//                             ,'${SET01[i].BDRevise3_1}'
//                             ,'${SET01[i].BDSublead3_1}'
//                             ,'${SET01[i].BDGL3_1}'
//                             ,'${SET01[i].BDMGR3_1}'
//                             ,'${SET01[i].BDJP3_1}'
//                             ,'${SET01[i].BDRevise3_2}'
//                             ,'${SET01[i].BDSublead3_2}'
//                             ,'${SET01[i].BDGL3_2}'
//                             ,'${SET01[i].BDMGR3_2}'
//                             ,'${SET01[i].BDJP3_2}'
//                             ,'${SET01[i].BDRevise3_3}'
//                             ,'${SET01[i].BDSublead3_3}'
//                             ,'${SET01[i].BDGL3_3}'
//                             ,'${SET01[i].BDMGR3_3}'
//                             ,'${SET01[i].BDJP3_3}'
//                             ,'${SET01[i].BDSent3}'
//                             ,'${SET01[i].Stage3}'
//                             ,'${SET01[i].Reason3}'
//                             ,'${SET01[i].ReqNo4}'
//                             ,'${SET01[i].Freq4}'
//                             ,'${SET01[i].Evaluation4}'
//                             ,'${SET01[i].PlanSam4}'
//                             ,'${SET01[i].ActSam4}'
//                             ,'${SET01[i].RepDue4}'
//                             ,'${SET01[i].SentRep4}'
//                             ,'${SET01[i].RepDays4}'
//                             ,'${SET01[i].Request4}'
//                             ,'${SET01[i].TTCResult4}'
//                             ,'${SET01[i].IssueDate4}'
//                             ,'${SET01[i].Sublead4}'
//                             ,'${SET01[i].GL4}'
//                             ,'${SET01[i].MGR4}'
//                             ,'${SET01[i].JP4}'
//                             ,'${SET01[i].Revise4_1}'
//                             ,'${SET01[i].Sublead4_1}'
//                             ,'${SET01[i].GL4_1}'
//                             ,'${SET01[i].MGR4_1}'
//                             ,'${SET01[i].JP4_1}'
//                             ,'${SET01[i].Revise4_2}'
//                             ,'${SET01[i].Sublead4_2}'
//                             ,'${SET01[i].GL4_2}'
//                             ,'${SET01[i].MGR4_2}'
//                             ,'${SET01[i].JP4_2}'
//                             ,'${SET01[i].Revise4_3}'
//                             ,'${SET01[i].Sublead4_3}'
//                             ,'${SET01[i].GL4_3}'
//                             ,'${SET01[i].MGR4_3}'
//                             ,'${SET01[i].JP4_3}'
//                             ,'${SET01[i].BDPrepare4}'
//                             ,'${SET01[i].BDTTC4}'
//                             ,'${SET01[i].BDIssue4}' 
//                             ,'${SET01[i].BDSublead4}'
//                             ,'${SET01[i].BDGL4}'
//                             ,'${SET01[i].BDMGR4}'
//                             ,'${SET01[i].BDJP4}'
//                             ,'${SET01[i].BDRevise4_1}'
//                             ,'${SET01[i].BDSublead4_1}'
//                             ,'${SET01[i].BDGL4_1}'
//                             ,'${SET01[i].BDMGR4_1}'
//                             ,'${SET01[i].BDJP4_1}'
//                             ,'${SET01[i].BDRevise4_2}'
//                             ,'${SET01[i].BDSublead4_2}'
//                             ,'${SET01[i].BDGL4_2}'
//                             ,'${SET01[i].BDMGR4_2}'
//                             ,'${SET01[i].BDJP4_2}'
//                             ,'${SET01[i].BDRevise4_3}'
//                             ,'${SET01[i].BDSublead4_3}'
//                             ,'${SET01[i].BDGL4_3}'
//                             ,'${SET01[i].BDMGR4_3}'
//                             ,'${SET01[i].BDJP4_3}'
//                             ,'${SET01[i].BDSent4}'
//                             ,'${SET01[i].Stage4}'
//                             ,'${SET01[i].Reason4}'
//                         )`;
//                 // if (i !== SET01.length - 1) {
//                 //     queryInsert = queryInsert + ",";
//                 // }
//                 // }
//                 query = queryInsert + ";";
//                 // query = queryDelete + queryInsert + ";";
//                 await mssql.qurey(query);
//                 // console.log('query:' + query);
//                 // console.log("Insert Complete " + i);
//                 // }
//             }
//         } catch (err) {
//             console.error('Error executing SQL query:', err.message);
//             res.status(500).send('Internal Server Error');
//         }
//         console.log("Complete " + formatDateTime(new Date().toISOString()))
//         output = SET01;
//     }
//     return res.json(output);
// });

// router.post('/02SARKPI/ReportOverKPIChart', async (req, res) => {
//     let input = req.body;
//     console.log("--02SARKPI/ReportOverKPIChart--");
//     console.log(input);
//     console.log("Start " + formatDateTime(new Date().toISOString()));

//     let SET01 = [];
//     let output = [];
//     await loadRoutineKACReport();
//     await loadHolidays();
//     if (input['YEAR'] != undefined) {
//         const queryDelete = `DELETE FROM [SARKPI].[dbo].[KPI_ReportOverKPI] WHERE Year = ${input['YEAR']}`;
//         await mssql.qurey(queryDelete);
//         for (let p = 0; p < 12; p++) {
//             let Round = (p + 1).toString().padStart(2, '0');
//             const currentMonth = new Date().getMonth() + 1;
//             const month3 = currentMonth.toString().padStart(2, '0');
//             const month2 = ((currentMonth - 1 + 12) % 12 || 12).toString().padStart(2, '0');
//             const month1 = ((currentMonth - 2 + 12) % 12 || 12).toString().padStart(2, '0');
//             const year = input['YEAR'];
//             const year2 = currentMonth === 1 ? year - 1 : year;
//             const year1 = currentMonth <= 2 ? year - 1 : year;
//             const type = input['TYPE'];
//             const month = input['MONTH'];

//             const queryMasterPattern = `
//             SELECT * From [SAR].[dbo].[Routine_MasterPatternTS] 
//             WHERE TYPE != ''
//             ORDER BY CustShort;
//             `;
//             const dbMaster = await mssql.qurey(queryMasterPattern);

//             const queryRequestLab = `
//             SELECT * From [SAR].[dbo].[Routine_RequestLab] 
//             WHERE MONTH(SamplingDate) = '${Round}' 
//             AND YEAR(SamplingDate) = '${year}'
//             ORDER BY CustShort, SamplingDate;
//             `;
//             // const queryRequestLab = `
//             // SELECT * FROM [SAR].[dbo].[Routine_RequestLab] 
//             // WHERE (MONTH(SamplingDate) = '${month3}' AND YEAR(SamplingDate) = '${year}')
//             // OR (MONTH(SamplingDate) = '${month2}' AND YEAR(SamplingDate) = '${year2}')
//             // OR (MONTH(SamplingDate) = '${month1}' AND YEAR(SamplingDate) = '${year1}')
//             // AND RequestStatus != 'CANCEL REQUEST'
//             // ORDER BY CustShort, SamplingDate;
//             // `;
//             const dbRequestLab = await mssql.qurey(queryRequestLab);

//             if (dbMaster.recordsets.length > 0 && dbRequestLab.recordsets.length > 0) {
//                 const masterRecords = dbMaster.recordsets[0];
//                 const requestRecords = dbRequestLab.recordsets[0];

//                 const requestRecordsMap = {};
//                 for (let i = 0; i < requestRecords.length; i++) {
//                     const req = requestRecords[i];
//                     const custShort = req.CustShort;
//                     if (custShort) {
//                         if (!requestRecordsMap[custShort]) {
//                             requestRecordsMap[custShort] = [];
//                         }
//                         requestRecordsMap[custShort].push(req);
//                     }
//                 };

//                 SET01 = masterRecords.map(record => ({
//                     "ID": "",
//                     "Type": record['TYPE'],
//                     "MKTGroup": record['MKTGROUP'],
//                     "Group": record['GROUP'],
//                     "Customer": record['CustFull'],
//                     "CustShort": record['CustShort'],
//                     "Frequency": record['FRE'],
//                     "Incharge": record['Incharge'],
//                     "KPIServ": record['GROUP'] === 'KAC' ? '100' : (record['GROUP'] === 'MEDIUM' ? '95' : record['KPIServ']),
//                     "KPIPeriod": record['TYPE'] === 'A' ? '12' : (record['TYPE'] === 'B' ? '10' : record['KPIPERIOD']),
//                     "RepItems": record['REPORTITEMS'],
//                     "Month": "",
//                     "Year": "",
//                     "ReqNo1": "",
//                     "Freq1": "",
//                     "Evaluation1": "",
//                     "PlanSam1": "",
//                     "ActSam1": "",
//                     "RepDue1": "",
//                     "SentRep1": "",
//                     "RepDays1": "",
//                     "Request1": "",
//                     "TTCResult1": "",
//                     "IssueDate1": "",
//                     "Sublead1": "",
//                     "GL1": "",
//                     "MGR1": "",
//                     "JP1": "",
//                     "Revise1_1": "",
//                     "Sublead1_1": "",
//                     "GL1_1": "",
//                     "MGR1_1": "",
//                     "JP1_1": "",
//                     "Revise1_2": "",
//                     "Sublead1_2": "",
//                     "GL1_2": "",
//                     "MGR1_2": "",
//                     "JP1_2": "",
//                     "Revise1_3": "",
//                     "Sublead1_3": "",
//                     "GL1_3": "",
//                     "MGR1_3": "",
//                     "JP1_3": "",
//                     "BDPrepare1": "",
//                     "BDTTC1": "",
//                     "BDIssue1": "",
//                     "BDSublead1": "",
//                     "BDGL1": "",
//                     "BDMGR1": "",
//                     "BDJP1": "",
//                     "BDRevise1_1": "",
//                     "BDSublead1_1": "",
//                     "BDGL1_1": "",
//                     "BDMGR1_1": "",
//                     "BDJP1_1": "",
//                     "BDRevise1_2": "",
//                     "BDSublead1_2": "",
//                     "BDGL1_2": "",
//                     "BDMGR1_2": "",
//                     "BDJP1_2": "",
//                     "BDRevise1_3": "",
//                     "BDSublead1_3": "",
//                     "BDGL1_3": "",
//                     "BDMGR1_3": "",
//                     "BDJP1_3": "",
//                     "BDSent1": "",
//                     "Stage1": "",
//                     "Reason1": "",
//                     "ReqNo2": "",
//                     "Freq2": "",
//                     "Evaluation2": "",
//                     "PlanSam2": "",
//                     "ActSam2": "",
//                     "RepDue2": "",
//                     "SentRep2": "",
//                     "RepDays2": "",
//                     "Request2": "",
//                     "TTCResult2": "",
//                     "IssueDate2": "",
//                     "Sublead2": "",
//                     "GL2": "",
//                     "MGR2": "",
//                     "JP2": "",
//                     "Revise2_1": "",
//                     "Sublead2_1": "",
//                     "GL2_1": "",
//                     "MGR2_1": "",
//                     "JP2_1": "",
//                     "Revise2_2": "",
//                     "Sublead2_2": "",
//                     "GL2_2": "",
//                     "MGR2_2": "",
//                     "JP2_2": "",
//                     "Revise2_3": "",
//                     "Sublead2_3": "",
//                     "GL2_3": "",
//                     "MGR2_3": "",
//                     "JP2_3": "",
//                     "BDPrepare2": "",
//                     "BDTTC2": "",
//                     "BDIssue2": "",
//                     "BDSublead2": "",
//                     "BDGL2": "",
//                     "BDMGR2": "",
//                     "BDJP2": "",
//                     "BDRevise2_1": "",
//                     "BDSublead2_1": "",
//                     "BDGL2_1": "",
//                     "BDMGR2_1": "",
//                     "BDJP2_1": "",
//                     "BDRevise2_2": "",
//                     "BDSublead2_2": "",
//                     "BDGL2_2": "",
//                     "BDMGR2_2": "",
//                     "BDJP2_2": "",
//                     "BDRevise2_3": "",
//                     "BDSublead2_3": "",
//                     "BDGL2_3": "",
//                     "BDMGR2_3": "",
//                     "BDJP2_3": "",
//                     "BDSent2": "",
//                     "Stage2": "",
//                     "Reason2": "",
//                     "ReqNo3": "",
//                     "Freq3": "",
//                     "Evaluation3": "",
//                     "PlanSam3": "",
//                     "ActSam3": "",
//                     "RepDue3": "",
//                     "SentRep3": "",
//                     "RepDays3": "",
//                     "Request3": "",
//                     "TTCResult3": "",
//                     "IssueDate3": "",
//                     "Sublead3": "",
//                     "GL3": "",
//                     "MGR3": "",
//                     "JP3": "",
//                     "Revise3_1": "",
//                     "Sublead3_1": "",
//                     "GL3_1": "",
//                     "MGR3_1": "",
//                     "JP3_1": "",
//                     "Revise3_2": "",
//                     "Sublead3_2": "",
//                     "GL3_2": "",
//                     "MGR3_2": "",
//                     "JP3_2": "",
//                     "Revise3_3": "",
//                     "Sublead3_3": "",
//                     "GL3_3": "",
//                     "MGR3_3": "",
//                     "JP3_3": "",
//                     "BDPrepare3": "",
//                     "BDTTC3": "",
//                     "BDIssue3": "",
//                     "BDSublead3": "",
//                     "BDGL3": "",
//                     "BDMGR3": "",
//                     "BDJP3": "",
//                     "BDRevise3_1": "",
//                     "BDSublead3_1": "",
//                     "BDGL3_1": "",
//                     "BDMGR3_1": "",
//                     "BDJP3_1": "",
//                     "BDRevise3_2": "",
//                     "BDSublead3_2": "",
//                     "BDGL3_2": "",
//                     "BDMGR3_2": "",
//                     "BDJP3_2": "",
//                     "BDRevise3_3": "",
//                     "BDSublead3_3": "",
//                     "BDGL3_3": "",
//                     "BDMGR3_3": "",
//                     "BDJP3_3": "",
//                     "BDSent3": "",
//                     "Stage3": "",
//                     "Reason3": "",
//                     "ReqNo4": "",
//                     "Freq4": "",
//                     "Evaluation4": "",
//                     "PlanSam4": "",
//                     "ActSam4": "",
//                     "RepDue4": "",
//                     "SentRep4": "",
//                     "RepDays4": "",
//                     "Request4": "",
//                     "TTCResult4": "",
//                     "IssueDate4": "",
//                     "Sublead4": "",
//                     "GL4": "",
//                     "MGR4": "",
//                     "JP4": "",
//                     "Revise4_1": "",
//                     "Sublead4_1": "",
//                     "GL4_1": "",
//                     "MGR4_1": "",
//                     "JP4_1": "",
//                     "Revise4_2": "",
//                     "Sublead4_2": "",
//                     "GL4_2": "",
//                     "MGR4_2": "",
//                     "JP4_2": "",
//                     "Revise4_3": "",
//                     "Sublead4_3": "",
//                     "GL4_3": "",
//                     "MGR4_3": "",
//                     "JP4_3": "",
//                     "BDPrepare4": "",
//                     "BDTTC4": "",
//                     "BDIssue4": "",
//                     "BDSublead4": "",
//                     "BDGL4": "",
//                     "BDMGR4": "",
//                     "BDJP4": "",
//                     "BDRevise4_1": "",
//                     "BDSublead4_1": "",
//                     "BDGL4_1": "",
//                     "BDMGR4_1": "",
//                     "BDJP4_1": "",
//                     "BDRevise4_2": "",
//                     "BDSublead4_2": "",
//                     "BDGL4_2": "",
//                     "BDMGR4_2": "",
//                     "BDJP4_2": "",
//                     "BDRevise4_3": "",
//                     "BDSublead4_3": "",
//                     "BDGL4_3": "",
//                     "BDMGR4_3": "",
//                     "BDJP4_3": "",
//                     "BDSent4": "",
//                     "Stage4": "",
//                     "Reason4": ""
//                 }));

//                 console.log('Month ' + (p + 1) + " AllCustomer: " + SET01.length)
//                 console.log("On process...");

//                 let lastcustshort = "";
//                 let lastreqno = "";

//                 for (let i = 0; i < SET01.length; i++) {
//                     const entry = SET01[i];
//                     const custShort = entry.CustShort;
//                     const matchingRequests = requestRecordsMap[custShort] || [];
//                     let lastWeek = 0;

//                     for (let j = 0; j < matchingRequests.length; j++) {
//                         const req = matchingRequests[j];
//                         const samplingDate = new Date(req.SamplingDate);
//                         const dayOfMonth = samplingDate.getDate();
//                         const monthString = samplingDate.toLocaleString('en-US', { month: '2-digit' });
//                         const yearString = samplingDate.getFullYear().toString();
//                         const kpiPeriod = entry.KPIPeriod;
//                         const sentRepDate = new Date(req.SentRep);
//                         const RepDue = await calculateRepDue(samplingDate, kpiPeriod);
//                         const RepDays = await calculateBusinessDays(samplingDate, sentRepDate);
//                         const reqNo = req.ReqNo;
//                         const custshort = req.CustShort;

//                         const maxSendDate = matchingRequests
//                             .filter(record => record['ReqNo'] === reqNo)
//                             .reduce((maxDate, record) => {
//                                 const currentSendDate = new Date(record['SendDate']);
//                                 return currentSendDate > maxDate ? currentSendDate : maxDate;
//                             }, new Date(req.SendDate));

//                         const maxResultApproveDate = matchingRequests
//                             .filter(record => record['ReqNo'] === reqNo)
//                             .reduce((maxDate, record) => {
//                                 const currentResultApproveDate = new Date(record['ResultApproveDate']);
//                                 return currentResultApproveDate > maxDate ? currentResultApproveDate : maxDate;
//                             }, new Date(req.ResultApproveDate));

//                         // const queryIssueDate = `
//                         // SELECT * FROM [SAR].[dbo].[Routine_KACReport] 
//                         // WHERE ReqNo = '${reqNo}';
//                         // `;
//                         // const dbIssueDate = await mssql.qurey(queryIssueDate);

//                         // const issueData = dbIssueDate &&
//                         //     dbIssueDate.recordsets &&
//                         //     dbIssueDate.recordsets.length > 0 &&
//                         //     dbIssueDate.recordsets[0].length > 0
//                         //     ? dbIssueDate.recordsets[0][0]
//                         //     : {};

//                         const filteredResults = routineKACData.filter(row => row.ReqNo === reqNo);
//                         const issueData = filteredResults.length > 0 ? filteredResults[0] : {};
//                         const issueDate = issueData['CreateReportDate'] ? new Date(issueData['CreateReportDate']) : null;
//                         const Sublead = issueData['SubLeaderTime_0'] ? new Date(issueData['SubLeaderTime_0']) : null;
//                         const GL = issueData['GLTime_0'] ? new Date(issueData['GLTime_0']) : null;
//                         const MGR = issueData['DGMTime_0'] ? new Date(issueData['DGMTime_0']) : null;
//                         const JP = issueData['JPTime_0'] ? new Date(issueData['JPTime_0']) : null;
//                         const Revise1 = issueData['InchargeTime_1'] ? new Date(issueData['InchargeTime_1']) : null;
//                         const Sublead1 = issueData['SubLeaderTime_1'] ? new Date(issueData['SubLeaderTime_1']) : null;
//                         const GL1 = issueData['GLTime_1'] ? new Date(issueData['GLTime_1']) : null;
//                         const MGR1 = issueData['DGMTime_1'] ? new Date(issueData['DGMTime_1']) : null;
//                         const JP1 = issueData['JPTime_1'] ? new Date(issueData['JPTime_1']) : null;
//                         const Revise2 = issueData['InchargeTime_2'] ? new Date(issueData['InchargeTime_2']) : null;
//                         const Sublead2 = issueData['SubLeaderTime_2'] ? new Date(issueData['SubLeaderTime_2']) : null;
//                         const GL2 = issueData['GLTime_2'] ? new Date(issueData['GLTime_2']) : null;
//                         const MGR2 = issueData['DGMTime_2'] ? new Date(issueData['DGMTime_2']) : null;
//                         const JP2 = issueData['JPTime_2'] ? new Date(issueData['JPTime_2']) : null;
//                         const Revise3 = issueData['InchargeTime_3'] ? new Date(issueData['InchargeTime_3']) : null;
//                         const Sublead3 = issueData['SubLeaderTime_3'] ? new Date(issueData['SubLeaderTime_3']) : null;
//                         const GL3 = issueData['GLTime_3'] ? new Date(issueData['GLTime_3']) : null;
//                         const MGR3 = issueData['DGMTime_3'] ? new Date(issueData['DGMTime_3']) : null;
//                         const JP3 = issueData['JPTime_3'] ? new Date(issueData['JPTime_3']) : null;
//                         const BDPrepare = await calculateBusinessDays(samplingDate, maxSendDate);
//                         const BDTTC = await calculateBusinessDays(maxSendDate, maxResultApproveDate);
//                         const BDIssue = await calculateBusinessDays(maxResultApproveDate, issueDate);
//                         const isValidDate = (date) => date && date.getTime() !== 0;
//                         const BDSublead = await calculateBusinessDays(issueDate, Sublead);
//                         const BDGL = isValidDate(Sublead) && isValidDate(GL) ? await calculateBusinessDays(Sublead, GL)
//                             : (isValidDate(issueDate) && isValidDate(GL) ? await calculateBusinessDays(issueDate, GL) : null);
//                         const BDMGR = isValidDate(GL) && isValidDate(MGR) ? await calculateBusinessDays(GL, MGR)
//                             : (isValidDate(Sublead) && isValidDate(MGR) ? await calculateBusinessDays(Sublead, MGR)
//                                 : (isValidDate(issueDate) && isValidDate(MGR) ? await calculateBusinessDays(issueDate, MGR) : null));
//                         const BDJP = isValidDate(MGR) && isValidDate(JP) ? await calculateBusinessDays(MGR, JP)
//                             : (isValidDate(GL) && isValidDate(JP) ? await calculateBusinessDays(GL, JP)
//                                 : (isValidDate(Sublead) && isValidDate(JP) ? await calculateBusinessDays(Sublead, JP) : null));
//                         const CheckSignerForBDRevise1 = isValidDate(JP) ? JP
//                             : isValidDate(MGR) ? MGR
//                                 : isValidDate(GL) ? GL
//                                     : isValidDate(Sublead) ? Sublead
//                                         : null;
//                         const BDRevise1 = CheckSignerForBDRevise1 ? await calculateBusinessDays(CheckSignerForBDRevise1, Revise1) : null;
//                         const BDSublead1 = await calculateBusinessDays(Revise1, Sublead1);
//                         const BDGL1 = isValidDate(Sublead1) && isValidDate(GL1) ? await calculateBusinessDays(Sublead1, GL1)
//                             : (isValidDate(Revise1) && isValidDate(GL1) ? await calculateBusinessDays(Revise1, GL1) : null);
//                         const BDMGR1 = isValidDate(GL1) && isValidDate(MGR1) ? await calculateBusinessDays(GL1, MGR1)
//                             : (isValidDate(Sublead1) && isValidDate(MGR1) ? await calculateBusinessDays(Sublead1, MGR1)
//                                 : (isValidDate(Revise1) && isValidDate(MGR1) ? await calculateBusinessDays(Revise1, MGR1) : null));
//                         const BDJP1 = isValidDate(MGR1) && isValidDate(JP1) ? await calculateBusinessDays(MGR1, JP1)
//                             : (isValidDate(GL1) && isValidDate(JP1) ? await calculateBusinessDays(GL1, JP1)
//                                 : (isValidDate(Sublead1) && isValidDate(JP1) ? await calculateBusinessDays(Sublead1, JP1) : null));
//                         const CheckSignerForBDRevise2 = isValidDate(JP1) ? JP1
//                             : isValidDate(MGR1) ? MGR1
//                                 : isValidDate(GL1) ? GL1
//                                     : isValidDate(Sublead1) ? Sublead1
//                                         : null;
//                         const BDRevise2 = CheckSignerForBDRevise2 ? await calculateBusinessDays(CheckSignerForBDRevise2, Revise2) : null;
//                         const BDSublead2 = await calculateBusinessDays(Revise2, Sublead2);
//                         const BDGL2 = isValidDate(Sublead2) && isValidDate(GL2) ? await calculateBusinessDays(Sublead2, GL2)
//                             : (isValidDate(Revise2) && isValidDate(GL2) ? await calculateBusinessDays(Revise2, GL2) : null);
//                         const BDMGR2 = isValidDate(GL2) && isValidDate(MGR2) ? await calculateBusinessDays(GL2, MGR2)
//                             : (isValidDate(Sublead2) && isValidDate(MGR2) ? await calculateBusinessDays(Sublead2, MGR2)
//                                 : (isValidDate(Revise2) && isValidDate(MGR2) ? await calculateBusinessDays(Revise2, MGR2) : null));
//                         const BDJP2 = isValidDate(MGR2) && isValidDate(JP2) ? await calculateBusinessDays(MGR2, JP2)
//                             : (isValidDate(GL2) && isValidDate(JP2) ? await calculateBusinessDays(GL2, JP2)
//                                 : (isValidDate(Sublead2) && isValidDate(JP2) ? await calculateBusinessDays(Sublead2, JP2) : null));
//                         const CheckSignerForBDRevise3 = isValidDate(JP2) ? JP2
//                             : isValidDate(MGR2) ? MGR2
//                                 : isValidDate(GL2) ? GL2
//                                     : isValidDate(Sublead2) ? Sublead2
//                                         : null;
//                         const BDRevise3 = CheckSignerForBDRevise3 ? await calculateBusinessDays(CheckSignerForBDRevise3, Revise3) : null;
//                         const BDSublead3 = await calculateBusinessDays(Revise3, Sublead3);
//                         const BDGL3 = isValidDate(Sublead3) && isValidDate(GL3) ? await calculateBusinessDays(Sublead3, GL3)
//                             : (isValidDate(Revise3) && isValidDate(GL3) ? await calculateBusinessDays(Revise3, GL3) : null);
//                         const BDMGR3 = isValidDate(GL3) && isValidDate(MGR3) ? await calculateBusinessDays(GL3, MGR3)
//                             : (isValidDate(Sublead3) && isValidDate(MGR3) ? await calculateBusinessDays(Sublead3, MGR3)
//                                 : (isValidDate(Revise3) && isValidDate(MGR3) ? await calculateBusinessDays(Revise3, MGR3) : null));
//                         const BDJP3 = isValidDate(MGR3) && isValidDate(JP3) ? await calculateBusinessDays(MGR3, JP3)
//                             : (isValidDate(GL3) && isValidDate(JP3) ? await calculateBusinessDays(GL3, JP3)
//                                 : (isValidDate(Sublead3) && isValidDate(JP3) ? await calculateBusinessDays(Sublead3, JP3) : null));
//                         const CheckSignerForBDSent = isValidDate(JP3) ? JP3
//                             : isValidDate(MGR3) ? MGR3
//                                 : isValidDate(GL3) ? GL3
//                                     : isValidDate(Sublead3) ? Sublead3
//                                         : isValidDate(JP2) ? JP2
//                                             : isValidDate(MGR2) ? MGR2
//                                                 : isValidDate(GL2) ? GL2
//                                                     : isValidDate(Sublead2) ? Sublead2
//                                                         : isValidDate(JP1) ? JP1
//                                                             : isValidDate(MGR1) ? MGR1
//                                                                 : isValidDate(GL1) ? GL1
//                                                                     : isValidDate(Sublead1) ? Sublead1
//                                                                         : isValidDate(JP) ? JP
//                                                                             : isValidDate(MGR) ? MGR
//                                                                                 : isValidDate(GL) ? GL
//                                                                                     : isValidDate(Sublead) ? Sublead
//                                                                                         : null;
//                         const BDSent = CheckSignerForBDSent ? await calculateBusinessDays(CheckSignerForBDSent, sentRepDate) : null;
//                         const Reason = req.Reason;

//                         let week = 0;
//                         if (dayOfMonth >= 1 && dayOfMonth <= 8) {
//                             week = 1;
//                         } else if (dayOfMonth >= 9 && dayOfMonth <= 16) {
//                             week = 2;
//                         } else if (dayOfMonth >= 17 && dayOfMonth <= 24) {
//                             week = 3;
//                         } else if (dayOfMonth >= 25 && dayOfMonth <= 31) {
//                             week = 4;
//                         }

//                         if (custshort == lastcustshort && reqNo == lastreqno) {
//                             if (week < lastWeek) {
//                                 week = lastWeek;
//                             }
//                         }
//                         if (custshort == lastcustshort && reqNo != lastreqno) {
//                             if (week == lastWeek) {
//                                 week = lastWeek + 1;
//                             }
//                         }

//                         switch (week) {
//                             case 1:
//                                 entry["ReqNo1"] = reqNo;
//                                 entry["RepDue1"] = RepDue.RepDue;
//                                 entry["RepDays1"] = RepDays;
//                                 entry["BDPrepare1"] = BDPrepare;
//                                 entry["BDTTC1"] = BDTTC;
//                                 entry["BDIssue1"] = BDIssue;
//                                 entry["BDSublead1"] = BDSublead;
//                                 entry["BDGL1"] = BDGL;
//                                 entry["BDMGR1"] = BDMGR;
//                                 entry["BDJP1"] = BDJP;
//                                 entry["BDRevise1_1"] = BDRevise1;
//                                 entry["BDSublead1_1"] = BDSublead1;
//                                 entry["BDGL1_1"] = BDGL1;
//                                 entry["BDMGR1_1"] = BDMGR1;
//                                 entry["BDJP1_1"] = BDJP1;
//                                 entry["BDRevise1_2"] = BDRevise2;
//                                 entry["BDSublead1_2"] = BDSublead2;
//                                 entry["BDGL1_2"] = BDGL2;
//                                 entry["BDMGR1_2"] = BDMGR2;
//                                 entry["BDJP1_2"] = BDJP2;
//                                 entry["BDRevise1_3"] = BDRevise3;
//                                 entry["BDSublead1_3"] = BDSublead3;
//                                 entry["BDGL1_3"] = BDGL3;
//                                 entry["BDMGR1_3"] = BDMGR3;
//                                 entry["BDJP1_3"] = BDJP3;
//                                 entry["BDSent1"] = BDSent;
//                                 break;
//                             case 2:
//                                 entry["ReqNo2"] = reqNo;
//                                 entry["RepDue2"] = RepDue.RepDue;
//                                 entry["RepDays2"] = RepDays;
//                                 entry["BDPrepare2"] = BDPrepare;
//                                 entry["BDTTC2"] = BDTTC;
//                                 entry["BDIssue2"] = BDIssue;
//                                 entry["BDSublead2"] = BDSublead;
//                                 entry["BDGL2"] = BDGL;
//                                 entry["BDMGR2"] = BDMGR;
//                                 entry["BDJP2"] = BDJP;
//                                 entry["BDRevise2_1"] = BDRevise1;
//                                 entry["BDSublead2_1"] = BDSublead1;
//                                 entry["BDGL2_1"] = BDGL1;
//                                 entry["BDMGR2_1"] = BDMGR1;
//                                 entry["BDJP2_1"] = BDJP1;
//                                 entry["BDRevise2_2"] = BDRevise2;
//                                 entry["BDSublead2_2"] = BDSublead2;
//                                 entry["BDGL2_2"] = BDGL2;
//                                 entry["BDMGR2_2"] = BDMGR2;
//                                 entry["BDJP2_2"] = BDJP2;
//                                 entry["BDRevise2_3"] = BDRevise3;
//                                 entry["BDSublead2_3"] = BDSublead3;
//                                 entry["BDGL2_3"] = BDGL3;
//                                 entry["BDMGR2_3"] = BDMGR3;
//                                 entry["BDJP2_3"] = BDJP3;
//                                 entry["BDSent2"] = BDSent;
//                                 break;
//                             case 3:
//                                 entry["ReqNo3"] = reqNo;
//                                 entry["RepDue3"] = RepDue.RepDue;
//                                 entry["RepDays3"] = RepDays;
//                                 entry["BDPrepare3"] = BDPrepare;
//                                 entry["BDTTC3"] = BDTTC;
//                                 entry["BDIssue3"] = BDIssue;
//                                 entry["BDSublead3"] = BDSublead;
//                                 entry["BDGL3"] = BDGL;
//                                 entry["BDMGR3"] = BDMGR;
//                                 entry["BDJP3"] = BDJP;
//                                 entry["BDRevise3_1"] = BDRevise1;
//                                 entry["BDSublead3_1"] = BDSublead1;
//                                 entry["BDGL3_1"] = BDGL1;
//                                 entry["BDMGR3_1"] = BDMGR1;
//                                 entry["BDJP3_1"] = BDJP1;
//                                 entry["BDRevise3_2"] = BDRevise2;
//                                 entry["BDSublead3_2"] = BDSublead2;
//                                 entry["BDGL3_2"] = BDGL2;
//                                 entry["BDMGR3_2"] = BDMGR2;
//                                 entry["BDJP3_2"] = BDJP2;
//                                 entry["BDRevise3_3"] = BDRevise3;
//                                 entry["BDSublead3_3"] = BDSublead3;
//                                 entry["BDGL3_3"] = BDGL3;
//                                 entry["BDMGR3_3"] = BDMGR3;
//                                 entry["BDJP3_3"] = BDJP3;
//                                 entry["BDSent3"] = BDSent;
//                                 break;
//                             case 4:
//                                 entry["ReqNo4"] = reqNo;
//                                 entry["RepDue4"] = RepDue.RepDue;
//                                 entry["RepDays4"] = RepDays;
//                                 entry["BDPrepare4"] = BDPrepare;
//                                 entry["BDTTC4"] = BDTTC;
//                                 entry["BDIssue4"] = BDIssue;
//                                 entry["BDSublead4"] = BDSublead;
//                                 entry["BDGL4"] = BDGL;
//                                 entry["BDMGR4"] = BDMGR;
//                                 entry["BDJP4"] = BDJP;
//                                 entry["BDRevise4_1"] = BDRevise1;
//                                 entry["BDSublead4_1"] = BDSublead1;
//                                 entry["BDGL4_1"] = BDGL1;
//                                 entry["BDMGR4_1"] = BDMGR1;
//                                 entry["BDJP4_1"] = BDJP1;
//                                 entry["BDRevise4_2"] = BDRevise2;
//                                 entry["BDSublead4_2"] = BDSublead2;
//                                 entry["BDGL4_2"] = BDGL2;
//                                 entry["BDMGR4_2"] = BDMGR2;
//                                 entry["BDJP4_2"] = BDJP2;
//                                 entry["BDRevise4_3"] = BDRevise3;
//                                 entry["BDSublead4_3"] = BDSublead3;
//                                 entry["BDGL4_3"] = BDGL3;
//                                 entry["BDMGR4_3"] = BDMGR3;
//                                 entry["BDJP4_3"] = BDJP3;
//                                 entry["BDSent4"] = BDSent;
//                                 break;
//                         }
//                         entry["Month"] = monthString;
//                         entry["Year"] = yearString;
//                         if (entry["Month"] == null || entry["Month"] == "") {
//                             entry["Month"] = Round;
//                         } else {

//                         }
//                         if (entry["Year"] == null || entry["Year"] == "") {
//                             entry["Year"] = year;
//                         } else {

//                         }
//                         lastWeek = week;
//                         lastcustshort = custshort;
//                         lastreqno = reqNo;
//                         // console.log("No. J" + j);
//                     }
//                     // console.log("No. i" + i);
//                 }
//                 try {
//                     for (let i = 0; i < SET01.length; i++) {
//                         // const queryCheck = `SELECT COUNT(*) AS count FROM [SARKPI].[dbo].[KPI_ReportOverKPI]
//                         //     WHERE [CustShort] = '${SET01[i].CustShort}' 
//                         //     AND [Month] = '${SET01[i].Month}' 
//                         //     AND [Year] = '${SET01[i].Year}'`;
//                         // const result = await mssql.qurey(queryCheck);
//                         // if (result.recordset[0].count > 0) {
//                         //     const queryUpdate = `UPDATE [SARKPI].[dbo].[KPI_ReportOverKPI]
//                         //          SET [Type] = '${SET01[i].Type}', 
//                         //             [MKTGroup] = '${SET01[i].MKTGroup}', 
//                         //             [Group] = '${SET01[i].Group}', 
//                         //             [Customer] = '${SET01[i].Customer}', 
//                         //             [CustShort] = '${SET01[i].CustShort}', 
//                         //             [Frequency] = '${SET01[i].Frequency}', 
//                         //             [Incharge] = '${SET01[i].Incharge}', 
//                         //             [KPIServ] = '${SET01[i].KPIServ}', 
//                         //             [KPIPeriod] = '${SET01[i].KPIPeriod}', 
//                         //             [RepItems] = '${SET01[i].RepItems}', 
//                         //             [Month] = '${SET01[i].Month}', 
//                         //             [Year] = '${SET01[i].Year}', 
//                         //             [ReqNo1] = '${SET01[i].ReqNo1}', 
//                         //             [Freq1] = '${SET01[i].Freq1}', 
//                         //             [Evaluation1] = '${SET01[i].Evaluation1}', 
//                         //             [PlanSam1] = '${SET01[i].PlanSam1}', 
//                         //             [ActSam1] = '${SET01[i].ActSam1}', 
//                         //             [RepDue1] = '${SET01[i].RepDue1}', 
//                         //             [SentRep1] = '${SET01[i].SentRep1}', 
//                         //             [RepDays1] = '${SET01[i].RepDays1}', 
//                         //             [Request1] = '${SET01[i].Request1}', 
//                         //             [TTCResult1] = '${SET01[i].TTCResult1}', 
//                         //             [IssueDate1] = '${SET01[i].IssueDate1}', 
//                         //             [Sublead1] = '${SET01[i].Sublead1}', 
//                         //             [GL1] = '${SET01[i].GL1}', 
//                         //             [MGR1] = '${SET01[i].MGR1}', 
//                         //             [JP1] = '${SET01[i].JP1}', 
//                         //             [Revise1_1] = '${SET01[i].Revise1_1}', 
//                         //             [Sublead1_1] = '${SET01[i].Sublead1_1}', 
//                         //             [GL1_1] = '${SET01[i].GL1_1}', 
//                         //             [MGR1_1] = '${SET01[i].MGR1_1}', 
//                         //             [JP1_1] = '${SET01[i].JP1_1}', 
//                         //             [Revise1_2] = '${SET01[i].Revise1_2}', 
//                         //             [Sublead1_2] = '${SET01[i].Sublead1_2}', 
//                         //             [GL1_2] = '${SET01[i].GL1_2}', 
//                         //             [MGR1_2] = '${SET01[i].MGR1_2}', 
//                         //             [JP1_2] = '${SET01[i].JP1_2}', 
//                         //             [Revise1_3] = '${SET01[i].Revise1_3}', 
//                         //             [Sublead1_3] = '${SET01[i].Sublead1_3}', 
//                         //             [GL1_3] = '${SET01[i].GL1_3}', 
//                         //             [MGR1_3] = '${SET01[i].MGR1_3}', 
//                         //             [JP1_3] = '${SET01[i].JP1_3}', 
//                         //             [BDPrepare1] = '${SET01[i].BDPrepare1}', 
//                         //             [BDTTC1] = '${SET01[i].BDTTC1}', 
//                         //             [BDIssue1] = '${SET01[i].BDIssue1}', 
//                         //             [BDSublead1] = '${SET01[i].BDSublead1}', 
//                         //             [BDGL1] = '${SET01[i].BDGL1}', 
//                         //             [BDMGR1] = '${SET01[i].BDMGR1}', 
//                         //             [BDJP1] = '${SET01[i].BDJP1}', 
//                         //             [BDRevise1_1] = '${SET01[i].BDRevise1_1}', 
//                         //             [BDSublead1_1] = '${SET01[i].BDSublead1_1}', 
//                         //             [BDGL1_1] = '${SET01[i].BDGL1_1}', 
//                         //             [BDMGR1_1] = '${SET01[i].BDMGR1_1}', 
//                         //             [BDJP1_1] = '${SET01[i].BDJP1_1}', 
//                         //             [BDRevise1_2] = '${SET01[i].BDRevise1_2}', 
//                         //             [BDSublead1_2] = '${SET01[i].BDSublead1_2}', 
//                         //             [BDGL1_2] = '${SET01[i].BDGL1_2}', 
//                         //             [BDMGR1_2] = '${SET01[i].BDMGR1_2}', 
//                         //             [BDJP1_2] = '${SET01[i].BDJP1_2}', 
//                         //             [BDRevise1_3] = '${SET01[i].BDRevise1_3}', 
//                         //             [BDSublead1_3] = '${SET01[i].BDSublead1_3}', 
//                         //             [BDGL1_3] = '${SET01[i].BDGL1_3}', 
//                         //             [BDMGR1_3] = '${SET01[i].BDMGR1_3}', 
//                         //             [BDJP1_3] = '${SET01[i].BDJP1_3}', 
//                         //             [BDSent1] = '${SET01[i].BDSent1}', 
//                         //             [Stage1] = '${SET01[i].Stage1}',
//                         //             [Reason1] = '${SET01[i].Reason1}', 
//                         //             [ReqNo2] = '${SET01[i].ReqNo2}', 
//                         //             [Freq2] = '${SET01[i].Freq2}', 
//                         //             [Evaluation2] = '${SET01[i].Evaluation2}', 
//                         //             [PlanSam2] = '${SET01[i].PlanSam2}', 
//                         //             [ActSam2] = '${SET01[i].ActSam2}', 
//                         //             [RepDue2] = '${SET01[i].RepDue2}', 
//                         //             [SentRep2] = '${SET01[i].SentRep2}', 
//                         //             [RepDays2] = '${SET01[i].RepDays2}', 
//                         //             [Request2] = '${SET01[i].Request2}', 
//                         //             [TTCResult2] = '${SET01[i].TTCResult2}', 
//                         //             [IssueDate2] = '${SET01[i].IssueDate2}', 
//                         //             [Sublead2] = '${SET01[i].Sublead2}', 
//                         //             [GL2] = '${SET01[i].GL2}', 
//                         //             [MGR2] = '${SET01[i].MGR2}', 
//                         //             [JP2] = '${SET01[i].JP2}', 
//                         //             [Revise2_1] = '${SET01[i].Revise2_1}', 
//                         //             [Sublead2_1] = '${SET01[i].Sublead2_1}', 
//                         //             [GL2_1] = '${SET01[i].GL2_1}', 
//                         //             [MGR2_1] = '${SET01[i].MGR2_1}', 
//                         //             [JP2_1] = '${SET01[i].JP2_1}', 
//                         //             [Revise2_2] = '${SET01[i].Revise2_2}', 
//                         //             [Sublead2_2] = '${SET01[i].Sublead2_2}', 
//                         //             [GL2_2] = '${SET01[i].GL2_2}', 
//                         //             [MGR2_2] = '${SET01[i].MGR2_2}', 
//                         //             [JP2_2] = '${SET01[i].JP2_2}', 
//                         //             [Revise2_3] = '${SET01[i].Revise2_3}', 
//                         //             [Sublead2_3] = '${SET01[i].Sublead2_3}', 
//                         //             [GL2_3] = '${SET01[i].GL2_3}', 
//                         //             [MGR2_3] = '${SET01[i].MGR2_3}', 
//                         //             [JP2_3] = '${SET01[i].JP2_3}', 
//                         //             [BDPrepare2] = '${SET01[i].BDPrepare2}', 
//                         //             [BDTTC2] = '${SET01[i].BDTTC2}', 
//                         //             [BDIssue2] = '${SET01[i].BDIssue2}', 
//                         //             [BDSublead2] = '${SET01[i].BDSublead2}', 
//                         //             [BDGL2] = '${SET01[i].BDGL2}', 
//                         //             [BDMGR2] = '${SET01[i].BDMGR2}', 
//                         //             [BDJP2] = '${SET01[i].BDJP2}', 
//                         //             [BDRevise2_1] = '${SET01[i].BDRevise2_1}', 
//                         //             [BDSublead2_1] = '${SET01[i].BDSublead2_1}', 
//                         //             [BDGL2_1] = '${SET01[i].BDGL2_1}', 
//                         //             [BDMGR2_1] = '${SET01[i].BDMGR2_1}', 
//                         //             [BDJP2_1] = '${SET01[i].BDJP2_1}', 
//                         //             [BDRevise2_2] = '${SET01[i].BDRevise2_2}', 
//                         //             [BDSublead2_2] = '${SET01[i].BDSublead2_2}', 
//                         //             [BDGL2_2] = '${SET01[i].BDGL2_2}', 
//                         //             [BDMGR2_2] = '${SET01[i].BDMGR2_2}', 
//                         //             [BDJP2_2] = '${SET01[i].BDJP2_2}', 
//                         //             [BDRevise2_3] = '${SET01[i].BDRevise2_3}', 
//                         //             [BDSublead2_3] = '${SET01[i].BDSublead2_3}', 
//                         //             [BDGL2_3] = '${SET01[i].BDGL2_3}', 
//                         //             [BDMGR2_3] = '${SET01[i].BDMGR2_3}', 
//                         //             [BDJP2_3] = '${SET01[i].BDJP2_3}', 
//                         //             [BDSent2] = '${SET01[i].BDSent2}', 
//                         //             [Stage2] = '${SET01[i].Stage2}',
//                         //             [Reason2] = '${SET01[i].Reason2}', 
//                         //             [ReqNo3] = '${SET01[i].ReqNo3}', 
//                         //             [Freq3] = '${SET01[i].Freq3}', 
//                         //             [Evaluation3] = '${SET01[i].Evaluation3}', 
//                         //             [PlanSam3] = '${SET01[i].PlanSam3}', 
//                         //             [ActSam3] = '${SET01[i].ActSam3}', 
//                         //             [RepDue3] = '${SET01[i].RepDue3}', 
//                         //             [SentRep3] = '${SET01[i].SentRep3}', 
//                         //             [RepDays3] = '${SET01[i].RepDays3}', 
//                         //             [Request3] = '${SET01[i].Request3}', 
//                         //             [TTCResult3] = '${SET01[i].TTCResult3}', 
//                         //             [IssueDate3] = '${SET01[i].IssueDate3}', 
//                         //             [Sublead3] = '${SET01[i].Sublead3}', 
//                         //             [GL3] = '${SET01[i].GL3}', 
//                         //             [MGR3] = '${SET01[i].MGR3}', 
//                         //             [JP3] = '${SET01[i].JP3}', 
//                         //             [Revise3_1] = '${SET01[i].Revise3_1}', 
//                         //             [Sublead3_1] = '${SET01[i].Sublead3_1}', 
//                         //             [GL3_1] = '${SET01[i].GL3_1}', 
//                         //             [MGR3_1] = '${SET01[i].MGR3_1}', 
//                         //             [JP3_1] = '${SET01[i].JP3_1}', 
//                         //             [Revise3_2] = '${SET01[i].Revise3_2}', 
//                         //             [Sublead3_2] = '${SET01[i].Sublead3_2}', 
//                         //             [GL3_2] = '${SET01[i].GL3_2}', 
//                         //             [MGR3_2] = '${SET01[i].MGR3_2}', 
//                         //             [JP3_2] = '${SET01[i].JP3_2}', 
//                         //             [Revise3_3] = '${SET01[i].Revise3_3}', 
//                         //             [Sublead3_3] = '${SET01[i].Sublead3_3}', 
//                         //             [GL3_3] = '${SET01[i].GL3_3}', 
//                         //             [MGR3_3] = '${SET01[i].MGR3_3}', 
//                         //             [JP3_3] = '${SET01[i].JP3_3}', 
//                         //             [BDPrepare3] = '${SET01[i].BDPrepare3}', 
//                         //             [BDTTC3] = '${SET01[i].BDTTC3}', 
//                         //             [BDIssue3] = '${SET01[i].BDIssue3}', 
//                         //             [BDSublead3] = '${SET01[i].BDSublead3}', 
//                         //             [BDGL3] = '${SET01[i].BDGL3}', 
//                         //             [BDMGR3] = '${SET01[i].BDMGR3}', 
//                         //             [BDJP3] = '${SET01[i].BDJP3}', 
//                         //             [BDRevise3_1] = '${SET01[i].BDRevise3_1}', 
//                         //             [BDSublead3_1] = '${SET01[i].BDSublead3_1}', 
//                         //             [BDGL3_1] = '${SET01[i].BDGL3_1}', 
//                         //             [BDMGR3_1] = '${SET01[i].BDMGR3_1}', 
//                         //             [BDJP3_1] = '${SET01[i].BDJP3_1}', 
//                         //             [BDRevise3_2] = '${SET01[i].BDRevise3_2}', 
//                         //             [BDSublead3_2] = '${SET01[i].BDSublead3_2}', 
//                         //             [BDGL3_2] = '${SET01[i].BDGL3_2}', 
//                         //             [BDMGR3_2] = '${SET01[i].BDMGR3_2}', 
//                         //             [BDJP3_2] = '${SET01[i].BDJP3_2}', 
//                         //             [BDRevise3_3] = '${SET01[i].BDRevise3_3}', 
//                         //             [BDSublead3_3] = '${SET01[i].BDSublead3_3}', 
//                         //             [BDGL3_3] = '${SET01[i].BDGL3_3}', 
//                         //             [BDMGR3_3] = '${SET01[i].BDMGR3_3}', 
//                         //             [BDJP3_3] = '${SET01[i].BDJP3_3}', 
//                         //             [BDSent3] = '${SET01[i].BDSent3}', 
//                         //             [Stage3] = '${SET01[i].Stage3}',
//                         //             [Reason3] = '${SET01[i].Reason3}', 
//                         //             [ReqNo4] = '${SET01[i].ReqNo4}', 
//                         //             [Freq4] = '${SET01[i].Freq4}', 
//                         //             [Evaluation4] = '${SET01[i].Evaluation4}', 
//                         //             [PlanSam4] = '${SET01[i].PlanSam4}', 
//                         //             [ActSam4] = '${SET01[i].ActSam4}', 
//                         //             [RepDue4] = '${SET01[i].RepDue4}', 
//                         //             [SentRep4] = '${SET01[i].SentRep4}', 
//                         //             [RepDays4] = '${SET01[i].RepDays4}', 
//                         //             [Request4] = '${SET01[i].Request4}', 
//                         //             [TTCResult4] = '${SET01[i].TTCResult4}', 
//                         //             [IssueDate4] = '${SET01[i].IssueDate4}', 
//                         //             [Sublead4] = '${SET01[i].Sublead4}', 
//                         //             [GL4] = '${SET01[i].GL4}', 
//                         //             [MGR4] = '${SET01[i].MGR4}', 
//                         //             [JP4] = '${SET01[i].JP4}', 
//                         //             [Revise4_1] = '${SET01[i].Revise4_1}', 
//                         //             [Sublead4_1] = '${SET01[i].Sublead4_1}', 
//                         //             [GL4_1] = '${SET01[i].GL4_1}', 
//                         //             [MGR4_1] = '${SET01[i].MGR4_1}', 
//                         //             [JP4_1] = '${SET01[i].JP4_1}', 
//                         //             [Revise4_2] = '${SET01[i].Revise4_2}', 
//                         //             [Sublead4_2] = '${SET01[i].Sublead4_2}', 
//                         //             [GL4_2] = '${SET01[i].GL4_2}', 
//                         //             [MGR4_2] = '${SET01[i].MGR4_2}', 
//                         //             [JP4_2] = '${SET01[i].JP4_2}', 
//                         //             [Revise4_3] = '${SET01[i].Revise4_3}', 
//                         //             [Sublead4_3] = '${SET01[i].Sublead4_3}', 
//                         //             [GL4_3] = '${SET01[i].GL4_3}', 
//                         //             [MGR4_3] = '${SET01[i].MGR4_3}', 
//                         //             [JP4_3] = '${SET01[i].JP4_3}', 
//                         //             [BDPrepare4] = '${SET01[i].BDPrepare4}', 
//                         //             [BDTTC4] = '${SET01[i].BDTTC4}', 
//                         //             [BDIssue4] = '${SET01[i].BDIssue4}', 
//                         //             [BDSublead4] = '${SET01[i].BDSublead4}', 
//                         //             [BDGL4] = '${SET01[i].BDGL4}', 
//                         //             [BDMGR4] = '${SET01[i].BDMGR4}', 
//                         //             [BDJP4] = '${SET01[i].BDJP4}', 
//                         //             [BDRevise4_1] = '${SET01[i].BDRevise4_1}', 
//                         //             [BDSublead4_1] = '${SET01[i].BDSublead4_1}', 
//                         //             [BDGL4_1] = '${SET01[i].BDGL4_1}', 
//                         //             [BDMGR4_1] = '${SET01[i].BDMGR4_1}', 
//                         //             [BDJP4_1] = '${SET01[i].BDJP4_1}', 
//                         //             [BDRevise4_2] = '${SET01[i].BDRevise4_2}', 
//                         //             [BDSublead4_2] = '${SET01[i].BDSublead4_2}', 
//                         //             [BDGL4_2] = '${SET01[i].BDGL4_2}', 
//                         //             [BDMGR4_2] = '${SET01[i].BDMGR4_2}', 
//                         //             [BDJP4_2] = '${SET01[i].BDJP4_2}', 
//                         //             [BDRevise4_3] = '${SET01[i].BDRevise4_3}', 
//                         //             [BDSublead4_3] = '${SET01[i].BDSublead4_3}', 
//                         //             [BDGL4_3] = '${SET01[i].GL4_3}', 
//                         //             [BDMGR4_3] = '${SET01[i].BDMGR4_3}', 
//                         //             [BDJP4_3] = '${SET01[i].BDJP4_3}', 
//                         //             [BDSent4] = '${SET01[i].BDSent4}',
//                         //             [Stage4] = '${SET01[i].Stage4}', 
//                         //             [Reason4] = '${SET01[i].Reason4}'
//                         //             WHERE [CustShort] = '${SET01[i].CustShort}' 
//                         //             AND [Month] = '${SET01[i].Month}' 
//                         //             AND [Year] = '${SET01[i].Year}'
//                         //             AND [ReqNo1] = '${SET01[i].ReqNo1}'
//                         //             AND [ReqNo2] = '${SET01[i].ReqNo2}'
//                         //             AND [ReqNo3] = '${SET01[i].ReqNo3}'
//                         //             AND [ReqNo4] = '${SET01[i].ReqNo4}';`;
//                         //     await mssql.qurey(queryUpdate);
//                         //     // console.log(queryUpdate);
//                         //     // console.log("Update Complete " + i);
//                         // } else {
//                         var queryInsert = `INSERT INTO [SARKPI].[dbo].[KPI_ReportOverKPI] 
//                         ([Type], [MKTGroup], [Group], [Customer], [CustShort], [Frequency], [Incharge], [KPIServ], [KPIPeriod], [RepItems], [Month], [Year], [ReqNo1], [Freq1], [Evaluation1], [PlanSam1], [ActSam1], [RepDue1], [SentRep1], [RepDays1], [Request1], [TTCResult1], 
//                         [IssueDate1], [Sublead1], [GL1], [MGR1], [JP1], [Revise1_1], [Sublead1_1], [GL1_1], [MGR1_1], [JP1_1], [Revise1_2], [Sublead1_2], [GL1_2], [MGR1_2], [JP1_2], [Revise1_3], [Sublead1_3], [GL1_3], [MGR1_3], [JP1_3], [BDPrepare1], [BDTTC1], [BDIssue1], [BDSublead1], [BDGL1], 
//                         [BDMGR1], [BDJP1], [BDRevise1_1], [BDSublead1_1], [BDGL1_1], [BDMGR1_1], [BDJP1_1], [BDRevise1_2], [BDSublead1_2], [BDGL1_2], [BDMGR1_2], [BDJP1_2], [BDRevise1_3], [BDSublead1_3], [BDGL1_3], [BDMGR1_3], [BDJP1_3], [BDSent1], [Stage1], [Reason1], [ReqNo2], 
//                         [Freq2], [Evaluation2], [PlanSam2], [ActSam2], [RepDue2], [SentRep2], [RepDays2], [Request2], [TTCResult2], [IssueDate2], [Sublead2], [GL2], [MGR2], [JP2], [Revise2_1], [Sublead2_1], [GL2_1], [MGR2_1], [JP2_1], [Revise2_2], [Sublead2_2], [GL2_2], [MGR2_2], [JP2_2], 
//                         [Revise2_3], [Sublead2_3], [GL2_3], [MGR2_3], [JP2_3], [BDPrepare2], [BDTTC2], [BDIssue2], [BDSublead2], [BDGL2], [BDMGR2], [BDJP2], [BDRevise2_1], [BDSublead2_1], [BDGL2_1], [BDMGR2_1], [BDJP2_1], [BDRevise2_2], [BDSublead2_2], [BDGL2_2], [BDMGR2_2], 
//                         [BDJP2_2], [BDRevise2_3], [BDSublead2_3], [BDGL2_3], [BDMGR2_3], [BDJP2_3], [BDSent2], [Stage2], [Reason2], [ReqNo3], [Freq3], [Evaluation3], [PlanSam3], [ActSam3], [RepDue3], [SentRep3], [RepDays3], [Request3], [TTCResult3], [IssueDate3], [Sublead3], [GL3], [MGR3], [JP3], 
//                         [Revise3_1], [Sublead3_1], [GL3_1], [MGR3_1], [JP3_1], [Revise3_2], [Sublead3_2], [GL3_2], [MGR3_2], [JP3_2], [Revise3_3], [Sublead3_3], [GL3_3], [MGR3_3], [JP3_3], [BDPrepare3], [BDTTC3], [BDIssue3], [BDSublead3], [BDGL3], [BDMGR3], [BDJP3], [BDRevise3_1], 
//                         [BDSublead3_1], [BDGL3_1], [BDMGR3_1], [BDJP3_1], [BDRevise3_2], [BDSublead3_2], [BDGL3_2], [BDMGR3_2], [BDJP3_2], [BDRevise3_3], [BDSublead3_3], [BDGL3_3], [BDMGR3_3], [BDJP3_3], [BDSent3], [Stage3], [Reason3], [ReqNo4], [Freq4], [Evaluation4], [PlanSam4], 
//                         [ActSam4], [RepDue4], [SentRep4], [RepDays4], [Request4], [TTCResult4], [IssueDate4], [Sublead4], [GL4], [MGR4], [JP4], [Revise4_1], [Sublead4_1], [GL4_1], [MGR4_1], [JP4_1], [Revise4_2], [Sublead4_2], [GL4_2], [MGR4_2], [JP4_2], [Revise4_3], [Sublead4_3], [GL4_3], 
//                         [MGR4_3], [JP4_3], [BDPrepare4], [BDTTC4], [BDIssue4], [BDSublead4], [BDGL4], [BDMGR4], [BDJP4], [BDRevise4_1], [BDSublead4_1], [BDGL4_1], [BDMGR4_1], [BDJP4_1], [BDRevise4_2], [BDSublead4_2], [BDGL4_2], [BDMGR4_2], [BDJP4_2], [BDRevise4_3], 
//                         [BDSublead4_3], [BDGL4_3], [BDMGR4_3], [BDJP4_3], [BDSent4], [Stage4], [Reason4]) 
//                         values `;

//                         for (i = 0; i < SET01.length; i++) {
//                             queryInsert =
//                                 queryInsert +
//                                 `( '${SET01[i].Type}'
//                                 ,'${SET01[i].MKTGroup}'
//                                 ,'${SET01[i].Group}'
//                                 ,'${SET01[i].Customer}'
//                                 ,'${SET01[i].CustShort}'
//                                 ,'${SET01[i].Frequency}'
//                                 ,'${SET01[i].Incharge}'
//                                 ,'${SET01[i].KPIServ}'
//                                 ,'${SET01[i].KPIPeriod}'
//                                 ,'${SET01[i].RepItems}'
//                                 ,'${SET01[i].Month}'
//                                 ,'${SET01[i].Year}'
//                                 ,'${SET01[i].ReqNo1}'
//                                 ,'${SET01[i].Freq1}'
//                                 ,'${SET01[i].Evaluation1}'
//                                 ,'${SET01[i].PlanSam1}'
//                                 ,'${SET01[i].ActSam1}'
//                                 ,'${SET01[i].RepDue1}'
//                                 ,'${SET01[i].SentRep1}'
//                                 ,'${SET01[i].RepDays1}'
//                                 ,'${SET01[i].Request1}'
//                                 ,'${SET01[i].TTCResult1}'
//                                 ,'${SET01[i].IssueDate1}'
//                                 ,'${SET01[i].Sublead1}'
//                                 ,'${SET01[i].GL1}'
//                                 ,'${SET01[i].MGR1}'
//                                 ,'${SET01[i].JP1}'
//                                 ,'${SET01[i].Revise1_1}'
//                                 ,'${SET01[i].Sublead1_1}'
//                                 ,'${SET01[i].GL1_1}'
//                                 ,'${SET01[i].MGR1_1}'
//                                 ,'${SET01[i].JP1_1}'
//                                 ,'${SET01[i].Revise1_2}'
//                                 ,'${SET01[i].Sublead1_2}'
//                                 ,'${SET01[i].GL1_2}'
//                                 ,'${SET01[i].MGR1_2}'
//                                 ,'${SET01[i].JP1_2}'
//                                 ,'${SET01[i].Revise1_3}'
//                                 ,'${SET01[i].Sublead1_3}'
//                                 ,'${SET01[i].GL1_3}'
//                                 ,'${SET01[i].MGR1_3}'
//                                 ,'${SET01[i].JP1_3}'
//                                 ,'${SET01[i].BDPrepare1}'
//                                 ,'${SET01[i].BDTTC1}'
//                                 ,'${SET01[i].BDIssue1}'
//                                 ,'${SET01[i].BDSublead1}'
//                                 ,'${SET01[i].BDGL1}'
//                                 ,'${SET01[i].BDMGR1}'
//                                 ,'${SET01[i].BDJP1}'
//                                 ,'${SET01[i].BDRevise1_1}'
//                                 ,'${SET01[i].BDSublead1_1}'
//                                 ,'${SET01[i].BDGL1_1}'
//                                 ,'${SET01[i].BDMGR1_1}'
//                                 ,'${SET01[i].BDJP1_1}'
//                                 ,'${SET01[i].BDRevise1_2}'
//                                 ,'${SET01[i].BDSublead1_2}'
//                                 ,'${SET01[i].BDGL1_2}'
//                                 ,'${SET01[i].BDMGR1_2}'
//                                 ,'${SET01[i].BDJP1_2}'          
//                                 ,'${SET01[i].BDRevise1_3}'
//                                 ,'${SET01[i].BDSublead1_3}'
//                                 ,'${SET01[i].BDGL1_3}'
//                                 ,'${SET01[i].BDMGR1_3}'
//                                 ,'${SET01[i].BDJP1_3}'
//                                 ,'${SET01[i].BDSent1}'
//                                 ,'${SET01[i].Stage1}'  
//                                 ,'${SET01[i].Reason1}'  
//                                 ,'${SET01[i].ReqNo2}'
//                                 ,'${SET01[i].Freq2}'
//                                 ,'${SET01[i].Evaluation2}'
//                                 ,'${SET01[i].PlanSam2}'
//                                 ,'${SET01[i].ActSam2}'
//                                 ,'${SET01[i].RepDue2}'
//                                 ,'${SET01[i].SentRep2}'
//                                 ,'${SET01[i].RepDays2}'
//                                 ,'${SET01[i].Request2}'
//                                 ,'${SET01[i].TTCResult2}'
//                                 ,'${SET01[i].IssueDate2}'
//                                 ,'${SET01[i].Sublead2}'
//                                 ,'${SET01[i].GL2}'
//                                 ,'${SET01[i].MGR2}'
//                                 ,'${SET01[i].JP2}'
//                                 ,'${SET01[i].Revise2_1}'
//                                 ,'${SET01[i].Sublead2_1}'
//                                 ,'${SET01[i].GL2_1}'
//                                 ,'${SET01[i].MGR2_1}'
//                                 ,'${SET01[i].JP2_1}'
//                                 ,'${SET01[i].Revise2_2}'
//                                 ,'${SET01[i].Sublead2_2}'
//                                 ,'${SET01[i].GL2_2}'
//                                 ,'${SET01[i].MGR2_2}'
//                                 ,'${SET01[i].JP2_2}'
//                                 ,'${SET01[i].Revise2_3}'
//                                 ,'${SET01[i].Sublead2_3}'
//                                 ,'${SET01[i].GL2_3}'
//                                 ,'${SET01[i].MGR2_3}'
//                                 ,'${SET01[i].JP2_3}'
//                                 ,'${SET01[i].BDPrepare2}'
//                                 ,'${SET01[i].BDTTC2}'
//                                 ,'${SET01[i].BDIssue2}'
//                                 ,'${SET01[i].BDSublead2}'
//                                 ,'${SET01[i].BDGL2}'
//                                 ,'${SET01[i].BDMGR2}'
//                                 ,'${SET01[i].BDJP2}'
//                                 ,'${SET01[i].BDRevise2_1}'
//                                 ,'${SET01[i].BDSublead2_1}'
//                                 ,'${SET01[i].BDGL2_1}'
//                                 ,'${SET01[i].BDMGR2_1}'
//                                 ,'${SET01[i].BDJP2_1}'
//                                 ,'${SET01[i].BDRevise2_2}'
//                                 ,'${SET01[i].BDSublead2_2}'
//                                 ,'${SET01[i].BDGL2_2}'
//                                 ,'${SET01[i].BDMGR2_2}'
//                                 ,'${SET01[i].BDJP2_2}'
//                                 ,'${SET01[i].BDRevise2_3}'
//                                 ,'${SET01[i].BDSublead2_3}'
//                                 ,'${SET01[i].BDGL2_3}'  
//                                 ,'${SET01[i].BDMGR2_3}'
//                                 ,'${SET01[i].BDJP2_3}'
//                                 ,'${SET01[i].BDSent2}'
//                                 ,'${SET01[i].Stage2}'
//                                 ,'${SET01[i].Reason2}'
//                                 ,'${SET01[i].ReqNo3}'
//                                 ,'${SET01[i].Freq3}'
//                                 ,'${SET01[i].Evaluation3}'
//                                 ,'${SET01[i].PlanSam3}'
//                                 ,'${SET01[i].ActSam3}'
//                                 ,'${SET01[i].RepDue3}'  
//                                 ,'${SET01[i].SentRep3}'
//                                 ,'${SET01[i].RepDays3}'
//                                 ,'${SET01[i].Request3}'
//                                 ,'${SET01[i].TTCResult3}'
//                                 ,'${SET01[i].IssueDate3}'
//                                 ,'${SET01[i].Sublead3}'
//                                 ,'${SET01[i].GL3}'
//                                 ,'${SET01[i].MGR3}'
//                                 ,'${SET01[i].JP3}'
//                                 ,'${SET01[i].Revise3_1}'
//                                 ,'${SET01[i].Sublead3_1}'
//                                 ,'${SET01[i].GL3_1}'
//                                 ,'${SET01[i].MGR3_1}'
//                                 ,'${SET01[i].JP3_1}'
//                                 ,'${SET01[i].Revise3_2}'
//                                 ,'${SET01[i].Sublead3_2}'
//                                 ,'${SET01[i].GL3_2}'
//                                 ,'${SET01[i].MGR3_2}'
//                                 ,'${SET01[i].JP3_2}'
//                                 ,'${SET01[i].Revise3_3}'
//                                 ,'${SET01[i].Sublead3_3}'
//                                 ,'${SET01[i].GL3_3}'
//                                 ,'${SET01[i].MGR3_3}'
//                                 ,'${SET01[i].JP3_3}'
//                                 ,'${SET01[i].BDPrepare3}'
//                                 ,'${SET01[i].BDTTC3}'
//                                 ,'${SET01[i].BDIssue3}'
//                                 ,'${SET01[i].BDSublead3}'
//                                 ,'${SET01[i].BDGL3}'
//                                 ,'${SET01[i].BDMGR3}'
//                                 ,'${SET01[i].BDJP3}'
//                                 ,'${SET01[i].BDRevise3_1}'
//                                 ,'${SET01[i].BDSublead3_1}'
//                                 ,'${SET01[i].BDGL3_1}'
//                                 ,'${SET01[i].BDMGR3_1}'
//                                 ,'${SET01[i].BDJP3_1}'
//                                 ,'${SET01[i].BDRevise3_2}'
//                                 ,'${SET01[i].BDSublead3_2}'
//                                 ,'${SET01[i].BDGL3_2}'
//                                 ,'${SET01[i].BDMGR3_2}'
//                                 ,'${SET01[i].BDJP3_2}'
//                                 ,'${SET01[i].BDRevise3_3}'
//                                 ,'${SET01[i].BDSublead3_3}'
//                                 ,'${SET01[i].BDGL3_3}'
//                                 ,'${SET01[i].BDMGR3_3}'
//                                 ,'${SET01[i].BDJP3_3}'
//                                 ,'${SET01[i].BDSent3}'
//                                 ,'${SET01[i].Stage3}'
//                                 ,'${SET01[i].Reason3}'
//                                 ,'${SET01[i].ReqNo4}'
//                                 ,'${SET01[i].Freq4}'
//                                 ,'${SET01[i].Evaluation4}'
//                                 ,'${SET01[i].PlanSam4}'
//                                 ,'${SET01[i].ActSam4}'
//                                 ,'${SET01[i].RepDue4}'
//                                 ,'${SET01[i].SentRep4}'
//                                 ,'${SET01[i].RepDays4}'
//                                 ,'${SET01[i].Request4}'
//                                 ,'${SET01[i].TTCResult4}'
//                                 ,'${SET01[i].IssueDate4}'
//                                 ,'${SET01[i].Sublead4}'
//                                 ,'${SET01[i].GL4}'
//                                 ,'${SET01[i].MGR4}'
//                                 ,'${SET01[i].JP4}'
//                                 ,'${SET01[i].Revise4_1}'
//                                 ,'${SET01[i].Sublead4_1}'
//                                 ,'${SET01[i].GL4_1}'
//                                 ,'${SET01[i].MGR4_1}'
//                                 ,'${SET01[i].JP4_1}'
//                                 ,'${SET01[i].Revise4_2}'
//                                 ,'${SET01[i].Sublead4_2}'
//                                 ,'${SET01[i].GL4_2}'
//                                 ,'${SET01[i].MGR4_2}'
//                                 ,'${SET01[i].JP4_2}'
//                                 ,'${SET01[i].Revise4_3}'
//                                 ,'${SET01[i].Sublead4_3}'
//                                 ,'${SET01[i].GL4_3}'
//                                 ,'${SET01[i].MGR4_3}'
//                                 ,'${SET01[i].JP4_3}'
//                                 ,'${SET01[i].BDPrepare4}'
//                                 ,'${SET01[i].BDTTC4}'
//                                 ,'${SET01[i].BDIssue4}' 
//                                 ,'${SET01[i].BDSublead4}'
//                                 ,'${SET01[i].BDGL4}'
//                                 ,'${SET01[i].BDMGR4}'
//                                 ,'${SET01[i].BDJP4}'
//                                 ,'${SET01[i].BDRevise4_1}'
//                                 ,'${SET01[i].BDSublead4_1}'
//                                 ,'${SET01[i].BDGL4_1}'
//                                 ,'${SET01[i].BDMGR4_1}'
//                                 ,'${SET01[i].BDJP4_1}'
//                                 ,'${SET01[i].BDRevise4_2}'
//                                 ,'${SET01[i].BDSublead4_2}'
//                                 ,'${SET01[i].BDGL4_2}'
//                                 ,'${SET01[i].BDMGR4_2}'
//                                 ,'${SET01[i].BDJP4_2}'
//                                 ,'${SET01[i].BDRevise4_3}'
//                                 ,'${SET01[i].BDSublead4_3}'
//                                 ,'${SET01[i].BDGL4_3}'
//                                 ,'${SET01[i].BDMGR4_3}'
//                                 ,'${SET01[i].BDJP4_3}'
//                                 ,'${SET01[i].BDSent4}'
//                                 ,'${SET01[i].Stage4}'
//                                 ,'${SET01[i].Reason4}'
//                             )`;
//                             if (i !== SET01.length - 1) {
//                                 queryInsert = queryInsert + ",";
//                             }
//                         }
//                         query = queryInsert + ";";
//                         // query = queryDelete + queryInsert + ";";
//                         await mssql.qurey(query);
//                         // console.log(query);
//                         // console.log("Insert Complete " + i);
//                         // }
//                     }
//                 } catch (err) {
//                     console.error('Error executing SQL query:', err.message);
//                     res.status(500).send('Internal Server Error');
//                 }
//                 console.log('Month ' + (p + 1) + " Complete " + formatDateTime(new Date().toISOString()))
//                 output = SET01;
//             }
//         }
//     }
//     return res.json(output);
// });

// router.post('/02SARKPI/AchievedCustomer', async (req, res) => {
//     let input = req.body;
//     console.log("--02SARKPI/AchievedCustomer--");
//     console.log(input);
//     console.log("Start " + formatDateTime(new Date().toISOString()));
//     console.log("On process...");

//     let SET01 = [];
//     let output = [];
//     let previousReqNo = null;

//     await loadHolidays();
//     if (input['YEAR'] != undefined) {
//         const year = input['YEAR'];
//         const lastYear = year - 1;
//         const queryDelete = `DELETE FROM [SARKPI].[dbo].[KPI_AchievedCust] WHERE Year IN (${year}, ${lastYear})`;
//         await mssql.qurey(queryDelete);
//         const type = input['TYPE'];

//         const queryRequestLab = `
//             SELECT * FROM [SAR].[dbo].[Routine_RequestLab]
//             WHERE YEAR(SamplingDate) IN (${year}, ${lastYear})
//             AND RequestStatus != 'CANCEL REQUEST'
//             ORDER BY CustShort, SamplingDate;
//         `;
//         const dbRequestLab = await mssql.qurey(queryRequestLab);
//         const requestRecords = dbRequestLab.recordsets[0];
//         // console.log("requestRecords " + requestRecords.length);

//         const queryMasterPattern = `
//             SELECT * From [SAR].[dbo].[Routine_MasterPatternTS] 
//             WHERE TYPE != ''
//             ORDER BY CustShort;
//         `;
//         const dbMasterPattern = await mssql.qurey(queryMasterPattern);
//         const masterRecords = dbMasterPattern.recordsets[0];

//         const groupMap = {};
//         for (let i = 0; i < masterRecords.length; i++) {
//             const record = masterRecords[i];
//             groupMap[record.CustShort] = {
//                 TYPE: record.TYPE,
//                 MKTGROUP: record.MKTGROUP,
//                 GROUP: record.GROUP,
//                 RepItems: record.REPORTITEMS
//             };
//         };
//         // console.log(requestRecords.length);
//         for (let i = 0; i < requestRecords.length; i++) {
//             // console.log(i);
//             const req = requestRecords[i];
//             const samplingDate = new Date(req.SamplingDate);
//             const dayOfMonth = samplingDate.getDate();
//             const monthString = samplingDate.toLocaleString('en-US', { month: '2-digit' });
//             const yearString = samplingDate.getFullYear().toString();

//             let entry = {
//                 "ID": "",
//                 "Type": groupMap[req.CustShort] ? groupMap[req.CustShort].TYPE || "" : "",
//                 "MKTGroup": groupMap[req.CustShort] ? groupMap[req.CustShort].MKTGROUP || "" : "",
//                 "Group": groupMap[req.CustShort] ? groupMap[req.CustShort].GROUP || "" : "",
//                 "Customer": req.CustFull,
//                 "CustShort": req.CustShort,
//                 "Frequency": "",
//                 "Incharge": "",
//                 "KPIServ": groupMap[req.CustShort]
//                     ? (groupMap[req.CustShort].GROUP === 'KAC' ? '100'
//                         : (groupMap[req.CustShort].GROUP === 'MEDIUM' ? '95' : ""))
//                     : "",
//                 "KPIPeriod": groupMap[req.CustShort]
//                     ? (groupMap[req.CustShort].TYPE === 'A' ? '12'
//                         : (groupMap[req.CustShort].TYPE === 'B' ? '10' : ""))
//                     : "",
//                 "RepItems": groupMap[req.CustShort] ? groupMap[req.CustShort].RepItems || "" : "",
//                 "Month": monthString,
//                 "Year": yearString,
//                 "ReqNo1": "",
//                 "Freq1": "",
//                 "Evaluation1": "",
//                 "PlanSam1": "",
//                 "ActSam1": "",
//                 "RepDue1": "",
//                 "SentRep1": "",
//                 "RepDays1": "",
//                 "Request1": "",
//                 "TTCResult1": "",
//                 "IssueDate1": "",
//                 "Sublead1": "",
//                 "GL1": "",
//                 "MGR1": "",
//                 "JP1": "",
//                 "Revise1_1": "",
//                 "Sublead1_1": "",
//                 "GL1_1": "",
//                 "MGR1_1": "",
//                 "JP1_1": "",
//                 "Revise1_2": "",
//                 "Sublead1_2": "",
//                 "GL1_2": "",
//                 "MGR1_2": "",
//                 "JP1_2": "",
//                 "Revise1_3": "",
//                 "Sublead1_3": "",
//                 "GL1_3": "",
//                 "MGR1_3": "",
//                 "JP1_3": "",
//                 "BDPrepare1": "",
//                 "BDTTC1": "",
//                 "BDIssue1": "",
//                 "BDSublead1": "",
//                 "BDGL1": "",
//                 "BDMGR1": "",
//                 "BDJP1": "",
//                 "BDRevise1_1": "",
//                 "BDSublead1_1": "",
//                 "BDGL1_1": "",
//                 "BDMGR1_1": "",
//                 "BDJP1_1": "",
//                 "BDRevise1_2": "",
//                 "BDSublead1_2": "",
//                 "BDGL1_2": "",
//                 "BDMGR1_2": "",
//                 "BDJP1_2": "",
//                 "BDRevise1_3": "",
//                 "BDSublead1_3": "",
//                 "BDGL1_3": "",
//                 "BDMGR1_3": "",
//                 "BDJP1_3": "",
//                 "BDSent1": "",
//                 "Stage1": "",
//                 "Reason1": "",
//                 "ReqNo2": "",
//                 "Freq2": "",
//                 "Evaluation2": "",
//                 "PlanSam2": "",
//                 "ActSam2": "",
//                 "RepDue2": "",
//                 "SentRep2": "",
//                 "RepDays2": "",
//                 "Request2": "",
//                 "TTCResult2": "",
//                 "IssueDate2": "",
//                 "Sublead2": "",
//                 "GL2": "",
//                 "MGR2": "",
//                 "JP2": "",
//                 "Revise2_1": "",
//                 "Sublead2_1": "",
//                 "GL2_1": "",
//                 "MGR2_1": "",
//                 "JP2_1": "",
//                 "Revise2_2": "",
//                 "Sublead2_2": "",
//                 "GL2_2": "",
//                 "MGR2_2": "",
//                 "JP2_2": "",
//                 "Revise2_3": "",
//                 "Sublead2_3": "",
//                 "GL2_3": "",
//                 "MGR2_3": "",
//                 "JP2_3": "",
//                 "BDPrepare2": "",
//                 "BDTTC2": "",
//                 "BDIssue2": "",
//                 "BDSublead2": "",
//                 "BDGL2": "",
//                 "BDMGR2": "",
//                 "BDJP2": "",
//                 "BDRevise2_1": "",
//                 "BDSublead2_1": "",
//                 "BDGL2_1": "",
//                 "BDMGR2_1": "",
//                 "BDJP2_1": "",
//                 "BDRevise2_2": "",
//                 "BDSublead2_2": "",
//                 "BDGL2_2": "",
//                 "BDMGR2_2": "",
//                 "BDJP2_2": "",
//                 "BDRevise2_3": "",
//                 "BDSublead2_3": "",
//                 "BDGL2_3": "",
//                 "BDMGR2_3": "",
//                 "BDJP2_3": "",
//                 "BDSent2": "",
//                 "Stage2": "",
//                 "Reason2": "",
//                 "ReqNo3": "",
//                 "Freq3": "",
//                 "Evaluation3": "",
//                 "PlanSam3": "",
//                 "ActSam3": "",
//                 "RepDue3": "",
//                 "SentRep3": "",
//                 "RepDays3": "",
//                 "Request3": "",
//                 "TTCResult3": "",
//                 "IssueDate3": "",
//                 "Sublead3": "",
//                 "GL3": "",
//                 "MGR3": "",
//                 "JP3": "",
//                 "Revise3_1": "",
//                 "Sublead3_1": "",
//                 "GL3_1": "",
//                 "MGR3_1": "",
//                 "JP3_1": "",
//                 "Revise3_2": "",
//                 "Sublead3_2": "",
//                 "GL3_2": "",
//                 "MGR3_2": "",
//                 "JP3_2": "",
//                 "Revise3_3": "",
//                 "Sublead3_3": "",
//                 "GL3_3": "",
//                 "MGR3_3": "",
//                 "JP3_3": "",
//                 "BDPrepare3": "",
//                 "BDTTC3": "",
//                 "BDIssue3": "",
//                 "BDSublead3": "",
//                 "BDGL3": "",
//                 "BDMGR3": "",
//                 "BDJP3": "",
//                 "BDRevise3_1": "",
//                 "BDSublead3_1": "",
//                 "BDGL3_1": "",
//                 "BDMGR3_1": "",
//                 "BDJP3_1": "",
//                 "BDRevise3_2": "",
//                 "BDSublead3_2": "",
//                 "BDGL3_2": "",
//                 "BDMGR3_2": "",
//                 "BDJP3_2": "",
//                 "BDRevise3_3": "",
//                 "BDSublead3_3": "",
//                 "BDGL3_3": "",
//                 "BDMGR3_3": "",
//                 "BDJP3_3": "",
//                 "BDSent3": "",
//                 "Stage3": "",
//                 "Reason3": "",
//                 "ReqNo4": "",
//                 "Freq4": "",
//                 "Evaluation4": "",
//                 "PlanSam4": "",
//                 "ActSam4": "",
//                 "RepDue4": "",
//                 "SentRep4": "",
//                 "RepDays4": "",
//                 "Request4": "",
//                 "TTCResult4": "",
//                 "IssueDate4": "",
//                 "Sublead4": "",
//                 "GL4": "",
//                 "MGR4": "",
//                 "JP4": "",
//                 "Revise4_1": "",
//                 "Sublead4_1": "",
//                 "GL4_1": "",
//                 "MGR4_1": "",
//                 "JP4_1": "",
//                 "Revise4_2": "",
//                 "Sublead4_2": "",
//                 "GL4_2": "",
//                 "MGR4_2": "",
//                 "JP4_2": "",
//                 "Revise4_3": "",
//                 "Sublead4_3": "",
//                 "GL4_3": "",
//                 "MGR4_3": "",
//                 "JP4_3": "",
//                 "BDPrepare4": "",
//                 "BDTTC4": "",
//                 "BDIssue4": "",
//                 "BDSublead4": "",
//                 "BDGL4": "",
//                 "BDMGR4": "",
//                 "BDJP4": "",
//                 "BDRevise4_1": "",
//                 "BDSublead4_1": "",
//                 "BDGL4_1": "",
//                 "BDMGR4_1": "",
//                 "BDJP4_1": "",
//                 "BDRevise4_2": "",
//                 "BDSublead4_2": "",
//                 "BDGL4_2": "",
//                 "BDMGR4_2": "",
//                 "BDJP4_2": "",
//                 "BDRevise4_3": "",
//                 "BDSublead4_3": "",
//                 "BDGL4_3": "",
//                 "BDMGR4_3": "",
//                 "BDJP4_3": "",
//                 "BDSent4": "",
//                 "Stage4": "",
//                 "Reason4": ""
//             };

//             const kpiPeriod = entry.KPIPeriod;
//             const sentRepDate = new Date(req.SentRep);
//             const RepDue = await calculateRepDue(samplingDate, kpiPeriod);
//             const RepDays = await calculateBusinessDays(samplingDate, sentRepDate);
//             // const RepDue = 'Test';
//             // const RepDays = 'Test';
//             const reqNo = req.ReqNo;
//             const CloseLine = req.RequestStatus;

//             if (reqNo === previousReqNo) {
//                 // console.log("Jump");
//                 continue;
//             } else {
//                 // console.log(reqNo)
//             }

//             previousReqNo = reqNo;

//             let week = 0;
//             if (dayOfMonth >= 1 && dayOfMonth <= 8) {
//                 week = 1;
//             } else if (dayOfMonth >= 9 && dayOfMonth <= 16) {
//                 week = 2;
//             } else if (dayOfMonth >= 17 && dayOfMonth <= 24) {
//                 week = 3;
//             } else if (dayOfMonth >= 25 && dayOfMonth <= 31) {
//                 week = 4;
//             }

//             // console.log("week: " + week);
//             switch (week) {
//                 case 1:
//                     if (CloseLine == "CLOSE LINE") {
//                         entry["ReqNo1"] = reqNo;
//                         entry["Freq1"] = "CLOSE LINE";
//                         entry["PlanSam1"] = "CLOSE LINE";
//                         entry["ActSam1"] = "CLOSE LINE";
//                         entry["RepDue1"] = "CLOSE LINE";
//                         entry["SentRep1"] = "CLOSE LINE";
//                         entry["RepDays1"] = "CLOSE LINE";
//                         break;
//                     } else {
//                         entry["ReqNo1"] = reqNo;
//                         entry["Freq1"] = "1";
//                         entry["PlanSam1"] = formatDate(samplingDate);
//                         entry["ActSam1"] = formatDate(samplingDate);
//                         entry["RepDue1"] = RepDue.RepDue;
//                         entry["SentRep1"] = formatDate(sentRepDate);
//                         entry["RepDays1"] = RepDays;
//                         break;
//                     }
//                 case 2:
//                     if (CloseLine == "CLOSE LINE") {
//                         entry["ReqNo2"] = reqNo;
//                         entry["Freq2"] = "CLOSE LINE";
//                         entry["PlanSam2"] = "CLOSE LINE";
//                         entry["ActSam2"] = "CLOSE LINE";
//                         entry["RepDue2"] = "CLOSE LINE";
//                         entry["SentRep2"] = "CLOSE LINE";
//                         entry["RepDays2"] = "CLOSE LINE";
//                         break;
//                     } else {
//                         entry["ReqNo2"] = reqNo;
//                         entry["Freq2"] = "1";
//                         entry["PlanSam2"] = formatDate(samplingDate);
//                         entry["ActSam2"] = formatDate(samplingDate);
//                         entry["RepDue2"] = RepDue.RepDue;
//                         entry["SentRep2"] = formatDate(sentRepDate);
//                         entry["RepDays2"] = RepDays;
//                         break;
//                     }
//                 case 3:
//                     if (CloseLine == "CLOSE LINE") {
//                         entry["ReqNo3"] = reqNo;
//                         entry["Freq3"] = "CLOSE LINE";
//                         entry["PlanSam3"] = "CLOSE LINE";
//                         entry["ActSam3"] = "CLOSE LINE";
//                         entry["RepDue3"] = "CLOSE LINE";
//                         entry["SentRep3"] = "CLOSE LINE";
//                         entry["RepDays3"] = "CLOSE LINE";
//                         break;
//                     } else {
//                         entry["ReqNo3"] = reqNo;
//                         entry["Freq3"] = "1";
//                         entry["PlanSam3"] = formatDate(samplingDate);
//                         entry["ActSam3"] = formatDate(samplingDate);
//                         entry["RepDue3"] = RepDue.RepDue;
//                         entry["SentRep3"] = formatDate(sentRepDate);
//                         entry["RepDays3"] = RepDays;
//                         break;
//                     }
//                 case 4:
//                     if (CloseLine == "CLOSE LINE") {
//                         entry["ReqNo4"] = reqNo;
//                         entry["Freq4"] = "CLOSE LINE";
//                         entry["PlanSam4"] = "CLOSE LINE";
//                         entry["ActSam4"] = "CLOSE LINE";
//                         entry["RepDue4"] = "CLOSE LINE";
//                         entry["SentRep4"] = "CLOSE LINE";
//                         entry["RepDays4"] = "CLOSE LINE";
//                         break;
//                     } else {
//                         entry["ReqNo4"] = reqNo;
//                         entry["Freq4"] = "1";
//                         entry["PlanSam4"] = formatDate(samplingDate);
//                         entry["ActSam4"] = formatDate(samplingDate);
//                         entry["RepDue4"] = RepDue.RepDue;
//                         entry["SentRep4"] = formatDate(sentRepDate);
//                         entry["RepDays4"] = RepDays;
//                         break;
//                     }
//             }
//             SET01.push(entry);
//         };
//         console.log("SET01 " + SET01.length);
//         try {
//             for (let i = 0; i < SET01.length; i++) {
//                 // const queryCheck = `SELECT COUNT(*) AS count FROM [SARKPI].[dbo].[KPI_AchievedCust]
//                 //         WHERE [CustShort] = '${SET01[i].CustShort}' 
//                 //         AND [Month] = '${SET01[i].Month}' 
//                 //         AND [Year] = '${SET01[i].Year}'
//                 //         AND ([ReqNo1] = '${SET01[i].ReqNo1}'
//                 //         OR [ReqNo2] = '${SET01[i].ReqNo2}'
//                 //         OR [ReqNo3] = '${SET01[i].ReqNo3}'
//                 //         OR [ReqNo4] = '${SET01[i].ReqNo4}')`;
//                 // const result = await mssql.qurey(queryCheck);
//                 // // console.log('queryCheck:' + queryCheck);
//                 // if (result.recordset[0].count > 0) {
//                 //     const queryUpdate = `UPDATE [SARKPI].[dbo].[KPI_AchievedCust]
//                 //             SET [Type] = '${SET01[i].Type}', 
//                 //                 [MKTGroup] = '${SET01[i].MKTGroup}', 
//                 //                 [Group] = '${SET01[i].Group}', 
//                 //                 [Customer] = '${SET01[i].Customer}', 
//                 //                 [CustShort] = '${SET01[i].CustShort}', 
//                 //                 [Frequency] = '${SET01[i].Frequency}', 
//                 //                 [Incharge] = '${SET01[i].Incharge}', 
//                 //                 [KPIServ] = '${SET01[i].KPIServ}', 
//                 //                 [KPIPeriod] = '${SET01[i].KPIPeriod}', 
//                 //                 [RepItems] = '${SET01[i].RepItems}', 
//                 //                 [Month] = '${SET01[i].Month}', 
//                 //                 [Year] = '${SET01[i].Year}', 
//                 //                 [ReqNo1] = '${SET01[i].ReqNo1}', 
//                 //                 [Freq1] = '${SET01[i].Freq1}', 
//                 //                 [Evaluation1] = '${SET01[i].Evaluation1}', 
//                 //                 [PlanSam1] = '${SET01[i].PlanSam1}', 
//                 //                 [ActSam1] = '${SET01[i].ActSam1}', 
//                 //                 [RepDue1] = '${SET01[i].RepDue1}', 
//                 //                 [SentRep1] = '${SET01[i].SentRep1}', 
//                 //                 [RepDays1] = '${SET01[i].RepDays1}', 
//                 //                 [Request1] = '${SET01[i].Request1}', 
//                 //                 [TTCResult1] = '${SET01[i].TTCResult1}', 
//                 //                 [IssueDate1] = '${SET01[i].IssueDate1}', 
//                 //                 [Sublead1] = '${SET01[i].Sublead1}', 
//                 //                 [GL1] = '${SET01[i].GL1}', 
//                 //                 [MGR1] = '${SET01[i].MGR1}', 
//                 //                 [JP1] = '${SET01[i].JP1}', 
//                 //                 [Revise1_1] = '${SET01[i].Revise1_1}', 
//                 //                 [Sublead1_1] = '${SET01[i].Sublead1_1}', 
//                 //                 [GL1_1] = '${SET01[i].GL1_1}', 
//                 //                 [MGR1_1] = '${SET01[i].MGR1_1}', 
//                 //                 [JP1_1] = '${SET01[i].JP1_1}', 
//                 //                 [Revise1_2] = '${SET01[i].Revise1_2}', 
//                 //                 [Sublead1_2] = '${SET01[i].Sublead1_2}', 
//                 //                 [GL1_2] = '${SET01[i].GL1_2}', 
//                 //                 [MGR1_2] = '${SET01[i].MGR1_2}', 
//                 //                 [JP1_2] = '${SET01[i].JP1_2}', 
//                 //                 [Revise1_3] = '${SET01[i].Revise1_3}', 
//                 //                 [Sublead1_3] = '${SET01[i].Sublead1_3}', 
//                 //                 [GL1_3] = '${SET01[i].GL1_3}', 
//                 //                 [MGR1_3] = '${SET01[i].MGR1_3}', 
//                 //                 [JP1_3] = '${SET01[i].JP1_3}', 
//                 //                 [BDPrepare1] = '${SET01[i].BDPrepare1}', 
//                 //                 [BDTTC1] = '${SET01[i].BDTTC1}', 
//                 //                 [BDIssue1] = '${SET01[i].BDIssue1}', 
//                 //                 [BDSublead1] = '${SET01[i].BDSublead1}', 
//                 //                 [BDGL1] = '${SET01[i].BDGL1}', 
//                 //                 [BDMGR1] = '${SET01[i].BDMGR1}', 
//                 //                 [BDJP1] = '${SET01[i].BDJP1}', 
//                 //                 [BDRevise1_1] = '${SET01[i].BDRevise1_1}', 
//                 //                 [BDSublead1_1] = '${SET01[i].BDSublead1_1}', 
//                 //                 [BDGL1_1] = '${SET01[i].BDGL1_1}', 
//                 //                 [BDMGR1_1] = '${SET01[i].BDMGR1_1}', 
//                 //                 [BDJP1_1] = '${SET01[i].BDJP1_1}', 
//                 //                 [BDRevise1_2] = '${SET01[i].BDRevise1_2}', 
//                 //                 [BDSublead1_2] = '${SET01[i].BDSublead1_2}', 
//                 //                 [BDGL1_2] = '${SET01[i].BDGL1_2}', 
//                 //                 [BDMGR1_2] = '${SET01[i].BDMGR1_2}', 
//                 //                 [BDJP1_2] = '${SET01[i].BDJP1_2}', 
//                 //                 [BDRevise1_3] = '${SET01[i].BDRevise1_3}', 
//                 //                 [BDSublead1_3] = '${SET01[i].BDSublead1_3}', 
//                 //                 [BDGL1_3] = '${SET01[i].BDGL1_3}', 
//                 //                 [BDMGR1_3] = '${SET01[i].BDMGR1_3}', 
//                 //                 [BDJP1_3] = '${SET01[i].BDJP1_3}', 
//                 //                 [BDSent1] = '${SET01[i].BDSent1}', 
//                 //                 [Stage1] = '${SET01[i].Stage1}',
//                 //                 [Reason1] = '${SET01[i].Reason1}', 
//                 //                 [ReqNo2] = '${SET01[i].ReqNo2}', 
//                 //                 [Freq2] = '${SET01[i].Freq2}', 
//                 //                 [Evaluation2] = '${SET01[i].Evaluation2}', 
//                 //                 [PlanSam2] = '${SET01[i].PlanSam2}', 
//                 //                 [ActSam2] = '${SET01[i].ActSam2}', 
//                 //                 [RepDue2] = '${SET01[i].RepDue2}', 
//                 //                 [SentRep2] = '${SET01[i].SentRep2}', 
//                 //                 [RepDays2] = '${SET01[i].RepDays2}', 
//                 //                 [Request2] = '${SET01[i].Request2}', 
//                 //                 [TTCResult2] = '${SET01[i].TTCResult2}', 
//                 //                 [IssueDate2] = '${SET01[i].IssueDate2}', 
//                 //                 [Sublead2] = '${SET01[i].Sublead2}', 
//                 //                 [GL2] = '${SET01[i].GL2}', 
//                 //                 [MGR2] = '${SET01[i].MGR2}', 
//                 //                 [JP2] = '${SET01[i].JP2}', 
//                 //                 [Revise2_1] = '${SET01[i].Revise2_1}', 
//                 //                 [Sublead2_1] = '${SET01[i].Sublead2_1}', 
//                 //                 [GL2_1] = '${SET01[i].GL2_1}', 
//                 //                 [MGR2_1] = '${SET01[i].MGR2_1}', 
//                 //                 [JP2_1] = '${SET01[i].JP2_1}', 
//                 //                 [Revise2_2] = '${SET01[i].Revise2_2}', 
//                 //                 [Sublead2_2] = '${SET01[i].Sublead2_2}', 
//                 //                 [GL2_2] = '${SET01[i].GL2_2}', 
//                 //                 [MGR2_2] = '${SET01[i].MGR2_2}', 
//                 //                 [JP2_2] = '${SET01[i].JP2_2}', 
//                 //                 [Revise2_3] = '${SET01[i].Revise2_3}', 
//                 //                 [Sublead2_3] = '${SET01[i].Sublead2_3}', 
//                 //                 [GL2_3] = '${SET01[i].GL2_3}', 
//                 //                 [MGR2_3] = '${SET01[i].MGR2_3}', 
//                 //                 [JP2_3] = '${SET01[i].JP2_3}', 
//                 //                 [BDPrepare2] = '${SET01[i].BDPrepare2}', 
//                 //                 [BDTTC2] = '${SET01[i].BDTTC2}', 
//                 //                 [BDIssue2] = '${SET01[i].BDIssue2}', 
//                 //                 [BDSublead2] = '${SET01[i].BDSublead2}', 
//                 //                 [BDGL2] = '${SET01[i].BDGL2}', 
//                 //                 [BDMGR2] = '${SET01[i].BDMGR2}', 
//                 //                 [BDJP2] = '${SET01[i].BDJP2}', 
//                 //                 [BDRevise2_1] = '${SET01[i].BDRevise2_1}', 
//                 //                 [BDSublead2_1] = '${SET01[i].BDSublead2_1}', 
//                 //                 [BDGL2_1] = '${SET01[i].BDGL2_1}', 
//                 //                 [BDMGR2_1] = '${SET01[i].BDMGR2_1}', 
//                 //                 [BDJP2_1] = '${SET01[i].BDJP2_1}', 
//                 //                 [BDRevise2_2] = '${SET01[i].BDRevise2_2}', 
//                 //                 [BDSublead2_2] = '${SET01[i].BDSublead2_2}', 
//                 //                 [BDGL2_2] = '${SET01[i].BDGL2_2}', 
//                 //                 [BDMGR2_2] = '${SET01[i].BDMGR2_2}', 
//                 //                 [BDJP2_2] = '${SET01[i].BDJP2_2}', 
//                 //                 [BDRevise2_3] = '${SET01[i].BDRevise2_3}', 
//                 //                 [BDSublead2_3] = '${SET01[i].BDSublead2_3}', 
//                 //                 [BDGL2_3] = '${SET01[i].BDGL2_3}', 
//                 //                 [BDMGR2_3] = '${SET01[i].BDMGR2_3}', 
//                 //                 [BDJP2_3] = '${SET01[i].BDJP2_3}', 
//                 //                 [BDSent2] = '${SET01[i].BDSent2}', 
//                 //                 [Stage2] = '${SET01[i].Stage2}',
//                 //                 [Reason2] = '${SET01[i].Reason2}', 
//                 //                 [ReqNo3] = '${SET01[i].ReqNo3}', 
//                 //                 [Freq3] = '${SET01[i].Freq3}', 
//                 //                 [Evaluation3] = '${SET01[i].Evaluation3}', 
//                 //                 [PlanSam3] = '${SET01[i].PlanSam3}', 
//                 //                 [ActSam3] = '${SET01[i].ActSam3}', 
//                 //                 [RepDue3] = '${SET01[i].RepDue3}', 
//                 //                 [SentRep3] = '${SET01[i].SentRep3}', 
//                 //                 [RepDays3] = '${SET01[i].RepDays3}', 
//                 //                 [Request3] = '${SET01[i].Request3}', 
//                 //                 [TTCResult3] = '${SET01[i].TTCResult3}', 
//                 //                 [IssueDate3] = '${SET01[i].IssueDate3}', 
//                 //                 [Sublead3] = '${SET01[i].Sublead3}', 
//                 //                 [GL3] = '${SET01[i].GL3}', 
//                 //                 [MGR3] = '${SET01[i].MGR3}', 
//                 //                 [JP3] = '${SET01[i].JP3}', 
//                 //                 [Revise3_1] = '${SET01[i].Revise3_1}', 
//                 //                 [Sublead3_1] = '${SET01[i].Sublead3_1}', 
//                 //                 [GL3_1] = '${SET01[i].GL3_1}', 
//                 //                 [MGR3_1] = '${SET01[i].MGR3_1}', 
//                 //                 [JP3_1] = '${SET01[i].JP3_1}', 
//                 //                 [Revise3_2] = '${SET01[i].Revise3_2}', 
//                 //                 [Sublead3_2] = '${SET01[i].Sublead3_2}', 
//                 //                 [GL3_2] = '${SET01[i].GL3_2}', 
//                 //                 [MGR3_2] = '${SET01[i].MGR3_2}', 
//                 //                 [JP3_2] = '${SET01[i].JP3_2}', 
//                 //                 [Revise3_3] = '${SET01[i].Revise3_3}', 
//                 //                 [Sublead3_3] = '${SET01[i].Sublead3_3}', 
//                 //                 [GL3_3] = '${SET01[i].GL3_3}', 
//                 //                 [MGR3_3] = '${SET01[i].MGR3_3}', 
//                 //                 [JP3_3] = '${SET01[i].JP3_3}', 
//                 //                 [BDPrepare3] = '${SET01[i].BDPrepare3}', 
//                 //                 [BDTTC3] = '${SET01[i].BDTTC3}', 
//                 //                 [BDIssue3] = '${SET01[i].BDIssue3}', 
//                 //                 [BDSublead3] = '${SET01[i].BDSublead3}', 
//                 //                 [BDGL3] = '${SET01[i].BDGL3}', 
//                 //                 [BDMGR3] = '${SET01[i].BDMGR3}', 
//                 //                 [BDJP3] = '${SET01[i].BDJP3}', 
//                 //                 [BDRevise3_1] = '${SET01[i].BDRevise3_1}', 
//                 //                 [BDSublead3_1] = '${SET01[i].BDSublead3_1}', 
//                 //                 [BDGL3_1] = '${SET01[i].BDGL3_1}', 
//                 //                 [BDMGR3_1] = '${SET01[i].BDMGR3_1}', 
//                 //                 [BDJP3_1] = '${SET01[i].BDJP3_1}', 
//                 //                 [BDRevise3_2] = '${SET01[i].BDRevise3_2}', 
//                 //                 [BDSublead3_2] = '${SET01[i].BDSublead3_2}', 
//                 //                 [BDGL3_2] = '${SET01[i].BDGL3_2}', 
//                 //                 [BDMGR3_2] = '${SET01[i].BDMGR3_2}', 
//                 //                 [BDJP3_2] = '${SET01[i].BDJP3_2}', 
//                 //                 [BDRevise3_3] = '${SET01[i].BDRevise3_3}', 
//                 //                 [BDSublead3_3] = '${SET01[i].BDSublead3_3}', 
//                 //                 [BDGL3_3] = '${SET01[i].BDGL3_3}', 
//                 //                 [BDMGR3_3] = '${SET01[i].BDMGR3_3}', 
//                 //                 [BDJP3_3] = '${SET01[i].BDJP3_3}', 
//                 //                 [BDSent3] = '${SET01[i].BDSent3}', 
//                 //                 [Stage3] = '${SET01[i].Stage3}',
//                 //                 [Reason3] = '${SET01[i].Reason3}', 
//                 //                 [ReqNo4] = '${SET01[i].ReqNo4}', 
//                 //                 [Freq4] = '${SET01[i].Freq4}', 
//                 //                 [Evaluation4] = '${SET01[i].Evaluation4}', 
//                 //                 [PlanSam4] = '${SET01[i].PlanSam4}', 
//                 //                 [ActSam4] = '${SET01[i].ActSam4}', 
//                 //                 [RepDue4] = '${SET01[i].RepDue4}', 
//                 //                 [SentRep4] = '${SET01[i].SentRep4}', 
//                 //                 [RepDays4] = '${SET01[i].RepDays4}', 
//                 //                 [Request4] = '${SET01[i].Request4}', 
//                 //                 [TTCResult4] = '${SET01[i].TTCResult4}', 
//                 //                 [IssueDate4] = '${SET01[i].IssueDate4}', 
//                 //                 [Sublead4] = '${SET01[i].Sublead4}', 
//                 //                 [GL4] = '${SET01[i].GL4}', 
//                 //                 [MGR4] = '${SET01[i].MGR4}', 
//                 //                 [JP4] = '${SET01[i].JP4}', 
//                 //                 [Revise4_1] = '${SET01[i].Revise4_1}', 
//                 //                 [Sublead4_1] = '${SET01[i].Sublead4_1}', 
//                 //                 [GL4_1] = '${SET01[i].GL4_1}', 
//                 //                 [MGR4_1] = '${SET01[i].MGR4_1}', 
//                 //                 [JP4_1] = '${SET01[i].JP4_1}', 
//                 //                 [Revise4_2] = '${SET01[i].Revise4_2}', 
//                 //                 [Sublead4_2] = '${SET01[i].Sublead4_2}', 
//                 //                 [GL4_2] = '${SET01[i].GL4_2}', 
//                 //                 [MGR4_2] = '${SET01[i].MGR4_2}', 
//                 //                 [JP4_2] = '${SET01[i].JP4_2}', 
//                 //                 [Revise4_3] = '${SET01[i].Revise4_3}', 
//                 //                 [Sublead4_3] = '${SET01[i].Sublead4_3}', 
//                 //                 [GL4_3] = '${SET01[i].GL4_3}', 
//                 //                 [MGR4_3] = '${SET01[i].MGR4_3}', 
//                 //                 [JP4_3] = '${SET01[i].JP4_3}', 
//                 //                 [BDPrepare4] = '${SET01[i].BDPrepare4}', 
//                 //                 [BDTTC4] = '${SET01[i].BDTTC4}', 
//                 //                 [BDIssue4] = '${SET01[i].BDIssue4}', 
//                 //                 [BDSublead4] = '${SET01[i].BDSublead4}', 
//                 //                 [BDGL4] = '${SET01[i].BDGL4}', 
//                 //                 [BDMGR4] = '${SET01[i].BDMGR4}', 
//                 //                 [BDJP4] = '${SET01[i].BDJP4}', 
//                 //                 [BDRevise4_1] = '${SET01[i].BDRevise4_1}', 
//                 //                 [BDSublead4_1] = '${SET01[i].BDSublead4_1}', 
//                 //                 [BDGL4_1] = '${SET01[i].BDGL4_1}', 
//                 //                 [BDMGR4_1] = '${SET01[i].BDMGR4_1}', 
//                 //                 [BDJP4_1] = '${SET01[i].BDJP4_1}', 
//                 //                 [BDRevise4_2] = '${SET01[i].BDRevise4_2}', 
//                 //                 [BDSublead4_2] = '${SET01[i].BDSublead4_2}', 
//                 //                 [BDGL4_2] = '${SET01[i].BDGL4_2}', 
//                 //                 [BDMGR4_2] = '${SET01[i].BDMGR4_2}', 
//                 //                 [BDJP4_2] = '${SET01[i].BDJP4_2}', 
//                 //                 [BDRevise4_3] = '${SET01[i].BDRevise4_3}', 
//                 //                 [BDSublead4_3] = '${SET01[i].BDSublead4_3}', 
//                 //                 [BDGL4_3] = '${SET01[i].GL4_3}', 
//                 //                 [BDMGR4_3] = '${SET01[i].BDMGR4_3}', 
//                 //                 [BDJP4_3] = '${SET01[i].BDJP4_3}', 
//                 //                 [BDSent4] = '${SET01[i].BDSent4}',
//                 //                 [Stage4] = '${SET01[i].Stage4}', 
//                 //                 [Reason4] = '${SET01[i].Reason4}'
//                 //                 WHERE [CustShort] = '${SET01[i].CustShort}' 
//                 //                 AND [Month] = '${SET01[i].Month}' 
//                 //                 AND [Year] = '${SET01[i].Year}'
//                 //                 AND [ReqNo1] = '${SET01[i].ReqNo1}'
//                 //                 AND [ReqNo2] = '${SET01[i].ReqNo2}'
//                 //                 AND [ReqNo3] = '${SET01[i].ReqNo3}'
//                 //                 AND [ReqNo4] = '${SET01[i].ReqNo4}';`;
//                 //     await mssql.qurey(queryUpdate);
//                 //     // console.log('queryUpdate:' + queryUpdate);
//                 //     // console.log("Update Complete " + i);
//                 // } else {
//                 var queryInsert = `INSERT INTO [SARKPI].[dbo].[KPI_AchievedCust] 
//                     ([Type], [MKTGroup], [Group], [Customer], [CustShort], [Frequency], [Incharge], [KPIServ], [KPIPeriod], [RepItems], [Month], [Year], [ReqNo1], [Freq1], [Evaluation1], [PlanSam1], [ActSam1], [RepDue1], [SentRep1], [RepDays1], [Request1], [TTCResult1], 
//                     [IssueDate1], [Sublead1], [GL1], [MGR1], [JP1], [Revise1_1], [Sublead1_1], [GL1_1], [MGR1_1], [JP1_1], [Revise1_2], [Sublead1_2], [GL1_2], [MGR1_2], [JP1_2], [Revise1_3], [Sublead1_3], [GL1_3], [MGR1_3], [JP1_3], [BDPrepare1], [BDTTC1], [BDIssue1], [BDSublead1], [BDGL1], 
//                     [BDMGR1], [BDJP1], [BDRevise1_1], [BDSublead1_1], [BDGL1_1], [BDMGR1_1], [BDJP1_1], [BDRevise1_2], [BDSublead1_2], [BDGL1_2], [BDMGR1_2], [BDJP1_2], [BDRevise1_3], [BDSublead1_3], [BDGL1_3], [BDMGR1_3], [BDJP1_3], [BDSent1], [Stage1], [Reason1], [ReqNo2], 
//                     [Freq2], [Evaluation2], [PlanSam2], [ActSam2], [RepDue2], [SentRep2], [RepDays2], [Request2], [TTCResult2], [IssueDate2], [Sublead2], [GL2], [MGR2], [JP2], [Revise2_1], [Sublead2_1], [GL2_1], [MGR2_1], [JP2_1], [Revise2_2], [Sublead2_2], [GL2_2], [MGR2_2], [JP2_2], 
//                     [Revise2_3], [Sublead2_3], [GL2_3], [MGR2_3], [JP2_3], [BDPrepare2], [BDTTC2], [BDIssue2], [BDSublead2], [BDGL2], [BDMGR2], [BDJP2], [BDRevise2_1], [BDSublead2_1], [BDGL2_1], [BDMGR2_1], [BDJP2_1], [BDRevise2_2], [BDSublead2_2], [BDGL2_2], [BDMGR2_2], 
//                     [BDJP2_2], [BDRevise2_3], [BDSublead2_3], [BDGL2_3], [BDMGR2_3], [BDJP2_3], [BDSent2], [Stage2], [Reason2], [ReqNo3], [Freq3], [Evaluation3], [PlanSam3], [ActSam3], [RepDue3], [SentRep3], [RepDays3], [Request3], [TTCResult3], [IssueDate3], [Sublead3], [GL3], [MGR3], [JP3], 
//                     [Revise3_1], [Sublead3_1], [GL3_1], [MGR3_1], [JP3_1], [Revise3_2], [Sublead3_2], [GL3_2], [MGR3_2], [JP3_2], [Revise3_3], [Sublead3_3], [GL3_3], [MGR3_3], [JP3_3], [BDPrepare3], [BDTTC3], [BDIssue3], [BDSublead3], [BDGL3], [BDMGR3], [BDJP3], [BDRevise3_1], 
//                     [BDSublead3_1], [BDGL3_1], [BDMGR3_1], [BDJP3_1], [BDRevise3_2], [BDSublead3_2], [BDGL3_2], [BDMGR3_2], [BDJP3_2], [BDRevise3_3], [BDSublead3_3], [BDGL3_3], [BDMGR3_3], [BDJP3_3], [BDSent3], [Stage3], [Reason3], [ReqNo4], [Freq4], [Evaluation4], [PlanSam4], 
//                     [ActSam4], [RepDue4], [SentRep4], [RepDays4], [Request4], [TTCResult4], [IssueDate4], [Sublead4], [GL4], [MGR4], [JP4], [Revise4_1], [Sublead4_1], [GL4_1], [MGR4_1], [JP4_1], [Revise4_2], [Sublead4_2], [GL4_2], [MGR4_2], [JP4_2], [Revise4_3], [Sublead4_3], [GL4_3], 
//                     [MGR4_3], [JP4_3], [BDPrepare4], [BDTTC4], [BDIssue4], [BDSublead4], [BDGL4], [BDMGR4], [BDJP4], [BDRevise4_1], [BDSublead4_1], [BDGL4_1], [BDMGR4_1], [BDJP4_1], [BDRevise4_2], [BDSublead4_2], [BDGL4_2], [BDMGR4_2], [BDJP4_2], [BDRevise4_3], 
//                     [BDSublead4_3], [BDGL4_3], [BDMGR4_3], [BDJP4_3], [BDSent4], [Stage4], [Reason4]) 
//                     values `;

//                 // for (i = 0; i < SET01.length; i++) {
//                 queryInsert =
//                     queryInsert +
//                     `( '${SET01[i].Type}'
//                             ,'${SET01[i].MKTGroup}'
//                             ,'${SET01[i].Group}'
//                             ,'${SET01[i].Customer}'
//                             ,'${SET01[i].CustShort}'
//                             ,'${SET01[i].Frequency}'
//                             ,'${SET01[i].Incharge}'
//                             ,'${SET01[i].KPIServ}'
//                             ,'${SET01[i].KPIPeriod}'
//                             ,'${SET01[i].RepItems}'
//                             ,'${SET01[i].Month}'
//                             ,'${SET01[i].Year}'
//                             ,'${SET01[i].ReqNo1}'
//                             ,'${SET01[i].Freq1}'
//                             ,'${SET01[i].Evaluation1}'
//                             ,'${SET01[i].PlanSam1}'
//                             ,'${SET01[i].ActSam1}'
//                             ,'${SET01[i].RepDue1}'
//                             ,'${SET01[i].SentRep1}'
//                             ,'${SET01[i].RepDays1}'
//                             ,'${SET01[i].Request1}'
//                             ,'${SET01[i].TTCResult1}'
//                             ,'${SET01[i].IssueDate1}'
//                             ,'${SET01[i].Sublead1}'
//                             ,'${SET01[i].GL1}'
//                             ,'${SET01[i].MGR1}'
//                             ,'${SET01[i].JP1}'
//                             ,'${SET01[i].Revise1_1}'
//                             ,'${SET01[i].Sublead1_1}'
//                             ,'${SET01[i].GL1_1}'
//                             ,'${SET01[i].MGR1_1}'
//                             ,'${SET01[i].JP1_1}'
//                             ,'${SET01[i].Revise1_2}'
//                             ,'${SET01[i].Sublead1_2}'
//                             ,'${SET01[i].GL1_2}'
//                             ,'${SET01[i].MGR1_2}'
//                             ,'${SET01[i].JP1_2}'
//                             ,'${SET01[i].Revise1_3}'
//                             ,'${SET01[i].Sublead1_3}'
//                             ,'${SET01[i].GL1_3}'
//                             ,'${SET01[i].MGR1_3}'
//                             ,'${SET01[i].JP1_3}'
//                             ,'${SET01[i].BDPrepare1}'
//                             ,'${SET01[i].BDTTC1}'
//                             ,'${SET01[i].BDIssue1}'
//                             ,'${SET01[i].BDSublead1}'
//                             ,'${SET01[i].BDGL1}'
//                             ,'${SET01[i].BDMGR1}'
//                             ,'${SET01[i].BDJP1}'
//                             ,'${SET01[i].BDRevise1_1}'
//                             ,'${SET01[i].BDSublead1_1}'
//                             ,'${SET01[i].BDGL1_1}'
//                             ,'${SET01[i].BDMGR1_1}'
//                             ,'${SET01[i].BDJP1_1}'
//                             ,'${SET01[i].BDRevise1_2}'
//                             ,'${SET01[i].BDSublead1_2}'
//                             ,'${SET01[i].BDGL1_2}'
//                             ,'${SET01[i].BDMGR1_2}'
//                             ,'${SET01[i].BDJP1_2}'          
//                             ,'${SET01[i].BDRevise1_3}'
//                             ,'${SET01[i].BDSublead1_3}'
//                             ,'${SET01[i].BDGL1_3}'
//                             ,'${SET01[i].BDMGR1_3}'
//                             ,'${SET01[i].BDJP1_3}'
//                             ,'${SET01[i].BDSent1}'
//                             ,'${SET01[i].Stage1}'  
//                             ,'${SET01[i].Reason1}'  
//                             ,'${SET01[i].ReqNo2}'
//                             ,'${SET01[i].Freq2}'
//                             ,'${SET01[i].Evaluation2}'
//                             ,'${SET01[i].PlanSam2}'
//                             ,'${SET01[i].ActSam2}'
//                             ,'${SET01[i].RepDue2}'
//                             ,'${SET01[i].SentRep2}'
//                             ,'${SET01[i].RepDays2}'
//                             ,'${SET01[i].Request2}'
//                             ,'${SET01[i].TTCResult2}'
//                             ,'${SET01[i].IssueDate2}'
//                             ,'${SET01[i].Sublead2}'
//                             ,'${SET01[i].GL2}'
//                             ,'${SET01[i].MGR2}'
//                             ,'${SET01[i].JP2}'
//                             ,'${SET01[i].Revise2_1}'
//                             ,'${SET01[i].Sublead2_1}'
//                             ,'${SET01[i].GL2_1}'
//                             ,'${SET01[i].MGR2_1}'
//                             ,'${SET01[i].JP2_1}'
//                             ,'${SET01[i].Revise2_2}'
//                             ,'${SET01[i].Sublead2_2}'
//                             ,'${SET01[i].GL2_2}'
//                             ,'${SET01[i].MGR2_2}'
//                             ,'${SET01[i].JP2_2}'
//                             ,'${SET01[i].Revise2_3}'
//                             ,'${SET01[i].Sublead2_3}'
//                             ,'${SET01[i].GL2_3}'
//                             ,'${SET01[i].MGR2_3}'
//                             ,'${SET01[i].JP2_3}'
//                             ,'${SET01[i].BDPrepare2}'
//                             ,'${SET01[i].BDTTC2}'
//                             ,'${SET01[i].BDIssue2}'
//                             ,'${SET01[i].BDSublead2}'
//                             ,'${SET01[i].BDGL2}'
//                             ,'${SET01[i].BDMGR2}'
//                             ,'${SET01[i].BDJP2}'
//                             ,'${SET01[i].BDRevise2_1}'
//                             ,'${SET01[i].BDSublead2_1}'
//                             ,'${SET01[i].BDGL2_1}'
//                             ,'${SET01[i].BDMGR2_1}'
//                             ,'${SET01[i].BDJP2_1}'
//                             ,'${SET01[i].BDRevise2_2}'
//                             ,'${SET01[i].BDSublead2_2}'
//                             ,'${SET01[i].BDGL2_2}'
//                             ,'${SET01[i].BDMGR2_2}'
//                             ,'${SET01[i].BDJP2_2}'
//                             ,'${SET01[i].BDRevise2_3}'
//                             ,'${SET01[i].BDSublead2_3}'
//                             ,'${SET01[i].BDGL2_3}'  
//                             ,'${SET01[i].BDMGR2_3}'
//                             ,'${SET01[i].BDJP2_3}'
//                             ,'${SET01[i].BDSent2}'
//                             ,'${SET01[i].Stage2}'
//                             ,'${SET01[i].Reason2}'
//                             ,'${SET01[i].ReqNo3}'
//                             ,'${SET01[i].Freq3}'
//                             ,'${SET01[i].Evaluation3}'
//                             ,'${SET01[i].PlanSam3}'
//                             ,'${SET01[i].ActSam3}'
//                             ,'${SET01[i].RepDue3}'  
//                             ,'${SET01[i].SentRep3}'
//                             ,'${SET01[i].RepDays3}'
//                             ,'${SET01[i].Request3}'
//                             ,'${SET01[i].TTCResult3}'
//                             ,'${SET01[i].IssueDate3}'
//                             ,'${SET01[i].Sublead3}'
//                             ,'${SET01[i].GL3}'
//                             ,'${SET01[i].MGR3}'
//                             ,'${SET01[i].JP3}'
//                             ,'${SET01[i].Revise3_1}'
//                             ,'${SET01[i].Sublead3_1}'
//                             ,'${SET01[i].GL3_1}'
//                             ,'${SET01[i].MGR3_1}'
//                             ,'${SET01[i].JP3_1}'
//                             ,'${SET01[i].Revise3_2}'
//                             ,'${SET01[i].Sublead3_2}'
//                             ,'${SET01[i].GL3_2}'
//                             ,'${SET01[i].MGR3_2}'
//                             ,'${SET01[i].JP3_2}'
//                             ,'${SET01[i].Revise3_3}'
//                             ,'${SET01[i].Sublead3_3}'
//                             ,'${SET01[i].GL3_3}'
//                             ,'${SET01[i].MGR3_3}'
//                             ,'${SET01[i].JP3_3}'
//                             ,'${SET01[i].BDPrepare3}'
//                             ,'${SET01[i].BDTTC3}'
//                             ,'${SET01[i].BDIssue3}'
//                             ,'${SET01[i].BDSublead3}'
//                             ,'${SET01[i].BDGL3}'
//                             ,'${SET01[i].BDMGR3}'
//                             ,'${SET01[i].BDJP3}'
//                             ,'${SET01[i].BDRevise3_1}'
//                             ,'${SET01[i].BDSublead3_1}'
//                             ,'${SET01[i].BDGL3_1}'
//                             ,'${SET01[i].BDMGR3_1}'
//                             ,'${SET01[i].BDJP3_1}'
//                             ,'${SET01[i].BDRevise3_2}'
//                             ,'${SET01[i].BDSublead3_2}'
//                             ,'${SET01[i].BDGL3_2}'
//                             ,'${SET01[i].BDMGR3_2}'
//                             ,'${SET01[i].BDJP3_2}'
//                             ,'${SET01[i].BDRevise3_3}'
//                             ,'${SET01[i].BDSublead3_3}'
//                             ,'${SET01[i].BDGL3_3}'
//                             ,'${SET01[i].BDMGR3_3}'
//                             ,'${SET01[i].BDJP3_3}'
//                             ,'${SET01[i].BDSent3}'
//                             ,'${SET01[i].Stage3}'
//                             ,'${SET01[i].Reason3}'
//                             ,'${SET01[i].ReqNo4}'
//                             ,'${SET01[i].Freq4}'
//                             ,'${SET01[i].Evaluation4}'
//                             ,'${SET01[i].PlanSam4}'
//                             ,'${SET01[i].ActSam4}'
//                             ,'${SET01[i].RepDue4}'
//                             ,'${SET01[i].SentRep4}'
//                             ,'${SET01[i].RepDays4}'
//                             ,'${SET01[i].Request4}'
//                             ,'${SET01[i].TTCResult4}'
//                             ,'${SET01[i].IssueDate4}'
//                             ,'${SET01[i].Sublead4}'
//                             ,'${SET01[i].GL4}'
//                             ,'${SET01[i].MGR4}'
//                             ,'${SET01[i].JP4}'
//                             ,'${SET01[i].Revise4_1}'
//                             ,'${SET01[i].Sublead4_1}'
//                             ,'${SET01[i].GL4_1}'
//                             ,'${SET01[i].MGR4_1}'
//                             ,'${SET01[i].JP4_1}'
//                             ,'${SET01[i].Revise4_2}'
//                             ,'${SET01[i].Sublead4_2}'
//                             ,'${SET01[i].GL4_2}'
//                             ,'${SET01[i].MGR4_2}'
//                             ,'${SET01[i].JP4_2}'
//                             ,'${SET01[i].Revise4_3}'
//                             ,'${SET01[i].Sublead4_3}'
//                             ,'${SET01[i].GL4_3}'
//                             ,'${SET01[i].MGR4_3}'
//                             ,'${SET01[i].JP4_3}'
//                             ,'${SET01[i].BDPrepare4}'
//                             ,'${SET01[i].BDTTC4}'
//                             ,'${SET01[i].BDIssue4}' 
//                             ,'${SET01[i].BDSublead4}'
//                             ,'${SET01[i].BDGL4}'
//                             ,'${SET01[i].BDMGR4}'
//                             ,'${SET01[i].BDJP4}'
//                             ,'${SET01[i].BDRevise4_1}'
//                             ,'${SET01[i].BDSublead4_1}'
//                             ,'${SET01[i].BDGL4_1}'
//                             ,'${SET01[i].BDMGR4_1}'
//                             ,'${SET01[i].BDJP4_1}'
//                             ,'${SET01[i].BDRevise4_2}'
//                             ,'${SET01[i].BDSublead4_2}'
//                             ,'${SET01[i].BDGL4_2}'
//                             ,'${SET01[i].BDMGR4_2}'
//                             ,'${SET01[i].BDJP4_2}'
//                             ,'${SET01[i].BDRevise4_3}'
//                             ,'${SET01[i].BDSublead4_3}'
//                             ,'${SET01[i].BDGL4_3}'
//                             ,'${SET01[i].BDMGR4_3}'
//                             ,'${SET01[i].BDJP4_3}'
//                             ,'${SET01[i].BDSent4}'
//                             ,'${SET01[i].Stage4}'
//                             ,'${SET01[i].Reason4}'
//                         )`;
//                 // if (i !== SET01.length - 1) {
//                 //     queryInsert = queryInsert + ",";
//                 // }
//                 // }
//                 query = queryInsert + ";";
//                 // query = queryDelete + queryInsert + ";";
//                 await mssql.qurey(query);
//                 // console.log('query:' + query);
//                 // console.log("Insert Complete " + i);
//                 // }
//             }
//         } catch (err) {
//             console.error('Error executing SQL query:', err.message);
//             res.status(500).send('Internal Server Error');
//         }
//         console.log("Complete " + formatDateTime(new Date().toISOString()))
//         output = SET01;
//     }
//     return res.json(output);
// });

let routineKACData = [];
async function loadRoutineKACReport() {
    const query = `SELECT * FROM [SAR].[dbo].[Routine_KACReport]`;
    try {
        const db = await mssql.qurey(query);
        routineKACData = db.recordset || [];
        // console.log("Routine KAC Report loaded:", routineKACData.length, "records");
    } catch (error) {
        console.error("Error loading Routine KAC Report data:", error);
        routineKACData = [];
    }
}

let holidays = null;
async function loadHolidays() {
    const query = `SELECT HolidayDate FROM [SAR].[dbo].[Master_Holiday]`;
    try {
        let db = await mssql.qurey(query);
        if (db && db.recordsets && db.recordsets[0]) {
            holidays = new Set(db.recordsets[0].map(record => record.HolidayDate.toISOString().split('T')[0]));
            // console.log("Holidays loaded:", holidays);
        }
    } catch (error) {
        console.error("Error loading holidays:", error);
        holidays = new Set();
    }
}

// async function calculateRepDue(startDate, addDays) {
//     let output = { "RepDue": null };
//     let date = new Date(startDate);
//     let addedDays = 0;

//     if (addDays === null || addDays === '') {
//         return { "RepDue": "" };
//     }

//     while (addedDays < addDays) {
//         let query = `SELECT * FROM [SAR].[dbo].[Master_Holiday] WHERE HolidayDate = '${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}'`;
//         try {
//             let db = await mssql.qurey(query);
//             let isHoliday = false;

//             if (db && db.recordsets && db.recordsets[0]) {
//                 isHoliday = db.recordsets[0].length > 0;
//             } else {
//                 // console.warn("No recordsets found for query:", query);
//             }

//             if (!isHoliday) {
//                 addedDays++;
//             }
//         } catch (error) {
//             console.error("Database query failed:", error);
//             throw error;
//         }

//         date.setDate(date.getDate() + 1);
//     }

//     output['RepDue'] = formatDate(date);
//     return output;
// }

async function calculateRepDue(startDate, addDays) {
    let output = { "RepDue": null };
    let date = new Date(startDate);
    let addedDays = 0;

    if (!holidays) {
        throw new Error("Holidays data has not been loaded. Please call loadHolidays() first.");
    }

    if (addDays === null || addDays === '') {
        return { "RepDue": "" };
    }

    while (addedDays < addDays) {
        const currentDate = date.toISOString().split('T')[0];

        const isHoliday = holidays.has(currentDate);
        // console.log(isHoliday);
        if (!isHoliday) {
            addedDays++;
        }

        date.setDate(date.getDate() + 1);
    }

    while (holidays.has(date.toISOString().split('T')[0])) {
        date.setDate(date.getDate() + 1);
    }

    output['RepDue'] = formatDate(date);
    return output;
}

// async function calculateBusinessDays(startDate, endDate) {
//     let count = 0;
//     let SetstartDate = new Date(startDate);
//     SetstartDate.setHours(0, 0, 0, 0);
//     let SetendDate = new Date(endDate);
//     SetendDate.setHours(0, 0, 0, 0);

//     if (startDate === null || startDate.getTime() === 0 || startDate.getTime() === '' || endDate === null || endDate.getTime() === 0 || endDate.getTime() === '') {
//         return "";
//     }

//     while (SetstartDate < SetendDate) {
//         let query = `
//         SELECT * FROM [SAR].[dbo].[Master_Holiday] 
//         WHERE HolidayDate = '${SetstartDate.getFullYear()}-${SetstartDate.getMonth() + 1}-${SetstartDate.getDate()}'
//         `;
//         // console.log('query: ' + query);
//         try {
//             let db = await mssql.qurey(query);
//             let isHoliday = false;

//             if (db && db.recordsets && db.recordsets.length > 0 && db.recordsets[0]) {
//                 isHoliday = db.recordsets[0].length > 0;
//             } else {
//                 // console.warn("No recordsets found for query:", query);
//             }

//             if (!isHoliday) {
//                 count++;
//             }
//         } catch (error) {
//             console.error("Database query failed:", error);
//             throw error;
//         }
//         SetstartDate.setDate(SetstartDate.getDate() + 1);
//     }
//     if (count < 0) {
//         count = 0;
//     }
//     return count;
// }

async function calculateBusinessDays(startDate, endDate, custshort) {
    // console.log('Start: ' + startDate + ' End: ' + endDate);
    let count = 0;
    let SetstartDate = new Date(startDate);
    SetstartDate.setHours(0, 0, 0, 0);
    let SetendDate = new Date(endDate);
    SetendDate.setHours(0, 0, 0, 0);



    // if (custshort === "IMCT-S#B") {
    //     console.log('Start: ' + SetstartDate + ' End: ' + SetendDate);
    // }
    if (!holidays) {
        throw new Error("Holidays data has not been loaded. Please call loadHolidays() first.");
    }

    if (startDate === null || startDate.getTime() === 0 || startDate.getTime() === '' || endDate === null || endDate.getTime() === 0 || endDate.getTime() === '') {
        return "";
    }

    // if (SetstartDate.getTime() === SetendDate.getTime()) {
    //     console.log("in ==");
    //     return 0;
    // }

    while (SetstartDate < SetendDate) {
        const currentDate = SetstartDate.toISOString().split('T')[0];


        const isHoliday = holidays.has(currentDate);
        // if (custshort === "IMCT-S#B") {
        //     console.log("currentDate " + currentDate);
        //     console.log("isHoliday " + isHoliday);
        // }
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

const callAPIsSequentially = async () => {
    const year = new Date().getFullYear();
    const payload = { YEAR: year };
    // const payload = { YEAR: 2023 };

    try {
        const StartTime = new Date();
        console.log("Calling API 1... " + formatDateTime(new Date().toISOString()));
        const response1 = await axios.post("http://172.23.10.51:14000/02SARKPI/Service", payload);
        // console.log(response1.data);
        // console.log("API 1 Completed " + formatDateTime(new Date().toISOString()));

        // console.log("Calling API 2... " + formatDateTime(new Date().toISOString()));
        // const response2 = await axios.post("http://172.23.10.51:14000/02SARKPI/Overdue", payload);
        // // console.log(response2.data);
        // console.log("API 2 Completed " + formatDateTime(new Date().toISOString()));

        // console.log("Calling API 3... " + formatDateTime(new Date().toISOString()));
        // const response3 = await axios.post("http://172.23.10.51:14000/02SARKPI/CustServiceChart", payload);
        // // console.log(response3.data);
        // console.log("API 3 Completed " + formatDateTime(new Date().toISOString()));

        // console.log("Calling API 4... " + formatDateTime(new Date().toISOString()));
        // const response4 = await axios.post("http://172.23.10.51:14000/02SARKPI/ReportOverKPIChart", payload);
        // // console.log(response4.data);
        // console.log("API 4 Completed " + formatDateTime(new Date().toISOString()));

        // console.log("Calling API 5... " + formatDateTime(new Date().toISOString()));
        // const response5 = await axios.post("http://172.23.10.51:14000/02SARKPI/AchievedCustomer", payload);
        // // console.log(response5.data);
        // console.log("API 5 Completed " + formatDateTime(new Date().toISOString()));

        console.log("All APIs completed! " + formatDateTime(new Date().toISOString()));
        const FinishTime = new Date();
        const duration = FinishTime - StartTime;
        const seconds = Math.floor(duration / 1000);
        const milliseconds = duration % 1000;
        console.log(`Total duration: ${seconds} seconds and ${milliseconds} milliseconds`);
    } catch (error) {
        console.error("Error occurred:", error.message);
    }
};

// callAPIsSequentially();

schedule.scheduleJob("0 0 * * *", () => {
    console.log("Scheduled task started at midnight");
    callAPIsSequentially();
});

function formatDateTime(isoString) {
    const date = new Date(isoString);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;

    return `${formattedDate} ${formattedTime}`;
}

function adjust7Hours(dateString) {
    const date = new Date(dateString);
    date.setHours(date.getHours() - 7);
    return date;
}

module.exports = router;
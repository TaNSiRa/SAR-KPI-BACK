const express = require("express");
const router = express.Router();
var mssql = require('../../function/mssql');
var mssqlR = require('../../function/mssqlR');
var mongodb = require('../../function/mongodb');
var httpreq = require('../../function/axios');
var axios = require('axios');
const e = require("express");
const schedule = require("node-schedule");

// ===== Global Cache Variables =====
let cachedServiceData = [];
let cachedMasterPattern = null;
let masterPatternTimestamp = null;
let routineKACData = [];
let holidays = null;

// ===== 1. แคช MasterPattern (Query ครั้งเดียว) =====
async function loadMasterPattern() {
    const now = Date.now();
    // Cache 1 ชั่วโมง
    if (cachedMasterPattern && (now - masterPatternTimestamp) < 3600000) {
        return cachedMasterPattern;
    }

    const query = `
        WITH Ranked AS (
            SELECT t.*,
                   ROW_NUMBER() OVER (PARTITION BY t.CustShort ORDER BY t.CustShort) AS rn
            FROM [SAR].[dbo].[Routine_MasterPatternTS] t
            WHERE FRE NOT IN ('', '<1', '-')
              AND TYPE NOT IN ('', '-')
              AND [GROUP] NOT IN ('', '-')
              AND MKTGROUP NOT IN ('', '-')
              AND REPORTITEMS NOT IN ('', '-')
        )
        SELECT *
        FROM Ranked
        WHERE rn = 1
        ORDER BY CustShort;
    `;

    const db = await mssql.qurey(query);
    cachedMasterPattern = db.recordsets[0] || [];
    masterPatternTimestamp = now;
    console.log("MasterPattern loaded:", cachedMasterPattern.length, "records");
    return cachedMasterPattern;
}

// ===== 2. โหลดข้อมูล Routine KAC Report =====
async function loadRoutineKACReport() {
    const query = `SELECT ReqNo, Evaluation, CreateReportDate, 
                   SubLeaderTime_0, GLTime_0, DGMTime_0, JPTime_0,
                   InchargeTime_1, SubLeaderTime_1, GLTime_1, DGMTime_1, JPTime_1,
                   InchargeTime_2, SubLeaderTime_2, GLTime_2, DGMTime_2, JPTime_2,
                   InchargeTime_3, SubLeaderTime_3, GLTime_3, DGMTime_3, JPTime_3
                   FROM [SAR].[dbo].[Routine_KACReport]`;
    try {
        const db = await mssql.qurey(query);
        routineKACData = db.recordset || [];
        console.log("Routine KAC Report loaded:", routineKACData.length, "records");
    } catch (error) {
        console.error("Error loading Routine KAC Report data:", error);
        routineKACData = [];
    }
}

// ===== 3. โหลดข้อมูล Holidays =====
async function loadHolidays() {
    const query = `SELECT HolidayDate FROM [SAR].[dbo].[Master_Holiday]`;
    try {
        let db = await mssql.qurey(query);
        if (db && db.recordsets && db.recordsets[0]) {
            holidays = new Set(db.recordsets[0].map(record =>
                record.HolidayDate.toISOString().split('T')[0]
            ));
            console.log("Holidays loaded:", holidays.size, "days");
        }
    } catch (error) {
        console.error("Error loading holidays:", error);
        holidays = new Set();
    }
}

// ===== 4. ดึงข้อมูล RequestLab ครั้งเดียวสำหรับ 2 ปี =====
async function loadRequestLabData(year) {
    const query = `
        SELECT * 
        FROM [SAR].[dbo].[Routine_RequestLab] 
        WHERE YEAR(SamplingDate) IN (${year}, ${year - 1})
          AND RequestStatus != 'CANCEL REQUEST'
        ORDER BY CustShort, SamplingDate;
    `;
    const db = await mssql.qurey(query);
    return db.recordsets[0] || [];
}

// ===== 5. Helper Functions =====
function adjust7Hours(dateString) {
    const date = new Date(dateString);
    date.setHours(date.getHours() - 7);
    return date;
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

async function calculateBusinessDays(startDate, endDate, custshort, samplingDate) {
    let count = 0;
    let SetstartDate = new Date(startDate);
    SetstartDate.setHours(0, 0, 0, 0);
    let SetendDate = new Date(endDate);
    SetendDate.setHours(0, 0, 0, 0);

    if (!holidays) {
        throw new Error("Holidays data has not been loaded. Please call loadHolidays() first.");
    }

    if (startDate === "" || startDate === null || startDate.getTime() === 0 || startDate.getTime() === '' || endDate === "" || endDate === null || endDate.getTime() === 0 || endDate.getTime() === '') {
        return "";
    }

    if (SetstartDate.getTime() === SetendDate.getTime()) {

        return 0;
    }

    while (SetstartDate < SetendDate) {

        const currentDate = Plus7Hours(SetstartDate, 7);

        const isHoliday = holidays.has(currentDate);

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

function escapeSQL(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/'/g, "''");
}

function Plus7Hours(date) {
    const newDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// ===== 6. ประมวลผลข้อมูลรายเดือน =====
async function processMonthData(masterRecords, requestRecordsMap, month, year) {
    const results = [];
    let lastcustshort = "";
    let lastreqno = "";

    for (const record of masterRecords) {
        const entry = {
            ID: "",
            Type: record['TYPE'],
            MKTGroup: record['MKTGROUP'],
            Group: record['GROUP'],
            Customer: record['CustFull'],
            CustShort: record['CustShort'],
            Frequency: record['FRE'],
            Incharge: record['Incharge'],
            KPIServ: record['GROUP'] === 'KAC' ? '100' :
                (record['GROUP'] === 'MEDIUM' ? '95' : record['KPIServ']),
            KPIPeriod: record['TYPE'] === 'A' ? '12' :
                (record['TYPE'] === 'B' ? '10' : record['KPIPERIOD']),
            RepItems: record['REPORTITEMS'],
            Month: month,
            Year: year,
            ReqNo1: "", Freq1: "", Evaluation1: "", PlanSam1: "", ActSam1: "", RepDue1: "", SentRep1: "", RepDays1: "",
            TS_Send1: "", TTC_Receive1: "", Request1: "", TTCResult1: "", IssueDate1: "", Sublead1: "", GL1: "", MGR1: "", JP1: "",
            Revise1_1: "", Sublead1_1: "", GL1_1: "", MGR1_1: "", JP1_1: "",
            Revise1_2: "", Sublead1_2: "", GL1_2: "", MGR1_2: "", JP1_2: "",
            Revise1_3: "", Sublead1_3: "", GL1_3: "", MGR1_3: "", JP1_3: "",
            BDPrepare1: "", BDTTC1: "", BDIssue1: "", BDSublead1: "", BDGL1: "", BDMGR1: "", BDJP1: "",
            BDRevise1_1: "", BDSublead1_1: "", BDGL1_1: "", BDMGR1_1: "", BDJP1_1: "",
            BDRevise1_2: "", BDSublead1_2: "", BDGL1_2: "", BDMGR1_2: "", BDJP1_2: "",
            BDRevise1_3: "", BDSublead1_3: "", BDGL1_3: "", BDMGR1_3: "", BDJP1_3: "",
            BDSent1: "", Stage1: "", Reason1: "",
            ReqNo2: "", Freq2: "", Evaluation2: "", PlanSam2: "", ActSam2: "", RepDue2: "", SentRep2: "", RepDays2: "",
            TS_Send2: "", TTC_Receive2: "", Request2: "", TTCResult2: "", IssueDate2: "", Sublead2: "", GL2: "", MGR2: "", JP2: "",
            Revise2_1: "", Sublead2_1: "", GL2_1: "", MGR2_1: "", JP2_1: "",
            Revise2_2: "", Sublead2_2: "", GL2_2: "", MGR2_2: "", JP2_2: "",
            Revise2_3: "", Sublead2_3: "", GL2_3: "", MGR2_3: "", JP2_3: "",
            BDPrepare2: "", BDTTC2: "", BDIssue2: "", BDSublead2: "", BDGL2: "", BDMGR2: "", BDJP2: "",
            BDRevise2_1: "", BDSublead2_1: "", BDGL2_1: "", BDMGR2_1: "", BDJP2_1: "",
            BDRevise2_2: "", BDSublead2_2: "", BDGL2_2: "", BDMGR2_2: "", BDJP2_2: "",
            BDRevise2_3: "", BDSublead2_3: "", BDGL2_3: "", BDMGR2_3: "", BDJP2_3: "",
            BDSent2: "", Stage2: "", Reason2: "",
            ReqNo3: "", Freq3: "", Evaluation3: "", PlanSam3: "", ActSam3: "", RepDue3: "", SentRep3: "", RepDays3: "",
            TS_Send3: "", TTC_Receive3: "", Request3: "", TTCResult3: "", IssueDate3: "", Sublead3: "", GL3: "", MGR3: "", JP3: "",
            Revise3_1: "", Sublead3_1: "", GL3_1: "", MGR3_1: "", JP3_1: "",
            Revise3_2: "", Sublead3_2: "", GL3_2: "", MGR3_2: "", JP3_2: "",
            Revise3_3: "", Sublead3_3: "", GL3_3: "", MGR3_3: "", JP3_3: "",
            BDPrepare3: "", BDTTC3: "", BDIssue3: "", BDSublead3: "", BDGL3: "", BDMGR3: "", BDJP3: "",
            BDRevise3_1: "", BDSublead3_1: "", BDGL3_1: "", BDMGR3_1: "", BDJP3_1: "",
            BDRevise3_2: "", BDSublead3_2: "", BDGL3_2: "", BDMGR3_2: "", BDJP3_2: "",
            BDRevise3_3: "", BDSublead3_3: "", BDGL3_3: "", BDMGR3_3: "", BDJP3_3: "",
            BDSent3: "", Stage3: "", Reason3: "",
            ReqNo4: "", Freq4: "", Evaluation4: "", PlanSam4: "", ActSam4: "", RepDue4: "", SentRep4: "", RepDays4: "",
            TS_Send4: "", TTC_Receive4: "", Request4: "", TTCResult4: "", IssueDate4: "", Sublead4: "", GL4: "", MGR4: "", JP4: "",
            Revise4_1: "", Sublead4_1: "", GL4_1: "", MGR4_1: "", JP4_1: "",
            Revise4_2: "", Sublead4_2: "", GL4_2: "", MGR4_2: "", JP4_2: "",
            Revise4_3: "", Sublead4_3: "", GL4_3: "", MGR4_3: "", JP4_3: "",
            BDPrepare4: "", BDTTC4: "", BDIssue4: "", BDSublead4: "", BDGL4: "", BDMGR4: "", BDJP4: "",
            BDRevise4_1: "", BDSublead4_1: "", BDGL4_1: "", BDMGR4_1: "", BDJP4_1: "",
            BDRevise4_2: "", BDSublead4_2: "", BDGL4_2: "", BDMGR4_2: "", BDJP4_2: "",
            BDRevise4_3: "", BDSublead4_3: "", BDGL4_3: "", BDMGR4_3: "", BDJP4_3: "",
            BDSent4: "", Stage4: "", Reason4: ""
        };

        const matchingRequests = requestRecordsMap[record.CustShort] || [];
        let lastWeek = 0;

        // ประมวลผล requests แต่ละตัว
        for (const req of matchingRequests) {
            const samplingDate = new Date(req.SamplingDate);
            const dayOfMonth = samplingDate.getDate();
            const kpiPeriod = entry.KPIPeriod;
            const RepDue = calculateRepDue(samplingDate, kpiPeriod);
            const sentRepDate = req.SentRep && !isNaN(new Date(req.SentRep).getTime())
                ? adjust7Hours(new Date(req.SentRep)) : '';
            const RepDays = calculateBusinessDays(samplingDate, sentRepDate);
            const reqNo = req.ReqNo;
            const custshort = req.CustShort;
            const CloseLine = req.RequestStatus;

            // คำนวณวันที่ต่างๆ
            const maxTSSendDate = adjust7Hours(new Date(req.SendDate)) || samplingDate;
            const maxSendDate = adjust7Hours(new Date(req.ReceiveDate)) || samplingDate;
            const maxResultApproveDate = adjust7Hours(new Date(req.ResultApproveDate)) || samplingDate;

            // ดึงข้อมูลจาก KAC Report
            const filteredResults = routineKACData.filter(row => row.ReqNo === reqNo);
            const countEvaluation = filteredResults.length === 0 ? '' :
                filteredResults.reduce((acc, row) => {
                    if (['LOW', 'HIGH', 'NOT PASS', 'NG'].includes(row.Evaluation)) {
                        return acc + 1;
                    }
                    return acc;
                }, 0);

            const issueData = filteredResults.length > 0 ? filteredResults[0] : {};
            const issueDate = issueData['CreateReportDate'] ?
                adjust7Hours(new Date(issueData['CreateReportDate'])) : samplingDate;

            const Sublead = issueData['SubLeaderTime_0'] ? adjust7Hours(new Date(issueData['SubLeaderTime_0'])) : null;
            const GL = issueData['GLTime_0'] ? adjust7Hours(new Date(issueData['GLTime_0'])) : null;
            const MGR = issueData['DGMTime_0'] ? adjust7Hours(new Date(issueData['DGMTime_0'])) : null;
            const JP = issueData['JPTime_0'] ? adjust7Hours(new Date(issueData['JPTime_0'])) : null;

            const Revise1 = issueData['InchargeTime_1'] ? adjust7Hours(new Date(issueData['InchargeTime_1'])) : null;
            const Sublead1 = issueData['SubLeaderTime_1'] ? adjust7Hours(new Date(issueData['SubLeaderTime_1'])) : null;
            const GL1 = issueData['GLTime_1'] ? adjust7Hours(new Date(issueData['GLTime_1'])) : null;
            const MGR1 = issueData['DGMTime_1'] ? adjust7Hours(new Date(issueData['DGMTime_1'])) : null;
            const JP1 = issueData['JPTime_1'] ? adjust7Hours(new Date(issueData['JPTime_1'])) : null;

            const Revise2 = issueData['InchargeTime_2'] ? adjust7Hours(new Date(issueData['InchargeTime_2'])) : null;
            const Sublead2 = issueData['SubLeaderTime_2'] ? adjust7Hours(new Date(issueData['SubLeaderTime_2'])) : null;
            const GL2 = issueData['GLTime_2'] ? adjust7Hours(new Date(issueData['GLTime_2'])) : null;
            const MGR2 = issueData['DGMTime_2'] ? adjust7Hours(new Date(issueData['DGMTime_2'])) : null;
            const JP2 = issueData['JPTime_2'] ? adjust7Hours(new Date(issueData['JPTime_2'])) : null;

            const Revise3 = issueData['InchargeTime_3'] ? adjust7Hours(new Date(issueData['InchargeTime_3'])) : null;
            const Sublead3 = issueData['SubLeaderTime_3'] ? adjust7Hours(new Date(issueData['SubLeaderTime_3'])) : null;
            const GL3 = issueData['GLTime_3'] ? adjust7Hours(new Date(issueData['GLTime_3'])) : null;
            const MGR3 = issueData['DGMTime_3'] ? adjust7Hours(new Date(issueData['DGMTime_3'])) : null;
            const JP3 = issueData['JPTime_3'] ? adjust7Hours(new Date(issueData['JPTime_3'])) : null;

            // คำนวณ Business Days
            const BDPrepare = await calculateBusinessDays(samplingDate, maxSendDate);
            const BDTTC = await calculateBusinessDays(maxSendDate, maxResultApproveDate);
            const BDIssue = await calculateBusinessDays(maxResultApproveDate, issueDate);

            const isValidDate = (date) => date && date.getTime() !== 0;
            const BDSublead = await calculateBusinessDays(issueDate, Sublead);
            const BDGL = isValidDate(Sublead) && isValidDate(GL) ? await calculateBusinessDays(Sublead, GL)
                : (isValidDate(issueDate) && isValidDate(GL) ? await calculateBusinessDays(issueDate, GL) : '');
            const BDMGR = isValidDate(GL) && isValidDate(MGR) ? await calculateBusinessDays(GL, MGR)
                : (isValidDate(Sublead) && isValidDate(MGR) ? await calculateBusinessDays(Sublead, MGR)
                    : (isValidDate(issueDate) && isValidDate(MGR) ? await calculateBusinessDays(issueDate, MGR) : ''));
            const BDJP = isValidDate(MGR) && isValidDate(JP) ? await calculateBusinessDays(MGR, JP)
                : (isValidDate(GL) && isValidDate(JP) ? await calculateBusinessDays(GL, JP)
                    : (isValidDate(Sublead) && isValidDate(JP) ? await calculateBusinessDays(Sublead, JP) : ''));

            const CheckSignerForBDRevise1 = isValidDate(JP) ? JP : isValidDate(MGR) ? MGR : isValidDate(GL) ? GL : isValidDate(Sublead) ? Sublead : null;
            const BDRevise1 = CheckSignerForBDRevise1 ? await calculateBusinessDays(CheckSignerForBDRevise1, Revise1) : '';
            const BDSublead1 = await calculateBusinessDays(Revise1, Sublead1);
            const BDGL1 = isValidDate(Sublead1) && isValidDate(GL1) ? await calculateBusinessDays(Sublead1, GL1)
                : (isValidDate(Revise1) && isValidDate(GL1) ? await calculateBusinessDays(Revise1, GL1) : '');
            const BDMGR1 = isValidDate(GL1) && isValidDate(MGR1) ? await calculateBusinessDays(GL1, MGR1)
                : (isValidDate(Sublead1) && isValidDate(MGR1) ? await calculateBusinessDays(Sublead1, MGR1)
                    : (isValidDate(Revise1) && isValidDate(MGR1) ? await calculateBusinessDays(Revise1, MGR1) : ''));
            const BDJP1 = isValidDate(MGR1) && isValidDate(JP1) ? await calculateBusinessDays(MGR1, JP1)
                : (isValidDate(GL1) && isValidDate(JP1) ? await calculateBusinessDays(GL1, JP1)
                    : (isValidDate(Sublead1) && isValidDate(JP1) ? await calculateBusinessDays(Sublead1, JP1) : ''));

            const CheckSignerForBDRevise2 = isValidDate(JP1) ? JP1 : isValidDate(MGR1) ? MGR1 : isValidDate(GL1) ? GL1 : isValidDate(Sublead1) ? Sublead1 : null;
            const BDRevise2 = CheckSignerForBDRevise2 ? await calculateBusinessDays(CheckSignerForBDRevise2, Revise2) : '';
            const BDSublead2 = await calculateBusinessDays(Revise2, Sublead2);
            const BDGL2 = isValidDate(Sublead2) && isValidDate(GL2) ? await calculateBusinessDays(Sublead2, GL2)
                : (isValidDate(Revise2) && isValidDate(GL2) ? await calculateBusinessDays(Revise2, GL2) : '');
            const BDMGR2 = isValidDate(GL2) && isValidDate(MGR2) ? await calculateBusinessDays(GL2, MGR2)
                : (isValidDate(Sublead2) && isValidDate(MGR2) ? await calculateBusinessDays(Sublead2, MGR2)
                    : (isValidDate(Revise2) && isValidDate(MGR2) ? await calculateBusinessDays(Revise2, MGR2) : ''));
            const BDJP2 = isValidDate(MGR2) && isValidDate(JP2) ? await calculateBusinessDays(MGR2, JP2)
                : (isValidDate(GL2) && isValidDate(JP2) ? await calculateBusinessDays(GL2, JP2)
                    : (isValidDate(Sublead2) && isValidDate(JP2) ? await calculateBusinessDays(Sublead2, JP2) : ''));

            const CheckSignerForBDRevise3 = isValidDate(JP2) ? JP2 : isValidDate(MGR2) ? MGR2 : isValidDate(GL2) ? GL2 : isValidDate(Sublead2) ? Sublead2 : null;
            const BDRevise3 = CheckSignerForBDRevise3 ? await calculateBusinessDays(CheckSignerForBDRevise3, Revise3) : '';
            const BDSublead3 = await calculateBusinessDays(Revise3, Sublead3);
            const BDGL3 = isValidDate(Sublead3) && isValidDate(GL3) ? await calculateBusinessDays(Sublead3, GL3)
                : (isValidDate(Revise3) && isValidDate(GL3) ? await calculateBusinessDays(Revise3, GL3) : '');
            const BDMGR3 = isValidDate(GL3) && isValidDate(MGR3) ? await calculateBusinessDays(GL3, MGR3)
                : (isValidDate(Sublead3) && isValidDate(MGR3) ? await calculateBusinessDays(Sublead3, MGR3)
                    : (isValidDate(Revise3) && isValidDate(MGR3) ? await calculateBusinessDays(Revise3, MGR3) : ''));
            const BDJP3 = isValidDate(MGR3) && isValidDate(JP3) ? await calculateBusinessDays(MGR3, JP3)
                : (isValidDate(GL3) && isValidDate(JP3) ? await calculateBusinessDays(GL3, JP3)
                    : (isValidDate(Sublead3) && isValidDate(JP3) ? await calculateBusinessDays(Sublead3, JP3) : ''));

            const CheckSignerForBDSent = isValidDate(JP3) ? JP3 : isValidDate(MGR3) ? MGR3 : isValidDate(GL3) ? GL3 : isValidDate(Sublead3) ? Sublead3
                : isValidDate(JP2) ? JP2 : isValidDate(MGR2) ? MGR2 : isValidDate(GL2) ? GL2 : isValidDate(Sublead2) ? Sublead2
                    : isValidDate(JP1) ? JP1 : isValidDate(MGR1) ? MGR1 : isValidDate(GL1) ? GL1 : isValidDate(Sublead1) ? Sublead1
                        : isValidDate(JP) ? JP : isValidDate(MGR) ? MGR : isValidDate(GL) ? GL : isValidDate(Sublead) ? Sublead : null;
            const BDSent = CheckSignerForBDSent ? await calculateBusinessDays(CheckSignerForBDSent, sentRepDate) : '';
            const Reason = req.Reason || "";

            // คำนวณ week
            let week = 0;
            if (dayOfMonth >= 1 && dayOfMonth <= 12) week = 1;
            else if (dayOfMonth >= 13 && dayOfMonth <= 23) week = 2;
            else if (dayOfMonth >= 24 && dayOfMonth <= 31) week = 3;

            if (custshort == lastcustshort && reqNo == lastreqno) {
                if (week < lastWeek) week = lastWeek;
            }
            if (custshort == lastcustshort && reqNo != lastreqno) {
                if (week <= lastWeek) week = lastWeek + 1;
            }

            // กำหนดค่าตาม week
            const weekData = {
                ReqNo: reqNo,
                Freq: CloseLine == "CLOSE LINE" ? "CLOSE LINE" : "1",
                Evaluation: CloseLine == "CLOSE LINE" ? "CLOSE LINE" : countEvaluation,
                PlanSam: CloseLine == "CLOSE LINE" ? "CLOSE LINE" : formatDate(samplingDate),
                ActSam: CloseLine == "CLOSE LINE" ? "CLOSE LINE" : formatDate(samplingDate),
                RepDue: CloseLine == "CLOSE LINE" ? "CLOSE LINE" : (await RepDue).RepDue,
                SentRep: CloseLine == "CLOSE LINE" ? "CLOSE LINE" : formatDate(sentRepDate),
                RepDays: CloseLine == "CLOSE LINE" ? "CLOSE LINE" : await RepDays,
                TS_Send: formatDate(maxTSSendDate),
                TTC_Receive: formatDate(maxSendDate),
                Request: formatDate(maxSendDate),
                TTCResult: formatDate(maxResultApproveDate),
                IssueDate: formatDate(issueDate),
                Sublead: formatDate(Sublead),
                GL: formatDate(GL),
                MGR: formatDate(MGR),
                JP: formatDate(JP),
                Revise_1: formatDate(Revise1),
                Sublead_1: formatDate(Sublead1),
                GL_1: formatDate(GL1),
                MGR_1: formatDate(MGR1),
                JP_1: formatDate(JP1),
                Revise_2: formatDate(Revise2),
                Sublead_2: formatDate(Sublead2),
                GL_2: formatDate(GL2),
                MGR_2: formatDate(MGR2),
                JP_2: formatDate(JP2),
                Revise_3: formatDate(Revise3),
                Sublead_3: formatDate(Sublead3),
                GL_3: formatDate(GL3),
                MGR_3: formatDate(MGR3),
                JP_3: formatDate(JP3),
                BDPrepare: BDPrepare,
                BDTTC: BDTTC,
                BDIssue: BDIssue,
                BDSublead: BDSublead,
                BDGL: BDGL,
                BDMGR: BDMGR,
                BDJP: BDJP,
                BDRevise_1: BDRevise1,
                BDSublead_1: BDSublead1,
                BDGL_1: BDGL1,
                BDMGR_1: BDMGR1,
                BDJP_1: BDJP1,
                BDRevise_2: BDRevise2,
                BDSublead_2: BDSublead2,
                BDGL_2: BDGL2,
                BDMGR_2: BDMGR2,
                BDJP_2: BDJP2,
                BDRevise_3: BDRevise3,
                BDSublead_3: BDSublead3,
                BDGL_3: BDGL3,
                BDMGR_3: BDMGR3,
                BDJP_3: BDJP3,
                BDSent: BDSent,
                Reason: Reason
            };

            if (CloseLine != "CLOSE LINE") {
                if (week === 1) {
                    Object.keys(weekData).forEach(key => {
                        entry[key + "1"] = weekData[key];
                    });
                } else if (week === 2) {
                    Object.keys(weekData).forEach(key => {
                        entry[key + "2"] = weekData[key];
                    });
                } else if (week === 3) {
                    Object.keys(weekData).forEach(key => {
                        entry[key + "3"] = weekData[key];
                    });
                } else if (week === 4) {
                    Object.keys(weekData).forEach(key => {
                        entry[key + "4"] = weekData[key];
                    });
                }
            } else {
                if (week === 1) {
                    entry.ReqNo1 = reqNo;
                    entry.Freq1 = "CLOSE LINE";
                    entry.Evaluation1 = "CLOSE LINE";
                    entry.PlanSam1 = "CLOSE LINE";
                    entry.ActSam1 = "CLOSE LINE";
                    entry.RepDue1 = "CLOSE LINE";
                    entry.SentRep1 = "CLOSE LINE";
                    entry.RepDays1 = "CLOSE LINE";
                } else if (week === 2) {
                    entry.ReqNo2 = reqNo;
                    entry.Freq2 = "CLOSE LINE";
                    entry.Evaluation2 = "CLOSE LINE";
                    entry.PlanSam2 = "CLOSE LINE";
                    entry.ActSam2 = "CLOSE LINE";
                    entry.RepDue2 = "CLOSE LINE";
                    entry.SentRep2 = "CLOSE LINE";
                    entry.RepDays2 = "CLOSE LINE";
                } else if (week === 3) {
                    entry.ReqNo3 = reqNo;
                    entry.Freq3 = "CLOSE LINE";
                    entry.Evaluation3 = "CLOSE LINE";
                    entry.PlanSam3 = "CLOSE LINE";
                    entry.ActSam3 = "CLOSE LINE";
                    entry.RepDue3 = "CLOSE LINE";
                    entry.SentRep3 = "CLOSE LINE";
                    entry.RepDays3 = "CLOSE LINE";
                } else if (week === 4) {
                    entry.ReqNo4 = reqNo;
                    entry.Freq4 = "CLOSE LINE";
                    entry.Evaluation4 = "CLOSE LINE";
                    entry.PlanSam4 = "CLOSE LINE";
                    entry.ActSam4 = "CLOSE LINE";
                    entry.RepDue4 = "CLOSE LINE";
                    entry.SentRep4 = "CLOSE LINE";
                    entry.RepDays4 = "CLOSE LINE";
                }
            }

            lastWeek = week;
            lastcustshort = custshort;
            lastreqno = reqNo;
        }

        results.push(entry);
    }

    return results;
}

// ===== 7. Bulk Upsert ใช้ MERGE Statement =====
async function bulkUpsertKPIService(dataArray) {
    if (dataArray.length === 0) return;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // แบ่ง batch เพื่อไม่ให้ query ใหญ่เกินไป
    const batchSize = 500;

    for (let i = 0; i < dataArray.length; i += batchSize) {
        // console.log('dataArray.length :', dataArray.length);
        // console.log('dataArray :', dataArray);
        const batch = dataArray.slice(i, i + batchSize);
        // console.log('batch :', batch);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dataArray.length / batchSize)}...`);
        // สร้าง VALUES สำหรับ batch นี้
        const values = batch.map(item => `(
            '${escapeSQL(item.Type)}', '${escapeSQL(item.MKTGroup)}', '${escapeSQL(item.Group)}',
            '${escapeSQL(item.Customer)}', '${escapeSQL(item.CustShort)}', '${escapeSQL(item.Frequency)}',
            '${escapeSQL(item.Incharge)}', '${escapeSQL(item.KPIServ)}', '${escapeSQL(item.KPIPeriod)}',
            '${escapeSQL(item.RepItems)}', '${escapeSQL(item.Month)}', '${escapeSQL(item.Year)}',
            '${escapeSQL(item.ReqNo1)}', '${escapeSQL(item.Freq1)}', '${escapeSQL(item.Evaluation1)}',
            '${escapeSQL(item.PlanSam1)}', '${escapeSQL(item.ActSam1)}', '${escapeSQL(item.RepDue1)}',
            '${escapeSQL(item.SentRep1)}', '${escapeSQL(item.RepDays1)}', '${escapeSQL(item.TS_Send1)}',
            '${escapeSQL(item.TTC_Receive1)}', '${escapeSQL(item.Request1)}', '${escapeSQL(item.TTCResult1)}',
            '${escapeSQL(item.IssueDate1)}', '${escapeSQL(item.Sublead1)}', '${escapeSQL(item.GL1)}',
            '${escapeSQL(item.MGR1)}', '${escapeSQL(item.JP1)}', '${escapeSQL(item.Revise1_1)}',
            '${escapeSQL(item.Sublead1_1)}', '${escapeSQL(item.GL1_1)}', '${escapeSQL(item.MGR1_1)}',
            '${escapeSQL(item.JP1_1)}', '${escapeSQL(item.Revise1_2)}', '${escapeSQL(item.Sublead1_2)}',
            '${escapeSQL(item.GL1_2)}', '${escapeSQL(item.MGR1_2)}', '${escapeSQL(item.JP1_2)}',
            '${escapeSQL(item.Revise1_3)}', '${escapeSQL(item.Sublead1_3)}', '${escapeSQL(item.GL1_3)}',
            '${escapeSQL(item.MGR1_3)}', '${escapeSQL(item.JP1_3)}', '${escapeSQL(item.BDPrepare1)}',
            '${escapeSQL(item.BDTTC1)}', '${escapeSQL(item.BDIssue1)}', '${escapeSQL(item.BDSublead1)}',
            '${escapeSQL(item.BDGL1)}', '${escapeSQL(item.BDMGR1)}', '${escapeSQL(item.BDJP1)}',
            '${escapeSQL(item.BDRevise1_1)}', '${escapeSQL(item.BDSublead1_1)}', '${escapeSQL(item.BDGL1_1)}',
            '${escapeSQL(item.BDMGR1_1)}', '${escapeSQL(item.BDJP1_1)}', '${escapeSQL(item.BDRevise1_2)}',
            '${escapeSQL(item.BDSublead1_2)}', '${escapeSQL(item.BDGL1_2)}', '${escapeSQL(item.BDMGR1_2)}',
            '${escapeSQL(item.BDJP1_2)}', '${escapeSQL(item.BDRevise1_3)}', '${escapeSQL(item.BDSublead1_3)}',
            '${escapeSQL(item.BDGL1_3)}', '${escapeSQL(item.BDMGR1_3)}', '${escapeSQL(item.BDJP1_3)}',
            '${escapeSQL(item.BDSent1)}', '${escapeSQL(item.Stage1)}', '${escapeSQL(item.Reason1)}',
            '${escapeSQL(item.ReqNo2)}', '${escapeSQL(item.Freq2)}', '${escapeSQL(item.Evaluation2)}',
            '${escapeSQL(item.PlanSam2)}', '${escapeSQL(item.ActSam2)}', '${escapeSQL(item.RepDue2)}',
            '${escapeSQL(item.SentRep2)}', '${escapeSQL(item.RepDays2)}', '${escapeSQL(item.TS_Send2)}',
            '${escapeSQL(item.TTC_Receive2)}', '${escapeSQL(item.Request2)}', '${escapeSQL(item.TTCResult2)}',
            '${escapeSQL(item.IssueDate2)}', '${escapeSQL(item.Sublead2)}', '${escapeSQL(item.GL2)}',
            '${escapeSQL(item.MGR2)}', '${escapeSQL(item.JP2)}', '${escapeSQL(item.Revise2_1)}',
            '${escapeSQL(item.Sublead2_1)}', '${escapeSQL(item.GL2_1)}', '${escapeSQL(item.MGR2_1)}',
            '${escapeSQL(item.JP2_1)}', '${escapeSQL(item.Revise2_2)}', '${escapeSQL(item.Sublead2_2)}',
            '${escapeSQL(item.GL2_2)}', '${escapeSQL(item.MGR2_2)}', '${escapeSQL(item.JP2_2)}',
            '${escapeSQL(item.Revise2_3)}', '${escapeSQL(item.Sublead2_3)}', '${escapeSQL(item.GL2_3)}',
            '${escapeSQL(item.MGR2_3)}', '${escapeSQL(item.JP2_3)}', '${escapeSQL(item.BDPrepare2)}',
            '${escapeSQL(item.BDTTC2)}', '${escapeSQL(item.BDIssue2)}', '${escapeSQL(item.BDSublead2)}',
            '${escapeSQL(item.BDGL2)}', '${escapeSQL(item.BDMGR2)}', '${escapeSQL(item.BDJP2)}',
            '${escapeSQL(item.BDRevise2_1)}', '${escapeSQL(item.BDSublead2_1)}', '${escapeSQL(item.BDGL2_1)}',
            '${escapeSQL(item.BDMGR2_1)}', '${escapeSQL(item.BDJP2_1)}', '${escapeSQL(item.BDRevise2_2)}',
            '${escapeSQL(item.BDSublead2_2)}', '${escapeSQL(item.BDGL2_2)}', '${escapeSQL(item.BDMGR2_2)}',
            '${escapeSQL(item.BDJP2_2)}', '${escapeSQL(item.BDRevise2_3)}', '${escapeSQL(item.BDSublead2_3)}',
            '${escapeSQL(item.BDGL2_3)}', '${escapeSQL(item.BDMGR2_3)}', '${escapeSQL(item.BDJP2_3)}',
            '${escapeSQL(item.BDSent2)}', '${escapeSQL(item.Stage2)}', '${escapeSQL(item.Reason2)}',
            '${escapeSQL(item.ReqNo3)}', '${escapeSQL(item.Freq3)}', '${escapeSQL(item.Evaluation3)}',
            '${escapeSQL(item.PlanSam3)}', '${escapeSQL(item.ActSam3)}', '${escapeSQL(item.RepDue3)}',
            '${escapeSQL(item.SentRep3)}', '${escapeSQL(item.RepDays3)}', '${escapeSQL(item.TS_Send3)}',
            '${escapeSQL(item.TTC_Receive3)}', '${escapeSQL(item.Request3)}', '${escapeSQL(item.TTCResult3)}',
            '${escapeSQL(item.IssueDate3)}', '${escapeSQL(item.Sublead3)}', '${escapeSQL(item.GL3)}',
            '${escapeSQL(item.MGR3)}', '${escapeSQL(item.JP3)}', '${escapeSQL(item.Revise3_1)}',
            '${escapeSQL(item.Sublead3_1)}', '${escapeSQL(item.GL3_1)}', '${escapeSQL(item.MGR3_1)}',
            '${escapeSQL(item.JP3_1)}', '${escapeSQL(item.Revise3_2)}', '${escapeSQL(item.Sublead3_2)}',
            '${escapeSQL(item.GL3_2)}', '${escapeSQL(item.MGR3_2)}', '${escapeSQL(item.JP3_2)}',
            '${escapeSQL(item.Revise3_3)}', '${escapeSQL(item.Sublead3_3)}', '${escapeSQL(item.GL3_3)}',
            '${escapeSQL(item.MGR3_3)}', '${escapeSQL(item.JP3_3)}', '${escapeSQL(item.BDPrepare3)}',
            '${escapeSQL(item.BDTTC3)}', '${escapeSQL(item.BDIssue3)}', '${escapeSQL(item.BDSublead3)}',
            '${escapeSQL(item.BDGL3)}', '${escapeSQL(item.BDMGR3)}', '${escapeSQL(item.BDJP3)}',
            '${escapeSQL(item.BDRevise3_1)}', '${escapeSQL(item.BDSublead3_1)}', '${escapeSQL(item.BDGL3_1)}',
            '${escapeSQL(item.BDMGR3_1)}', '${escapeSQL(item.BDJP3_1)}', '${escapeSQL(item.BDRevise3_2)}',
            '${escapeSQL(item.BDSublead3_2)}', '${escapeSQL(item.BDGL3_2)}', '${escapeSQL(item.BDMGR3_2)}',
            '${escapeSQL(item.BDJP3_2)}', '${escapeSQL(item.BDRevise3_3)}', '${escapeSQL(item.BDSublead3_3)}',
            '${escapeSQL(item.BDGL3_3)}', '${escapeSQL(item.BDMGR3_3)}', '${escapeSQL(item.BDJP3_3)}',
            '${escapeSQL(item.BDSent3)}', '${escapeSQL(item.Stage3)}', '${escapeSQL(item.Reason3)}',
            '${escapeSQL(item.ReqNo4)}', '${escapeSQL(item.Freq4)}', '${escapeSQL(item.Evaluation4)}',
            '${escapeSQL(item.PlanSam4)}', '${escapeSQL(item.ActSam4)}', '${escapeSQL(item.RepDue4)}',
            '${escapeSQL(item.SentRep4)}', '${escapeSQL(item.RepDays4)}', '${escapeSQL(item.TS_Send4)}',
            '${escapeSQL(item.TTC_Receive4)}', '${escapeSQL(item.Request4)}', '${escapeSQL(item.TTCResult4)}',
            '${escapeSQL(item.IssueDate4)}', '${escapeSQL(item.Sublead4)}', '${escapeSQL(item.GL4)}',
            '${escapeSQL(item.MGR4)}', '${escapeSQL(item.JP4)}', '${escapeSQL(item.Revise4_1)}',
            '${escapeSQL(item.Sublead4_1)}', '${escapeSQL(item.GL4_1)}', '${escapeSQL(item.MGR4_1)}',
            '${escapeSQL(item.JP4_1)}', '${escapeSQL(item.Revise4_2)}', '${escapeSQL(item.Sublead4_2)}',
            '${escapeSQL(item.GL4_2)}', '${escapeSQL(item.MGR4_2)}', '${escapeSQL(item.JP4_2)}',
            '${escapeSQL(item.Revise4_3)}', '${escapeSQL(item.Sublead4_3)}', '${escapeSQL(item.GL4_3)}',
            '${escapeSQL(item.MGR4_3)}', '${escapeSQL(item.JP4_3)}', '${escapeSQL(item.BDPrepare4)}',
            '${escapeSQL(item.BDTTC4)}', '${escapeSQL(item.BDIssue4)}', '${escapeSQL(item.BDSublead4)}',
            '${escapeSQL(item.BDGL4)}', '${escapeSQL(item.BDMGR4)}', '${escapeSQL(item.BDJP4)}',
            '${escapeSQL(item.BDRevise4_1)}', '${escapeSQL(item.BDSublead4_1)}', '${escapeSQL(item.BDGL4_1)}',
            '${escapeSQL(item.BDMGR4_1)}', '${escapeSQL(item.BDJP4_1)}', '${escapeSQL(item.BDRevise4_2)}',
            '${escapeSQL(item.BDSublead4_2)}', '${escapeSQL(item.BDGL4_2)}', '${escapeSQL(item.BDMGR4_2)}',
            '${escapeSQL(item.BDJP4_2)}', '${escapeSQL(item.BDRevise4_3)}', '${escapeSQL(item.BDSublead4_3)}',
            '${escapeSQL(item.BDGL4_3)}', '${escapeSQL(item.BDMGR4_3)}', '${escapeSQL(item.BDJP4_3)}',
            '${escapeSQL(item.BDSent4)}', '${escapeSQL(item.Stage4)}', '${escapeSQL(item.Reason4)}'
        )`).join(',\n');
        // if (dataArray[i].CustShort === "APM") {
        //     console.log('values :', values);
        // }
        const mergeQuery = `
        MERGE [SARKPI].[dbo].[KPI_Service] AS target
        USING (VALUES ${values}) AS source (
            [Type], [MKTGroup], [Group], [Customer], [CustShort], [Frequency], [Incharge], [KPIServ], [KPIPeriod], [RepItems],
            [Month], [Year], [ReqNo1], [Freq1], [Evaluation1], [PlanSam1], [ActSam1], [RepDue1], [SentRep1], [RepDays1],
            [TS_Send1], [TTC_Receive1], [Request1], [TTCResult1], [IssueDate1], [Sublead1], [GL1], [MGR1], [JP1],
            [Revise1_1], [Sublead1_1], [GL1_1], [MGR1_1], [JP1_1], [Revise1_2], [Sublead1_2], [GL1_2], [MGR1_2], [JP1_2],
            [Revise1_3], [Sublead1_3], [GL1_3], [MGR1_3], [JP1_3], [BDPrepare1], [BDTTC1], [BDIssue1], [BDSublead1], [BDGL1],
            [BDMGR1], [BDJP1], [BDRevise1_1], [BDSublead1_1], [BDGL1_1], [BDMGR1_1], [BDJP1_1], [BDRevise1_2], [BDSublead1_2],
            [BDGL1_2], [BDMGR1_2], [BDJP1_2], [BDRevise1_3], [BDSublead1_3], [BDGL1_3], [BDMGR1_3], [BDJP1_3], [BDSent1],
            [Stage1], [Reason1], [ReqNo2], [Freq2], [Evaluation2], [PlanSam2], [ActSam2], [RepDue2], [SentRep2], [RepDays2],
            [TS_Send2], [TTC_Receive2], [Request2], [TTCResult2], [IssueDate2], [Sublead2], [GL2], [MGR2], [JP2],
            [Revise2_1], [Sublead2_1], [GL2_1], [MGR2_1], [JP2_1], [Revise2_2], [Sublead2_2], [GL2_2], [MGR2_2], [JP2_2],
            [Revise2_3], [Sublead2_3], [GL2_3], [MGR2_3], [JP2_3], [BDPrepare2], [BDTTC2], [BDIssue2], [BDSublead2], [BDGL2],
            [BDMGR2], [BDJP2], [BDRevise2_1], [BDSublead2_1], [BDGL2_1], [BDMGR2_1], [BDJP2_1], [BDRevise2_2], [BDSublead2_2],
            [BDGL2_2], [BDMGR2_2], [BDJP2_2], [BDRevise2_3], [BDSublead2_3], [BDGL2_3], [BDMGR2_3], [BDJP2_3], [BDSent2],
            [Stage2], [Reason2], [ReqNo3], [Freq3], [Evaluation3], [PlanSam3], [ActSam3], [RepDue3], [SentRep3], [RepDays3],
            [TS_Send3], [TTC_Receive3], [Request3], [TTCResult3], [IssueDate3], [Sublead3], [GL3], [MGR3], [JP3],
            [Revise3_1], [Sublead3_1], [GL3_1], [MGR3_1], [JP3_1], [Revise3_2], [Sublead3_2], [GL3_2], [MGR3_2], [JP3_2],
            [Revise3_3], [Sublead3_3], [GL3_3], [MGR3_3], [JP3_3], [BDPrepare3], [BDTTC3], [BDIssue3], [BDSublead3], [BDGL3],
            [BDMGR3], [BDJP3], [BDRevise3_1], [BDSublead3_1], [BDGL3_1], [BDMGR3_1], [BDJP3_1], [BDRevise3_2], [BDSublead3_2],
            [BDGL3_2], [BDMGR3_2], [BDJP3_2], [BDRevise3_3], [BDSublead3_3], [BDGL3_3], [BDMGR3_3], [BDJP3_3], [BDSent3],
            [Stage3], [Reason3], [ReqNo4], [Freq4], [Evaluation4], [PlanSam4], [ActSam4], [RepDue4], [SentRep4], [RepDays4],
            [TS_Send4], [TTC_Receive4], [Request4], [TTCResult4], [IssueDate4], [Sublead4], [GL4], [MGR4], [JP4],
            [Revise4_1], [Sublead4_1], [GL4_1], [MGR4_1], [JP4_1], [Revise4_2], [Sublead4_2], [GL4_2], [MGR4_2], [JP4_2],
            [Revise4_3], [Sublead4_3], [GL4_3], [MGR4_3], [JP4_3], [BDPrepare4], [BDTTC4], [BDIssue4], [BDSublead4], [BDGL4],
            [BDMGR4], [BDJP4], [BDRevise4_1], [BDSublead4_1], [BDGL4_1], [BDMGR4_1], [BDJP4_1], [BDRevise4_2], [BDSublead4_2],
            [BDGL4_2], [BDMGR4_2], [BDJP4_2], [BDRevise4_3], [BDSublead4_3], [BDGL4_3], [BDMGR4_3], [BDJP4_3], [BDSent4],
            [Stage4], [Reason4]
        )
        ON target.[CustShort] = source.[CustShort] 
           AND target.[Month] = source.[Month] 
           AND target.[Year] = source.[Year]

        WHEN MATCHED THEN
            UPDATE SET
                target.[Customer] = source.[Customer],
                target.[ReqNo1] = source.[ReqNo1], target.[Freq1] = source.[Freq1], target.[Evaluation1] = source.[Evaluation1],
                target.[PlanSam1] = source.[PlanSam1], target.[ActSam1] = source.[ActSam1], target.[RepDue1] = source.[RepDue1],
                target.[SentRep1] = source.[SentRep1], target.[RepDays1] = source.[RepDays1], target.[TS_Send1] = source.[TS_Send1],
                target.[TTC_Receive1] = source.[TTC_Receive1], target.[Request1] = source.[Request1], target.[TTCResult1] = source.[TTCResult1],
                target.[IssueDate1] = source.[IssueDate1], target.[Sublead1] = source.[Sublead1], target.[GL1] = source.[GL1],
                target.[MGR1] = source.[MGR1], target.[JP1] = source.[JP1], target.[Revise1_1] = source.[Revise1_1],
                target.[Sublead1_1] = source.[Sublead1_1], target.[GL1_1] = source.[GL1_1], target.[MGR1_1] = source.[MGR1_1],
                target.[JP1_1] = source.[JP1_1], target.[Revise1_2] = source.[Revise1_2], target.[Sublead1_2] = source.[Sublead1_2],
                target.[GL1_2] = source.[GL1_2], target.[MGR1_2] = source.[MGR1_2], target.[JP1_2] = source.[JP1_2],
                target.[Revise1_3] = source.[Revise1_3], target.[Sublead1_3] = source.[Sublead1_3], target.[GL1_3] = source.[GL1_3],
                target.[MGR1_3] = source.[MGR1_3], target.[JP1_3] = source.[JP1_3], target.[BDPrepare1] = source.[BDPrepare1],
                target.[BDTTC1] = source.[BDTTC1], target.[BDIssue1] = source.[BDIssue1], target.[BDSublead1] = source.[BDSublead1],
                target.[BDGL1] = source.[BDGL1], target.[BDMGR1] = source.[BDMGR1], target.[BDJP1] = source.[BDJP1],
                target.[BDRevise1_1] = source.[BDRevise1_1], target.[BDSublead1_1] = source.[BDSublead1_1], target.[BDGL1_1] = source.[BDGL1_1],
                target.[BDMGR1_1] = source.[BDMGR1_1], target.[BDJP1_1] = source.[BDJP1_1], target.[BDRevise1_2] = source.[BDRevise1_2],
                target.[BDSublead1_2] = source.[BDSublead1_2], target.[BDGL1_2] = source.[BDGL1_2], target.[BDMGR1_2] = source.[BDMGR1_2],
                target.[BDJP1_2] = source.[BDJP1_2], target.[BDRevise1_3] = source.[BDRevise1_3], target.[BDSublead1_3] = source.[BDSublead1_3],
                target.[BDGL1_3] = source.[BDGL1_3], target.[BDMGR1_3] = source.[BDMGR1_3], target.[BDJP1_3] = source.[BDJP1_3],
                target.[BDSent1] = source.[BDSent1], target.[Reason1] = source.[Reason1],
                target.[ReqNo2] = source.[ReqNo2], target.[Freq2] = source.[Freq2], target.[Evaluation2] = source.[Evaluation2],
                target.[PlanSam2] = source.[PlanSam2], target.[ActSam2] = source.[ActSam2], target.[RepDue2] = source.[RepDue2],
                target.[SentRep2] = source.[SentRep2], target.[RepDays2] = source.[RepDays2], target.[TS_Send2] = source.[TS_Send2],
                target.[TTC_Receive2] = source.[TTC_Receive2], target.[Request2] = source.[Request2], target.[TTCResult2] = source.[TTCResult2],
                target.[IssueDate2] = source.[IssueDate2], target.[Sublead2] = source.[Sublead2], target.[GL2] = source.[GL2],
                target.[MGR2] = source.[MGR2], target.[JP2] = source.[JP2], target.[Revise2_1] = source.[Revise2_1],
                target.[Sublead2_1] = source.[Sublead2_1], target.[GL2_1] = source.[GL2_1], target.[MGR2_1] = source.[MGR2_1],
                target.[JP2_1] = source.[JP2_1], target.[Revise2_2] = source.[Revise2_2], target.[Sublead2_2] = source.[Sublead2_2],
                target.[GL2_2] = source.[GL2_2], target.[MGR2_2] = source.[MGR2_2], target.[JP2_2] = source.[JP2_2],
                target.[Revise2_3] = source.[Revise2_3], target.[Sublead2_3] = source.[Sublead2_3], target.[GL2_3] = source.[GL2_3],
                target.[MGR2_3] = source.[MGR2_3], target.[JP2_3] = source.[JP2_3], target.[BDPrepare2] = source.[BDPrepare2],
                target.[BDTTC2] = source.[BDTTC2], target.[BDIssue2] = source.[BDIssue2], target.[BDSublead2] = source.[BDSublead2],
                target.[BDGL2] = source.[BDGL2], target.[BDMGR2] = source.[BDMGR2], target.[BDJP2] = source.[BDJP2],
                target.[BDRevise2_1] = source.[BDRevise2_1], target.[BDSublead2_1] = source.[BDSublead2_1], target.[BDGL2_1] = source.[BDGL2_1],
                target.[BDMGR2_1] = source.[BDMGR2_1], target.[BDJP2_1] = source.[BDJP2_1], target.[BDRevise2_2] = source.[BDRevise2_2],
                target.[BDSublead2_2] = source.[BDSublead2_2], target.[BDGL2_2] = source.[BDGL2_2], target.[BDMGR2_2] = source.[BDMGR2_2],
                target.[BDJP2_2] = source.[BDJP2_2], target.[BDRevise2_3] = source.[BDRevise2_3], target.[BDSublead2_3] = source.[BDSublead2_3],
                target.[BDGL2_3] = source.[BDGL2_3], target.[BDMGR2_3] = source.[BDMGR2_3], target.[BDJP2_3] = source.[BDJP2_3],
                target.[BDSent2] = source.[BDSent2], target.[Reason2] = source.[Reason2],
                target.[ReqNo3] = source.[ReqNo3], target.[Freq3] = source.[Freq3], target.[Evaluation3] = source.[Evaluation3],
                target.[PlanSam3] = source.[PlanSam3], target.[ActSam3] = source.[ActSam3], target.[RepDue3] = source.[RepDue3],
                target.[SentRep3] = source.[SentRep3], target.[RepDays3] = source.[RepDays3], target.[TS_Send3] = source.[TS_Send3],
                target.[TTC_Receive3] = source.[TTC_Receive3], target.[Request3] = source.[Request3], target.[TTCResult3] = source.[TTCResult3],
                target.[IssueDate3] = source.[IssueDate3], target.[Sublead3] = source.[Sublead3], target.[GL3] = source.[GL3],
                target.[MGR3] = source.[MGR3], target.[JP3] = source.[JP3], target.[Revise3_1] = source.[Revise3_1],
                target.[Sublead3_1] = source.[Sublead3_1], target.[GL3_1] = source.[GL3_1], target.[MGR3_1] = source.[MGR3_1],
                target.[JP3_1] = source.[JP3_1], target.[Revise3_2] = source.[Revise3_2], target.[Sublead3_2] = source.[Sublead3_2],
                target.[GL3_2] = source.[GL3_2], target.[MGR3_2] = source.[MGR3_2], target.[JP3_2] = source.[JP3_2],
                target.[Revise3_3] = source.[Revise3_3], target.[Sublead3_3] = source.[Sublead3_3], target.[GL3_3] = source.[GL3_3],
                target.[MGR3_3] = source.[MGR3_3], target.[JP3_3] = source.[JP3_3], target.[BDPrepare3] = source.[BDPrepare3],
                target.[BDTTC3] = source.[BDTTC3], target.[BDIssue3] = source.[BDIssue3], target.[BDSublead3] = source.[BDSublead3],
                target.[BDGL3] = source.[BDGL3], target.[BDMGR3] = source.[BDMGR3], target.[BDJP3] = source.[BDJP3],
                target.[BDRevise3_1] = source.[BDRevise3_1], target.[BDSublead3_1] = source.[BDSublead3_1], target.[BDGL3_1] = source.[BDGL3_1],
                target.[BDMGR3_1] = source.[BDMGR3_1], target.[BDJP3_1] = source.[BDJP3_1], target.[BDRevise3_2] = source.[BDRevise3_2],
                target.[BDSublead3_2] = source.[BDSublead3_2], target.[BDGL3_2] = source.[BDGL3_2], target.[BDMGR3_2] = source.[BDMGR3_2],
                target.[BDJP3_2] = source.[BDJP3_2], target.[BDRevise3_3] = source.[BDRevise3_3], target.[BDSublead3_3] = source.[BDSublead3_3],
                target.[BDGL3_3] = source.[BDGL3_3], target.[BDMGR3_3] = source.[BDMGR3_3], target.[BDJP3_3] = source.[BDJP3_3],
                target.[BDSent3] = source.[BDSent3], target.[Reason3] = source.[Reason3],
                target.[ReqNo4] = source.[ReqNo4], target.[Freq4] = source.[Freq4], target.[Evaluation4] = source.[Evaluation4],
                target.[PlanSam4] = source.[PlanSam4], target.[ActSam4] = source.[ActSam4], target.[RepDue4] = source.[RepDue4],
                target.[SentRep4] = source.[SentRep4], target.[RepDays4] = source.[RepDays4], target.[TS_Send4] = source.[TS_Send4],
                target.[TTC_Receive4] = source.[TTC_Receive4], target.[Request4] = source.[Request4], target.[TTCResult4] = source.[TTCResult4],
                target.[IssueDate4] = source.[IssueDate4], target.[Sublead4] = source.[Sublead4], target.[GL4] = source.[GL4],
                target.[MGR4] = source.[MGR4], target.[JP4] = source.[JP4], target.[Revise4_1] = source.[Revise4_1],
                target.[Sublead4_1] = source.[Sublead4_1], target.[GL4_1] = source.[GL4_1], target.[MGR4_1] = source.[MGR4_1],
                target.[JP4_1] = source.[JP4_1], target.[Revise4_2] = source.[Revise4_2], target.[Sublead4_2] = source.[Sublead4_2],
                target.[GL4_2] = source.[GL4_2], target.[MGR4_2] = source.[MGR4_2], target.[JP4_2] = source.[JP4_2],
                target.[Revise4_3] = source.[Revise4_3], target.[Sublead4_3] = source.[Sublead4_3], target.[GL4_3] = source.[GL4_3],
                target.[MGR4_3] = source.[MGR4_3], target.[JP4_3] = source.[JP4_3], target.[BDPrepare4] = source.[BDPrepare4],
                target.[BDTTC4] = source.[BDTTC4], target.[BDIssue4] = source.[BDIssue4], target.[BDSublead4] = source.[BDSublead4],
                target.[BDGL4] = source.[BDGL4], target.[BDMGR4] = source.[BDMGR4], target.[BDJP4] = source.[BDJP4],
                target.[BDRevise4_1] = source.[BDRevise4_1], target.[BDSublead4_1] = source.[BDSublead4_1], target.[BDGL4_1] = source.[BDGL4_1],
                target.[BDMGR4_1] = source.[BDMGR4_1], target.[BDJP4_1] = source.[BDJP4_1], target.[BDRevise4_2] = source.[BDRevise4_2],
                target.[BDSublead4_2] = source.[BDSublead4_2], target.[BDGL4_2] = source.[BDGL4_2], target.[BDMGR4_2] = source.[BDMGR4_2],
                target.[BDJP4_2] = source.[BDJP4_2], target.[BDRevise4_3] = source.[BDRevise4_3], target.[BDSublead4_3] = source.[BDSublead4_3],
                target.[BDGL4_3] = source.[BDGL4_3], target.[BDMGR4_3] = source.[BDMGR4_3], target.[BDJP4_3] = source.[BDJP4_3],
                target.[BDSent4] = source.[BDSent4], target.[Reason4] = source.[Reason4]

        WHEN NOT MATCHED THEN
            INSERT ([Type], [MKTGroup], [Group], [Customer], [CustShort], [Frequency], [Incharge], [KPIServ], [KPIPeriod], [RepItems],
                    [Month], [Year], [ReqNo1], [Freq1], [Evaluation1], [PlanSam1], [ActSam1], [RepDue1], [SentRep1], [RepDays1],
                    [TS_Send1], [TTC_Receive1], [Request1], [TTCResult1], [IssueDate1], [Sublead1], [GL1], [MGR1], [JP1],
                    [Revise1_1], [Sublead1_1], [GL1_1], [MGR1_1], [JP1_1], [Revise1_2], [Sublead1_2], [GL1_2], [MGR1_2], [JP1_2],
                    [Revise1_3], [Sublead1_3], [GL1_3], [MGR1_3], [JP1_3], [BDPrepare1], [BDTTC1], [BDIssue1], [BDSublead1], [BDGL1],
                    [BDMGR1], [BDJP1], [BDRevise1_1], [BDSublead1_1], [BDGL1_1], [BDMGR1_1], [BDJP1_1], [BDRevise1_2], [BDSublead1_2],
                    [BDGL1_2], [BDMGR1_2], [BDJP1_2], [BDRevise1_3], [BDSublead1_3], [BDGL1_3], [BDMGR1_3], [BDJP1_3], [BDSent1],
                    [Stage1], [Reason1], [ReqNo2], [Freq2], [Evaluation2], [PlanSam2], [ActSam2], [RepDue2], [SentRep2], [RepDays2],
                    [TS_Send2], [TTC_Receive2], [Request2], [TTCResult2], [IssueDate2], [Sublead2], [GL2], [MGR2], [JP2],
                    [Revise2_1], [Sublead2_1], [GL2_1], [MGR2_1], [JP2_1], [Revise2_2], [Sublead2_2], [GL2_2], [MGR2_2], [JP2_2],
                    [Revise2_3], [Sublead2_3], [GL2_3], [MGR2_3], [JP2_3], [BDPrepare2], [BDTTC2], [BDIssue2], [BDSublead2], [BDGL2],
                    [BDMGR2], [BDJP2], [BDRevise2_1], [BDSublead2_1], [BDGL2_1], [BDMGR2_1], [BDJP2_1], [BDRevise2_2], [BDSublead2_2],
                    [BDGL2_2], [BDMGR2_2], [BDJP2_2], [BDRevise2_3], [BDSublead2_3], [BDGL2_3], [BDMGR2_3], [BDJP2_3], [BDSent2],
                    [Stage2], [Reason2], [ReqNo3], [Freq3], [Evaluation3], [PlanSam3], [ActSam3], [RepDue3], [SentRep3], [RepDays3],
                    [TS_Send3], [TTC_Receive3], [Request3], [TTCResult3], [IssueDate3], [Sublead3], [GL3], [MGR3], [JP3],
                    [Revise3_1], [Sublead3_1], [GL3_1], [MGR3_1], [JP3_1], [Revise3_2], [Sublead3_2], [GL3_2], [MGR3_2], [JP3_2],
                    [Revise3_3], [Sublead3_3], [GL3_3], [MGR3_3], [JP3_3], [BDPrepare3], [BDTTC3], [BDIssue3], [BDSublead3], [BDGL3],
                    [BDMGR3], [BDJP3], [BDRevise3_1], [BDSublead3_1], [BDGL3_1], [BDMGR3_1], [BDJP3_1], [BDRevise3_2], [BDSublead3_2],
                    [BDGL3_2], [BDMGR3_2], [BDJP3_2], [BDRevise3_3], [BDSublead3_3], [BDGL3_3], [BDMGR3_3], [BDJP3_3], [BDSent3],
                    [Stage3], [Reason3], [ReqNo4], [Freq4], [Evaluation4], [PlanSam4], [ActSam4], [RepDue4], [SentRep4], [RepDays4],
                    [TS_Send4], [TTC_Receive4], [Request4], [TTCResult4], [IssueDate4], [Sublead4], [GL4], [MGR4], [JP4],
                    [Revise4_1], [Sublead4_1], [GL4_1], [MGR4_1], [JP4_1], [Revise4_2], [Sublead4_2], [GL4_2], [MGR4_2], [JP4_2],
                    [Revise4_3], [Sublead4_3], [GL4_3], [MGR4_3], [JP4_3], [BDPrepare4], [BDTTC4], [BDIssue4], [BDSublead4], [BDGL4],
                    [BDMGR4], [BDJP4], [BDRevise4_1], [BDSublead4_1], [BDGL4_1], [BDMGR4_1], [BDJP4_1], [BDRevise4_2], [BDSublead4_2],
                    [BDGL4_2], [BDMGR4_2], [BDJP4_2], [BDRevise4_3], [BDSublead4_3], [BDGL4_3], [BDMGR4_3], [BDJP4_3], [BDSent4],
                    [Stage4], [Reason4])
            VALUES (source.[Type], source.[MKTGroup], source.[Group], source.[Customer], source.[CustShort], source.[Frequency],
                    source.[Incharge], source.[KPIServ], source.[KPIPeriod], source.[RepItems], source.[Month], source.[Year],
                    source.[ReqNo1], source.[Freq1], source.[Evaluation1], source.[PlanSam1], source.[ActSam1], source.[RepDue1],
                    source.[SentRep1], source.[RepDays1], source.[TS_Send1], source.[TTC_Receive1], source.[Request1], source.[TTCResult1],
                    source.[IssueDate1], source.[Sublead1], source.[GL1], source.[MGR1], source.[JP1], source.[Revise1_1],
                    source.[Sublead1_1], source.[GL1_1], source.[MGR1_1], source.[JP1_1], source.[Revise1_2], source.[Sublead1_2],
                    source.[GL1_2], source.[MGR1_2], source.[JP1_2], source.[Revise1_3], source.[Sublead1_3], source.[GL1_3],
                    source.[MGR1_3], source.[JP1_3], source.[BDPrepare1], source.[BDTTC1], source.[BDIssue1], source.[BDSublead1],
                    source.[BDGL1], source.[BDMGR1], source.[BDJP1], source.[BDRevise1_1], source.[BDSublead1_1], source.[BDGL1_1],
                    source.[BDMGR1_1], source.[BDJP1_1], source.[BDRevise1_2], source.[BDSublead1_2], source.[BDGL1_2], source.[BDMGR1_2],
                    source.[BDJP1_2], source.[BDRevise1_3], source.[BDSublead1_3], source.[BDGL1_3], source.[BDMGR1_3], source.[BDJP1_3],
                    source.[BDSent1], source.[Stage1], source.[Reason1], source.[ReqNo2], source.[Freq2], source.[Evaluation2],
                    source.[PlanSam2], source.[ActSam2], source.[RepDue2], source.[SentRep2], source.[RepDays2], source.[TS_Send2],
                    source.[TTC_Receive2], source.[Request2], source.[TTCResult2], source.[IssueDate2], source.[Sublead2], source.[GL2],
                    source.[MGR2], source.[JP2], source.[Revise2_1], source.[Sublead2_1], source.[GL2_1], source.[MGR2_1], source.[JP2_1],
                    source.[Revise2_2], source.[Sublead2_2], source.[GL2_2], source.[MGR2_2], source.[JP2_2], source.[Revise2_3],
                    source.[Sublead2_3], source.[GL2_3], source.[MGR2_3], source.[JP2_3], source.[BDPrepare2], source.[BDTTC2],
                    source.[BDIssue2], source.[BDSublead2], source.[BDGL2], source.[BDMGR2], source.[BDJP2], source.[BDRevise2_1],
                    source.[BDSublead2_1], source.[BDGL2_1], source.[BDMGR2_1], source.[BDJP2_1], source.[BDRevise2_2], source.[BDSublead2_2],
                    source.[BDGL2_2], source.[BDMGR2_2], source.[BDJP2_2], source.[BDRevise2_3], source.[BDSublead2_3], source.[BDGL2_3],
                    source.[BDMGR2_3], source.[BDJP2_3], source.[BDSent2], source.[Stage2], source.[Reason2], source.[ReqNo3],
                    source.[Freq3], source.[Evaluation3], source.[PlanSam3], source.[ActSam3], source.[RepDue3], source.[SentRep3],
                    source.[RepDays3], source.[TS_Send3], source.[TTC_Receive3], source.[Request3], source.[TTCResult3], source.[IssueDate3],
                    source.[Sublead3], source.[GL3], source.[MGR3], source.[JP3], source.[Revise3_1], source.[Sublead3_1], source.[GL3_1],
                    source.[MGR3_1], source.[JP3_1], source.[Revise3_2], source.[Sublead3_2], source.[GL3_2], source.[MGR3_2],
                    source.[JP3_2], source.[Revise3_3], source.[Sublead3_3], source.[GL3_3], source.[MGR3_3], source.[JP3_3],
                    source.[BDPrepare3], source.[BDTTC3], source.[BDIssue3], source.[BDSublead3], source.[BDGL3], source.[BDMGR3],
                    source.[BDJP3], source.[BDRevise3_1], source.[BDSublead3_1], source.[BDGL3_1], source.[BDMGR3_1], source.[BDJP3_1],
                    source.[BDRevise3_2], source.[BDSublead3_2], source.[BDGL3_2], source.[BDMGR3_2], source.[BDJP3_2], source.[BDRevise3_3],
                    source.[BDSublead3_3], source.[BDGL3_3], source.[BDMGR3_3], source.[BDJP3_3], source.[BDSent3], source.[Stage3],
                    source.[Reason3], source.[ReqNo4], source.[Freq4], source.[Evaluation4], source.[PlanSam4], source.[ActSam4],
                    source.[RepDue4], source.[SentRep4], source.[RepDays4], source.[TS_Send4], source.[TTC_Receive4], source.[Request4],
                    source.[TTCResult4], source.[IssueDate4], source.[Sublead4], source.[GL4], source.[MGR4], source.[JP4],
                    source.[Revise4_1], source.[Sublead4_1], source.[GL4_1], source.[MGR4_1], source.[JP4_1], source.[Revise4_2],
                    source.[Sublead4_2], source.[GL4_2], source.[MGR4_2], source.[JP4_2], source.[Revise4_3], source.[Sublead4_3],
                    source.[GL4_3], source.[MGR4_3], source.[JP4_3], source.[BDPrepare4], source.[BDTTC4], source.[BDIssue4],
                    source.[BDSublead4], source.[BDGL4], source.[BDMGR4], source.[BDJP4], source.[BDRevise4_1], source.[BDSublead4_1],
                    source.[BDGL4_1], source.[BDMGR4_1], source.[BDJP4_1], source.[BDRevise4_2], source.[BDSublead4_2], source.[BDGL4_2],
                    source.[BDMGR4_2], source.[BDJP4_2], source.[BDRevise4_3], source.[BDSublead4_3], source.[BDGL4_3], source.[BDMGR4_3],
                    source.[BDJP4_3], source.[BDSent4], source.[Stage4], source.[Reason4]);
        `;
        // if (dataArray[i].CustShort === "APM") {
        //     console.log('mergeQuery :', mergeQuery);
        // }
        await mssql.qurey(mergeQuery);
    }

    console.log("Bulk upsert completed");
}

// ===== 8. เก็บข้อมูลที่แคชไว้ =====
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
        fetchServiceData();
        setInterval(fetchServiceData, 24 * 60 * 60 * 1000);
    }, timeUntilNextFetch);
}

scheduleDataFetch();
fetchServiceData();

// ===== 9. API Routes =====
router.post('/02SARKPI/ServiceSelectCache', (req, res) => {
    console.log("--02SARKPI/ServiceSelectCache--");
    res.json(cachedServiceData);
});

router.post('/02SARKPI/ServiceSelectRefresh', async (req, res) => {
    await fetchServiceData();
    return res.json({ success: true, message: "Cache refreshed", count: cachedServiceData.length });
});

router.post('/02SARKPI/Service', async (req, res) => {
    const input = req.body;
    console.log("--02SARKPI/Service--");
    console.log(input);
    console.log("Start:", formatDateTime(new Date().toISOString()));

    if (!input['YEAR']) {
        return res.status(400).json({ error: "Year is required" });
    }

    try {
        // โหลดข้อมูล master ครั้งเดียว
        // await Promise.all([
        await loadRoutineKACReport(),
            await loadHolidays()
        // ]);

        const masterRecords = await loadMasterPattern();
        const year = input['YEAR'];

        // ดึงข้อมูล RequestLab ครั้งเดียวสำหรับ 2 ปี
        console.log("Loading RequestLab data...");
        const requestRecords = await loadRequestLabData(year);
        console.log("RequestLab " + requestRecords.length + "data");
        // สร้าง Map สำหรับ lookup ที่เร็วขึ้น
        const requestByYearMonth = {};
        requestRecords.forEach(req => {
            const date = new Date(req.SamplingDate);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!requestByYearMonth[key]) {
                requestByYearMonth[key] = {};
            }
            if (!requestByYearMonth[key][req.CustShort]) {
                requestByYearMonth[key][req.CustShort] = [];
            }
            requestByYearMonth[key][req.CustShort].push(req);
        });

        const allResults = [];

        // ประมวลผลแต่ละปี/เดือน
        for (let a = 0; a < 2; a++) {
            const currentYear = year - a;

            for (let p = 0; p < 12; p++) {
                const month = String(p + 1).padStart(2, '0');
                const key = `${currentYear}-${month}`;

                console.log(`Processing Year ${currentYear} Month ${month}...`);

                const monthData = await processMonthData(
                    masterRecords,
                    requestByYearMonth[key] || {},
                    month,
                    currentYear
                );
                allResults.push(...monthData);
                console.log(`Year ${currentYear} Month ${month} Complete - ${monthData.length} records`);
            }
        }

        // Bulk upsert ครั้งเดียว
        console.log("Saving to database...");
        await bulkUpsertKPIService(allResults);

        // Refresh cache
        await fetchServiceData();

        console.log("Complete:", formatDateTime(new Date().toISOString()));
        return res.json({
            success: true,
            message: "Process completed",
            recordsProcessed: allResults.length
        });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: error.message });
    }
});

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

// ===== 10. สร้าง Index ในฐานข้อมูล (Run ครั้งแรกเท่านั้น) =====
/*
-- รัน SQL นี้ใน SQL Server Management Studio เพื่อเพิ่ม Performance
 
-- Index สำหรับ KPI_Service
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_KPI_Service_Lookup')
CREATE NONCLUSTERED INDEX IX_KPI_Service_Lookup 
ON [SARKPI].[dbo].[KPI_Service] ([CustShort], [Month], [Year])
INCLUDE ([Type], [MKTGroup], [Group], [Customer]);
 
-- Index สำหรับ RequestLab
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_RequestLab_Lookup')
CREATE NONCLUSTERED INDEX IX_RequestLab_Lookup 
ON [SAR].[dbo].[Routine_RequestLab] ([CustShort], [SamplingDate])
INCLUDE ([ReqNo], [RequestStatus], [SentRep], [SendDate], [ReceiveDate], [ResultApproveDate], [Reason]);
 
-- Index สำหรับ KACReport
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_KACReport_Lookup')
CREATE NONCLUSTERED INDEX IX_KACReport_Lookup 
ON [SAR].[dbo].[Routine_KACReport] ([ReqNo])
INCLUDE ([Evaluation], [CreateReportDate], [SubLeaderTime_0], [GLTime_0], [DGMTime_0], [JPTime_0]);
 
-- Index สำหรับ MasterPatternTS
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_MasterPattern_Lookup')
CREATE NONCLUSTERED INDEX IX_MasterPattern_Lookup 
ON [SAR].[dbo].[Routine_MasterPatternTS] ([CustShort])
INCLUDE ([TYPE], [MKTGROUP], [GROUP], [CustFull], [FRE], [Incharge], [KPIServ], [KPIPERIOD], [REPORTITEMS]);
*/

const callAPIsSequentially = async () => {
    const year = new Date().getFullYear();
    const payload = { YEAR: year };

    try {
        const StartTime = new Date();
        console.log("Calling API 1... " + formatDateTime(new Date().toISOString()));
        const response1 = await axios.post("http://127.0.0.1:14000/02SARKPI/Service", payload);
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

callAPIsSequentially();

schedule.scheduleJob("0 0 * * *", () => {
    console.log("Scheduled task started at midnight");
    callAPIsSequentially();
});

module.exports = router;
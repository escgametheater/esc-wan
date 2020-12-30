const fs = require('fs');
const combineAggregations = require ("./aggregationSubscriber").combineAggregations;
const displayAggregation = require ("./aggregationSubscriber").displayAggregation;
const fileName = process.argv[2] ;

if (!fileName) {
    console.log("Please enter a file name.");
    return ;
}

function getJSONfromFile(fileName) {
    return JSON.parse(fs.readFileSync(fileName));
}

function getAverage(key,n,aHist,v,a,i) {
    const i0 = Math.max(i-n,0);
    if (i0 > 0) {
        const deltaT = aHist[i].lastTimeStamp - aHist[i0].lastTimeStamp;
        const total0 = aHist[i0][key] ? aHist[i0][key].total : 0;
        const deltaV = v.total - total0 ;
        if (deltaT > 0) {
            return 1000*deltaV/deltaT ;
        }
        return "" ;
    }
    return "" ;
}
function getRatio(key,n,aHist,v,a,i) {
    const i0 = Math.max(i-n,0);
    if (i0 > 0) {
        const count0 = aHist[i0][key] ? aHist[i0][key].count : 0 ;
        const count = aHist[i][key] ? aHist[i][key].count : 0 ;
        const deltaCount = count - count0 ;
        const total0 = aHist[i0][key] ? aHist[i0][key].total : 0;
        const deltaV = v.total - total0 ;
        if (deltaCount > 0) {
            return deltaV/deltaCount ;
        }
        return "" ;
    }
    return "" ;
}

function processMessages(messages) {
    let a = {};
    let keys = ["join","#A","#B","#Null","A","B","A","B","Null","Null"];
    let cols2 = [
        {f: a => a["join"].total, label:"Joins"},
        {f: a => a["#A"].total, label:"Team A"},
        {f: a => a["#B"].total, label:"Team B"},
        {f: a => -a["#A+#B"].total, label:"#A+#B"},
        {f: a => a["A"].count, label:"A shakes"},
        {f: a => a["B"].count, label:"B shakes"},
        {f: a => a["A"].total, label:"A power"},
        {f: a => a["B"].total, label:"B power"},
        {f: a => a["Null"].count, label:"Null team shakes"},
        {f: a => a["Null"].count, label:"Null team power"},
    ];
    let cols = [
        {key:"join", f: v => v.total, label:"Joins"},
        {key:"#A", f: v => v.total, label:"Team A"},
        {key:"#B", f: v => v.total, label:"Team B"},
        {key:"#Null", f: v => -v.total, label:"#A+#B"},
        {key:"A", f: v => v.count, label:"A shakes"},
        {key:"B", f: v => v.count, label:"B shakes"},
        {key:"A", f: v => v.total, label:"A total"},
        {key:"B", f: v => v.total, label:"B total"},
        {key:"A", f: (v,a,i) => getAverage("A",48,aHist,v,a,i), label:"A power"},
        {key:"B", f: (v,a,i) => getAverage("B",48,aHist,v,a,i), label:"B power"},
        {key:"A", f: (v,a,i) => getRatio("A",48,aHist,v,a,i), label:"A per shake"},
        {key:"B", f: (v,a,i) => getRatio("B",48,aHist,v,a,i), label:"B per shake"},
        {key:"Null", f: v => v.count, label:"Null team shakes"},
        {key:"Null", f: v => v.count, label:"Null team power"},
    ];
    let fields = ["total","total","total","total","count","count","total","total","count","total"];
    let headers = ["Message","time"];
    cols.forEach(col => {
        headers.push(col.label || col.key);
    });
    let rows = [headers] ;
    console.log(headers.join("\t"));
    const aHist = [];
    messages.forEach(function(msg,i) {
        a = combineAggregations({message:msg.entry});
        if (!a) {
            return ;
        }
        aHist.push(a);
//        console.log(a);
//        console.log(msg);
        const name = msg.entry.aggregation.name ;
        displayAggregation(name,a);
        let columns = [i];
        let time = 0 ;
        cols.forEach((col)=> {
            const key = col.key;
            if (a[key]) {
                time = Math.max(time,a[key].lastUpdateTime);
            }
        });
        a.lastTimeStamp = time ;
        //columns.push(time);
        columns.push(new Date(time).toISOString().slice(11,23));

        cols.forEach(col=> {
            const key = col.key ;
            const f = col.f ;
            if (a[key]) {
                //columns.push(new Date(a[field].lastUpdateTime).toISOString().slice(11,23));
//                columns.push(a[key][fields[i]]);
                columns.push(f(a[key],a,i));
            }
            else {
                columns.push("");
                //columns.push("");
            }
        });
        rows.push(columns);
        console.log(columns.join("\t"));
    });
}

const messages = getJSONfromFile(fileName);
processMessages(messages);
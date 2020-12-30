const fs = require('fs');
const fileName = process.argv[2] ;

if (!fileName) {
    console.log("Please enter a file name.");
    return ;
}

function getJSONfromFile(fileName) {
    return JSON.parse(fs.readFileSync(fileName,{encoding:"utf8"}));
}

const questionColumnDefinitions = [
    { header: "id", value: obj=>obj.id},
    { header: "questionNum", value: obj=>obj.questionNum},
    { header: "text", value: obj=>obj.text},
];

const numAnswers = 3 ;
let i ;
for (i = 0 ; i < numAnswers; i++) {
    const ii = i ;
    const fields = ["id","text","correct"];
    fields.forEach((field) => {
        questionColumnDefinitions.push (
            { header: `answers[${ii}].${field}`, value: obj=> obj.answers.length > ii ? obj.answers[ii][field] : ""},
        );
    })
}

function arrayOfObjectsToArrayOfArrays(objs, columnDefinitions) {
    const arr = [[]];
    columnDefinitions.forEach( (col) => {
        arr[0].push(col.header);
    });
    objs.forEach( (obj) => {
        const row = [];
        arr.push(row);
        columnDefinitions.forEach( (col) => {
            row.push(col.value(obj));
        });
    });
    return arr ;
}

const testQuestions = [
    {"id":"c99d5a04-a036-4908-841c-f9a6e9f35a71","questionNum":1,"text":"This Lehigh Valley IronPigs player was struckout 3 times in 2015.","answers":[{"id":"4b2346d5-e4b9-4966-b6e1-62caf877515c","text":"John Hester","correct":true},{"id":"c5ea2b4f-6915-4531-9bc7-2ea01104c5ef","text":"Ed Bouchee","correct":false},{"id":"143b0ccb-c239-479c-964e-dd2182e0eb51","text":"Tim McCarver","correct":false}]},
    {"id":"289bcc1f-cba2-4998-b432-fc760646e884","questionNum":2,"text":"This Lehigh Valley IronPigs player was struckout 3 times in 2015.","answers":[{"id":"f7e3b2f3-0975-40ba-8d22-27655bda3b3a","text":"David Buchanan","correct":true},{"id":"3583db3c-922c-4bf6-8476-ed6127689138","text":"Pancho Herrera","correct":false},{"id":"418d6ab1-bcac-4bc3-bb8d-faf3edcc2014","text":"Brennan King","correct":false}]},
    {"id":"6e748e35-4fa3-4002-8f35-9f3387841290","questionNum":3,"text":"This Lehigh Valley IronPigs player was struckout 1 times in 2014.","answers":[{"id":"2f76d693-6016-4533-a1cb-7b211aaa4dd7","text":"Eddie Waitkus","correct":false},{"id":"f7df0b9d-de01-41ee-b608-e6b9396378d5","text":"David Buchanan","correct":true},{"id":"3b3c53ef-1e3e-438f-ad79-0c7b893a5592","text":"Bake McBride","correct":false}]},
    {"id":"b51346f4-cb03-4d1f-b78c-2ee44fab1b49","questionNum":4,"text":"This Lehigh Valley IronPigs player was struckout 0 times in 2010.","answers":[{"id":"2f9b3dcd-46da-4692-aa20-d886769aa485","text":"Jim Thome","correct":false},{"id":"d10641bc-8b1b-4c71-a1be-91d2890c6ad0","text":"Nelson Figueroa","correct":true},{"id":"e3d5a753-f05d-4fc9-aa62-bebca711c1d4","text":"Cookie Rojas","correct":false}]},
    {"id":"00f8f3f7-705c-4edf-a882-fb334266dbf9","questionNum":5,"text":"This Lehigh Valley IronPigs player pounded 79 hits in 2008.","answers":[{"id":"1b78a8a2-3fc0-4cd0-85f8-dcb8d2009a68","text":"Mike Schmidt","correct":false},{"id":"c4f94089-c777-4c4d-8fcd-685e4d4d2ae9","text":"Brian Bocock","correct":false},{"id":"3f8b809f-0e99-4eae-9fbc-9abe46d9f188","text":"Oscar Robles","correct":true}]},
];
//console.log(questionColumnDefinitions);

const array = arrayOfObjectsToArrayOfArrays(getJSONfromFile(fileName),questionColumnDefinitions) ;
array.forEach(row => console.log(row.join("\t")) );

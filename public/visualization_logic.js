/***************************************************************
    Constants
****************************************************************/
const msToDay = 1000 * 60 * 60 * 24;
let global_data = undefined;
/***************************************************************
    Interactivity Logic
****************************************************************/
window.addEventListener('load', () => { init() });

async function init() {
    //document.getElementById('updateButton').addEventListener('click', updateGraph);
    document.getElementById('toggleDirection').addEventListener('change', updateDirection);
    global_data = await getData();
    //updateGraph();
    updateDirection();
}

/***************************************************************
    Graph Logic
****************************************************************/

//each scene needs to filter the data and then do another rollup to sum the data (or not) 

function updateGraph() {
    d3.select("svg").html("");
    createAggregateGraph(getCheckedInData(global_data));
}

function setupGraph(){}

function createAggregateGraph(data) {
    var parseDate = d3.timeParse("%Y-%m-%d");
    var mindate = parseDate("2022-01-01"),
        maxdate = parseDate("2022-03-31");

    var x = d3.scaleTime()
        .domain([mindate, maxdate])
        .range([0, 500]);
    var y = d3.scaleLog().domain([3000, 150000]).range([500, 0]);

    d3.select("svg").append("g",).attr("transform", "translate(50,50)")
        .selectAll("circle").data(data).enter().append("circle")
        .attr("cx", function (d) {
            return x(parseDate(d.Date));
        }).attr("cy", function (d) { return y(d.Count); })
        .attr("r", function (d) { return 2; });

    d3.select("svg").append("g").attr("transform", "translate(50,50)").call(d3.axisLeft(y).tickValues([5000, 10000, 50000, 150000]).tickFormat(d3.format("d")));
    d3.select("svg").append("g").attr("transform", "translate(50,550)").call(d3.axisBottom(x).tickValues([10, 20, 50, 90]).tickFormat(d3.format("d")));
}

/***************************************************************
    Data Manipulation
****************************************************************/

async function getData() {
    //local
    //data = await d3.csv("https://jackmeyers.github.io/Ukraine-Refugee-Narrative-Visualization/public/border_traffic_UA_PL_01_03.csv");
    //github
    //if (data === undefined) {
    data = await d3.csv("border_traffic_UA_PL_01_03.csv");
    //}
    return data;
}

function getCheckedInData(data) {
    let aggregatedByDayDirection = d3.rollup(data, v => d3.sum(v, d => d.Number_of_persons_checked_in), d => d.Date, d => d.Direction_to_from_Poland);
    let aggregated = Array.from(aggregatedByDayDirection).map(([Date, Direction]) => ({ Date, Direction }));

    let output = [];
    if (isToPoland())
        index = Array.from(aggregated[0].Direction.keys()).indexOf('arrival in Poland');
    else
        index = Array.from(aggregated[0].Direction.keys()).indexOf('departure from Poland');

    aggregated.forEach(day => {
        output.push({
            Date: day.Date,
            Count: Array.from(day.Direction.values())[index]
        });
    })
    return output;
}

function getEvacuatedData(data) {
    let aggregatedByDayDirection = d3.rollup(data, v => d3.sum(v, d => d.Nu), d => d.Date, d => d.Number_of_people_evacuated);
    let aggregated = Array.from(aggregatedByDayDirection).map(([Date, Direction]) => ({ Date, Direction }));

    let output = [];
    if (isToPoland())
        index = Array.from(aggregated[0].Direction.keys()).indexOf('arrival in Poland');
    else
        index = Array.from(aggregated[0].Direction.keys()).indexOf('departure from Poland');

    aggregated.forEach(day => {
        output.push({
            Date: day.Date,
            Count: Array.from(day.Direction.values())[index]
        });
    })
    return output;
}

/***************************************************************
    Utilities / Tests
****************************************************************/

function isToPoland() {
    return document.getElementById("toggleDirection").checked;
}

function updateDirection() {
    if (isToPoland())
        document.getElementById("direction").innerText = "To Poland";
    else    
        document.getElementById("direction").innerText = "To Ukraine";
    updateGraph();
}

function testDateMath(entry) {
    console.log("Entry: " + entry.Date.toString());
    console.log("DaysFromBeginning: " + getDaysFromBeginning(entry));
}

function getMaxNumberPeopleCheckedIn(data) {
    let max = 0;
    for (entry of data) {
        if (entry.Number_of_persons_checked_in > max)
            max = entry.Number_of_persons_checked_in;
    }
    console.log(max);
}

function getDaysFromBeginning(value) {
    var start = new Date("2022-01-01");
    var current = new Date(value.Date);
    var diff = (current - start) / msToDay;
    return diff;
}
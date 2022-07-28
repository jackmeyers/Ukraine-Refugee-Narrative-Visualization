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
    document.getElementById('next-slide').addEventListener('click', getNextSlide);
    document.getElementById('toggle-direction').addEventListener('change', updateDirection);
    global_data = await getData();
    toggleDirectionText();
    updateSlide();
}

function updateSlide() {
    switch (getCurrentSlideIndex()) {
        case 0:
            updateGraphTitle("Checked in Border Crossings");      
            updateGraph(getCheckedInData(global_data));
            break;
        case 1:
            updateGraphTitle("Evacuation Border Crossings");      
            updateGraph(getEvacuatedData(global_data));
            break;
        case 2:
            console.log(2);
            break;
    }
}

function getNextSlide() {
    document.getElementById("visualization").setAttribute("data-slide", (getCurrentSlideIndex() + 1) % 3);
    updateSlide();
}

function updateDirection() {
    toggleDirectionText();
    updateSlide();
}

/***************************************************************
    Graph Logic
****************************************************************/

//each scene needs to filter the data and then do another rollup to sum the data (or not) 

function updateGraph(data) {
    d3.select("svg").html("");
    createAggregateGraph(data);
}

function setupGraph() { }

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
    data = await d3.csv("https://jackmeyers.github.io/Ukraine-Refugee-Narrative-Visualization/public/border_traffic_UA_PL_01_03.csv");
    //github
    if (data === undefined) {
        data = await d3.csv("border_traffic_UA_PL_01_03.csv");
    }
    return data;
}

function getCheckedInData(data) {
    let output = [];
    let aggregatedByDayDirection = d3.rollup(data, v => d3.sum(v, d => d.Number_of_persons_checked_in), d => d.Date, d => d.Direction_to_from_Poland);
    let aggregated = Array.from(aggregatedByDayDirection).map(([Date, Direction]) => ({ Date, Direction }));

    if (isToPoland())
        index = Array.from(aggregated[0].Direction.keys()).indexOf('arrival in Poland');
    else
        index = Array.from(aggregated[0].Direction.keys()).indexOf('departure from Poland');

    aggregated.forEach(day => {
        output.push({
            Date: day.Date,
            Count: Array.from(day.Direction.values())[index]
        });
    });
    return output;
}

function getEvacuatedData(data) {
    let output = [];
    //decided to edit the data because log(0) doesn't exist and causes issues due to plotting NaN
    let aggregatedByDayDirection = d3.rollup(data, v => { return d3.sum(v, d => d.Number_of_people_evacuated) < 1 ? 1 : d3.sum(v, d => d.Number_of_people_evacuated) }, d => d.Date, d => d.Direction_to_from_Poland);
    let aggregated = Array.from(aggregatedByDayDirection).map(([Date, Direction]) => ({ Date, Direction }));

    if (isToPoland())
        index = Array.from(aggregated[0].Direction.keys()).indexOf('arrival in Poland');
    else
        index = Array.from(aggregated[0].Direction.keys()).indexOf('departure from Poland');

    aggregated.forEach(day => {
        output.push({
            Date: day.Date,
            Count: Array.from(day.Direction.values())[index]
        });
    });
    return output;
}

/***************************************************************
    Utilities / Tests
****************************************************************/

function isToPoland() {
    return !document.getElementById("toggle-direction").checked;
}

function toggleDirectionText() {
    if (isToPoland())
        document.getElementById("direction").innerText = "To Poland";
    else
        document.getElementById("direction").innerText = "To Ukraine";
}

function updateGraphTitle(text){
    document.getElementById("graph-title").innerText = text;
}

function getCurrentSlideIndex(){
    return parseInt(document.getElementById("visualization").getAttribute("data-slide"));
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
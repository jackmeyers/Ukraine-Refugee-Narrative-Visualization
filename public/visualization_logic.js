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
    document.getElementById('toggle-direction').addEventListener('change', updateSlide);
    document.getElementById('toggle-crossing-type').addEventListener('change', updateSlide);
    global_data = await getData();
    updateSlide();
}

function updateSlide() {
    switch (getCurrentSlideIndex()) {
        case 0:
            updateGraphTitle("Checked in Border Crossings");      
            updateGraph(getCheckedInData(global_data));
            showDirectionToggle();
            hideCrossingType();      
            break;
        case 1:
            updateGraphTitle("Evacuation Border Crossings");      
            updateGraph(getEvacuatedData(global_data));
            showDirectionToggle();  
            hideCrossingType();    
            break;
        case 2:
            updateGraphTitle("Net Border Crossings");
            hideDirectionToggle();  
            showCrossingType();    
            break;
    }
}

function getNextSlide() {
    document.getElementById("visualization").setAttribute("data-slide", (getCurrentSlideIndex() + 1) % 3);
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
    //var y = d3.scaleLog().domain([100, 300000]).range([500, 0]);
    var y = d3.scaleLinear().domain([1, 150000]).range([500, 0]);

    d3.select("svg").append("g",).attr("transform", "translate(50,50)")
        .selectAll("circle").data(data).enter().append("circle")
        .attr("cx", function (d) {
            return x(parseDate(d.Date));
        }).attr("cy", function (d) { return y(d.Count); })
        .attr("r", function (d) { return 2; });

    d3.select("svg").append("g").attr("transform", "translate(50,50)").call(d3.axisLeft(y).tickValues([5000, 25000, 50000, 75000, 100000, 125000]).tickFormat(d3.format("d")));
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

function showDirectionToggle() {
    document.getElementById("direction-control").classList.remove("hide-control");
}

function hideDirectionToggle() {
    document.getElementById("direction-control").classList.add("hide-control");
}

function showCrossingType() {
    document.getElementById("crossing-type-control").classList.remove("hide-control");
}

function hideCrossingType() {
    document.getElementById("crossing-type-control").classList.add("hide-control");
}

function isToPoland() {
    return document.getElementById("toggle-direction").value === "to-poland";
}

function updateGraphTitle(text){
    document.getElementById("graph-title").innerText = text;
}

function getCurrentSlideIndex(){
    return parseInt(document.getElementById("visualization").getAttribute("data-slide"));
}

function getDaysFromBeginning(value) {
    var start = new Date("2022-01-01");
    var current = new Date(value.Date);
    var diff = (current - start) / msToDay;
    return diff;
}
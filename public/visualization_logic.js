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
            updateGraphTitle("Checked-in Border Crossings");
            createGraph(getDirectionalCheckInData(global_data, isToPoland()));
            showDirectionToggle();
            hideCrossingType();
            break;
        case 1:
            updateGraphTitle("Evacuations from Ukraine to Poland");
            createGraph(getDirectionalEvacuationData(global_data, isToPoland()));
            hideDirectionToggle();
            hideCrossingType();
            break;
        case 2:
            updateGraphTitle("Net Border Crossings from Ukraine to Poland");
            hideDirectionToggle();
            showCrossingType();
            createNetGraph(getNetCrossingData(global_data));
            break;
    }
}

function getNextSlide() {
    let index = (getCurrentSlideIndex() + 1) % 3;
    document.getElementById("visualization").setAttribute("data-slide", index);
    document.getElementById("slide-number").innerHTML = index+1;
    updateSlide();
}

/***************************************************************
    Graph Logic
****************************************************************/

function createGraph(data) {
    clearGraph();
    var parseDate = d3.timeParse("%Y-%m-%d");
    var mindate = parseDate("2022-01-01"),
        maxdate = parseDate("2022-03-31");

    var x = d3.scaleLinear().domain([0, 90]).range([0, 500]);
    var y = d3.scaleLinear().domain([0, 150000]).range([500, 0]);
    var height = d3.scaleLinear().domain([0, 150000]).range([0, 500]);
    var xDate = d3.scaleTime().domain([mindate, maxdate]).range([0, 500]);

    d3.select("svg").append("g").attr("transform","translate(50,50)")
        .selectAll("rect").data(data).enter().append("rect")
        .attr("x", function(d,i) { return x(i); })
        .attr("y", function(d) { return y(d.Count); })
        .attr("width", "4.5")
        .attr("height", function(d) {return height(d.Count);});

    d3.select("svg").append("g").attr("transform", "translate(50,50)").call(d3.axisLeft(y).tickValues([5000, 25000, 50000, 75000, 100000, 125000]).tickFormat(d3.format("d"))).append("text")
    .attr("fill", "#000").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", "0.8em").attr("text-anchor", "end").text("Total daily count of people");
    d3.select("svg").append("g").attr("transform", "translate(50,550)").call(d3.axisBottom(xDate).tickFormat(d3.timeFormat("%b-%d")).tickValues(sampleDates(data).map(function (d) { return new Date(d.Date) })))
}

function createNetGraph(data) {
    clearGraph();
    console.log(data);
    var parseDate = d3.timeParse("%Y-%m-%d");
    var mindate = parseDate("2022-01-01"),
        maxdate = parseDate("2022-03-31");

    var x = d3.scaleLinear().domain([0, 90]).range([0, 500]);
    var y = d3.scaleLinear().domain([-50000, 250000]).range([500, 0]);
    var height = d3.scaleLinear().domain([0, 250000]).range([0, 416.667]);
    var xDate = d3.scaleTime().domain([mindate, maxdate]).range([0, 500]);

    d3.select("svg").append("g").attr("transform","translate(50,50)")
        .selectAll("rect").data(data).enter().append("rect")
        .attr("x", function(d,i) { return x(i); })
        .attr("y", function(d) { return d.Count < 0 ? 416.667 : y(d.Count) ; })
        .attr("width", "4.5")
        .attr("height", function(d) {return d.Count < 0 ? height(-d.Count): height(d.Count); });

    d3.select("svg").append("g").attr("transform", "translate(50,50)").call(d3.axisLeft(y).ticks(7).tickFormat(d3.format("d"))).append("text")
    .attr("fill", "#000").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", "0.8em").attr("text-anchor", "end").text("Total daily count of people");
    d3.select("svg").append("g").attr("transform", "translate(50,550)").call(d3.axisBottom(xDate).tickFormat(d3.timeFormat("%b-%d")).tickValues(sampleDates(data).map(function (d) { return new Date(d.Date) })))
}

function clearGraph() {
    d3.select("svg").html("");
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

function getDirectionalCheckInData(data, toPoland) {
    let output = [];
    let aggregatedByDayDirection = d3.rollup(data, v => d3.sum(v, d => d.Number_of_persons_checked_in), d => d.Date, d => d.Direction_to_from_Poland);
    let aggregated = Array.from(aggregatedByDayDirection).map(([Date, Direction]) => ({ Date, Direction }));

    if (toPoland)
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

function getDirectionalEvacuationData(data, toPoland) {
    let output = [];
    let aggregatedByDayDirection = d3.rollup(data, v => { return d3.sum(v, d => d.Number_of_people_evacuated) }, d => d.Date, d => d.Direction_to_from_Poland);
    let aggregated = Array.from(aggregatedByDayDirection).map(([Date, Direction]) => ({ Date, Direction }));

    if (toPoland)
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

function getNetCrossingData(data) {
    let netCrossings = []
    switch(getCrossingType()){
        case "all":
            netCrossings = sumCountArrays(getNetCheckedInData(data), getNetEvacuationData(data))
            break;
        case "check-in":
            netCrossings = getNetCheckedInData(data);
            break;
        case "evacuation":
            netCrossings = getNetEvacuationData(data);
            break;
    }
    return netCrossings;
}

//Returns net crossings with respect to Poland - Ukraine
function getNetCheckedInData(data){
    let checkedInToPoland = getDirectionalCheckInData(data, true);
    let checkedInToUkraine = getDirectionalCheckInData(data, false);
    return subtractCountArrays(checkedInToPoland, checkedInToUkraine);
}

//Returns net crossings with respect to Poland - Ukraine
function getNetEvacuationData(data){
    let evacuatedToPoland = getDirectionalEvacuationData(data, true);
    let evacuatedToUkraine = getDirectionalEvacuationData(data, false);
    return subtractCountArrays(evacuatedToPoland, evacuatedToUkraine);
}

/***************************************************************
    Utilities / Tests
****************************************************************/

function sumCountArrays(arr1, arr2){
    let output = [];
    for (let i = 0; i < arr1.length; i++){
        let entry = {Date: arr1[i].Date, Count: arr1[i].Count + arr2[i].Count}
        output.push(entry);
    }
    return output;
}

function subtractCountArrays(arr1, arr2){
    let output = [];
    for (let i = 0; i < arr1.length; i++){
        let entry = {Date: arr1[i].Date, Count: arr1[i].Count - arr2[i].Count}
        output.push(entry);
    }
    return output;
}

function sampleDates(data) {
    let sampled = [];
    for (let i = 0; i < data.length; i++) {
        if (i % 14 === 1) {
            sampled.push(data[i]);
        }
    }
    return sampled;
}

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

function getCrossingType() {
    return document.getElementById("toggle-crossing-type").value;
}

function updateGraphTitle(text) {
    document.getElementById("graph-title").innerText = text;
}

function getCurrentSlideIndex() {
    return parseInt(document.getElementById("visualization").getAttribute("data-slide"));
}

function getDaysFromBeginning(value) {
    var start = new Date("2022-01-01");
    var current = new Date(value.Date);
    var diff = (current - start) / msToDay;
    return diff;
}
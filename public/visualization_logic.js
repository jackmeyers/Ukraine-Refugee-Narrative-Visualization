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
            showCheckInVis();
            break;
        case 1:
            showEvacuationVis();
            break;
        case 2:
            showNetCrossingVis();
            break;
    }
}

function showCheckInVis() {
    updateGraphTitle("Checked-in Border Crossings");
    updateGraphSubtext("Checked-in border crossings denote a standard border crossing with a visa.");
    createCheckInGraph(getDirectionalCheckInData(global_data, isToPoland()));
    showDirectionToggle();
    hideCrossingType();
    return;
}

function showEvacuationVis() {
    updateGraphTitle("Evacuations from Ukraine to Poland");
    updateGraphSubtext("No parameter control for crossing type because there were only evacuations from Ukraine to Poland.");
    createEvacuationGraph(getDirectionalEvacuationData(global_data, true));
    hideDirectionToggle();
    hideCrossingType();
    return;
}

function showNetCrossingVis() {
    updateGraphTitle("Net Border Crossings from Ukraine to Poland");
    updateGraphSubtext("");
    hideDirectionToggle();
    showCrossingType();
    createNetGraph(getNetCrossingData(global_data));
    return;
}

function getNextSlide() {
    let index = (getCurrentSlideIndex() + 1) % 3;
    document.getElementById("visualization").setAttribute("data-slide", index);
    document.getElementById("slide-number").innerHTML = index + 1;
    updateSlide();
}

/***************************************************************
    Graph Logic
****************************************************************/

function createCheckInGraph(data) {
    let svg = d3.select("svg");
    var parseDate = d3.timeParse("%Y-%m-%d");
    var mindate = parseDate("2022-01-01"), maxdate = parseDate("2022-03-31");
    var x = d3.scaleLinear().domain([0, 90]).range([0, 500]);
    var y = d3.scaleLinear().domain([0, 150000]).range([500, 0]);
    var height = d3.scaleLinear().domain([0, 150000]).range([0, 500]);
    var xDate = d3.scaleTime().domain([mindate, maxdate]).range([0, 500]);

    clearGraph();
    svg.append("g").attr("transform", "translate(50,50)")
        .selectAll("rect").data(data).enter().append("rect")
        .attr("x", function (d, i) { return x(i); })
        .attr("y", function (d) { return y(d.Count); })
        .attr("width", "4.5")
        .attr("height", function (d) { return height(d.Count); });

    svg.append("g").attr("transform", "translate(50,50)").call(d3.axisLeft(y).ticks(7).tickFormat(d3.format("d"))).append("text")
        .attr("fill", "#000").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", "0.8em").attr("text-anchor", "end").text("Total daily count of people");
    svg.append("g").attr("transform", "translate(50,550)").call(d3.axisBottom(xDate).tickFormat(d3.timeFormat("%b-%d")).tickValues(sampleDates(data).map(function (d) { return new Date(d.Date) })))

    addCheckInAnnotations(x, y);
}

function addCheckInAnnotations(x, y) {
    let annotations = []
    if (isToPoland()) {
        annotations = [
            {
                note: {
                    label: "Avg daily count: 16,873",
                    title: "Jan-21 : Feb-21",
                    wrap: 200,
                },
                x: x(21),
                y: y(20000),
                dy: -90,
                dx: 20,
                subject: { width: 175, height: 30 },
                type: d3.annotationCalloutRect,
            },
            {
                note: {
                    label: "Avg daily count: 101,079",
                    title: "First two weeks: Feb-24 to Mar-10",
                    wrap: 270,
                },
                x: x(56),
                y: y(101000),
                dy: 20,
                dx: -40,
                subject: { width: 80, height: 30 },
                type: d3.annotationCalloutRect,
            },
        ]
    }
    else {
        annotations = [
            {
                note: {
                    label: "Beginning of Russian Invasion",
                    title: "February 24th",
                    wrap: 200,
                },
                x: x(55),
                y: y(12500),
                dy: -40,
                dx: -40,
                type: d3.annotationCalloutElbow,
            },
            {
                note: {
                    label: "Little change in flow of people to Ukraine",
                    title: "Weeks following invasion",
                    wrap: 280,
                },
                x: x(60),
                y: y(16000),
                dy: -100,
                dx: -10,
                subject: { width: 100, height: 30 },
                type: d3.annotationCalloutRect,
            },
        ]
    }
    d3.select("svg").append("g").attr("transform", "translate(50,50)").call(d3.annotation().annotations(annotations))
    let elements = document.getElementsByClassName("annotation");
    for (let i = 0; i < elements.length; i++) {
        const showAnnotation1Timeout = setTimeout(showAnnotation, 1000 + 1000 * i, elements[i]);
    }
    return;
}

function createEvacuationGraph(data) {
    let svg = d3.select("svg");
    var parseDate = d3.timeParse("%Y-%m-%d");
    var mindate = parseDate("2022-01-01"), maxdate = parseDate("2022-03-31");
    var x = d3.scaleLinear().domain([0, 90]).range([0, 500]);
    var y = d3.scaleLinear().domain([0, 100000]).range([500, 0]);
    var height = d3.scaleLinear().domain([0, 100000]).range([0, 500]);
    var xDate = d3.scaleTime().domain([mindate, maxdate]).range([0, 500]);

    clearGraph();
    svg.append("g").attr("transform", "translate(50,50)")
        .selectAll("rect").data(data).enter().append("rect")
        .attr("x", function (d, i) { return x(i); })
        .attr("y", function (d) { return y(d.Count); })
        .attr("width", "4.5")
        .attr("height", function (d) { return height(d.Count); });

    svg.append("g").attr("transform", "translate(50,50)").call(d3.axisLeft(y).ticks(7).tickFormat(d3.format("d"))).append("text")
        .attr("fill", "#000").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", "0.8em").attr("text-anchor", "end").text("Total daily count of people");
    svg.append("g").attr("transform", "translate(50,550)").call(d3.axisBottom(xDate).tickFormat(d3.timeFormat("%b-%d")).tickValues(sampleDates(data).map(function (d) { return new Date(d.Date) })))

    addEvacuationAnnotations(x, y);
    return;
}

function addEvacuationAnnotations(x, y) {
    let annotations = [
        {
            note: {
                label: "Beginning of Russian Invasion",
                title: "February 24th",
                wrap: 200,
            },
            x: x(53),
            y: y(5000),
            dy: -50,
            dx: -50,
            type: d3.annotationCalloutElbow,
        },
        {
            note: {
                label: "Avg daily count: 69,495",
                title: "First two weeks: Feb-24 to Mar-10",
                wrap: 270,
            },
            x: x(54),
            y: y(70000),
            dy: 20,
            dx: -40,
            subject: { width: 80, height: 30 },
            type: d3.annotationCalloutRect,
        },
    ]
    d3.select("svg").append("g").attr("transform", "translate(50,50)").call(d3.annotation().annotations(annotations))
    let elements = document.getElementsByClassName("annotation");
    for (let i = 0; i < elements.length; i++) {
        const showAnnotation1Timeout = setTimeout(showAnnotation, 1000 + 1000 * i, elements[i]);
    }
    return;
}

function createNetGraph(data) {
    let svg = d3.select("svg");
    var parseDate = d3.timeParse("%Y-%m-%d");
    var mindate = parseDate("2022-01-01"), maxdate = parseDate("2022-03-31");
    var x = d3.scaleLinear().domain([0, 90]).range([0, 500]);
    var y = d3.scaleLinear().domain([-50000, 250000]).range([500, 0]);
    var height = d3.scaleLinear().domain([0, 250000]).range([0, 416.667]);
    var xDate = d3.scaleTime().domain([mindate, maxdate]).range([0, 500]);

    clearGraph();
    svg.append("g").attr("transform", "translate(50,50)")
        .selectAll("rect").data(data).enter().append("rect")
        .attr("x", function (d, i) { return x(i); })
        .attr("y", function (d) { return d.Count < 0 ? 416.667 : y(d.Count); })
        .attr("width", "4.5")
        .attr("height", function (d) { return d.Count < 0 ? height(-d.Count) : height(d.Count); });

    svg.append("g").attr("transform", "translate(50,50)").call(d3.axisLeft(y).ticks(7).tickFormat(d3.format("d"))).append("text")
        .attr("fill", "#000").attr("transform", "rotate(-90)").attr("y", 6).attr("dy", "0.8em").attr("text-anchor", "end").text("Total daily count of people");
    svg.append("g").attr("transform", "translate(50,550)").call(d3.axisBottom(xDate).tickFormat(d3.timeFormat("%b-%d")).tickValues(sampleDates(data).map(function (d) { return new Date(d.Date) })))

    addNetAnnotations(x, y);
    return;
}

function addNetAnnotations(x, y) {
    let annotations = [];
    let beginningOfInvasion = {
        note: {
            label: "Beginning of Russian Invasion",
            title: "February 24th",
            wrap: 200,
        },
        x: x(54),
        y: y(10000),
        dy: -50,
        dx: -50,
        type: d3.annotationCalloutElbow,
    };
    let denotesFlowToUkraine = {
        note: {
            title: "Denotes positive flow of people to Ukraine",
            wrap: 300,
        },
        x: x(2.8),
        y: y(1000),
        dy: 40,
        dx: 40,
        subject: { width: 18, height: 20 },
        type: d3.annotationCalloutRect,
    };

    switch (getCrossingType()) {
        case "all":
            annotations.push(
                denotesFlowToUkraine,
                beginningOfInvasion,
                {
                    note: {
                        label: "Peak net crossings at 229,832 people",
                        title: "March 7th",
                        wrap: 250,
                    },
                    x: x(65.3),
                    y: y(231000),
                    dy: 40,
                    dx: -80,
                    subject: { radius: 12, radiusPadding: 10 },
                    type: d3.annotationCalloutCircle
                });
            break;
        case "check-in":
            annotations.push(
                denotesFlowToUkraine,
                beginningOfInvasion,
                {
                    note: {
                        label: "Peak check-ins at 132,973 people",
                        title: "March 7th",
                        wrap: 250,
                    },
                    x: x(65.3),
                    y: y(134000),
                    dy: 40,
                    dx: -80,
                    subject: { radius: 12, radiusPadding: 10 },
                    type: d3.annotationCalloutCircle
                });
            break;
        case "evacuation":
            annotations.push(
                beginningOfInvasion,
                {
                    note: {
                        label: "Peak evacuations at 95,781 people",
                        title: "March 6th",
                        wrap: 250,
                    },
                    x: x(65.3),
                    y: y(97000),
                    dy: -40,
                    dx: -80,
                    subject: { radius: 12, radiusPadding: 10 },
                    type: d3.annotationCalloutCircle
                });
            break;
    }

    d3.select("svg").append("g").attr("transform", "translate(50,50)").call(d3.annotation().annotations(annotations))
    let elements = document.getElementsByClassName("annotation");
    for (let i = 0; i < elements.length; i++) {
        const showAnnotation1Timeout = setTimeout(showAnnotation, 1000 + 1000 * i, elements[i]);
    }
    return;
}

function clearGraph() {
    d3.select("svg").html("");
    return;
}

function showAnnotation(node) {
    if (node) node.classList.add("show-annotation");
    return;
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
    switch (getCrossingType()) {
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
function getNetCheckedInData(data) {
    let checkedInToPoland = getDirectionalCheckInData(data, true);
    let checkedInToUkraine = getDirectionalCheckInData(data, false);
    return subtractCountArrays(checkedInToPoland, checkedInToUkraine);
}

//Returns net crossings with respect to Poland - Ukraine
function getNetEvacuationData(data) {
    let evacuatedToPoland = getDirectionalEvacuationData(data, true);
    let evacuatedToUkraine = getDirectionalEvacuationData(data, false);
    return subtractCountArrays(evacuatedToPoland, evacuatedToUkraine);
}

/***************************************************************
    Utilities / Tests
****************************************************************/

function sumCountArrays(arr1, arr2) {
    let output = [];
    for (let i = 0; i < arr1.length; i++) {
        let entry = { Date: arr1[i].Date, Count: arr1[i].Count + arr2[i].Count }
        output.push(entry);
    }
    return output;
}

function subtractCountArrays(arr1, arr2) {
    let output = [];
    for (let i = 0; i < arr1.length; i++) {
        let entry = { Date: arr1[i].Date, Count: arr1[i].Count - arr2[i].Count }
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

function updateGraphSubtext(text) {
    document.getElementById("graph-subtext").innerText = text;
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
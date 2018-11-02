// maximum time allowed on x axis in seconds
var initialXmax = 10;  // number of seconds
var initalYmax = 50;  // number of people

var ARRIVAL = 0;
var SERVICE = 1;

var arrival = [
    {
        "time": 0,
        "people": 0,
    }
]
var service = [
    {
        "time": 0,
        "people": 0
    }
]

var queue = [
    {
        "time": 0,
        "queueLength": 0,
        "totalWaitTime": 0,
        "averageWaitTime": 0
    }
]

var addArrivalPeople = 0;
var addServicePeople = 0;
var timeInSeconds = 0;

var queueLength = 0;
var totalWaitTime = 0;
var averageWaitTime = 0;

// these can be adjusted by slider
// ranging from 0 to 5
var arrivalFreq = 0;
var serviceFreq = 0;

// click step: the amount of seconds that each click represents
// can choose from 1 to 5 by radio button
var clickStep = 1;

// simulation speed
var UPDATE_INTERVAL = 500;

// chart properties
var margin = {
        top: 80,
        right: 10,
        bottom: 50,
        left: 100
    },

width = 900 - margin.left - margin.right,
height = 350 - margin.top - margin.bottom;

// chart titles
X_AXIS_TITLE = "Time Elapsed (sec)";
COUNT_Y_AXIS_TITLE = "Cumulative Frequency Count (# of People)";
QUEUE_Y_AXIS_TITLE = "Queue Length (# of people)";

COUNT_CHART_TITLE = "How Arrival and Service Count Evolve";
QUEUE_CHART_TITLE = "How Queue Evolves";
TIME_CHART_TITLE = "How Avg Wait Time Changes";
TIME_Y_AXIS_TITLE = "Avg Wait Time (sec)";

// chart dot size changes dynamically
var DOT_SIZE = 10;
var LINE_WIDTH = 2;

// slider property
var SLIDER_WIDTH = 500;
var SLIDER_CONTAINER_WIDTH = 600;
var SLIDER_HEIGHT = 100;

// tooltip div
var div = d3.select("body").append("div")
                .attr("class", "toolTip")
                .style("position", "absolute");


function wireButtonClickEvents() {

    var startSimulation;

    d3.selectAll("#start .button").on("click", function () {
        var button = d3.select(this);
        if (button.text() == "Stop")
        {   
            clearInterval(startSimulation);
            d3.select(this).text("Start");
        }
        else
        {   
            startSimulation = setInterval(makeQueue, UPDATE_INTERVAL);
            d3.select(this).text("Stop");
        }
    });
}


$(document).ready(function () {
    
    // make the chart even it is empty
    visualizeCountChart();
    visualizeQueueChart();
    visualizeTimeChart();

    changeSlider();


    // call it once when it's clicked
    wireButtonClickEvents();
});

function changeSlider() {

    // Arrival slider
    var sliderArrival = d3.sliderHorizontal().min(0).max(5).step(1).width(SLIDER_WIDTH)
                   .on('onchange', val => {
                       arrivalFreq = val;
                   });

    d3.select("#sliderArrival").append("svg")
      .attr("width", SLIDER_CONTAINER_WIDTH)
      .attr("height", SLIDER_HEIGHT)
      .append("g")
      .attr("transform", "translate(30,30)")
      .call(sliderArrival);

    d3.select('#sliderArrival').call(sliderArrival);
    
    // Service slider
    var sliderService = d3.sliderHorizontal().min(0).max(5).step(1).width(SLIDER_WIDTH)
                   .on('onchange', val => {
                       serviceFreq = val;
                   });

    d3.select("#sliderService").append("svg")
      .attr("width", SLIDER_CONTAINER_WIDTH)
      .attr("height", SLIDER_HEIGHT)
      .append("g")
      .attr("transform", "translate(30,30)")
      .call(sliderService);

    d3.select('#sliderService').call(sliderService);

    // step size slider
    var sliderStep = d3.sliderHorizontal().min(1).max(5).step(1).width(SLIDER_WIDTH)
                   .on('onchange', val => {
                       clickStep = val;
                   });

    d3.select("#stepSize").append("svg")
      .attr("width", SLIDER_CONTAINER_WIDTH)
      .attr("height", SLIDER_HEIGHT)
      .append("g")
      .attr("transform", "translate(30,30)")
      .call(sliderStep);

    d3.select('#stepSize').call(sliderStep);
}


function countClipping(arrivalCount, serviceCount) {
    if (serviceCount > arrivalCount)
    {
        serviceCount = arrivalCount;
    }
    return [arrivalCount, serviceCount];
}

function makeQueue() {
    // time value (each click increases it by clickStep seconds)
    // clickStep ranges from 1 to 5
    timeInSeconds = timeInSeconds + clickStep;

    // arrival curve
    var prevArrival = addArrivalPeople;
    // update arrival
    addArrivalPeople = addArrivalPeople + arrivalFreq * clickStep;
    // check arrival and service frequency
    // the service frequency can be larger than arrival frequency
    // but the service curve can never be higher than arrival curve
    // hence clipping is required
    var clipped = countClipping(addArrivalPeople, addServicePeople);
    addArrivalPeople = clipped[ARRIVAL];

    // push to the array
    arrival.push({time: timeInSeconds, people: addArrivalPeople});

    // service curve
    var prevService = addServicePeople;
    // update service
    addServicePeople = addServicePeople + serviceFreq * clickStep;
    var clipped = countClipping(addArrivalPeople, addServicePeople);

    addServicePeople = clipped[SERVICE];

    // push to the array
    service.push({time: timeInSeconds, people: addServicePeople});
    
    // queue length curve
    var prevQueueLength = queueLength;
    // update queue length
    queueLength = addArrivalPeople - addServicePeople;
    // total wait time
    totalWaitTime = totalWaitTime + (prevQueueLength + queueLength) * clickStep / 2;
    // average wait time
    averageWaitTime = totalWaitTime / timeInSeconds;
    // push to the array
    queue.push({time: timeInSeconds, 
                queueLength: queueLength, 
                totalWaitTime: totalWaitTime,
                averageWaitTime: averageWaitTime});
    
    // update div info on bottom right of visualization
    var divArrival = document.getElementById("arrivedVal");
    divArrival.innerHTML = addArrivalPeople + " ppl";
    var divService = document.getElementById("servedVal");
    divService.innerHTML = addServicePeople + " ppl";
    var divQueued = document.getElementById("queuedVal");
    divQueued.innerHTML = queueLength + " ppl";
    var divAvgWaitTime = document.getElementById("avgWaitTimeval");
    divAvgWaitTime.innerHTML = averageWaitTime.toFixed(2) + " seconds";


    d3.selectAll("#chart1 > *").remove();
    d3.selectAll("#chart2 > *").remove();
    d3.selectAll("#chart3 > *").remove();

    visualizeCountChart();
    visualizeQueueChart();
    visualizeTimeChart()

}

function visualizeCountChart() {

    var toolTipCaption = ["<br>Arrived: ",
                          "<br>Served: ",
                          "<br>Both arrival and service: "];
    // from data
    maxTime = d3.max(arrival, function(d) {return d.time});
    maxPeople = d3.max(arrival, function(d) {return d.people});
   
    if (maxTime < initialXmax)
    {
        maxTime = initialXmax;
    }
    if (maxPeople < initalYmax)
    {
        maxPeople = initalYmax;
    }

    // dynamically change dot size
    DOT_SIZE = 50/(0.1*timeInSeconds+5);

    if (DOT_SIZE <= LINE_WIDTH)
    {
      DOT_SIZE = 3;
    }

    var xScale = d3.scaleLinear()
                   .domain([0, maxTime]) 
                   .range([0, width])
                   .nice();
    
    var yScale = d3.scaleLinear()
                   .domain([0, maxPeople])
                   .range([height, 0])
                   .nice();

    var chart = d3.select("#chart1").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
    
    var xAxis = chart.append("g")
                    .attr("transform", "translate(0, " + height + ")")
                    .call(d3.axisBottom(xScale));

    var yAxis = chart.append("g")
                    .call(d3.axisLeft(yScale));
    
    var lineGen = d3.line(arrival)
                 .x(function(d) { return xScale(d.time); })
                 .y(function(d) { return yScale(d.people); });
    

    chart.append('svg:path')
         .attr('d', lineGen(arrival))
         .attr('stroke', 'red')
         .attr('stroke-width', LINE_WIDTH)
         .attr('fill', 'none');
   
    chart.append('svg:path')
         .attr('d', lineGen(service))
         .attr('stroke', 'blue')
         .attr('stroke-width', LINE_WIDTH)
         .attr('fill', 'none');

    chart.selectAll(".dotArrival")
         .data(arrival)
         .enter().append("circle")
         .attr("class", "dotArrival")
         .attr("fill", "red")
         .attr("cx", function(d, i) { return xScale(d.time) })
         .attr("cy", function(d) { return yScale(d.people) })
         .attr("r", DOT_SIZE)
         .attr("opacity", "0.4")
         .on("mousemove", function(d) {
             d3.select(this).attr("opacity", "1");
             div.style("left", (d3.event.pageX) - 30 + "px")
                    .style("top", (d3.event.pageY) - 30 +"px")
                    .style("display", "inline-block")
                    .html("<b>Arrived: "+d.people+"</b>");
         })
         .on("mouseout", function(d) {
             d3.select(this).attr("opacity", "0.4");
             div.style("display", "none");
         })
    

    chart.selectAll(".dotService")
         .data(service)
         .enter().append("circle")
         .attr("class", "dotService")
         .attr("fill", "blue")
         .attr("cx", function(d, i) { return xScale(d.time) })
         .attr("cy", function(d) { return yScale(d.people) })
         .attr("r", DOT_SIZE)
         .attr("opacity", "0.4")
         .on("mousemove", function(d) {
             d3.select(this).attr("opacity", "1");
             div.style("left", (d3.event.pageX) - 30 +  "px")
                    .style("top", (d3.event.pageY) - 30 +"px")
                    .style("display", "inline-block")
                    .html("<b>Served: "+d.people+"</b>");
         })
         .on("mouseout", function(d) {
             d3.select(this).attr("opacity", "0.4");
             div.style("display", "none");
         })
    
    // Chart title
    chart.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 5))
        .attr("text-anchor", "middle")  
        .style("font-size", "25px")
        .style("font-weight", "bold") 
        .text(COUNT_CHART_TITLE);

    // x axis label
    chart.append("text")
         .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (height + 40) + ")")
         .style("text-anchor", "middle")
         .text(X_AXIS_TITLE);

    // y axis label
    chart.append("text")
         .attr("transform", "rotate(-90)")
         .attr("y", -50)
         .attr("x",0 - (height / 2))
         .attr("dy", "1em")
         .style("text-anchor", "middle")
         .text(COUNT_Y_AXIS_TITLE);   
}

function visualizeQueueChart() {
    // from data
    maxTime = d3.max(arrival, function(d) {return d.time});
    maxQueue = d3.max(queue, function(d) {return d.queueLength});
   
    if (maxTime < initialXmax)
    {
        maxTime = initialXmax;
    }
    if (maxQueue < initalYmax/5)
    {
        maxQueue = initalYmax/5;
    }
    
    var xScale = d3.scaleLinear()
                   .domain([0, maxTime]) 
                   .range([0, width])
                   .nice();
    
    var yScale = d3.scaleLinear()
                   .domain([0, maxQueue])
                   .range([height, 0])
                   .nice();

    var chart = d3.select("#chart2").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
    
    var xAxis = chart.append("g")
                    .attr("transform", "translate(0, " + height + ")")
                    .call(d3.axisBottom(xScale));

    var yAxis = chart.append("g")
                    .call(d3.axisLeft(yScale));
    
    var lineGen = d3.line(queue)
                 .x(function(d) { return xScale(d.time); })
                 .y(function(d) { return yScale(d.queueLength); });


    chart.append('svg:path')
         .attr('d', lineGen(queue))
         .attr('stroke', 'orange')
         .attr('stroke-width', LINE_WIDTH)
         .attr('fill', 'none');
    
  
    chart.selectAll(".dotQueue")
         .data(queue)
         .enter().append("circle")
         .attr("class", "dotArrival")
         .attr("fill", "orange")
         .attr("cx", function(d, i) { return xScale(d.time) })
         .attr("cy", function(d) { return yScale(d.queueLength) })
         .attr("r", DOT_SIZE)
         .attr("opacity", "0.4")
         .on("mousemove", function(d) {
             d3.select(this).attr("opacity", "1");
             div.style("left", (d3.event.pageX) - 30 +  "px")
                    .style("top", (d3.event.pageY) - 30 +"px")
                    .style("display", "inline-block")
                    .html("<b>Queued: "+d.queueLength+"</b>");
         })
         .on("mouseout", function(d) {
             d3.select(this).attr("opacity", "0.4");
             div.style("display", "none");
         })

    // Chart title
    chart.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 5))
        .attr("text-anchor", "middle")  
        .style("font-size", "25px")
        .style("font-weight", "bold") 
        .text(QUEUE_CHART_TITLE);

    // x axis label
    chart.append("text")
         .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (height + 40) + ")")
         .style("text-anchor", "middle")
         .text(X_AXIS_TITLE);

    // y axis label
    chart.append("text")
         .attr("transform", "rotate(-90)")
         .attr("y", -50)
         .attr("x",0 - (height / 2))
         .attr("dy", "1em")
         .style("text-anchor", "middle")
         .text(QUEUE_Y_AXIS_TITLE);   
}

function visualizeTimeChart() {
    // from data
    maxTime = d3.max(arrival, function(d) {return d.time});
    maxAvgWait = d3.max(queue, function(d) {return d.averageWaitTime});
   
    if (maxTime < initialXmax)
    {
        maxTime = initialXmax;
    }
    if (maxAvgWait < initalYmax/25)
    {
        maxAvgWait = initalYmax/25;
    }
    
    var xScale = d3.scaleLinear()
                   .domain([0, maxTime]) 
                   .range([0, width])
                   .nice();
    
    var yScale = d3.scaleLinear()
                   .domain([0, maxAvgWait])
                   .range([height, 0])
                   .nice();

    var chart = d3.select("#chart3").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
    
    var xAxis = chart.append("g")
                    .attr("transform", "translate(0, " + height + ")")
                    .call(d3.axisBottom(xScale));

    var yAxis = chart.append("g")
                    .call(d3.axisLeft(yScale));
    
    var lineGen = d3.line(queue)
                 .x(function(d) { return xScale(d.time); })
                 .y(function(d) { return yScale(d.averageWaitTime); });


    chart.append('svg:path')
         .attr('d', lineGen(queue))
         .attr('stroke', 'green')
         .attr('stroke-width', LINE_WIDTH)
         .attr('fill', 'none');
    
  
    chart.selectAll(".dotTime")
         .data(queue)
         .enter().append("circle")
         .attr("class", "dotTime")
         .attr("fill", "green")
         .attr("cx", function(d, i) { return xScale(d.time) })
         .attr("cy", function(d) { return yScale(d.averageWaitTime) })
         .attr("r", DOT_SIZE)
         .attr("opacity", "0.4")
         .on("mousemove", function(d) {
             d3.select(this).attr("opacity", "1");
             div.style("left", (d3.event.pageX) - 30 +  "px")
                    .style("top", (d3.event.pageY) - 30 +"px")
                    .style("display", "inline-block")
                    .html("<b>Avg Wait: "+(d.averageWaitTime).toFixed(2)+" sec</b>");
         })
         .on("mouseout", function(d) {
             d3.select(this).attr("opacity", "0.4");
             div.style("display", "none");
         })

    // Chart title
    chart.append("text")
        .attr("x", (width / 2))             
        .attr("y", 0 - (margin.top / 5))
        .attr("text-anchor", "middle")  
        .style("font-size", "25px")
        .style("font-weight", "bold") 
        .text(TIME_CHART_TITLE);

    // x axis label
    chart.append("text")
         .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (height + 40) + ")")
         .style("text-anchor", "middle")
         .text(X_AXIS_TITLE);

    // y axis label
    chart.append("text")
         .attr("transform", "rotate(-90)")
         .attr("y", -50)
         .attr("x",0 - (height / 2))
         .attr("dy", "1em")
         .style("text-anchor", "middle")
         .text(TIME_Y_AXIS_TITLE);   
}



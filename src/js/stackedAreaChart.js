/*
 *    stackedAreaChart.js
 *    Source: https://bl.ocks.org/mbostock/3885211
 *    Mastering Data Visualization with D3.js
 *    FreedomCorp Dashboard
 */

const StackedAreaChart = function (_parentElement, data) {
  this.parentElement = _parentElement;
  this.data = data;

  this.initVis();
};
var parseTime = d3.timeParse("%d/%m/%Y");
var formatTime = d3.timeFormat("%d/%m/%Y");
StackedAreaChart.prototype.initVis = function () {
  var vis = this;

  vis.margin = {
    left: 80,
    right: 100,
    top: 50,
    bottom: 40
  };
  vis.width = 870 - vis.margin.left - vis.margin.right;
  vis.height = 500 - vis.margin.top - vis.margin.bottom;

  vis.svg = d3.select(vis.parentElement)
    .append("svg")
    .attr("width", vis.width + vis.margin.left + vis.margin.right)
    .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

  vis.g = vis.svg.append("g")
    .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

  vis.t = () => d3.transition().duration(1000);

  vis.x = d3.scaleTime().range([0, vis.width]);
  vis.y = d3.scaleLinear().range([vis.height, 0]);
  vis.color = d3.scaleOrdinal(d3.schemePastel1);

  vis.yAxisCall = d3.axisLeft();
  vis.xAxisCall = d3.axisBottom()
    .ticks(4);
  vis.xAxis = vis.g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + vis.height + ")");
  vis.yAxis = vis.g.append("g")
    .attr("class", "y axis");

  vis.stack = d3.stack()
    .keys(["west", "south", "northeast", "midwest"]);
  vis.area = d3.area()
    .x((d, i) => {
      return vis.x(parseTime(d.data.date));
    })
    .y0(d => vis.y(d[0]))
    .y1(d => vis.y(d[1]));

  vis.addLegend();

  vis.wrangleData(vis.data);
};

StackedAreaChart.prototype.wrangleData = function (data) {
  var vis = this;
  vis.variable = $("#var-select").val();

  vis.dayNest = d3.nest()
    .key((d) => formatTime(d.date))
    .entries(data);

  vis.dataFiltered = vis.dayNest
    .map(function (day) {
      return day.values.reduce(function (accumulator, current) {
        accumulator.date = day.key;
        accumulator[current.team] = accumulator[current.team] + current[vis.variable];
        return accumulator;
      }, {
        "northeast": 0,
        "midwest": 0,
        "south": 0,
        "west": 0
      });
    });

  vis.updateVis();
};

StackedAreaChart.prototype.updateVis = function () {
  var vis = this;

  vis.maxDateVal = d3.max(vis.dataFiltered, function (d) {
    var vals = d3.keys(d).map(function (key) {
      return key !== 'date' ? d[key] : 0;
    });
    return d3.sum(vals);
  });

  // Update scales
  vis.x.domain(d3.extent(vis.dataFiltered, d => parseTime(d.date)));
  vis.y.domain([0, vis.maxDateVal]);

  // Update axes
  vis.xAxisCall.scale(vis.x);
  vis.xAxis.transition(vis.t()).call(vis.xAxisCall);
  vis.yAxisCall.scale(vis.y);
  vis.yAxis.transition(vis.t()).call(vis.yAxisCall);

  vis.teams = vis.g.selectAll(".team")
    .data(vis.stack(vis.dataFiltered));

  // Update the path for each team
  vis.teams.select(".area")
    .attr("d", vis.area);

  vis.teams.enter().append("g")
    .attr("class", function (d) {
      return "team " + d.key;
    })
    .append("path")
    .attr("class", "area")
    .attr("d", vis.area)
    .style("fill", function (d) {
      return vis.color(d.key);
    })
    .style("fill-opacity", 0.5);

};

StackedAreaChart.prototype.addLegend = function () {
  var vis = this;

  var legendArray = [{
      label: "Northeast",
      color: vis.color("northeast")
    },
    {
      label: "West",
      color: vis.color("west")
    },
    {
      label: "South",
      color: vis.color("south")
    },
    {
      label: "Midwest",
      color: vis.color("midwest")
    }
  ];

  var legend = vis.svg.append("g")
    .attr("transform", `translate(250, 25)`);

  var legendCol = legend.selectAll('.legend')
    .data(legendArray)
    .enter().append("g")
    .attr("class", "legendCol")
    .attr("transform", (d, i) => `translate(${i*150}, 0)`);

  legendCol.append("rect")
    .attr("class", "legendRect")
    .attr("height", 15)
    .attr("width", 15)
    .attr("fill", d => d.color)
    .attr("fill-opacity", 0.5);

  legendCol.append("text")
    .attr("class", "legendText")
    .attr("x", 24)
    .attr("y", 15)
    .attr("font-size", "20px")
    .attr("text-anchor", "start")
    .text(d => d.label);

};

export default StackedAreaChart;
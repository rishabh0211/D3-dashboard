/*
 *    main.js
 *    Mastering Data Visualization with D3.js
 *    FreedomCorp Dashboard
 */

import BarChart from "./js/barChart";
import Timeline from "./js/timeline";
import StackedAreaChart from './js/stackedAreaChart';
import DonutChart from './js/donutChart';

import "./css/style.css";

var parseTime = d3.timeParse("%d/%m/%Y");
var formatTime = d3.timeFormat("%d/%m/%Y");
var stackedArea, timeline, allCalls, calls, nestedCalls, revenueBar,
	durationBar,
	unitBar,
	donut;

fetch('/getData').then(res => res.json()).then(data => {
	data.map((d) => {
		d.call_duration = +d.call_duration;
		d.call_revenue = +d.call_revenue;
		d.units_sold = +d.units_sold;
		d.date = parseTime(d.date);
	});

	allCalls = data;
	calls = data;

	nestedCalls = d3.nest()
		.key(function (d) {
			return d.category;
		})
		.entries(calls);

	revenueBar = new BarChart("#revenue", "call_revenue", "Average call revenue (USD)", nestedCalls);
	durationBar = new BarChart("#call-duration", "call_duration", "Average call duration (seconds)", nestedCalls);
	unitBar = new BarChart("#units-sold", "units_sold", "Units sold per call", nestedCalls);

	stackedArea = new StackedAreaChart("#stacked-area", calls);
	timeline = new Timeline("#timeline", calls);
	donut = new DonutChart("#company-size", '', calls);

	$("#var-select").on("change", function () {
		stackedArea.wrangleData(calls);
	});
});

export const brushed = function () {
	var selection = d3.event.selection || timeline.x.range();
	var newValues = selection.map(timeline.x.invert);
	changeDates(newValues);
};

export const changeDates = function (values) {
	calls = allCalls.filter(function (d) {
		return ((d.date > values[0]) && (d.date < values[1]));
	});

	nestedCalls = d3.nest()
		.key(function (d) {
			return d.category;
		})
		.entries(calls);

	$("#dateLabel1").text(formatTime(values[0]));
	$("#dateLabel2").text(formatTime(values[1]));

	donut.wrangleData(calls);
	revenueBar.wrangleData(nestedCalls);
	unitBar.wrangleData(nestedCalls);
	durationBar.wrangleData(nestedCalls);
	stackedArea.wrangleData(calls);
};
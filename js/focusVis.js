/**
 * FocusVis object for the Sales Focus Chart visualization.
 * @constructor
 * @param {object} _parentElement -- the HTML or SVG element to which to attach
 *                                   this visualization object
 * @param {array} _data -- the array of data
 * @param {object} _eventHandler -- the Event Handling object to emit data to
 * @returns {FocusVis}
 */
FocusVis = function(_parentElement, _data, _eventHandler) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayData = [];

    // define all "constants" here
    this.margin = {top: 20, right: 0, bottom: 30, left: 100},
    this.width = 800 - this.margin.left - this.margin.right,
    this.height = 350 - this.margin.top - this.margin.bottom;

    this.initVis();
};

/**
 * Method that sets up the visualization.
 */
FocusVis.prototype.initVis = function() {

    var that = this;

    // bind to the eventHandler
    $(this.eventHandler).bind("selectionChanged",
        function(event, selectStart, selectEnd) {
            this.onSelectionChange(selectStart, selectEnd);
        }
    );

    // create scales and axis
    this.xScale = d3.time.scale()
        .range([0, this.width]);

    this.yScale = d3.scale.pow()
        .range([this.height, 0]);

    this.xAxis = d3.svg.axis()
        .scale(this.xScale)
        .orient("bottom");

    this.yAxis = d3.svg.axis()
        .scale(this.yScale)
        .orient("left");

    // create line chart object
    this.line = d3.svg.line()
        .interpolate("monotone")
        .x(function(d) { return that.xScale(d.year); })
        .y(function(d) { return that.yScale(d.value); });

    // append an SVG and group element
    this.svg = this.parentElement
        .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
            .attr("transform", "translate(" + this.margin.left + "," +
                this.margin.top + ")");

    // add axes visual elements
    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")");

    this.svg.append("g")
        .attr("class", "y axis");

    // implement the slider
    this.addSlider(this.svg);

    // filter, aggregate, modify data
    this.wrangleData();

    // call the update method
    this.updateVis();
};

/**
 * Method to wrangle the data.
 * @param _filterFunction -- filter function to apply on the data
 */
FocusVis.prototype.wrangleData = function(_filterFunction) {

    // displayData holds the data which is visualized
    this.displayData = this.filterAndAggregate(_filterFunction);
};

/**
 * Method to update the visualization.
 */
FocusVis.prototype.updateVis = function(){

    var that = this;

    // update scales
    this.xScale.domain([d3.min(this.displayData, function(d) {
        return d3.min(d.sales, function(s) { return s.year; });
    }), d3.max(this.displayData, function(d) {
        return d3.max(d.sales, function(s) { return s.year; });
    })]);
    this.yScale.domain([0, d3.max(this.displayData, function(d) {
        return d3.max(d.sales, function(s) { return s.value; });
    })]);

    // update axis
    this.svg.select(".x.axis")
        .call(this.xAxis);

    this.svg.select(".y.axis")
        .call(this.yAxis);

    // update graph
    var formats = this.svg.selectAll(".format")
        .data(this.displayData);

    // implement update graphs (D3: update, enter, exit)
    var formatsEnter = formats.enter().insert("g", ".axis")
        .attr("class", "format");

    // append a path and a text only for the Enter set (new g)
    formatsEnter.append("path");
    formatsEnter.append("text");

    formats.exit()
        .remove();

    // update all inner paths and texts (both update and enter sets)
    formats.select("path")
        .attr("d", function(d) { return that.line(d.sales); });

    formats.select("text")
        .text(function(d) { return d.formatName; });
};

/**
 * Filters the data based on the specified _filter and returns an array of
 * aggregated data.
 * @param _filterFunction -- filter function to apply on the data
 * @returns {array}
 */
FocusVis.prototype.filterAndAggregate = function(_filterFunction) {

    // set filterFunction to a function that accepts all items
    // ONLY if the parameter _filterFunction is null
    var filterFunction = _filterFunction || function() { return true; };

    // filter the data
    var filteredData = this.data.filter(filterFunction);

    // aggregate the data
    var aggregatedDataMap = d3.nest().key(function(d) {
        return d.formatName;
    }).rollup(function(leaves) {
        return {
            formatName: leaves[0].formatName,
            sales: leaves.map(function(d) {
                return { year: new Date(d.year, 0), value: d.value };
            })
        };
    }).map(filteredData);

    // return an array of filtered and aggregated data
    return d3.values(aggregatedDataMap);
};

/**
 * Gets called by the Event Handler on a "selectionChanged" event,
 * re-wrangles the data, and updates the visualization.
 * @param {number} selectStart
 * @param {number} selectEnd
 */
FocusVis.prototype.onSelectionChange = function (selectStart, selectEnd) {


};

/**
 * Creates the y-axis slider
 * @param {object} svg -- the svg element
 */
FocusVis.prototype.addSlider = function(svg) {

    var that = this;

    // the domain is the exponent value for the power scale
    var sliderScale = d3.scale.linear().domain([.5, 1]).range([0, this.height]);

    var sliderDragged = function() {

        var value = Math.max(0, Math.min(that.height,d3.event.y));
        var sliderValue = sliderScale.invert(value);

        // update the slider position
        d3.select(this).attr("y", value);

        // deform the y scale
        that.yScale.exponent(sliderValue);

        that.updateVis();
    };

    var sliderDragBehaviour = d3.behavior.drag().on("drag", sliderDragged);

    var sliderGroup = svg.append("g").attr({
        class: "sliderGroup",
        transform: "translate(" + -this.margin.left + ",0)"
    });

    sliderGroup.append("rect")
        .attr({
            class: "sliderBg",
            x: 5,
            width: 10,
            height: this.height
        })
        .style({
            fill: "lightgray"
        });

    sliderGroup.append("rect")
        .attr({
            class: "sliderHandle",
            y: this.height,
            width: 20,
            height: 10,
            rx: 2,
            ry: 2
        })
        .style({
            fill: "#333333"
        })
        .call(sliderDragBehaviour);
};

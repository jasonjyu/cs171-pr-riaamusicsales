/**
 * ContextVis object for the Sales Context Overview Chart visualization.
 * @constructor
 * @param {object} _parentElement -- the HTML or SVG element to which to attach
 *                                   this visualization object
 * @param {object} _dataObject -- the object containing the primary data
 * @param {object} _dataObject2 -- the object containing the secondary data
 * @param {array} _milestoneData -- the array of milestone data
 * @param {object} _eventHandler -- the Event Handling object to emit data to
 * @returns {ContextVis}
 */
ContextVis = function(_parentElement, _dataObject, _dataObject2, _milestoneData,
    _eventHandler) {

    this.parentElement = _parentElement;
    this.dataObject = _dataObject;
    this.dataObject2 = _dataObject2;
    this.milestoneData = _milestoneData;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    this.displayData2 = [];

    // define all "constants" here
    this.margin = {top: 20, right: 80, bottom: 30, left: 80};
    this.margin2 = {top: 69, right: 0, bottom: 1, left: 80},
    this.width = getInnerWidth(this.parentElement) - this.margin.left -
        this.margin.right;
    this.height = 100 - this.margin.top - this.margin.bottom;
    this.height2 = 100 - this.margin.top - this.margin2.top -
        this.margin2.bottom;

    this.initVis();
};

/**
 * Method that sets up the visualization.
 */
ContextVis.prototype.initVis = function() {

    var that = this;

    // bind to the eventHandler
    $(this.eventHandler).bind("dataChanged1",
        function(event, dataObject) {
            that.onDataChange(dataObject, that.dataObject2);
        }
    );
    $(this.eventHandler).bind("dataChanged2",
        function(event, dataObject) {
            that.onDataChange(that.dataObject, dataObject);
        }
    );
    $(this.eventHandler).bind("milestoneChanged",
        function(event, year) {
            that.onMilestoneChange(year);
        }
    );
    $(this.eventHandler).bind("selectionChanged2",
        function(event, selectStart, selectEnd) {
            that.onSelectionChange(selectStart, selectEnd);
        }
    );

    // create scales and axes
    this.xScale = d3.time.scale()
        .range([0, this.width]);

    this.yScale = d3.scale.linear()
        .range([this.height, 0]);

    this.yScale2 = d3.scale.linear()
        .range([this.height, 0]);

    this.xAxis = d3.svg.axis()
        .scale(this.xScale)
        .orient("bottom");

    this.yAxis = d3.svg.axis()
        .scale(this.yScale)
        .orient("left")
        .tickFormat(d3.format("s"))
        .ticks(5);

    this.yAxis2 = d3.svg.axis()
        .scale(this.yScale2)
        .orient("right")
        .tickFormat(d3.format("s"))
        .ticks(5);

    // create line chart objects
    this.line = d3.svg.line()
        .interpolate("monotone")
        .x(function(d) { return that.xScale(d.year); })
        .y(function(d) { return that.yScale(d.value); });
    this.line2 = d3.svg.line()
        .interpolate("monotone")
        .x(function(d) { return that.xScale(d.year); })
        .y(function(d) { return that.yScale2(d.value); });

    // create chart brush objects
    this.brush = d3.svg.brush();
    this.brush.on("brush", this.brushed(this.brush, this.eventHandler,
        "selectionChanged1"));
    this.brush2 = d3.svg.brush();
    this.brush2.on("brush", this.brushed(this.brush2, this.eventHandler,
        "selectionChanged2"));

    // append an SVG and group element
    var svgTemp = this.parentElement.append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);
    this.svg = svgTemp.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + this.margin.left + "," +
                this.margin.top + ")");

    // add chart clipping definition with some outer padding
    svgTemp.append("defs")
        .append("clipPath")
        .attr("id", "clip-chart")
        .append("rect")
        .attr({
            x: -5,
            y: -5,
            width: this.width + 10,
            height: this.height + 10
        });

    // add axes visual elements
    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")");

    this.svg.append("g")
        .attr("class", "y axis left")
        .append("g")
        .attr("class", "label")
        .append("text")
        .attr("dy", "-.35em");

    this.svg.append("g")
        .attr("class", "y axis right comparison")
        .attr("transform", "translate(" + this.width + ",0)")
        .append("g")
        .attr("class", "label")
        .append("text")
        .attr("dy", "-.35em");

    // add clip-path and brush elements
    this.svg.append("g")
        .attr("class", "chart")
        .attr("clip-path", "url(#clip-chart)")
        .append("g")
        .attr("class", "brush")
        .append("rect")
        .attr("class", "extent2 comparison");
    this.svg.append("g")
        .attr("class", "brush2 comparison")
        .attr("transform", "translate(0" + "," + this.margin2.top + ")")
        .append("rect")
        .attr("class", "brush-region")
        .attr("width", this.width)
        .attr("height", this.height2);
    var brushLabel = this.svg.append("g")
        .attr("class", "label comparison")
        .attr("transform", "translate(" + -this.margin2.left/2 + "," +
            this.margin2.top + ")");
    brushLabel.append("text")
        .attr("dy", "-.1em")
        .text("comparison");
    brushLabel.append("text")
        .attr("dy", ".9em")
        .text("brush");

    // filter, aggregate, modify data
    this.wrangleData();

    // call the update method
    this.updateVis();

    // add milestone markers to the chart
    this.addMilestoneMarkers(this.milestoneData, this.xScale, this.svg,
        this.height);
};

/**
 * Method to wrangle the data.
 * @param {function} _filterFunction -- filter function to apply on the data
 */
ContextVis.prototype.wrangleData = function(_filterFunction) {

    var that = this;

    // displayData holds the data which is visualized
    this.displayData = this.filterAndAggregate(this.dataObject.data,
        _filterFunction);
    this.displayData2 = this.filterAndAggregate(this.dataObject2.data,
        _filterFunction);
};

/**
 * Method to update the visualization.
 * @param {object} _options -- update option parameters
 */
ContextVis.prototype.updateVis = function(_options) {

    // transition duration
    var tDuration = _options && _options.tDuration ? _options.tDuration : 0;

    var that = this;

    // update scales
    this.xScale.domain(d3.extent(this.displayData,
        function(d) { return d.year; }));
    this.yScale.domain([
        Math.min(0, d3.min(this.displayData, function(d) { return d.value; })),
        d3.max(this.displayData, function(d) { return d.value; })
    ]);
    this.yScale2.domain([
        Math.min(0, d3.min(this.displayData2, function(d) { return d.value; })),
        d3.max(this.displayData2, function(d) { return d.value; })
    ]);

    // update axes
    this.svg.select(".x.axis")
        .call(this.xAxis);

    this.svg.select(".y.axis.left")
        .transition().duration(tDuration)
        .call(this.yAxis)
        .select(".label text")
        .text(this.dataObject.name);

    this.svg.select(".y.axis.right")
        .transition().duration(tDuration)
        .call(this.yAxis2)
        .select(".label text")
        .text(this.dataObject2.name);

    // bind data
    var metrics = this.svg.select(".chart").selectAll(".metric")
        .data([this.displayData]);
    var metrics2 = this.svg.select(".chart").selectAll(".metric2")
        .data([this.displayData2]);

    /*
     * DATA ENTER
     */
    // insert behind brush element
    var metricsEnter = metrics.enter().insert("g", ".brush")
        .attr("class", "metric");
    var metricsEnter2 = metrics2.enter().insert("g", ".brush")
        .attr("class", "metric2 comparison");

    // append a path for the Enter set (new g)
    metricsEnter.append("path");
    metricsEnter2.append("path");

    /*
     * DATA UPDATE
     */
    // update all inner paths (both update and enter sets)
    metrics.select("path")
        .transition().duration(tDuration)
        .attr("d", function(d) { return that.line(d); });
    metrics2.select("path")
        .transition().duration(tDuration)
        .attr("d", function(d) { return that.line2(d); });

    /*
     * DATA EXIT
     */
    // remove unbounded elements
    metrics.exit().remove();
    metrics2.exit().remove();

    // update brush elements
    this.brush.x(this.xScale);
    this.svg.select(".brush")
        .call(this.brush)
        .selectAll("rect")
        .attr("height", this.height);

    this.brush2.x(this.xScale);
    this.svg.select(".brush2")
        .call(this.brush2)
        .selectAll("rect")
        .attr("height", this.height2);
};

/**
 * Filters the data based on the specified _filter and returns an array of
 * aggregated data.
 * @param {array} _data -- the data to process
 * @param {function} _filterFunction -- filter function to apply on the data
 * @returns {array}
 */
ContextVis.prototype.filterAndAggregate = function(_data, _filterFunction) {

    // set filterFunction to a function that accepts all items
    // ONLY if the parameter _filterFunction is null
    var filterFunction = _filterFunction || function() { return true; };

    // filter the data
    var filteredData = _data.filter(filterFunction);

    // aggregate the data
    var aggregatedDataMap = d3.nest().key(function(d) {
        return d.year;
    })
    .rollup(function(leaves) {
        return {
            year: new Date(leaves[0].year, 0),
            value: d3.sum(leaves, function(d) { return d.value; })
        };
    })
    .map(filteredData);

    // return an array of filtered and aggregated data
    return d3.values(aggregatedDataMap);
};

/**
 * Gets called by the Event Handler on a "dataChanged" event,
 * re-wrangles the data, and updates the visualization.
 * @param {array} newDataObject
 * @param {array} newDataObject2
 */
ContextVis.prototype.onDataChange = function(newDataObject, newDataObject2) {

    this.dataObject = newDataObject;
    this.dataObject2 = newDataObject2;
    this.wrangleData();
    this.updateVis({tDuration: 500});
};

/**
 * Gets called by the Event Handler on a "milestoneChanged" event,
 * sets the brush extent accordingly, and updates the visualization.
 * @param {number} year - the year of the milestone currently set
 */
ContextVis.prototype.onMilestoneChange = function(year) {

    // tag selected milestone marker
    d3.selectAll(".marker").classed("selected",
        function(d) { return d.year === year; });

    // do not process any further if year is undefined
    if (!year) {
        return;
    }

    // get current brush selection range
    var currStartYear = this.brush.extent()[0].getFullYear();
    var currEndYear = this.brush.extent()[1].getFullYear();

    // determine year extent for milestone and update the brush selection
    var yearRange = Math.max(2, currEndYear - currStartYear);
    var newStartYear = Math.round(year - yearRange/2);
    var newEndYear = Math.round(year + yearRange/2);
    this.brush.extent([new Date(newStartYear, 0), new Date(newEndYear, 0)]);

    // update the visualization and trigger the brushing event
    this.updateVis();
    $(this.eventHandler).trigger("selectionChanged1",
        [Math.max(this.xScale.domain()[0].getFullYear(), newStartYear),
         Math.min(this.xScale.domain()[1].getFullYear(), newEndYear), true]);
};

/**
 * Gets called by the Event Handler on a "selectionChanged" event
 * and updates the secondary brush extent.
 */
ContextVis.prototype.onSelectionChange = function() {

    var extent = this.svg.select(".brush2 .extent");
    var extent2 = this.svg.select(".extent2");

    extent2.attr("width", extent.attr("width"))
        .attr("x", extent.attr("x"));
};

/**
 * Returns a function that reacts to chart brushing event.
 * @param {object} brush -- the object being brushed
 * @param {object} eventHandler -- the Event Handling object to emit data to
 * @param {string} eventName -- the name of the event to emit
 * @returns {Function}
 */
ContextVis.prototype.brushed = function(brush, eventHandler, eventName) {

    return function() {
        // determine year extent
        var startYear = null;
        var endYear = null;
        if (!brush.empty()) {
            startYear = brush.extent()[0].getFullYear();
            endYear = brush.extent()[1].getFullYear();

            // ensure a minimum extent of 1 year
            if (endYear - startYear < 1) {
                endYear = startYear + 1;
            }
        }

        // trigger event
        $(eventHandler).trigger(eventName, [startYear, endYear]);
    };
};

/**
 * Adds milestone markers to the chart.
 */
ContextVis.prototype.addMilestoneMarkers = function() {

    var that = this;

    var markerWidth = 10;

    var markerMouseovered = function() {
        // trigger milestoneChanged event
        $(that.eventHandler).trigger("milestoneChanged",
            d3.select(this).datum().year);
    };

    var markerClicked = function() {
        var element = d3.select(this);
        var wasSelected = element.classed("selected");

        // toggle selection
        element.classed("selected", !wasSelected);

        // trigger milestoneChanged event,
        // if marker was selected, then clear milestone,
        // otherwise set milestone to selected year
        $(that.eventHandler).trigger("milestoneChanged", wasSelected ?
            undefined : element.datum().year);
    };

    var milestoneGroup = this.svg.append("g")
        .attr("class", "milestone")
        .attr("transform", "translate(0," + this.height + ")");

    // bind data to milestone markers
    var markerGroup = milestoneGroup.selectAll(".marker")
        .data(this.milestoneData)
        .enter().append("g")
        .attr("class", "marker")
        .attr("transform", function(d) {
            return "translate(" + that.xScale(new Date(d.year, 0)) + ",0)";
        });

    // add markers
    markerGroup.append("circle")
        .attr("r", markerWidth/2);

    // add selection region
    markerGroup.append("rect")
        .attr({
            x: -markerWidth,
            y: -markerWidth,
            width: markerWidth*2,
            height: markerWidth*2
        })
        .style("opacity", 0);

    // add actions
    markerGroup
        .on("mouseover", markerMouseovered)
        .on("click", markerClicked);
};

/**
 * ContextVis object for the Sales Context Overview Chart visualization.
 * @constructor
 * @param {object} _parentElement -- the HTML or SVG element to which to attach
 *                                   this visualization object
 * @param {array} _data -- the primary array of data
 * @param {array} _data2 -- the secondary array of data
 * @param {object} _eventHandler -- the Event Handling object to emit data to
 * @returns {ContextVis}
 */
ContextVis = function(_parentElement, _data, _data2, _eventHandler) {

    this.parentElement = _parentElement;
    this.data = _data;
    this.data2 = _data2;
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
            that.onDataChange([dataObject], that.data2);
        }
    );
    $(this.eventHandler).bind("dataChanged2",
        function(event, dataObject) {
            that.onDataChange(that.data, [dataObject]);
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
    this.svg = this.parentElement
        .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + this.margin.left + "," +
                this.margin.top + ")");

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

    // add brush elements
    this.svg.append("g")
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
        .attr("dy", "-.35em")
        .text("brush");
    brushLabel.append("text")
        .attr("dy", ".7em")
        .text("(comparison)");

    // filter, aggregate, modify data
    this.wrangleData();

    // call the update method
    this.updateVis();
};

/**
 * Method to wrangle the data.
 * @param {function} _filterFunction -- filter function to apply on the data
 */
ContextVis.prototype.wrangleData = function(_filterFunction) {

    var that = this;

    // displayData holds the data which is visualized
    this.displayData = this.data.map(function(d) {
        return {
            metric: d.name,
            sales: that.filterAndAggregate(d.data, _filterFunction)
        };
    });
    this.displayData2 = this.data2.map(function(d) {
        return {
            metric: d.name,
            sales: that.filterAndAggregate(d.data, _filterFunction)
        };
    });
};

/**
 * Method to update the visualization.
 * @param {object} _options -- update option parameters
 */
ContextVis.prototype.updateVis = function(_options){

    var tDuration = _options ? _options.tDuration : 0;

    var that = this;

    // update scales
    this.xScale.domain([
        d3.min(this.displayData,
            function(d) {
                return d3.min(d.sales, function(s) { return s.year; });
            }
        ),
        d3.max(this.displayData,
            function(d) {
                return d3.max(d.sales, function(s) { return s.year; });
            }
        )
    ]);
    this.yScale.domain([
        Math.min(0, d3.min(this.displayData,
            function(d) {
                return d3.min(d.sales, function(s) { return s.value; });
            }
        )),
        d3.max(this.displayData,
            function(d) {
                return d3.max(d.sales, function(s) { return s.value; });
            }
        )
    ]);
    this.yScale2.domain([
        Math.min(0, d3.min(this.displayData2,
            function(d) {
                return d3.min(d.sales, function(s) { return s.value; });
            }
        )),
        d3.max(this.displayData2,
            function(d) {
                return d3.max(d.sales, function(s) { return s.value; });
            }
        )
    ]);

    // update axes
    this.svg.select(".x.axis")
        .call(this.xAxis);

    this.svg.select(".y.axis.left")
        .transition().duration(tDuration)
        .call(this.yAxis)
        .select(".label text")
        .text(this.displayData[0].metric);

    this.svg.select(".y.axis.right")
        .transition().duration(tDuration)
        .call(this.yAxis2)
        .select(".label text")
        .text(this.displayData2[0].metric);

    // bind data
    var metrics = this.svg.selectAll(".metric")
        .data(this.displayData);
    var metrics2 = this.svg.selectAll(".metric2")
        .data(this.displayData2);

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
        .attr("d", function(d) { return that.line(d.sales); });
    metrics2.select("path")
        .transition().duration(tDuration)
        .attr("d", function(d) { return that.line2(d.sales); });

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
 * @param {array} newData
 * @param {array} newData2
 */
ContextVis.prototype.onDataChange = function(newData, newData2) {

    this.data = newData;
    this.data2 = newData2;
    this.wrangleData();
    this.updateVis({tDuration: 500});
};

/**
 * Gets called by the Event Handler on a "milestoneChanged" event,
 * re-wrangles the data, and updates the visualization.
 * @param {number} year - the year of the milestone currently set
 */
ContextVis.prototype.onMilestoneChange = function(year) {

    // determine year extent for milestone
    var startYear = Math.max(this.xScale.domain()[0].getFullYear(), year - 2);
    var endYear = Math.min(this.xScale.domain()[1].getFullYear(), year + 2);
    this.brush.extent([new Date(startYear, 0), new Date(endYear, 0)]);

    // update the visualization and trigger the brushing event
    this.updateVis();
    $(this.eventHandler).trigger("selectionChanged1",
        [startYear, endYear, true]);
};

/**
 * Gets called by the Event Handler on a "selectionChanged" event
 * and updates the secondary brush extent.
 * @param {number} selectStart
 * @param {number} selectEnd
 */
ContextVis.prototype.onSelectionChange = function(selectStart, selectEnd) {

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

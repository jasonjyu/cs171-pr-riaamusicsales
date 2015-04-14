/**
 * ContextVis object for the Sales Context Overview Chart visualization.
 * @constructor
 * @param {object} _parentElement -- the HTML or SVG element to which to attach
 *                                   this visualization object
 * @param {array} _data -- the array of data
 * @param {object} _eventHandler -- the Event Handling object to emit data to
 * @returns {ContextVis}
 */
ContextVis = function(_parentElement, _data, _eventHandler) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayData = [];

    // define all "constants" here
    this.margin = {top: 20, right: 90, bottom: 30, left: 60};
    this.width = getInnerWidth(this.parentElement) - this.margin.left -
        this.margin.right;
    this.height = 100 - this.margin.top - this.margin.bottom;

    this.initVis();
};

/**
 * Method that sets up the visualization.
 */
ContextVis.prototype.initVis = function() {

    var that = this;

    // bind to the eventHandler
    $(this.eventHandler).bind("dataChanged",
        function(event, newData) {
            that.onDataChange(newData);
        }
    );

    // create scales and axis
    this.xScale = d3.time.scale()
        .range([0, this.width]);

    this.yScale = d3.scale.linear()
        .range([this.height, 0]);

    this.xAxis = d3.svg.axis()
        .scale(this.xScale)
        .orient("bottom");

    // create area chart object
    this.area = d3.svg.area()
        .interpolate("monotone")
        .x(function(d) { return that.xScale(d.year); })
        .y0(this.height)
        .y1(function(d) { return that.yScale(d.value); });

    // create chart brush object
    this.brush = d3.svg.brush()
        .on("brush", this.brushed(this));

    // append an SVG and group element
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," +
            this.margin.top + ")");

    // add brush element
    this.svg.append("g")
        .attr("class", "brush");

    // add axes visual elements
    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")");

    this.svg.append("g")
        .attr("class", "y axis");

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

    // displayData holds the data which is visualized
    this.displayData = this.filterAndAggregate(_filterFunction);
};

/**
 * Method to update the visualization.
 * @param {object} _options -- update option parameters
 */
ContextVis.prototype.updateVis = function(_options){

    var tDuration = _options ? _options.tDuration : 0;

    // update scales
    this.xScale.domain(d3.extent(this.displayData,
        function(d) { return d.year; }));
    this.yScale.domain([0, d3.max(this.displayData,
        function(d) { return d.value; })]);

    // update axis
    this.svg.select(".x.axis")
        .call(this.xAxis);

    // update graph
    var path = this.svg.selectAll(".context")
        .data([this.displayData]);

    // implement update graphs (D3: update, enter, exit)
    path.enter().insert("path", "g") // insert 'path' behind other elements
        .attr("class", "context");

    path.transition().duration(tDuration)
        .attr("d", this.area);

    path.exit()
        .remove();

    // update brush element
    this.brush.x(this.xScale);
    this.svg.select(".brush")
        .call(this.brush)
        .selectAll("rect")
        .attr("height", this.height);
};

/**
 * Filters the data based on the specified _filter and returns an array of
 * aggregated data.
 * @param {function} _filterFunction -- filter function to apply on the data
 * @returns {array}
 */
ContextVis.prototype.filterAndAggregate = function(_filterFunction) {

    // set filterFunction to a function that accepts all items
    // ONLY if the parameter _filterFunction is null
    var filterFunction = _filterFunction || function() { return true; };

    // filter the data
    var filteredData = this.data.filter(filterFunction);

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
 */
ContextVis.prototype.onDataChange = function(newData) {

    this.data = newData;
    this.wrangleData();
    this.updateVis({tDuration: 500});
};

/**
 * Returns a function that reacts to chart brushing event.
 * @param {type} that -- a reference to this ContextVis object
 * @returns {Function}
 */
ContextVis.prototype.brushed = function(that) {
    return function() {
        // determine year extent
        var startYear = null;
        var endYear = null;
        if (!that.brush.empty()) {
            startYear = that.brush.extent()[0].getFullYear();
            endYear = that.brush.extent()[1].getFullYear();

            // ensure a minimum extent of 1 year
            if (endYear - startYear < 1) {
                endYear = startYear + 1;
            }
        }

        // trigger selectionChanged event
        $(that.eventHandler).trigger("selectionChanged", [startYear, endYear]);
    };
};

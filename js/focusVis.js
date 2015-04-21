/**
 * FocusVis object for the Sales Focus Chart visualization.
 * @constructor
 * @param {number} _visId -- the ID for this visualization instantiation
 * @param {object} _parentElement -- the HTML or SVG element to which to attach
 *                                   this visualization object
 * @param {array} _data -- the array of data
 * @param {object} _colorMap -- map of music formats to colors
 * @param {object} _eventHandler -- the Event Handling object to emit data to
 * @returns {FocusVis}
 */
FocusVis = function(_visId, _parentElement, _data, _colorMap, _eventHandler) {
    this.visId = _visId;
    this.parentElement = _parentElement;
    this.data = _data;
    this.colorMap = _colorMap;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    this.chartData = [{
        title: "Actual Value vs Time",
        yKey: "value"
    }, {
        title: "Value Change vs Time",
        yKey: "valueChange"
    }, {
        title: "Value Change (normalized) vs Time",
        yKey: "valueChangeNorm"
    }];

    // define all "constants" here
    this.margin = {top: 20, right: 90, bottom: 30, left: 60};
    this.width = getInnerWidth(this.parentElement) - this.margin.left -
        this.margin.right;
    this.height = 250 - this.margin.top - this.margin.bottom;

    this.initVis();
};

/**
 * Method that sets up the visualization.
 */
FocusVis.prototype.initVis = function() {

    var that = this;

    // bind to the eventHandler
    $(this.eventHandler).bind("dataChanged" + this.visId,
        function(event, dataObject) {
            that.onDataChange(dataObject.data);
        }
    );
    $(this.eventHandler).bind("selectionChanged",
        function(event, selectStart, selectEnd, transition) {
            that.onSelectionChange(selectStart, selectEnd, transition);
        }
    );
    $(this.eventHandler).bind("highlightChanged",
        function(event, highlight) {
            that.onHighlightChange(highlight);
        }
    );

    // initialize chart data index
    this.chartDataIndex = 0;

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
        .orient("left")
        .tickFormat(function(d) {
            var d_abs = Math.abs(d);
            return 0 < d_abs && d_abs < 1 ?
                d3.format(".1f")(d) : d3.format(".2s")(d);
        });

    // create line chart object
    this.line = d3.svg.line()
        .interpolate("monotone")
        .x(function(d) { return that.xScale(d.year); });

    // append an SVG and group element
    this.svg = this.parentElement
        .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + this.margin.left + "," +
                this.margin.top + ")");

    // add axes visual elements
    this.svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + this.height + ")");

    this.svg.append("g")
        .attr("class", "y axis");

    // add chart title
    this.svg.append("g")
        .attr("class", "title")
        .attr("transform", "translate(" + this.width/2 + "," +
            -this.margin.top/2 + ")")
        // add mouse click control to toggle the y-value encoding key
        .on("mousedown", function(d) {
            if (++that.chartDataIndex >= that.chartData.length) {
                that.chartDataIndex = 0;
            }
            that.updateVis({tDuration: 500});
        })
        .append("text");

    // implement the slider
    this.addSlider(this.svg);

    // filter, aggregate, modify data
    this.wrangleData();

    // call the update method
    this.updateVis();
};

/**
 * Method to wrangle the data.
 * @param {function} _filterFunction -- filter function to apply on the data
 */
FocusVis.prototype.wrangleData = function(_filterFunction) {

    // displayData holds the data which is visualized
    this.displayData = this.filterAndAggregate(_filterFunction);
};

/**
 * Method to update the visualization.
 * @param {object} _options -- update option parameters
 */
FocusVis.prototype.updateVis = function(_options){

    // transition duration
    var tDuration = _options && _options.tDuration ? _options.tDuration : 0;

    var that = this;

    // y-value encoding key
    var yKey = this.chartData[this.chartDataIndex].yKey;

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
                return d3.min(d.sales, function(s) { return s[yKey]; });
            }
        )),
        d3.max(this.displayData,
            function(d) {
                return d3.max(d.sales, function(s) { return s[yKey]; });
            }
        )
    ]);

    // update axis
    this.svg.select(".x.axis")
        .transition().duration(tDuration)
        .call(this.xAxis);

    this.svg.select(".y.axis")
        .transition().duration(tDuration)
        .call(this.yAxis);

    // update chart title
    this.svg.select(".title text")
        .text(this.chartData[this.chartDataIndex].title);

    // update line chart
    this.line.y(function(d) { return that.yScale(d[yKey]); });

    // bind data
    var formats = this.svg.selectAll(".format")
        .data(this.displayData, function(d) { return d.format; });

    /*
     * DATA ENTER
     */
    var formatsEnter = formats.enter().insert("g", ".axis")
        .attr("class", "format");

    // append a path, circle, and text only for the Enter set (new g)
    formatsEnter.append("path")
        .style("stroke", function(d) { return that.colorMap[d.format]; });
    var endpointEnter = formatsEnter.append("g")
        .attr("class", "endpoint");
    endpointEnter.append("circle")
        .attr("r", 2)
        .style("fill", function(d) { return that.colorMap[d.format]; });
    endpointEnter.append("text")
        .attr("dx", ".35em")
        .attr("dy", ".35em")
        .text(function(d) { return d.format; });
    endpointEnter.attr("transform", function(d) {
        var lastDatum = d.sales[d.sales.length - 1];
        return "translate(" + that.xScale(lastDatum.year) + "," +
            that.yScale(lastDatum[yKey]) + ")";
    });

    // add mouse over and out controls to highlight and fade the chart elements
    formatsEnter.on("mouseover", function(d) {
        // trigger highlightChanged event
        $(that.eventHandler).trigger("highlightChanged", d.format);
    });
    formatsEnter.on("mouseout", function(d) {
        // trigger highlightChanged event with no arguments to clear highlight
        $(that.eventHandler).trigger("highlightChanged");
    });

    /*
     * DATA UPDATE
     */
    // update all inner paths and circles (both update and enter sets)
    formats.select("path")
        .transition().duration(tDuration)
        .attr("d", function(d) { return that.line(d.sales); });

    formats.select(".endpoint")
        .transition().duration(tDuration)
        .attr("transform", function(d) {
            var lastDatum = d.sales[d.sales.length - 1];
            return "translate(" + that.xScale(lastDatum.year) + "," +
                that.yScale(lastDatum[yKey]) + ")";
        });

    /*
     * DATA EXIT
     */
    // remove unbounded elements
    formats.exit().remove();
};

/**
 * Filters the data based on the specified _filter and returns an array of
 * aggregated data.
 * @param {function} _filterFunction -- filter function to apply on the data
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
        return d.format;
    }).rollup(function(leaves) {
        return {
            format: leaves[0].format,
            sales: leaves.map(function(d, i) {
                return {
                    year: new Date(d.year, 0),
                    value: d.value,
                    valueChange: d.valueChange,
                    valueChangeNorm: d.valueChangeNorm
                };
            })
        };
    }).map(filteredData);

    // return an array of filtered and aggregated data
    return d3.values(aggregatedDataMap);
};

/**
 * Gets called by the Event Handler on a "dataChanged" event,
 * re-wrangles the data, and updates the visualization.
 * @param {array} newData
 */
FocusVis.prototype.onDataChange = function(newData) {

    this.data = newData;

    var selectStart = this.selectStart;
    var selectEnd = this.selectEnd;
    this.wrangleData(selectStart && selectEnd ? function(d) {
        // filter for data within range
        return selectStart <= d.year && d.year <= selectEnd;
    } : null);

    this.updateVis({tDuration: 500});
};

/**
 * Gets called by the Event Handler on a "selectionChanged" event,
 * re-wrangles the data, and updates the visualization.
 * @param {number} selectStart
 * @param {number} selectEnd
 * @param {boolean} transition -- indicates whether a transition should occur
 */
FocusVis.prototype.onSelectionChange = function(selectStart, selectEnd,
    transition) {

    // save off selection range
    this.selectStart = selectStart;
    this.selectEnd = selectEnd;

    this.wrangleData(selectStart && selectEnd ? function(d) {
        // filter for data within range
        return selectStart <= d.year && d.year <= selectEnd;
    } : null);

    this.updateVis(transition ? {tDuration: 500} : {});
};

/**
 * Gets called by the Event Handler on a "highlightChanged" event,
 * re-wrangles the data, and updates the visualization.
 * @param {number} highlight -- the format to highlight
 */
FocusVis.prototype.onHighlightChange = function(highlight) {

    var formats = this.svg.selectAll(".format");
    formats.classed("faded", function(d) {
        return highlight && d.format !== highlight;
    });
    formats.classed("highlighted", function(d) {
        return highlight && d.format === highlight;
    });
};

/**
 * Creates the y-axis slider
 * @param {object} svg -- the svg element
 */
FocusVis.prototype.addSlider = function(svg) {

    var that = this;

    // the domain is the exponent value for the power scale
    var sliderScale = d3.scale.linear().domain([.1, 1]).range([0, this.height]);

    var sliderDragged = function() {

        var value = Math.max(0, Math.min(that.height, d3.event.y));
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
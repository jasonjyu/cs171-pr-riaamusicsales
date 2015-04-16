/**
 * FocusVis object for the Sales Focus Chart visualization.
 * @constructor
 * @param {object} _parentElement -- the HTML or SVG element to which to attach
 *                                   this visualization object
 * @param {array} _data -- the array of data
 * @param {object} _colorMap -- map of music formats to colors
 * @param {object} _eventHandler -- the Event Handling object to emit data to
 * @returns {FocusVis}
 */
ParaVis = function(_parentElement, _data, _colorMap, _eventHandler) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.colorMap = _colorMap;
    this.eventHandler = _eventHandler;
    this.displayData = [];

    // define all "constants" here
    this.margin = {top: 20, right: 90, bottom: 30, left: 60};
    this.width = 800 - this.margin.left - this.margin.right;
    this.height = 350 - this.margin.top - this.margin.bottom;

    this.initVis();
	
};

/**
 * Method that sets up the visualization.
 */
ParaVis.prototype.initVis = function() {

    var that = this;
	

    // bind to the eventHandler
    $(this.eventHandler).bind("dataChanged",
        function(event, newData) {
            that.onDataChange(newData);
        }
    );

    // bind to the eventHandler
    $(this.eventHandler).bind("selectionChanged",
        function(event, selectStart, selectEnd) {
            that.onSelectionChange(selectStart, selectEnd);
        }
    );

    // create scales and axis
    this.xScale = d3.scale.ordinal().rangePoints([0, this.width], 1)

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


    // append an SVG and group element
    this.svg = this.parentElement
        .append("svg")
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom)
        .append("g")
            .attr("transform", "translate(" + this.margin.left + "," +
                this.margin.top + ")");


    // filter, aggregate, modify data
    this.wrangleData();

    // call the update method
    this.updateVis();
};

/**
 * Method to wrangle the data.
 * @param {function} _filterFunction -- filter function to apply on the data
 */
ParaVis.prototype.wrangleData = function(_filterFunction) {

    // displayData holds the data which is visualized
    this.displayData = this.filterAndAggregate(_filterFunction);
};

/**
 * Method to update the visualization.
 * @param {object} _options -- update option parameters
 */
ParaVis.prototype.updateVis = function(_options){
	
	
var colors = d3.scale.category20b(); 
d3.csv('data/paradata.csv', function(data) {
  var colorgen = d3.scale.ordinal()
    .range(["#a6cee3","#1f78b4","#b2df8a","#33a02c",
            "#fb9a99","#e31a1c","#fdbf6f","#ff7f00",
            "#cab2d6","#6a3d9a","#ffff99","#b15928"]);

  var color = function(d) {return colors(d.format);};

  var parcoords = d3.parcoords()("#paraVis")
    .data(data)
    .color(color)
    .alpha(0.25)
    .composite("darken")
    .margin({ top: 24, left: 150, bottom: 12, right: 0 })
    .mode("queue")
    .render()
    .brushMode("1D-axes");  // enable brushing

  parcoords.svg.selectAll("text")
    .style("font", "10px sans-serif");
});

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
  var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
      extents = actives.map(function(p) { return y[p].brush.extent(); });
  foreground.style("display", function(d) {
    return actives.every(function(p, i) {
      return extents[i][0] <= d[p] && d[p] <= extents[i][1];
    }) ? null : "none";
  });
}

    
};

/**
 * Filters the data based on the specified _filter and returns an array of
 * aggregated data.
 * @param {function} _filterFunction -- filter function to apply on the data
 * @returns {array}
 */
ParaVis.prototype.filterAndAggregate = function(_filterFunction) {

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
            sales: leaves.map(function(d) {
                return { year: new Date(d.year, 0), value: d.value };
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
ParaVis.prototype.onDataChange = function(newData) {

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
 */
ParaVis.prototype.onSelectionChange = function(selectStart, selectEnd) {

    this.selectStart = selectStart;
    this.selectEnd = selectEnd;

    this.wrangleData(selectStart && selectEnd ? function(d) {
        // filter for data within range
        return selectStart <= d.year && d.year <= selectEnd;
    } : null);

    this.updateVis();
};


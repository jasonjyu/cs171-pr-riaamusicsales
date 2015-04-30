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
ParaVis = function(_parentElement, _dataset, _colorMap, _eventHandler) {
    this.parentElement = _parentElement;
    this.colorMap = _colorMap;
    this.eventHandler = _eventHandler;
    this.dataset = _dataset;
    this.displayData = [];
    this.selectStart = null;
    this.selectEnd = null;
    this.parcoords = null;
    this.formats = null;
    this.highlight = null;
    this.highlightArray = null;

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

    // bind to the eventHandler selection changed
    $(this.eventHandler).bind("selectionChanged1",
        function(event, selectStart, selectEnd) {
            that.onSelectionChange(selectStart, selectEnd);
        }
    );

    // bind to the eventHandler formats changed
    $(this.eventHandler).bind("formatsChanged",
        function(event, formats) {
            that.onformatsChange(formats);
        }
    );

    // bind to the eventHandler highlight changed
    $(this.eventHandler).bind("highlightChanged",
        function(event, highlight) {
            that.onHighlightChange(highlight);
        }
    );

    // Loads data and creates the parallel coordinates chart
    var colormap = this.colorMap;
    var colors = function(d){return colormap[d];};
    this.displayData = this.dataset;
    var color = function(d) {return colors(d.format);};

    this.parcoords = d3.parcoords()("#paraVis")
        .data(this.displayData)
        .color(color)
        .alpha(0.25)
        .composite("darken")
        .margin({ top: 24, left: 50, bottom: 12, right: 0 })
        .mode("queue")
        .render()
        .brushMode("1D-axes")
        .reorderable()

    this.parcoords.svg.selectAll("text")
        .style("font", "10px sans-serif");


    // call the update method
    this.updateVis();
};

/**
 * Method to wrangle the data.
 */
 ParaVis.prototype.wrangleData = function() {

    // generate filter function based on filter options
    var selectStart = this.selectStart;
    var selectEnd = this.selectEnd;
    var formats = this.formats;
    var filterFunction = function(d) {
        // filter for data within range and contained in formats
        return (selectStart ? selectStart <= d.year : true) &&
            (selectEnd ? d.year <= selectEnd : true) &&
            (formats && formats.length ? formats.indexOf(d.format) >= 0 : true);
    };

    // displayData holds the data which is visualized
    this.displayData = this.filterAndAggregate(filterFunction);
};


/**
 * Method to update the visualization.
 * @param {object} _options -- update option parameters
 */
ParaVis.prototype.updateVis = function(_options){
    selectStart = this.selectStart;
    selectEnd = this.selectEnd;


    this.parcoords
        .data(this.displayData)
        .render()



    this.parcoords.svg.selectAll("text")
        .style("font", "10px sans-serif");
};

/**
 * Filters the data based on the specified _filter and returns an array of
 */
 ParaVis.prototype.filterAndAggregate = function(_filterFunction) {

    // set filterFunction to a function that accepts all items
    // ONLY if the parameter _filterFunction is null
    var filterFunction = _filterFunction || function() { return true; };

    // filter the data
    var filteredData = this.dataset.filter(filterFunction);

    // return an array of filtered and aggregated data
    return filteredData;
};


/**
 * Gets called by the Event Handler on a "formatsChanged" event,
 * and updates the visualization.
 * @param {array} formats
 */
ParaVis.prototype.onformatsChange = function(formats) {

    this.formats = formats;

    this.wrangleData();

    this.updateVis();
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

    this.wrangleData();

    this.updateVis();
};

/**
 * Gets called by the Event Handler on a "highlightChanged" event,
 * re-wrangles the data, and updates the visualization.
 * @param {number} highlight
 */
ParaVis.prototype.onHighlightChange = function(highlight) {

    if (!highlight) {
        this.parcoords.unhighlight();
    }
    else{
        this.highlight = highlight;
        this.highlightArray = this.dataset.filter(function(d){
            if (d.format == highlight){
                    return d
            }
        });

    this.parcoords.highlight(this.highlightArray);
    };
};


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
ParaVis = function(_parentElement, _colorMap, _eventHandler) {
    this.parentElement = _parentElement;
    this.colorMap = _colorMap;
    this.eventHandler = _eventHandler;
    this.displayData = [];
	this.selectStart = null;
    this.selectEnd = null;
	this.previousStart = null;
	this.previousEnd = null;

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
            


    // call the update method
    this.updateVis();
};

/**
 * Method to wrangle the data.
 * @param {function} _filterFunction -- filter function to apply on the data
 */


/**
 * Method to update the visualization.
 * @param {object} _options -- update option parameters
 */
ParaVis.prototype.updateVis = function(_options){
	selectStart = this.selectStart;
	selectEnd = this.selectEnd;

	
	// Loads data and creates the parallel coordinates chart
				var colormap = this.colorMap;
                var colors = function(d){return colormap[d];};
                d3.csv('data/paradata.csv', function(data) {				
					var DisplayData = data;
					
					if (selectStart != null){
					// Filtering for Display Data
			
					var filterFunction = function(d,i) {
					// filter for data within range and contained in formats
					if ((selectEnd >= d.year) & (selectStart<= d.year)){
							return d};
					};

					DisplayData = DisplayData.filter(filterFunction);
					};

					// Attempting to fix fast brushing bug
					if ((selectStart != this.previousStart) || (selectEnd != this.previousEnd) || (selectStart == null)){
					this.previousStart = selectStart;
					this.previousEnd = selectEnd;
					d3.select("#paraVis").select("svg").remove();
                    var color = function(d) {return colors(d.format);};
                    var parcoords = d3.parcoords()("#paraVis")
                            .data(DisplayData)
                            .color(color)
                            .alpha(0.25)
                            .composite("darken")
                            .margin({ top: 24, left: 50, bottom: 12, right: 0 })
                            .mode("queue")
                            .render()
                            .brushMode("1D-axes")
                            .reorderable()

                    parcoords.svg.selectAll("text")
                            .style("font", "10px sans-serif");
							
                }});   
};

/**
 * Filters the data based on the specified _filter and returns an array of
 * aggregated data.
 * @param {function} _filterFunction -- filter function to apply on the data
 * @returns {array}
 */


/**
 * Gets called by the Event Handler on a "dataChanged" event,
 * re-wrangles the data, and updates the visualization.
 * @param {array} newData
 */
ParaVis.prototype.onDataChange = function(newData) {

    this.data = newData;

    var selectStart = this.selectStart;
    var selectEnd = this.selectEnd;



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
	
    this.updateVis();
	
};



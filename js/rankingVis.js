/**
 * RankingVis object for the Sales Focus Chart visualization.
 * @constructor
 * @param {number} _visId -- the ID for this visualization instantiation
 * @param {object} _parentElement -- the HTML or SVG element to which to attach
 *                                   this visualization object
 * @param {object} _dataObject -- the object containing the data
 * @param {object} _colorMap -- map of music formats to colors
 * @param {object} _eventHandler -- the Event Handling object to emit data to
 * @returns {RankingVis}
 */
RankingVis = function(_visId, _parentElement, _dataObject, _colorMap, _eventHandler) {
    this.visId = _visId;
    this.parentElement = _parentElement;
    this.dataObject = _dataObject;
    this.colorMap = _colorMap;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    this.filterOptions = {};

    // define all "constants" here
    this.margin = {top: 20, right: 70, bottom: 85, left: 80};
    this.width = getInnerWidth(this.parentElement) - this.margin.left -
        this.margin.right;
    this.height = 265 - this.margin.top - this.margin.bottom;

    this.initVis();
};

/**
 * Method that sets up the visualization.
 */
RankingVis.prototype.initVis = function() {

    var that = this;

    // bind to the eventHandler
    $(this.eventHandler).bind("dataChanged" + this.visId,
        function(event, dataObject) {
            that.onDataChange(dataObject);
        }
    );
     $(this.eventHandler).bind("selectionChanged" + this.visId,
        function(event, selectStart, selectEnd, autoSelected) {
            that.onSelectionChange(selectStart, selectEnd, autoSelected);
        });
    $(this.eventHandler).bind("highlightChanged",
        function(event, highlight) {
            that.onHighlightChange(highlight);
        }
    );
    $(this.eventHandler).bind("scaleChanged" + this.visId,
        function(event, scale) {
            that.onScaleChange(scale);
        });
    $(this.eventHandler).bind("formatsChanged",
        function(event, formats) {
            that.onFormatsChange(formats);
        }
    );

// constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height+ this.margin.top +this.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    // creates axis and scales
    this.yScale = d3.scale.pow()
      .range([this.height,0]);

    this.xScale = d3.scale.ordinal()
      .rangeRoundBands([0, this.width], .1);


    this.xAxis = d3.svg.axis()
      .scale(this.xScale)
      // .ticks(6)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.yScale)
      .tickFormat(function(d) {
         // determine formatting string
         var formatting = "";
         var d_abs = Math.abs(d);

         // check if dollar formatting is needed
         if (that.dataObject.name.indexOf("Price") >= 0 ||
             that.dataObject.name.indexOf("Dollar") >= 0) {
             formatting = "$" + formatting;
             if (0 < d_abs && d_abs < .05) {
                 formatting = formatting + ".3f";
             }
         }

         // check if SI/metric formmating is needed
         if (1e3 <= d_abs) {
             formatting = formatting + "s";
         }

         // replace 'G' with 'B' for billions for SI/metric formatting
         return d3.format(formatting)(d).replace("G", "B");
      })
      .orient("left");

    // Add axes visual elements
    this.svg.append("g")
      .attr("class", "axis x_axis")
      .attr("transform", "translate(0," + this.height + ")")
      // .call(this.xAxis)

    this.svg.append("g")
        .attr("class", "y axis")
        .append("g")
        .attr("class", "label")
        .append("text")
        .attr("dy", "-.7em");
        // .call(this.yAxis)


    // filter, aggregate, modify data
    this.wrangleData();

    // call the update method
    this.updateVis();
}



/**
 * Method to wrangle the data.
 * @param {function} _filterFunction -- filter function to apply on the data
 */
RankingVis.prototype.wrangleData = function(_filterFunction) {

var selectStart = this.filterOptions.selectStart;
    var selectEnd = this.filterOptions.selectEnd;
    var formats = this.filterOptions.formats;
    var filterFunction = function(d) {
        // filter for data within range and contained in formats
        return (selectStart ? selectStart <= d.year : true) &&
            (selectEnd ? d.year <= selectEnd : true) &&
            (formats && formats.length ? formats.indexOf(d.format) >= 0 : true);
    };

    // displayData holds the data which is visualized
    this.displayData = this.filterAndAggregate(this.dataObject.data,
        filterFunction, this.dataObject.name);

};

/**
 * Method to update the visualization.
 * @param {object} _options -- update option parameters
 */
RankingVis.prototype.updateVis = function(_options){

    var tDuration = _options && _options.tDuration ? _options.tDuration : 0;

    var that = this;
    // update scales
    {
        this.xScale.domain(this.displayData.map(function(d){
            return d.key
        }))
    }
    // else{
    //     this.xScale.domain(d3.keys(this.colorMap2))
    //     }
    yMin = Math.min(0, d3.min(this.displayData.map(function(d){
        return d.value
    })))
    // d3.min(this.displayData, function(d){
    //     return d.value;
    //    })
    yMax = d3.max(this.displayData, function(d){
        return d.value;
       });
    // if (yMin == yMax) {
    //     yMin = 0
    // }
    this.yScale.domain([yMin, yMax]);

    // update axis
    this.svg.select(".x_axis")
        .transition().duration(tDuration)
        .call(this.xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", function(d) {
            return "rotate(-60)";
        })
        .attr("dy", -1)
        .attr("dx", -8);
    this.svg.select(".y.axis")
        .transition().duration(tDuration)
        .call(this.yAxis)
        .select(".label text")
        .text(this.dataObject.name);
    this.svg.select(".x_axis")
        .call(this.xAxis)
        .selectAll("text")
        .on("mouseover", function(d) {
            // trigger highlightChanged event
            $(that.eventHandler).trigger("highlightChanged", d);
        })
        .on("mouseout", function(d) {
            // trigger highlightChanged event with no arguments to clear highlight
            $(that.eventHandler).trigger("highlightChanged");
        });

 // Remove the extra bars
// Data join
 var bar = that.svg.selectAll(".bar")
 .data(this.displayData, function(d) { return d.key; }); // BOUND COUNT DATA IS CORRECTLY FILTERED HERE AFTER BRUSH

// Append new bar groups, if required
var bar_enter = bar.enter().append("g")
 .attr("class", "bar");

// Append a rect and a text only for the Enter set (new g)

 bar_enter.append("rect")
 .style("fill", function(d,i) {
    color = that.colorMap[d.key]
 return color;
});

    bar_enter.on("mouseover", function(d) {
        // trigger highlightChanged event
        $(that.eventHandler).trigger("highlightChanged", d.key);
    });
    bar_enter.on("mouseout", function(d) {
        // trigger highlightChanged event with no arguments to clear highlight
        $(that.eventHandler).trigger("highlightChanged");
    });

 // .transition()
 // .attr("transform", function(d, i) { return "translate(0," + that.yScale(d) + ")"; })

 // Add attributes (position) to all bars

// Update all inner rects and texts (both update and enter sets)
  bar.select("rect")

 .attr("y", function(d) {
 return that.yScale(d.value);})
 .attr("width", that.xScale.rangeBand())


 .attr("height", function(d) {
 var barheight = that.height-that.yScale(d.value);
 return barheight;
 })
  .transition().duration(tDuration)
  .attr("x", function(d,i){
        x = that.xScale(d.key);
    return x;
  })
 bar.exit().remove();
}

RankingVis.prototype.filterAndAggregate = function(_data, _filterFunction, _metricname) {

    // set filterFunction to a function that accepts all items
    // ONLY if the parameter _filterFunction is null
    var filterFunction = _filterFunction || function() { return true; };

    // filter the data
    var filteredData = _data.filter(filterFunction);

    // aggregate the data
    var aggregatedData = {}
    var aggregatedData_count = {}

        {filteredData.forEach(function(d){
        if (!(d.format in aggregatedData)){
            aggregatedData[d.format] = 0;
            aggregatedData_count[d.format] = 0;
        }
        aggregatedData[d.format] += d.value;
        aggregatedData_count[d.format] += 1;
    })}
        if(_metricname.indexOf("Price") >= 0){
            for(var format in aggregatedData){
                aggregatedData[format] = aggregatedData[format]/aggregatedData_count[format]
            }

        }
    aggregatedData = d3.entries(aggregatedData);

    aggregatedData.sort(function(a,b){
        if(b.value > a.value){
            return 1;
        }
        if(b.value < a.value){
            return -1;
        }
        return 0;
    })
    // }
    // return an array of filtered and aggregated data
    return (aggregatedData);
};

/**
 * Gets called by the Event Handler on a "dataChanged" event,
 * re-wrangles the data, and updates the visualization.
 * @param {array} newData
 */
RankingVis.prototype.onDataChange = function(newDataObject) {

    this.dataObject = newDataObject;
    this.wrangleData();
    this.updateVis({tDuration: 500});
};

/**
 * Gets called by the Event Handler on a "selectionChanged" event,
 * re-wrangles the data, and updates the visualization.
 * @param {number} selectStart
 * @param {number} selectEnd
 */
RankingVis.prototype.onSelectionChange = function(selectStart, selectEnd, autoSelected) {

    // save off selection range

    this.filterOptions.selectStart = selectStart;
    this.filterOptions.selectEnd = selectEnd;
     this.wrangleData();

    this.updateVis(autoSelected ? {tDuration: 500} : {});
};

RankingVis.prototype.onHighlightChange = function(highlight) {

    var formats = this.svg.selectAll(".bar");
    formats.classed("faded", function(d) {
        return highlight && d.key !== highlight;
    });
    formats.classed("highlighted", function(d) {
        return highlight && d.key === highlight;
    });
};
RankingVis.prototype.onScaleChange = function(scale) {

    // deform the y scale
    this.yScale.exponent(scale);

    this.updateVis();
};

RankingVis.prototype.onFormatsChange = function(formats) {

    // set format filter options and wrangle data
    this.filterOptions.formats = formats;
    this.wrangleData();

    this.updateVis({tDuration: 500});
};

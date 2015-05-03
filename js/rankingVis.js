/**
 * RankingVis object for the Sales Focus Chart visualization.
 * @constructor
 * @param {number} _visId -- the ID for this visualization instantiation
 * @param {object} _parentElement -- the HTML or SVG element to which to attach
 *                                   this visualization object
 * @param {array} _data -- the array of data
 * @param {object} _colorMap -- map of music formats to colors
 * @param {object} _eventHandler -- the Event Handling object to emit data to
 * @returns {RankingVis}
 */
RankingVis = function(_visId, _parentElement, _data, _colorMap, _eventHandler) {
    this.visId = _visId;
    this.parentElement = _parentElement;
    this.data = _data;
    this.colorMap = _colorMap;
    var colors = d3.scale.category20();
    this.colorMap2 = {"physical": colors[0],"digital": colors[1], "streaming": colors[2]}
    this.eventHandler = _eventHandler;
    this.displayData = [];

    // define all "constants" here
    this.margin = {top: 20, right: 90, bottom: 100, left: 80};
    this.width = 487 - this.margin.left -this.margin.right;
    this.height = 276 - this.margin.top - this.margin.bottom;

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
            that.onDataChange(dataObject.data);
        }
    );
    $(this.eventHandler).bind("selectionChanged" + this.visId,
        function(event, selectStart, selectEnd) {
            that.onSelectionChange(selectStart, selectEnd);
        }
    );
    $(this.eventHandler).bind("highlightChanged",
        function(event, highlight) {
            that.onHighlightChange(highlight);
        }
    );

// constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height+ this.margin.top +this.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");
    // creates axis and scales
    this.yScale = d3.scale.linear()
      .range([this.height,0]);

    this.xScale = d3.scale.ordinal()
      .rangeRoundBands([0, this.width], .1);


    this.xAxis = d3.svg.axis()
      .scale(this.xScale)
      // .ticks(6)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.yScale)
      .tickFormat(d3.format("s")) 
      .orient("left");

    // Add axes visual elements
    this.svg.append("g")
      .attr("class", "axis x_axis")
      .attr("transform", "translate(0," + this.height + ")")
      .call(this.xAxis)

    this.svg.append("g")
        .attr("class", "y axis")
        .call(this.yAxis)

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

    // displayData holds the data which is visualized
    this.displayData = this.filterAndAggregate(_filterFunction);
};

/**
 * Method to update the visualization.
 * @param {object} _options -- update option parameters
 */
RankingVis.prototype.updateVis = function(_options){

    var tDuration = _options ? _options.tDuration : 0;

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
    yMin = 0
    // d3.min(this.displayData, function(d){
    //     return d.value;
    //    })
    yMax = d3.max(this.displayData, function(d){
        return d.value;
       });
    if (yMin == yMax) {
        yMin = 0
    }
    this.yScale.domain([yMin, yMax]);

    // update axis
    this.svg.select(".x_axis")
        .transition().duration(tDuration)
        .call(this.xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
         .attr("transform", function(d) {
         return "rotate(-60)" 
         })
         .attr("dy", -1)
         .attr("dx", -8)
    this.svg.select(".y.axis")
        .transition().duration(tDuration)
        .call(this.yAxis)
        


this.svg.selectAll(".bar").remove();
 // Remove the extra bars
// Data join
 var bar = that.svg.selectAll(".bar")
 .data(this.displayData); // BOUND COUNT DATA IS CORRECTLY FILTERED HERE AFTER BRUSH
 
// Append new bar groups, if required
bar.enter().append("g")
 .attr("class", "bar")
// Append a rect and a text only for the Enter set (new g)
 
 .append("rect")
 // .transition()
 // .attr("transform", function(d, i) { return "translate(0," + that.yScale(d) + ")"; })

 // Add attributes (position) to all bars
 
// Update all inner rects and texts (both update and enter sets)
  .attr("x", function(d,i){
    // if (that.visId == 1) {
        x = that.xScale(d.key);
    // }
    // else {
    //     x = that.xScale(d.key)
    // }
    return x;
  })

 .attr("y", function(d) {
 return that.yScale(d.value);})
 .attr("width", that.xScale.rangeBand())
 .style("fill", function(d,i) {
 // if (that.visId == 1) {
    color = that.colorMap[d.key]
 // }
 // else{
 // color = that.colorMap2[d.key]
 // }
 return color;
})

 .attr("height", function(d) {
 var barheight = that.height-that.yScale(d.value);
 return barheight;
 })

}

RankingVis.prototype.filterAndAggregate = function(_filterFunction) {

    // set filterFunction to a function that accepts all items
    // ONLY if the parameter _filterFunction is null
    var filterFunction = _filterFunction || function() { return true; };

    // filter the data
    var filteredData = this.data.filter(filterFunction);

    // aggregate the data
    var aggregatedData = {}
    // if(this.visId == 1)
        {filteredData.forEach(function(d){
        if (!(d.format in aggregatedData)){
            aggregatedData[d.format] = 0;
        }
        aggregatedData[d.format] += d.value;
    })}
    // else{
    //  filteredData.forEach(function(d){
    //     if (!(d.media in aggregatedData)){
    //         aggregatedData[d.media] = 0;
    //     }
    //     aggregatedData[d.media] += d.value;
    // })   
    // }

    aggregatedData = d3.entries(aggregatedData);
    
    // if(this.visId ==1 ){
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
RankingVis.prototype.onDataChange = function(newData) {

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
RankingVis.prototype.onSelectionChange = function(selectStart, selectEnd) {

    // save off selection range
    this.selectStart = selectStart;
    this.selectEnd = selectEnd;

    this.wrangleData(selectStart && selectEnd ? function(d) {
        // filter for data within range
        return selectStart <= d.year && d.year <= selectEnd;
    } : null);

    this.updateVis();
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

RankingVis.prototype.addSlider = function(height, svg, eventHandler) {

    // the domain is the exponent value for the power scale
    var sliderScale = d3.scale.linear().domain([.1, 1]).range([0, height]);

    var sliderDragged = function() {

        var value = Math.max(0, Math.min(height, d3.event.y));

        // update the slider position
        d3.select(this).attr("y", value);

        $(eventHandler).trigger("scaleChanged", sliderScale.invert(value));
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



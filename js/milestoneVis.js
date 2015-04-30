/**
 * MilestoneVis object for the Music Milestone Guide visualization.
 * @constructor
 * @param {object} _parentElement -- the HTML or SVG element to which to attach
 *                                   this visualization object
 * @param {array} _data -- the array of data
 * @param {object} _eventHandler -- the Event Handling object to emit data to
 * @param {string} _imageDir -- the directory containing the milestone images
 * @returns {MilestoneVis}
 */
MilestoneVis = function(_parentElement, _data, _eventHandler, _imageDir) {

    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.imageDir = _imageDir;
    this.displayDataIndex = -1;

    this.initVis();
};

/**
 * Method that sets up the visualization.
 */
MilestoneVis.prototype.initVis = function() {

    var that = this;

    // bind to the eventHandler
    $(this.eventHandler).bind("selectionChanged1",
        function(event, selectStart, selectEnd) {
            that.onSelectionChange(selectStart, selectEnd);
        }
    );

    // append an img element to display the milestone images
    this.img = this.parentElement.append("img")
        .attr("height", 100);

    // append a paragraph element to display the data
    this.p = this.parentElement.append("p");
};

/**
 * Method to update the visualization.
 * @param {object} _options -- update option parameters
 */
MilestoneVis.prototype.updateVis = function(_options){

    // update image and paragraph with data
    var milestoneInfo = this.data[this.displayDataIndex];
    this.img.attr("src", this.imageDir + "/" + milestoneInfo.image);
    this.p.html("<b>" + milestoneInfo.year + ":</b> " +
        milestoneInfo.milestone);

    // trigger milestoneChanged event
    $(this.eventHandler).trigger("milestoneChanged", milestoneInfo.year);
};

/**
 * Gets called by the Event Handler on a "selectionChanged" event and
 * clears the visualization if the selection is empty.
 * @param {number} selectStart
 * @param {number} selectEnd
 */
MilestoneVis.prototype.onSelectionChange = function(selectStart, selectEnd) {

    // if selection is empty, then clear the image and paragraph and reset index
    if(!selectStart && !selectStart) {
        this.img.remove();
        this.img = this.parentElement.append("img")
            .attr("height", 100);

        this.p.remove();
        this.p = this.parentElement.append("p");

        this.displayDataIndex = -1;
    }
};


/**
 * Returns a function that increments to next milestone in the data.
 */
MilestoneVis.prototype.incrementMilestone = function(that) {

    return function() {
        if (++that.displayDataIndex >= that.data.length) {
            that.displayDataIndex = 0;
        }
        that.updateVis();
    };
};

/**
 * Returns a function that decrements to previous milestone in the data.
 */
MilestoneVis.prototype.decrementMilestone = function(that) {

    return function() {
        if (--that.displayDataIndex < 0) {
            that.displayDataIndex = that.data.length - 1;
        }
        that.updateVis();
    };
};

/**
 * MilestoneVis object for the Music Milestone Guide visualization.
 * @constructor
 * @param {object} _parentElement -- the HTML or SVG element to which to attach
 *                                   this visualization object
 * @param {array} _data -- the array of data
 * @param {object} _eventHandler -- the Event Handling object to emit data to
 * @returns {MilestoneVis}
 */
MilestoneVis = function(_parentElement, _data, _eventHandler) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayDataIndex = -1;

    this.initVis();
};

/**
 * Method that sets up the visualization.
 */
MilestoneVis.prototype.initVis = function() {

    // append a paragraph element to display the data
    this.p = this.parentElement.append("p")
        .html("<br>");
};

/**
 * Method to update the visualization.
 * @param {object} _options -- update option parameters
 */
MilestoneVis.prototype.updateVis = function(_options){

    // update paragraph with data
    var milestoneInfo = this.data[this.displayDataIndex];
    this.p.html("<b>" + milestoneInfo.year + ":</b> " + milestoneInfo.milestone);

    // trigger milestoneChanged event
    $(this.eventHandler).trigger("milestoneChanged", milestoneInfo.year);
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

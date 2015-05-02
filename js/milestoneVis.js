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
    this.dataIndex = -1;

    this.initVis();
};

/**
 * Method that sets up the visualization.
 */
MilestoneVis.prototype.initVis = function() {

    var that = this;

    // bind to the eventHandler
    $(this.eventHandler).bind("milestoneChanged",
        function(event, year) {
            that.onMilestoneChange(year);
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
MilestoneVis.prototype.updateVis = function(_options) {

    // if milestone exists, update image and paragraph with data
    var milestoneInfo = this.data[this.dataIndex];
    if (milestoneInfo) {
        this.img.attr("src", this.imageDir + "/" + milestoneInfo.image);
        this.p.html("<b>" + milestoneInfo.year + ":</b> " +
            milestoneInfo.milestone);
    }
    // otherwise, clear the image and paragraph and reset index
    else {
        this.img.remove();
        this.img = this.parentElement.append("img")
            .attr("height", 100);

        this.p.remove();
        this.p = this.parentElement.append("p");

        this.dataIndex = -1;
    }

    // trigger milestoneChanged event
    $(this.eventHandler).trigger("milestoneChanged",
        milestoneInfo ? milestoneInfo.year : undefined);
};

/**
 * Gets called by the Event Handler on a "milestoneChanged" event and
 * updates the visualization.
 * @param {number} year - the year of the milestone currently set
 */
MilestoneVis.prototype.onMilestoneChange = function(year) {

    // check if milestone year is in the data and has changed
    var milestoneIndex = this.data.map(function(d) { return d.year; })
        .indexOf(year);
    if (milestoneIndex !== this.dataIndex) {
        // set the milestone data index and update the visualization
        this.dataIndex = milestoneIndex;
        this.updateVis();
    }
};

/**
 * Returns a function that increments to next milestone in the data.
 */
MilestoneVis.prototype.incrementMilestone = function(that) {

    return function() {
        if (++that.dataIndex >= that.data.length) {
            that.dataIndex = 0;
        }
        that.updateVis();
    };
};

/**
 * Returns a function that decrements to previous milestone in the data.
 */
MilestoneVis.prototype.decrementMilestone = function(that) {

    return function() {
        if (--that.dataIndex < 0) {
            that.dataIndex = that.data.length - 1;
        }
        that.updateVis();
    };
};

/**
 * Metadata object for the music sales dataset.
 * @constructor
 * @param {array} _metricsData
 * @param {array} _milestonesData
 * @returns {undefined}
 */
Metadata = function(_metricsData, _milestonesData) {

    this.colorMap = this.generateColorMap(_metricsData);
    this.milestones = _milestonesData.map(function(d) {
        return {
            year: +d.year,
            milestone: d.milestone,
            image: d.image
        };
    });
};

/**
 * Generates a map of music formats to colors.
 * @param {array} data
 * @returns {object} map of formats to colors
 */
Metadata.prototype.generateColorMap = function(data) {
    // create an array of unique music format names
    var formats = data.reduce(function(prev, curr) {
        if (prev.indexOf(curr.format) < 0) {
            prev.push(curr.format);
        }
        return prev;
    }, []);
    
    // map the music format names to the color scale
    var color = d3.scale.category20().domain(formats);
    var colorMap = {};
    formats.map(function(d) {
        colorMap[d] = color(d);
    });
    
    return colorMap;
};

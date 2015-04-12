/**
 * Metadata object for the music sales dataset.
 * @constructor
 * @param {array} _data
 * @returns {undefined}
 */
Metadata = function(_data) {

    this.colorMap = this.generateColorMap(_data);
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

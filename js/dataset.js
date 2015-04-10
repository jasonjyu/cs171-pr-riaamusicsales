/**
 * Dataset object for containing the different music sales data types.
 * @constructor
 * @param {array} _rows_units
 * @param {array} _rows_dollars
 * @param {array} _rows_inflatedDollars
 * @returns {undefined}
 */
Dataset = function(_rows_units, _rows_dollars, _rows_inflatedDollars) {

    this.data_units = this.parseRows(_rows_units);
    this.data_dollars = this.parseRows(_rows_dollars);
    this.data_inflatedDollars = this.parseRows(_rows_inflatedDollars);
};

/**
 * Parse the rows into an array of objects with the following attributes:
 * {
 *     format: , // {string} (CD, cassette, vinyl, download single,
 *               //           paid subscriptions, etc.)
 *     media:  , // {string} (physical, digital, streaming)
 *     year:   , // {number} year of the sales metric value
 *     value:    // {number} value of the sales metric (units, dollars,
 *               //          dollars adjusted for inflation)
 * }
 * @param {array} rows -- music sales data rows
 * @returns {array} array of objects containing the restructured data
 */
Dataset.prototype.parseRows = function(rows) {

    var result = [];
    rows.forEach(function(row) {
        // check for valid data
        if (row.format.trim() !== "") {
            for (var key in row) {
                // if the key is a number type,
                // then save the sales metric value for that year
                if (+key) {
                    result.push({
                        format: row.format,
                        media:  row.media,
                        year:   +key,
                        value:  +row[key]
                    });
                }
            }
        }
    });

    return result;
};

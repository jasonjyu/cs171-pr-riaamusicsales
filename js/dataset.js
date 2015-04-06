/**
 * Dataset object for containing the different music sales data types.
 * @constructor
 * @param {array} _rows_units
 * @param {array} _rows_dollarValue
 * @param {array} _rows_inflatedDollarValue
 * @returns {undefined}
 */
Dataset = function(_rows_units, _rows_dollarValue, _rows_inflatedDollarValue) {

    this.data_units = this.parseRows(_rows_units);
    this.data_dollarValue = this.parseRows(_rows_dollarValue);
    this.data_inflatedDollarValue = this.parseRows(_rows_inflatedDollarValue);
};

/**
 * Parse the rows into an array of objects with the following attributes:
 * {
 *     formatName: , // {string} (CD, cassette, vinyl, download single,
 *                   //           paid subscriptions, etc.)
 *     formatType: , // {string} (physical, digital, streaming)
 *     year: ,       // {number} year the metric value is for
 *     value: ,      // {number} value of the metric (units sold,
 *                               dollar value sold, dollar value adjusted
 *                               for inflation sold)
 * }
 * @param {array} rows
 * @returns {array} array of objects containing the restructured data
 */
Dataset.prototype.parseRows = function(rows) {

    var result = [];
    rows.forEach(function(row) {
        for (var key in row) {
            // if the key is a number type, then save the metric for that year
            if (+key) {
                result.push({
                    formatName: row.formatName,
                    formatType: row.formatType,
                    year:       +key,
                    value:      +row[key]
                });
            }
        }
    });

    return result;
};

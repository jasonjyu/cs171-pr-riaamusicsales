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
 *     sales:        // {array}  array of sale objects
 *     [
 *         {
 *             year: ,       // {number} year of the sales metric value
 *             value:        // {number} value of the sales metric (units,
 *                           //          dollar value, dollar value adjusted
 *                           //          for inflation)
 *         },
 *         ...
 *     ]
 * }
 * @param {array} rows
 * @returns {array} array of objects containing the restructured data
 */
Dataset.prototype.parseRows = function(rows) {

    var result = [];
    rows.forEach(function(row) {
        // check for valid data
        if (row.formatName.trim() !== "" && row.formatType.trim() !== "") {
            var sales = [];
            for (var key in row) {
                // if the key is a number type,
                // then save the sales metric value for that year
                if (+key) {
                    sales.push({
                        year:  +key,
                        value: +row[key]
                    });
                }
            }

            result.push({
                formatName: row.formatName,
                formatType: row.formatType,
                sales:      sales
            });
        }
    });

    return result;
};

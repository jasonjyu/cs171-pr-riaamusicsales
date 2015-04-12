/**
 * Dataset object for containing the different music sales data types.
 * @constructor
 * @param {array} _rows_units
 * @param {array} _rows_dollars
 * @param {array} _rows_inflatedDollars
 * @returns {undefined}
 */
Dataset = function(_rows_units, _rows_dollars, _rows_inflatedDollars) {

    this.units = {
        name: "Units",
        data: this.parseRows(_rows_units)
    };
    this.dollars = {
        name: "Dollars",
        data: this.parseRows(_rows_dollars)
    };
    this.inflatedDollars = {
        name: "Dollars (inflated)",
        data: this.parseRows(_rows_inflatedDollars)
    };
    this.prices = {
        name: "Price Per Unit",
        data: this.derivePricesData(this.units.data, this.dollars.data)
    };
    this.inflatedPrices = {
        name: "Price Per Unit (inflated)",
        data: this.derivePricesData(this.units.data, this.inflatedDollars.data)
    };
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
                // if the key is a number type and the value is non-zero,
                // then save the sales metric value for that year
                if (+key && +row[key]) {
                    result.push({
                        format: row.format,
                        media:  row.media,
                        year:   +key,
                        value:  +row[key]*1e6 // row value is stored in millions
                    });
                }
            }
        }
    });

    return result;
};

/**
 * Generates an array of prices derived from the given units and dollars data.
 * @param {type} unitsData -- units data to derive from
 * @param {type} dollarsData -- dollars data to derive from
 * @returns {array} array of derived prices data
 */
Dataset.prototype.derivePricesData = function(unitsData, dollarsData) {

    var that = this;

    var result = [];
    unitsData.forEach(function(d) {
        // find corresponding dollar value in order to calculate price
        var dollarsDatum = that.findDataItem(dollarsData, d.format, d.year);
        if (dollarsDatum) {
            result.push({
                format: d.format,
                media:  d.media,
                year:   d.year,
                value:  dollarsDatum.value/d.value
            });
        }
    });

    return result;
};

/**
 * Finds an item in the given data array with the specified format and year.
 * @param {array} data -- array of data to search
 * @param {string} format -- music format to find
 * @param {number} year -- year to find
 * @returns {object} the matching data item or 'undefined' if not found
 */
Dataset.prototype.findDataItem = function(data, format, year) {

    return data.filter(function(d) {
        return d.format === format && d.year === year;
    })[0];
};

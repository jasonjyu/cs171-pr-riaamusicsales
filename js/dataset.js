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
        data: this.deriveValueChangeData(this.parseRows(_rows_units))
    };
    this.dollars = {
        name: "Dollars",
        data: this.deriveValueChangeData(this.parseRows(_rows_dollars))
    };
    this.inflatedDollars = {
        name: "Dollars (inflated)",
        data: this.deriveValueChangeData(this.parseRows(_rows_inflatedDollars))
    };
    this.prices = {
        name: "Price Per Unit",
        data: this.deriveValueChangeData(this.derivePricesData(this.units.data,
            this.dollars.data))
    };
    this.inflatedPrices = {
        name: "Price Per Unit (inflated)",
        data: this.deriveValueChangeData(this.derivePricesData(this.units.data,
            this.inflatedDollars.data))
    };
};

/**
 * Parse the rows into an array of objects with the following attributes:
 * {
 *     format: , // {string} (CD, cassette, vinyl, download single,
 *               //           paid subscriptions, etc.)
 *     medium: , // {string} (physical, digital, streaming)
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
                        medium: row.medium,
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
    unitsData.forEach(function(unitsDatum) {
        // find corresponding dollar value in order to calculate price
        var dollarsDatum = that.findDataItem(dollarsData, unitsDatum.format,
            unitsDatum.year);
        if (dollarsDatum) {
            var deriviedDatum = that.cloneObject(unitsDatum);
            deriviedDatum.value = dollarsDatum.value/unitsDatum.value;
            // derive monthly price for 'Paid Subscriptions' instead of annual
            if (deriviedDatum.format === "Paid Subscriptions") {
                deriviedDatum.value /= 12;
            }
            result.push(deriviedDatum);
        }
    });

    return result;
};

/**
 * Generates an array appended with value change data.
 * @param {type} data -- the data to append to
 * @returns {array} appended array of data
 */
Dataset.prototype.deriveValueChangeData = function(data) {

    var that = this;

    var result = [];
    data.forEach(function(d) {
        // find prior year data item to calculate value change
        var priorYearDatum = that.findDataItem(data, d.format, d.year - 1);
        var valueChangeDatum = that.cloneObject(d);
        valueChangeDatum.valueChange = priorYearDatum ?
            d.value - priorYearDatum.value : 0;
        valueChangeDatum.valueChangeNorm = priorYearDatum ?
            valueChangeDatum.valueChange / priorYearDatum.value : 0;
        result.push(valueChangeDatum);
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

/**
 * Creates a new copy of a specified object.
 * @param {object} obj -- the object to clone
 * @returns {object} the cloned object
 */
Dataset.prototype.cloneObject = function(obj) {

    if (typeof obj !== "object" || obj === null) {
        return obj;
    }

    var cloneObj = obj.constructor();
    for (var key in obj) {
        cloneObj[key] = this.cloneObject(obj[key]);
    };

    return cloneObj;
};

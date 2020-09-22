import Fancy from "fancygrid";
import {getMonthColumnIndexes, getQuarterColumnIndexes, getYearColumnIndexes} from "./indexes";

function toggleColumns(segbutton, button, value, values) {
  let grid = Fancy.getWidget('financial-grid');

  if (value === false) {
    if (values[0] === false) {
      let indexes = getMonthColumnIndexes();
      grid.hideColumn(indexes);
    }

    if (values[1] === false) {
      let indexes = getQuarterColumnIndexes();
      grid.hideColumn(indexes);
    }

    if (values[2] === false) {
      let indexes = getYearColumnIndexes();
      grid.hideColumn(indexes);
    }
  }

  if (value === true) {
    if (values[0] === true) {
      let indexes = getMonthColumnIndexes();
      grid.showColumn(indexes);
    }

    if (values[1] === true) {
      let indexes = getQuarterColumnIndexes();
      grid.showColumn(indexes);
    }

    if (values[2] === true) {
      let indexes = getYearColumnIndexes();
      grid.showColumn(indexes);
    }
  }
}

export {
  toggleColumns
};
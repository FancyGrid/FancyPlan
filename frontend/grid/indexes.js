import Fancy from "fancygrid";

function getMonthColumnIndexes(){
  let grid = Fancy.getWidget('financial-grid'),
    columns = grid.getColumns(),
    indexes = [];

  Fancy.each(columns, (column)=>{
    if(column.isMonth){
      indexes.push(column.id);
    }
  });

  return indexes;
}

function getMonthForecastColumnIndexes(){
  let grid = Fancy.getWidget('financial-grid'),
    columns = grid.getColumns(),
    indexes = [];

  Fancy.each(columns, (column)=>{
    if(column.isMonth && column.isForeCast){
      indexes.push(column.id);
    }
  });

  return indexes;
}

function getQuarterColumnIndexes(){
  let grid = Fancy.getWidget('financial-grid'),
    columns = grid.getColumns(),
    indexes = [];

  Fancy.each(columns, (column)=>{
    if(column.isQuarter){
      indexes.push(column.id);
    }
  });

  return indexes;
}

function getQuarterForecastColumnIndexes(){
  let grid = Fancy.getWidget('financial-grid'),
    columns = grid.getColumns(),
    indexes = [];

  Fancy.each(columns, (column)=>{
    if(column.isQuarter && column.isForeCast){
      indexes.push(column.id);
    }
  });

  return indexes;
}

function getYearColumnIndexes(){
  let grid = Fancy.getWidget('financial-grid'),
    columns = grid.getColumns(),
    indexes = [];

  Fancy.each(columns, (column)=>{
    if(column.isAnnual){
      indexes.push(column.id);
    }
  });

  return indexes;
}

export {
  getMonthColumnIndexes,
  getMonthForecastColumnIndexes,
  getQuarterColumnIndexes,
  getQuarterForecastColumnIndexes,
  getYearColumnIndexes
};
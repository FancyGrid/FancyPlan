import {
  initializeBlock,
  useBase,
  useRecords,
  useGlobalConfig,
  loadCSSFromURLAsync
} from '@airtable/blocks/ui';
import React from 'react';
import Fancy from 'fancygrid';
import { FancyGridReact } from 'fancygrid-react';
import {sortByDate, getMonthTitle, getQuarterTitle} from  './util/date';
import {sortByAmount} from  './util/amount';
loadCSSFromURLAsync('https://fancygrid.com/temp/air.css?_dc=22');

let globalConfig;

const NOT_GROUPED_TEXT = 'Not Grouped';

let columns = [];
let data = [];
let allRecords = [];

function App() {
  const base = useBase();
  let tables = base.tables;
  let tableNames = [];

  globalConfig = useGlobalConfig();

  allRecords = [];

  columns = [{
    type: 'order',
    locked: true
  },{
    //type: 'string',
    title: 'Name',
    type: 'combo',
    minListWidth: 120,
    sortable: true,
    multiSelect: true,
    itemCheckBox: true,
    filter: {
      header: true
    },
    headerCls: 'header-cell-name',
    locked: true,
    index: 'name'
  }];
  data = [{'name': 'All'}];

  tables.forEach((table)=>{
    tableNames.push(table.name);
  });

  let i = 0,
    iL = tableNames.length;

  for(;i<iL;i++){
    let tableName = tableNames[i];

    let table = base.getTableByName(tableName);
    const records = useRecords(table);

    prepairData(records);
  }

  allRecords = sortByDate(allRecords);
  processData(allRecords);

  let groups = generateGroups(allRecords);

  let row = {
    name: NOT_GROUPED_TEXT
  };

  for(let month in groups[NOT_GROUPED_TEXT].months){
    row[month.replace('-', '')] = groups[NOT_GROUPED_TEXT].months[month];
  }

  for(let quarter in groups[NOT_GROUPED_TEXT].quarters){
    row[quarter.replace(' ', '')] = groups[NOT_GROUPED_TEXT].quarters[quarter];
  }

  for(let year in groups[NOT_GROUPED_TEXT].years){
    row[year] = groups[NOT_GROUPED_TEXT].years[year];
  }

  data.push(row);

  delete groups[NOT_GROUPED_TEXT];
  let sortedByAmountGroups = sortByAmountGroups(groups);

  sortedByAmountGroups.forEach((group)=>{
    let row = {
      name: group.name
    };

    for(let month in group.months){
      row[month.replace('-', '')] = group.months[month];
    }

    for(let quarter in group.quarters){
      row[quarter.replace(' ', '')] = group.quarters[quarter];
    }

    for(let year in group.years){
      row[year] = group.years[year];
    }

    data.push(row);
  });

  return (
    <div style={{height:'calc(100% - 20px)', padding: '10px'}}>
      <div id="container" style={{height: '100%'}}>
        <FancyGridReact
          config={getConfig()}>
        </FancyGridReact>
      </div>
    </div>
  );
}

function prepairData(records){
  records.forEach((record)=> {
    let value = record.getCellValue('Amount');
    let group = record.getCellValue('Name');

    let splittedDate = record.name.split('.');

    allRecords.push({
      date: record.name,
      dateValue: +new Date(splittedDate[2], splittedDate[1], splittedDate[0]),
      amount: Number(value),
      name: group
    });
  });
}

function processData(records){
  let months = {};
  let monthsOrder = [];
  let quarters = {};
  let years = {};
  let yearsOrder = [];

  let currency = globalConfig.get('currency') || Fancy.currency.USD;

  records.forEach((record)=>{
    let dateSplitted = record.date.split('.');
    let month = dateSplitted[1];
    let year = dateSplitted[2];
    let quarter = getQuarterTitle(month + '-' + year);

    if(months[month + '-' + year] === undefined){
      months[month + '-' + year] = 0;
      monthsOrder.push(month + '-' + year);
    }

    if(quarters[quarter] === undefined){
      quarters[quarter] = 0;
    }

    if(years[year] === undefined){
      years[year] = 0;
      yearsOrder.push(year);
    }

    months[month + '-' + year] += record.amount;
    quarters[quarter] += record.amount;
    years[year] += record.amount;
  });

  let usingQuarter;
  let quarterColumns = [];

  monthsOrder.forEach((month)=>{
    let monthSplitted = month.split('-');
    let monthIndex = month.replace('-', '');

    data[0][monthIndex] = Number(months[month].toFixed(2));

    let quarter = getQuarterTitle(month);
    if(usingQuarter !== quarter) {
      usingQuarter = quarter;
      quarterColumns = [];
    }

    quarterColumns.push({
      title: getMonthTitle(month),
      type: 'currency',
      isMonth: true,
      currency: currency,
      sortable: true,
      index: monthIndex,
      autoWidth: true
    });

    switch (Number(monthSplitted[0])){
      case 2:
      case 5:
      case 8:
      case 11:
        var quarterIndex = quarter.replace(' ', '').toLocaleLowerCase();
        data[0][quarterIndex] = Number(quarters[quarter].toFixed(2));

        quarterColumns.push({
          title: quarter,
          type: 'currency',
          isQuarter: true,
          headerCls: 'header-cell-quarter',
          cls: 'column-quarter',
          currency: currency,
          sortable: true,
          index: quarter.toLocaleLowerCase().replace(' ', ''),
          autoWidth: true
        });

        columns.push({
          title: quarter,
          headerCls: 'header-cell-quarter',
          columns: quarterColumns
        });
        break;
    }
  });

  yearsOrder.forEach((year)=>{
    data[0][year] = years[year];

    columns.push({
      title: year,
      type: 'currency',
      isAnnual: true,
      headerCls: 'header-cell-annual',
      currency: currency,
      sortable: true,
      index: year,
      align: 'center',
      rightLocked: true,
      autoWidth: true
    });
  });
}

function getConfig(){
  let currency = globalConfig.get('currency') || Fancy.currency.USD;

  return {
    id: 'financial-grid',
    theme: 'extra-gray',
    trackOver: true,
    selModel: {
      type: 'row',
      activeCell: true
    },
    paging: data.length > 700,
    data: data,
    defaults: {
      width: 85,
      resizable: true,
      //sortable: true
    },
    cellStylingCls: ['low-value', 'high-value'],
    columns: columns,
    events: [{
      init: function(grid){
        document.body.firstChild.style.height = '100%';
        document.body.firstChild.firstChild.style.height = '100%';

        grid.onWindowResize();
      }
    }],
    tbar: [{
      type: 'segbutton',
      multiToggle: true,
      items: [{
        text: 'Month',
        pressed: true
      }, {
        text: 'Quarter',
        pressed: true
      }, {
        text: 'Year',
        pressed: true
      }],
      events: [{
        toggle: function (segbutton, button, value, values) {
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
      }]
    }],
    subTBar: [{
      type: 'segbutton',
      items: [{
        text: Fancy.currency.USD,
        pressed: currency === Fancy.currency.USD
      }, {
        text: Fancy.currency.EUR,
        pressed: currency === Fancy.currency.EUR
      }, {
        text: Fancy.currency.GBP,
        pressed: currency === Fancy.currency.GBP
      }, {
        text: Fancy.currency.JPY,
        pressed: currency === Fancy.currency.JPY
      },{
        text: Fancy.currency.RUB,
        pressed: currency === Fancy.currency.RUB
      }],
      events: [{
        toggle: function(segbutton, button) {
          globalConfig.setAsync('currency', button.text);
          let grid = Fancy.getWidget('financial-grid');

          grid.showLoadMask('Reload page');
        }
      }]
    }]
  };
}

function getMonthColumnIndexes(){
  let grid = Fancy.getWidget('financial-grid'),
    columns = grid.getColumns(),
    indexes = [];

  Fancy.each(columns, (column)=>{
    if(column.isMonth){
      indexes.push(column.index);
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
      indexes.push(column.index);
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
      indexes.push(column.index);
    }
  });

  return indexes;
}

function generateGroups(records){
  let groups = {};

  records.forEach((record)=>{
    let amount = Number(Number(record.amount).toFixed(2));

    if(groups[record.name] === undefined){
      groups[record.name] = {
        value: 0,
        amount: 0,
        months: {},
        years: {},
        quarters: {}
      };
    }

    groups[record.name].value++;

    let splittedDate = record.date.split('.');
    let month = splittedDate[1] + '-' + splittedDate[2];
    let year = splittedDate[2];
    let quarter = getQuarterTitle(month).toLocaleLowerCase();

    if(groups[record.name].months[month] === undefined){
      groups[record.name].months[month] = 0;
    }

    if(groups[record.name].years[year] === undefined){
      groups[record.name].years[year] = 0;
    }

    if(groups[record.name].quarters[quarter] === undefined){
      groups[record.name].quarters[quarter] = 0;
    }

    groups[record.name].months[month] += amount;
    groups[record.name].quarters[quarter] = amount;
    groups[record.name].years[year] += amount;
    groups[record.name].amount += amount;

    groups[record.name].months[month] = Number(groups[record.name].months[month].toFixed(2));
    groups[record.name].quarters[quarter] = Number(groups[record.name].quarters[quarter].toFixed(2));
    groups[record.name].years[year] = Number(groups[record.name].years[year].toFixed(2));
    groups[record.name].amount = Number(groups[record.name].amount.toFixed(2));
  });

  delete groups[null];

  for(let p in groups) {
    if (groups[p].value < 2) {
      groups[NOT_GROUPED_TEXT] = groups[NOT_GROUPED_TEXT] || {
        value: 0,
        months: {},
        years: {},
        quarters: {}
      };

      groups[NOT_GROUPED_TEXT].value += groups[p].value;
      groups[NOT_GROUPED_TEXT].value = Number(groups[NOT_GROUPED_TEXT].value.toFixed(2))

      for(let month in groups[p].months){
        if(groups[NOT_GROUPED_TEXT].months[month] === undefined){
          groups[NOT_GROUPED_TEXT].months[month] = 0;
        }

        groups[NOT_GROUPED_TEXT].months[month] += groups[p].months[month];
        groups[NOT_GROUPED_TEXT].months[month] = Number(groups[NOT_GROUPED_TEXT].months[month].toFixed(2));
      }

      for(let quarter in groups[p].quarters){
        if(groups[NOT_GROUPED_TEXT].quarters[quarter] === undefined){
          groups[NOT_GROUPED_TEXT].quarters[quarter] = 0;
        }

        groups[NOT_GROUPED_TEXT].quarters[quarter] += groups[p].quarters[quarter];
        groups[NOT_GROUPED_TEXT].quarters[quarter] = Number(groups[NOT_GROUPED_TEXT].quarters[quarter].toFixed(2));
      }

      for(let year in groups[p].years){
        if(groups[NOT_GROUPED_TEXT].years[year] === undefined){
          groups[NOT_GROUPED_TEXT].years[year] = 0;
        }

        groups[NOT_GROUPED_TEXT].years[year] += groups[p].years[year];
        groups[NOT_GROUPED_TEXT].years[year] = Number(groups[NOT_GROUPED_TEXT].years[year].toFixed(2));
      }

      delete groups[p];
    }
  }

  return groups;
}

function sortByAmountGroups(groups){
  let unsortedGroups = [];

  for(let p in groups){
    let row = groups[p];
    row.name = p;
    unsortedGroups.push(row);
  }

  let sortedGroups = sortByAmount(unsortedGroups);

  return sortedGroups;
}

initializeBlock(() => <App />);
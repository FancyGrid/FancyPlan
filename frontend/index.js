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
import {sortByDate, getQuarterTitle, getMonthTitle} from './util/date';
import {sortByAmountGroups} from  './util/amount';
import {toggleColumns} from './grid/columns';
import {prepareData} from './util/data';
import {getQuarterForecastColumnIndexes, getMonthForecastColumnIndexes} from './grid/indexes';
import {median, mean, standardDeviation} from "./util/stat";

loadCSSFromURLAsync('https://fancygrid.com/temp/air.css?_dc=26');

let globalConfig;
let aliasGroupNames = {};

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
    title: 'Name',
    type: 'combo',
    minListWidth: 120,
    autoWidth: true,
    maxAutoWidth: 120,
    sortable: true,
    multiSelect: true,
    itemCheckBox: true,
    filter: {
      editable: false,
      header: true
    },
    headerCls: 'header-cell-name',
    locked: true,
    index: 'name'
  }];
  data = [{'name': 'All'}];

  let tableGroups = base.getTableByNameIfExists('Groups');

  if(tableGroups){
    let records = useRecords(tableGroups);

    prepareAliasGroups(records);
  }

  tables.forEach((table)=>{
    if(table.name === 'Groups'){
      return;
    }

    tableNames.push(table.name);
  });

  let i = 0,
    iL = tableNames.length;

  for(;i<iL;i++){
    let tableName = tableNames[i];

    let table = base.getTableByName(tableName);
    const records = useRecords(table);

    allRecords = allRecords.concat(prepareData(records, aliasGroupNames));
  }

  allRecords = sortByDate(allRecords);

  processData(allRecords);

  let groups = generateGroups(allRecords);

  if(groups[NOT_GROUPED_TEXT]){
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
  }

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

function prepareAliasGroups(records){
  records.forEach((record)=> {
    let name = record.getCellValue('Name');
    let a = record.getCellValue('Alias');

    aliasGroupNames[name] = a;
  });
}

function getConfig(){
  let currency = globalConfig.get('currency') || Fancy.currency.USD;
  let groupNotRepeatedData = true;
  let precision = false;

  if(globalConfig.get('groupNotRepeatedData') !== undefined){
    groupNotRepeatedData = globalConfig.get('groupNotRepeatedData');
  }

  if(globalConfig.get('precision') !== undefined){
    precision = globalConfig.get('precision');
  }

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
      sortable: true
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
        toggle: toggleColumns
      }]
    },'->',{
      type: 'button',
      enableToggle: true,
      text: 'Extra',
      pressed: globalConfig.get('extra') === true,
      handler: function(button){
        let grid = Fancy.getWidget('financial-grid');

        if(!button.pressed){
          grid.showBar('subtbar');
          globalConfig.setAsync('extra', true);
        }
        else{
          grid.hideBar('subtbar');
          globalConfig.setAsync('extra', false);
        }
      }
    }],
    subTBarHidden: globalConfig.get('extra') !== true,
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
      }, {
        text: Fancy.currency.RUB,
        pressed: currency === Fancy.currency.RUB
      }],
      events: [{
        toggle: function (segbutton, button) {
          globalConfig.setAsync('currency', button.text);
          let grid = Fancy.getWidget('financial-grid');

          grid.showLoadMask('Reload page');
        }
      }]
    },{
      type: 'button',
      enableToggle: true,
      text: ".00",
      pressed: precision === true,
      handler: function(button){
        globalConfig.setAsync('precision', !button.pressed);

        let grid = Fancy.getWidget('financial-grid');

        grid.showLoadMask('Reload page');
      }
    },{
      type: 'button',
      enableToggle: true,
      text: 'Group Not Repeated',
      pressed: groupNotRepeatedData,
      handler: function(button){
        globalConfig.setAsync('groupNotRepeatedData', !button.pressed);

        let grid = Fancy.getWidget('financial-grid');

        grid.showLoadMask('Reload page');
      }
    },{
      type: 'button',
      enableToggle: true,
      text: 'Forecast',
      pressed: globalConfig.get('forecast') === true,
      handler: function(button){
        let grid = Fancy.getWidget('financial-grid');
        let quarterIndexes = getQuarterForecastColumnIndexes();
        let monthIndexes = getMonthForecastColumnIndexes();

        if(!button.pressed){
          grid.showColumn(monthIndexes);
          grid.showColumn(quarterIndexes);
          globalConfig.setAsync('forecast', true);
        }
        else{
          grid.hideColumn(monthIndexes);
          grid.hideColumn(quarterIndexes);
          globalConfig.setAsync('forecast', false);
        }
      }
    }]
  };
}

function generateGroups(records){
  let groups = {};

  records.forEach((record)=>{
    let name = record.name;
    let amount = Number(Number(record.amount).toFixed(2));

    if(groups[name] === undefined){
      groups[name] = {
        value: 0,
        amount: 0,
        months: {},
        years: {},
        quarters: {}
      };
    }

    let group = groups[name];

    group.value++;

    let splittedDate = record.date.split('.');
    let month = splittedDate[1] + '-' + splittedDate[2];
    let year = splittedDate[2];
    let quarter = getQuarterTitle(splittedDate[1] + '-' + splittedDate[2]).toLocaleLowerCase();

    if(group.months[month] === undefined){
      group.months[month] = 0;
    }

    if(group.years[year] === undefined){
      group.years[year] = 0;
    }

    if(group.quarters[quarter] === undefined){
      group.quarters[quarter] = 0;
    }

    group.months[month] += amount;
    group.quarters[quarter] += amount;
    group.years[year] += amount;
    group.amount += amount;

    group.months[month] = Number(group.months[month].toFixed(2));
    group.quarters[quarter] = Number(group.quarters[quarter].toFixed(2));
    group.years[year] = Number(group.years[year].toFixed(2));
    group.amount = Number(group.amount.toFixed(2));
  });

  let groupNotRepeatedData = true;

  if(globalConfig.get('groupNotRepeatedData') !== undefined){
    groupNotRepeatedData = globalConfig.get('groupNotRepeatedData');
  }

  for(let p in groups) {
    if (groups[p].value === 1 && groupNotRepeatedData && groups[p].amount < 3000) {
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

  let foreCastMonthsOrder = generateForeCastMonths(monthsOrder);

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
      precision: globalConfig.get('precision')?2: 0,
      isMonth: true,
      currency: currency,
      sortable: true,
      index: monthIndex,
      autoWidth: true
    });

    switch (Number(monthSplitted[0])){
      case 3:
      case 6:
      case 9:
      case 12:
        var quarterIndex = quarter.replace(' ', '').toLocaleLowerCase();
        data[0][quarterIndex] = Number(quarters[quarter].toFixed(2));

        quarterColumns.push({
          title: quarter,
          type: 'currency',
          precision: globalConfig.get('precision')?2: 0,
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
        quarterColumns = [];
        break;
    }
  });

  foreCastMonthsOrder.forEach(function(month){
    let monthSplitted = month.split('-');

    let quarter = getQuarterTitle(month);
    if(usingQuarter !== quarter) {
      usingQuarter = quarter;
      quarterColumns = [];
    }

    quarterColumns.push({
      title: getMonthTitle(month),
      type: 'currency',
      precision: globalConfig.get('precision')?2: 0,
      cls: 'forecast-column',
      isMonth: true,
      isForeCast: true,
      currency: currency,
      sortable: true,
      autoWidth: true,
      hidden: !globalConfig.get('forecast'),
      smartIndexFn: function(data){
        let value;
        let values = [];

        monthsOrder.forEach((month)=>{
          let monthIndex = month.replace('-', '');

          values.push(Number(data[monthIndex]));
        });

        switch(Number(monthSplitted[0])%3){
          case 0:
            value = mean(values);
            break;
          case 1:
            value = median(values);
            break;
          case 2:
            value = standardDeviation(values);
            break;
        }

        value = Number(value.toFixed(2));
        return value;
      }
    });

    switch (Number(monthSplitted[0])){
      case 3:
      case 6:
      case 9:
      case 12:
        /*
        quarterColumns.push({
          title: quarter,
          type: 'currency',
          precision: globalConfig.get('precision')?2: 0,
          isQuarter: true,
          isForeCast: true,
          headerCls: 'header-cell-quarter-forecast',
          cls: 'column-quarter-forecast',
          hidden: !globalConfig.get('forecast'),
          currency: currency,
          sortable: true,
          autoWidth: true,
          render: function(o){
            let value = 0;
            let values = [];

            monthsOrder.forEach((month)=>{
              let monthIndex = month.replace('-', '');

              value += Number(o.data[monthIndex]);
              values.push(Number(o.data[monthIndex]));
            });

            o.value = Number((3*value/month.length).toFixed(2));

            return o;
          }
        });
         */

        columns.push({
          title: quarter,
          headerCls: 'header-cell-quarter-forecast',
          columns: quarterColumns
        });
        quarterColumns = [];
        break;
    }
  });

  yearsOrder.forEach((year)=>{
    data[0][year] = years[year];

    columns.push({
      title: year,
      type: 'currency',
      precision: globalConfig.get('precision')?2: 0,
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

  return data;
}

function generateForeCastMonths(monthsOrder){
  let splitted = monthsOrder[monthsOrder.length - 1].split('-'),
    month = splitted[0],
    year = splitted[1],
    fMonthsOrder = [];

  let i = 0,
    iL = 3,
    fMonth = month,
    fYear = year;

  for(;i<iL;i++){
    fMonth++;

    if(fMonth > 12){
      fMonth = 1;
      fYear++;
    }

    fMonthsOrder.push(fMonth + '-' + fYear);
  }

  return fMonthsOrder;
}

initializeBlock(() => <App />);
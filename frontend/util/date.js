import Fancy from "fancygrid";

const monthsQuarter = ['Q1', 'Q1', 'Q1', 'Q2', 'Q2', 'Q2', 'Q3', 'Q3', 'Q3', 'Q4', 'Q4', 'Q4'];

function sortByDate(data){
  return data.sort(compareDate);
}

function compareDate(a, b) {
  const bandA = a.dateValue;
  const bandB = b.dateValue;

  let comparison = 0;
  if (bandA > bandB) {
    comparison = 1;
  }
  else if (bandA < bandB) {
    comparison = -1;
  }

  return comparison;
}

function getMonthTitle(month){
  let monthSplitted = month.split('-');

  return Fancy.i18n.en.date.months[monthSplitted[0]] + ' ' + monthSplitted[1].slice(-2);
}

function getQuarterTitle(month){
  let monthSplitted = month.split('-');

  return monthsQuarter[monthSplitted[0]] + ' ' + monthSplitted[1].slice(-2);
}

export {
  sortByDate,
  getMonthTitle,
  getQuarterTitle
};
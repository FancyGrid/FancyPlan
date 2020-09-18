function sortByAmount(data){
  return data.sort(compareDate);
}

function compareDate(a, b) {
  const bandA = a.amount;
  const bandB = b.amount;

  let comparison = 0;
  if (bandA > bandB) {
    comparison = 1;
  }
  else if (bandA < bandB) {
    comparison = -1;
  }

  return comparison;
}

export {
  sortByAmount
};
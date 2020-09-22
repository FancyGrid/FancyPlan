function sortByAmount(data){
  return data.sort(compareDate);
}

function compareDate(b, a) {
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

export {
  sortByAmountGroups
};
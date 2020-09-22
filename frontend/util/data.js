function prepareData(records, aliasGroupNames){
  let data = [];
  let likes = {};

  for(let property in aliasGroupNames){
    if(property[0] === '*' && property[property.length - 1] === '*'){
      likes[property.replace(/\*/g, '').toLocaleLowerCase()] = aliasGroupNames[property];
    }
  }

  records.forEach((record)=> {
    let value = record.getCellValue('Amount');
    let group = record.getCellValue('Name');

    if(!group){
      return
    }

    let splittedDate = record.name.split('.');

    if(aliasGroupNames[group]){
      group = aliasGroupNames[group];
    }
    else{
      for(let property in likes){
        if(new RegExp(property).test(group.toLocaleLowerCase())){
          group = likes[property];
        }
      }
    }

    data.push({
      date: record.name,
      dateValue: +new Date(splittedDate[2], splittedDate[1], splittedDate[0]),
      amount: Number(value),
      name: group
    });
  });

  return data;
}

export {
  prepareData
};
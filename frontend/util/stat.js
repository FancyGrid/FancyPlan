function median(values){
  if(values.length ===0) return 0;

  values.sort(function(a,b){
    return a-b;
  });

  var half = Math.floor(values.length / 2);

  if (values.length % 2)
    return values[half];

  return (values[half - 1] + values[half]) / 2.0;
}

function sum(array){
  var num = 0;
  for (var i = 0, l = array.length; i < l; i++) num += array[i];
  return num;
}

function mean(array) {
  return sum(array) / array.length;
}

function variance(array) {
  var m = mean(array);

  return mean(array.map(function(num) {
    return Math.pow(num - m, 2);
  }));
}

function standardDeviation(array) {
  return Math.sqrt(variance(array));
}

export {
  median,
  mean,
  standardDeviation
}
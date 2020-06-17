const _ = require('lodash/fp');
const round = require('lodash/round');

const slugifyUrl = string => {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;';
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------';
  const p = new RegExp(a.split('').join('|'), 'g');

  return string
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

const checkFundProps = (fee, performance) => !_.isNil(fee) && !_.isNil(performance);
const getBestsFunds = funds => ({
  bestPerformance: _.maxBy('performance', funds),
  minFee: _.minBy('fee', funds)
});
const isBestFund = (fund, bestsFunds) => ({
  ...fund,
  isMinFee: _.isEqual(fund.ticker, bestsFunds.minFee.ticker),
  isBestPerformance: _.isEqual(fund.ticker, bestsFunds.bestPerformance.ticker)
});

class Fund {
  constructor({ long_name: longName, fee, ticker, performance }) {
    this.ticker = ticker;
    this.longName = longName;
    this.fee = round(fee, 2);
    this.performance = round(performance, 2);
    this.fund_url = slugifyUrl(longName);
  }
}

function prettifyAlternatives(alternatives) {
  return _.flow([
    _.filter(({ fee, performance }) => checkFundProps(fee, performance)),
    _.map(alt => new Fund(alt)),
    _.orderBy(['fee', 'performance'], ['asc', 'desc'])
  ])(alternatives);
}

function prettifyFunds(funds) {
  return _.flow([
    _.filter(({ instrument: { fee, performance } }) => checkFundProps(fee, performance)),
    _.map(({ instrument, alternatives }) => ({
      ...new Fund(instrument),
      alternatives: prettifyAlternatives(alternatives)
    })),
    _.sortBy(['fee'])
  ])(funds);
}

function buildFundDetailsData(currFund, alternatives) {
  let currentFund = null;
  let cheaperAlternatives = [];
  let similarAlternatives = [];

  function buildData(_currFund, _alternatives) {
    const bestFunds = getBestsFunds([_currFund, ..._alternatives]);

    return {
      f: isBestFund(_currFund, bestFunds),
      al: _alternatives.map(alt => isBestFund(alt, bestFunds))
    };
  }

  alternatives.forEach(alt => {
    const isLessFee = _.lt(alt.fee, currFund.fee);
    const isGreatPerformance = _.gt(alt.performance, currFund.performance);

    if (isLessFee && isGreatPerformance) {
      cheaperAlternatives.push(alt);
    } else if (isLessFee) {
      similarAlternatives.push(alt);
    }
  });

  if (!_.isEmpty(cheaperAlternatives)) {
    const { f, al } = buildData(currFund, cheaperAlternatives);

    currentFund = f;
    cheaperAlternatives = al;
  } else if (!_.isEmpty(similarAlternatives)) {
    const { f, al } = buildData(currFund, similarAlternatives);

    currentFund = f;
    similarAlternatives = al;
  } else {
    currentFund = currFund;
  }

  return { currentFund, cheaperAlternatives, similarAlternatives };
}



exports.slugifyUrl = slugifyUrl;
exports.checkFundProps = checkFundProps;
exports.getBestsFunds = getBestsFunds;
exports.isBestFund = isBestFund;
exports.prettifyAlternatives = prettifyAlternatives;
exports.prettifyFunds = prettifyFunds;
exports.buildFundDetailsData = buildFundDetailsData;
exports.Fund = Fund;
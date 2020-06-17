function startReply(firstName) {
  return `<strong>Hi! ${firstName}!</strong>
Make sure you have chosen the best fund
Choosing the best funds for their savings or pensions is not always easy - you are faced with many opportunities and decisions.
But one thing is certain. Don't pay unnecessarily high fees!
Before buying a fund, check here for better alternatives with lower fees and better returns.

<strong>Type the name of the fund and find out if it has alternatives.</strong>
`
}

function popularFundsReply({ longName, fee, performance, ticker, fund_url, alternatives }) {
  return `

<a href="https://www.njorda.se/fondkartan/${ticker}/${fund_url}/"><strong>${longName}</strong></a>
Fee: <strong>${fee}%</strong>
Returns 1 year: <strong>${performance}%</strong>
I found <strong>${alternatives.length}</strong> alternatives`
}

function searchReply(funds) {
  return `I found <strong>${funds.length}</strong> fund${funds.length > 1 ? 's' : ''} with similar name`;
}

function fundCheckerLinkReply(fund) {
  return {
    text: `Visit Njorda to get more data about ${fund.longName}`,
    url: `https://www.njorda.se/fondkartan/${fund.ticker}/${fund.fund_url}/`
  }
}

function noAlternativesReply(longName) {
  return `
I couldn't find any better alternatives for <strong>${longName}</strong>
This may be because <strong>${longName}</strong> has the best return and lowest fee among similar funds 
or may be unique in its strategy`
}


function alternativesListReply(currentFund, alternatives) {
  const longNameLength = [currentFund, ...alternatives].reduce((acc, { longName }) => {
    if (longName.trim().length > acc) {
      acc = longName.trim().length;
    }

    return acc;
  }, 0);

  return [currentFund, ...alternatives].reduce((replyList, { ticker, longName, fee, performance, isMinFee, isBestPerformance }) => {
    let nameToShow = longName.padEnd(100, ' ').slice(0, longNameLength);
    let feeToShow = ((isMinFee ? '⭐ ' : '') + fee);
    let performanceToShow = ((isBestPerformance ? '⭐ ' : '') + performance);

    if (longName.trim().length > longNameLength - 3) {
      nameToShow = longName.padEnd(50, ' ').slice(0, longNameLength - 3).padEnd(longNameLength, '.')
    }

    if (currentFund.ticker === ticker) {
      if (!isMinFee) {
        feeToShow = '🔴 ' + feeToShow;
      }
      if (!isBestPerformance) {
        performanceToShow = '🔴 ' + performanceToShow;
      }
    }

    feeToShow = feeToShow.padStart(isMinFee ? 6 : 7, ' ');
    performanceToShow = performanceToShow.padStart(isBestPerformance ? 11 : 12, ' ');

    replyList += `
    
${nameToShow}  ${feeToShow}  ${performanceToShow}`;
    return replyList;
  }, `
${''.padStart(50, ' ').slice(0, longNameLength)}  ${'Fee %'.padStart(7)}  ${'Returns 1y %'.padStart(12)}`)
}

exports.popularFundsReply = popularFundsReply;
exports.startReply = startReply;
exports.searchReply = searchReply;
exports.fundCheckerLinkReply = fundCheckerLinkReply;
exports.noAlternativesReply = noAlternativesReply;
exports.alternativesListReply = alternativesListReply;

require('dotenv').config();

const axios = require('axios');
const reply = require('./reply');
const servise = require('./servise');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.ENV_BOT_TOKEN);
const POPULAR_API = process.env.ENV_POPULAR_API;
const SEARCH_API = str => process.env.ENV_SEARCH_API + str;
const FUND_CHECKER_API = str => `${process.env.ENV_FUND_CHECKER_API}${str}/`;


bot.start((ctx) => {
  console.log(('START TRIGGERED BY ' + ctx.message.from.first_name));

  ctx.replyWithHTML(
    reply.startReply(ctx.message.from.first_name),
    {
      reply_markup: {
        one_time_keyboard: true,
        keyboard: [
          ['SEB Europafond', 'Robur Access Europa'],
          ['Swedbank Robur Sverige', 'Carnegie Asia A'],
        ]
      }
    })
});

bot.command('popular', async (ctx) => {
  console.log('POPULAR TRIGGERED');

  try {
    const { data: popular } = await axios.get(POPULAR_API);

    if (popular.length) {
      let popularFundsReplyMessage = '';

      popular.forEach(({ instrument, alternatives }) => {
        const { currentFund, cheaperAlternatives } = servise.buildFundDetailsData(
          new servise.Fund(instrument),
          servise.prettifyAlternatives(alternatives)
        );

        popularFundsReplyMessage += reply.popularFundsReply({
          ...currentFund,
          alternatives: cheaperAlternatives
        })
      });

      ctx.replyWithHTML(popularFundsReplyMessage, { disable_web_page_preview: true });
    } else {
      ctx.reply('No popular funds found');
    }
  } catch (error) {
    console.error(error);
  }
});

bot.on('text', async (ctx) => {
  console.log(ctx.message.text.toUpperCase());

  if (ctx.message.text.length < 3) {
    ctx.reply('Please type at least 3 symbol');

    return;
  }

  try {
    const { data } = await axios.get(SEARCH_API(ctx.message.text));

    if (data.length) {
      const funds = data.slice(0, 6);
      const buttons = funds.reduce((btnsArr, { ticker, long_name }) => {
        btnsArr.push([{ text: long_name, callback_data: ticker }]);

        return btnsArr;
      }, []);


      ctx.replyWithHTML(reply.searchReply(funds), {
        reply_markup: {
          inline_keyboard: buttons
        }
      });
    } else {
      ctx.reply('No Funds found');
    }
  } catch (error) {
    console.log(error);
  }
});

bot.on('callback_query', async (ctx) => {
  const { data: { instrument, alternatives } } = await axios.get(FUND_CHECKER_API(ctx.update.callback_query.data));

  const { currentFund, cheaperAlternatives, similarAlternatives } = servise.buildFundDetailsData(
    new servise.Fund(instrument),
    servise.prettifyAlternatives(alternatives)
  );

  let alternativesFoundTitle = '';
  let alternativesList = '';

  if (cheaperAlternatives.length || similarAlternatives.length) {
    if (cheaperAlternatives.length) {
      alternativesFoundTitle = `I found <strong>${cheaperAlternatives.length}</strong> alternatives for <strong>${currentFund.longName}</strong>
`;
      alternativesList = reply.alternativesListReply(currentFund, cheaperAlternatives);
    } else if (similarAlternatives.length) {
      alternativesFoundTitle = `It looks like <strong>${currentFund.longName}</strong> is that good alternative.
Similar funds with lower fees, but lower returns:
`;
      alternativesList = reply.alternativesListReply(currentFund, similarAlternatives);
    }
  } else {
    alternativesFoundTitle = reply.noAlternativesReply(currentFund.longName);
  }

  if (alternativesList.length) {
    ctx.replyWithHTML(`${alternativesFoundTitle} <pre>${alternativesList}</pre>`, {
      reply_markup: {
        inline_keyboard: [[reply.fundCheckerLinkReply(currentFund)]]
      }
    });
  } else {
    ctx.replyWithHTML(`${alternativesFoundTitle}`);
  }

  console.log(('REPLY TRIGGERED WITH TITLE ' + alternativesFoundTitle));
});

bot.launch();



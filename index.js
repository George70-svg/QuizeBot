const { Telegraf } = require('telegraf')
const schedule = require('node-schedule')
require('dotenv').config()

const common = require('./const')
const { questions } = require("./questions")

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) => {
  const currentUserId = ctx.update.message.from.id

  if(currentUserId == process.env.HOST_ID) {
    sendSticker(common.welcomeSticker, ctx)
    sendMessage('Добрый день, я телеграм-бот, который будет проводить ежедневную викторину!', ctx)

    startQuizOnTime(ctx)
  } else {
    sendSticker(common.slaveSticker, ctx)
    ctx.reply(`Извините, я выполняю команды только от моего хозяина.`)
  }
})

const startQuizOnTime = (ctx) => {
  schedule.scheduleJob('12 23 * * *', async () => {
    try {
      await createQuiz(ctx)
    } catch (error) {
      console.log(error)
    }
  })
}

const createQuiz = async (ctx) => {
  const { question, options, answer } = getQuestion()
  await createQuizMessage(ctx)
  await bot.telegram.sendPoll(ctx.chat.id, question, options, { type: 'quiz', is_anonymous: false, correct_option_id: answer })
}

const createQuizMessage = async (ctx) => {
  const randomPhraseNumber = Math.floor(Math.random() * 10)
  const randomStickerNumber = Math.floor(Math.random() * 4)

  await bot.telegram.sendSticker(ctx.chat.id, common.stickers[randomStickerNumber], { reply_markup: {remove_keyboard: true } })
  await ctx.replyWithHTML(common.welcomePhrases[randomPhraseNumber])
}

const getQuestion = () => {
  const dayOfMonth = new Date().getDate()

  const currentQuestion = questions[dayOfMonth]
  const question = currentQuestion.question
  const options = currentQuestion.options
  const answer = currentQuestion.options.indexOf(currentQuestion.answer)

  return { question, options, answer }
}

const sendSticker = (stickerId, ctx) => {
  bot.telegram.sendSticker(ctx.chat.id, stickerId, { reply_markup: { remove_keyboard: true } })
}

const sendMessage = (message, ctx) => {
  ctx.reply(message)
}

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

const { Telegraf } = require('telegraf')
const schedule = require('node-schedule')
require('dotenv').config()

const common = require('./const')
const { questions } = require("./questions")

const bot = new Telegraf(process.env.BOT_TOKEN)
const jobs = []
let quizJob = null

//Команда старт (запуск бота по /start)
bot.start(async (ctx) => {
  const currentUserId = ctx.update.message.from.id

  if(currentUserId == process.env.HOST_ID) {
    await sendSticker(common.welcomeSticker, ctx)
    await sendMessage('Добрый день, я телеграм-бот, который будет проводить ежедневную викторину!', ctx)
    await startQuizOnTime(ctx)
  } else {
    await sendSticker(common.slaveSticker, ctx)
    await sendMessage('Извините, я выполняю команды только от моего хозяина.', ctx)
  }
})

//Команда стоп (остановить работу бота по /stop)
bot.command('stop', async (ctx) => {
  const currentUserId = ctx.update.message.from.id

  if(currentUserId == process.env.HOST_ID) {
    await stopQuizOnTime()
  } else {
    await sendSticker(common.slaveSticker, ctx)
    await sendMessage('Извините, я выполняю команды только от моего хозяина.', ctx)
  }
})

//Команда проверки бота (проверить бота по /check)
bot.command('check', async (ctx) => {
  const currentUserId = ctx.update.message.from.id

  if(currentUserId == process.env.HOST_ID) {
    await sendSticker(common.hostSticker, ctx)
    await sendMessage('Бот отвечает корректно.', ctx)
  } else {
    await sendSticker(common.slaveSticker, ctx)
    await sendMessage('Извините, я выполняю команды только от моего хозяина.', ctx)
  }
})

//Создать квиз в определённое время
const startQuizOnTime = (ctx) => {
  const { min, hour } = getTime()

  quizJob = schedule.scheduleJob(`${min} ${hour} * * *`, async () => {
    try {
      await createQuiz(ctx)
    } catch (error) {
      console.log(error)
    }
  })

  jobs.push(quizJob)
}

//Функция для остановки созданых тасок
const stopQuizOnTime = () => {
  if(jobs.length > 0) {
    jobs.forEach(job => {
      job.cancel()
    })
  }
}

//Функция для создания опроса
const createQuiz = async (ctx) => {
  const { question, options, answer } = getQuestion()
  await createQuizMessage(ctx)
  await bot.telegram.sendPoll(ctx.chat.id, question, options, { type: 'quiz', is_anonymous: false, correct_option_id: answer })
}

//Функция для создания приветственного сообщения
const createQuizMessage = async (ctx) => {
  const randomPhraseNumber = Math.floor(Math.random() * 10)
  const randomStickerNumber = Math.floor(Math.random() * 4)

  await bot.telegram.sendSticker(ctx.chat.id, common.stickers[randomStickerNumber], { reply_markup: {remove_keyboard: true } })
  await ctx.replyWithHTML(common.welcomePhrases[randomPhraseNumber])
}

//Функция для получения вопроса дня
const getQuestion = () => {
  const dayOfMonth = new Date().getDate()

  const currentQuestion = questions[dayOfMonth]
  const question = currentQuestion.question
  const options = currentQuestion.options
  const answer = currentQuestion.options.indexOf(currentQuestion.answer)

  return { question, options, answer }
}

//Функция для получения текущего часа и минуты + 1 от времени запроса
const getTime = () => {
  const hour = new Date().getHours()
  const min = new Date().getMinutes() + 1
  return { min, hour }
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

import axios from 'axios'

export const sendTelegram = async ({ botToken, chatId, message }) => {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`,
        {
            chat_id: chatId,
            text: message
        }
    )
}
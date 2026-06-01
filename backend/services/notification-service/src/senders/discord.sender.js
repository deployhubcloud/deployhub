import axios from 'axios'

export const sendDiscord = async ({ webhookUrl, message }) => {
    await axios.post(webhookUrl, { content: message })
}
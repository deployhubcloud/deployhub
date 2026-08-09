import axios from 'axios'
import { BaseUrl } from './ApiUrl'

export const api = axios.create({
  baseURL: BaseUrl,
  withCredentials: true,
})

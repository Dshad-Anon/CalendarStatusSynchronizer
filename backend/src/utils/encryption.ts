import CryptoJS from 'crypto-js';
import { config } from '../config/config';

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, config.encryption.key).toString();
};

export const decrypt = (encryptedText: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedText, config.encryption.key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

import CryptoJS from 'crypto-js'

const SECRET_KEY = process.env.NEXT_PUBLIC_PASSWORD_SECRET_KEY!

export function encryptPassword(password: string): string {
    return CryptoJS.AES.encrypt(password, SECRET_KEY).toString()
}

export function decryptPassword(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return decrypted
}

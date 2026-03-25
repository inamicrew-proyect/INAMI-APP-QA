/**
 * Genera una contraseña temporal que cumple las mismas reglas que `passwordSchema`
 * (mayúscula, minúscula, número, símbolo, sin espacios).
 */
export function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghijkmnopqrstuvwxyz'
  const numbers = '23456789'
  const symbols = '!@#$%^&*'
  const allChars = `${uppercase}${lowercase}${numbers}${symbols}`
  const length = 12
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : null

  const randomIndex = (max: number) => {
    if (cryptoObj && cryptoObj.getRandomValues) {
      const randomValue = new Uint32Array(1)
      cryptoObj.getRandomValues(randomValue)
      return randomValue[0] % max
    }
    return Math.floor(Math.random() * max)
  }

  const pickChar = (charset: string) => charset[randomIndex(charset.length)]

  const requiredChars = [
    pickChar(uppercase),
    pickChar(lowercase),
    pickChar(numbers),
    pickChar(symbols),
  ]

  const remainingChars: string[] = []
  for (let i = requiredChars.length; i < length; i++) {
    remainingChars.push(pickChar(allChars))
  }

  const passwordChars = [...requiredChars, ...remainingChars]

  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1)
    ;[passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]]
  }

  return passwordChars.join('')
}

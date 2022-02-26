function getRandomUpperCase(): string {
  return String.fromCharCode(Math.floor(Math.random() * 26) + 65);
}

function getRandomLowerCase(): string {
  return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
}

function getRandomNumber(): string {
  return String.fromCharCode(Math.floor(Math.random() * 10) + 48);
}

export function generatePassword(): string {
  const charCount = Math.floor(Math.random() * 5) + 8;
  let pass = '';
  for (let i = 0; i < charCount; i += 1) {
    const charType = Math.floor(Math.random() * 4);
    switch (charType) {
      case 0:
        pass += getRandomUpperCase();
        break;
      case 1:
        pass += getRandomLowerCase();
        break;
      case 2:
      default:
        pass += getRandomNumber();
        break;
    }
  }
  return pass;
}
